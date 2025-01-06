/***************************************************************
  Front-end logic for:
    1) Searching a stock
    2) Displaying chart + current price
    3) Optionally adding it to the portfolio
    4) Showing the portfolio in a table with a Sell feature
***************************************************************/

// Our local portfolio array. Each entry:
// { stock, quantity, price, costBasis, pl, marketValue }
let portfolio = [];

// Refs to important DOM elements
const searchInput = document.getElementById('stockSearch');
const searchBtn = document.getElementById('searchBtn');
const searchResultContainer = document.getElementById('searchResultContainer');
const portfolioTableBody = document.getElementById('portfolioTable').querySelector('tbody');

// A variable to hold our chart instance (so we can destroy it if needed)
let priceChart = null;

// On page load, load existing portfolio from localStorage + render table
document.addEventListener('DOMContentLoaded', () => {
	portfolio = loadPortfolioFromStorage();
	updatePortfolioTable();
});

// -------------------- SEARCH LOGIC -------------------- //
searchBtn.addEventListener('click', async () => {
	const symbol = searchInput.value.trim();
	if (!symbol) {
		alert('Please enter a symbol or company name.');
		return;
	}

	// Clear previous search results
	searchResultContainer.innerHTML = '';

	// Attempt to fetch data from the backend
	try {
		// e.g. GET /api/stock?symbol=AAPL
		// returns { symbol, shortName, currentPrice, history: [ {date, close}, ... ] }
		const response = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
		if (!response.ok) {
			throw new Error(`Server responded with status ${response.status}`);
		}
		const data = await response.json();

		// Render the data: symbol, name, currentPrice, chart
		renderSearchResult(data);

	} catch (err) {
		console.error('Error fetching stock data:', err);
		alert('Could not find data for that stock. Check console or server logs.');
	}
});

// -------------------- RENDER SEARCH RESULT -------------------- //
function renderSearchResult(stockData) {
	// stockData expected to have: symbol, shortName, currentPrice, history array
	const { symbol, shortName, currentPrice, history } = stockData;

	// 1) Basic Info
	const infoDiv = document.createElement('div');
	infoDiv.innerHTML = `
    <h2>${symbol} - ${shortName || ''}</h2>
    <p>Current Price: $${currentPrice.toFixed(2)}</p>
  `;

	// 2) Canvas for the chart
	const canvas = document.createElement('canvas');
	canvas.id = 'priceChartCanvas';
	canvas.width = 600;
	canvas.height = 300;

	// 3) Form for user to choose quantity + "Add to Portfolio" button
	const actionDiv = document.createElement('div');
	actionDiv.style.marginTop = '1rem';
	actionDiv.innerHTML = `
    <label style="display: inline-block; margin-right: 1rem;">
      Quantity:
      <input type="number" id="quantityToAdd" min="1" placeholder="e.g. 10" />
    </label>
    <button id="addToPortfolioBtn">Add to Portfolio</button>
  `;

	// 4) Append them to container
	searchResultContainer.appendChild(infoDiv);
	searchResultContainer.appendChild(canvas);
	searchResultContainer.appendChild(actionDiv);

	// 5) Build the Chart.js line chart using "history" data
	//    history might look like: [ { date: '2023-10-01', close: 180 }, ... ]
	const chartLabels = history.map((point) => point.date);
	const chartPrices = history.map((point) => point.close);

	// If we already had a chart, destroy it to avoid duplication
	if (priceChart) {
		priceChart.destroy();
	}
	const ctx = document.getElementById('priceChartCanvas').getContext('2d');
	priceChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: chartLabels,
			datasets: [
				{
					label: `${symbol} Price`,
					data: chartPrices,
					borderColor: '#63b3ed',
					fill: false,
					tension: 0.3
				}
			]
		},
		options: {
			responsive: false, // so it uses our canvas width/height
			scales: {
				x: {
					ticks: { color: '#a0aec0' },
					grid: { color: '#2d3748' }
				},
				y: {
					ticks: { color: '#a0aec0' },
					grid: { color: '#2d3748' }
				}
			}
		}
	});

	// 6) Wire up the "Add to Portfolio" button
	const addBtn = document.getElementById('addToPortfolioBtn');
	addBtn.addEventListener('click', () => {
		const qtyInput = document.getElementById('quantityToAdd');
		const quantity = parseInt(qtyInput.value, 10);
		if (!quantity || quantity < 1) {
			alert('Please enter a valid quantity (>= 1).');
			return;
		}

		// We do a naive cost basis. In real usage, you'd store actual purchase price.
		const costBasis = currentPrice - (Math.random() * 10);
		const marketValue = currentPrice * quantity;
		const pl = (currentPrice - costBasis) * quantity;

		// Add it to the portfolio array
		portfolio.push({
			stock: symbol,
			quantity: quantity,
			price: +currentPrice.toFixed(2),
			costBasis: +costBasis.toFixed(2),
			pl: +pl.toFixed(2),
			marketValue: +marketValue.toFixed(2)
		});

		// Save to localStorage
		savePortfolioToStorage(portfolio);

		// Update table
		updatePortfolioTable();

		// Optionally, clear the result container
		//searchResultContainer.innerHTML = '';
	});
}

// -------------------- PORTFOLIO TABLE RENDER -------------------- //
function updatePortfolioTable() {
	portfolioTableBody.innerHTML = '';

	portfolio.forEach((item, index) => {
		const row = document.createElement('tr');

		// Stock
		const tdStock = document.createElement('td');
		tdStock.textContent = item.stock;
		row.appendChild(tdStock);

		// Quantity
		const tdQuantity = document.createElement('td');
		tdQuantity.textContent = item.quantity;
		row.appendChild(tdQuantity);

		// Price
		const tdPrice = document.createElement('td');
		tdPrice.textContent = item.price.toFixed(2);
		row.appendChild(tdPrice);

		// Market Value
		const tdValue = document.createElement('td');
		tdValue.textContent = item.marketValue.toFixed(2);
		row.appendChild(tdValue);

		// P/L
		const tdPL = document.createElement('td');
		tdPL.textContent = item.pl.toFixed(2);
		tdPL.style.color = item.pl >= 0 ? '#48bb78' : '#f56565';
		row.appendChild(tdPL);

		// Action (Sell)
		const tdAction = document.createElement('td');
		const sellBtn = document.createElement('button');
		sellBtn.textContent = 'Sell';
		sellBtn.style.backgroundColor = '#f56565';
		sellBtn.style.color = '#fff';
		sellBtn.style.padding = '0.4rem 0.8rem';
		sellBtn.style.border = 'none';
		sellBtn.style.borderRadius = '0.375rem';
		sellBtn.style.cursor = 'pointer';

		sellBtn.addEventListener('click', () => {
			handleSell(index);
		});

		tdAction.appendChild(sellBtn);
		row.appendChild(tdAction);

		portfolioTableBody.appendChild(row);
	});
}

// -------------------- SELL LOGIC -------------------- //
function handleSell(index) {
	const item = portfolio[index];
	if (!item) return;

	const maxShares = item.quantity;
	const input = prompt(`You have ${maxShares} share(s) of ${item.stock}. How many to sell?`, '0');
	if (input === null) return; // user canceled

	const sharesToSell = parseInt(input, 10);
	if (isNaN(sharesToSell) || sharesToSell <= 0) {
		alert('Please enter a valid positive number.');
		return;
	}
	if (sharesToSell > maxShares) {
		alert(`You only have ${maxShares} share(s).`);
		return;
	}

	const newQuantity = maxShares - sharesToSell;
	if (newQuantity === 0) {
		// Remove the item from portfolio entirely
		portfolio.splice(index, 1);
	} else {
		// Update quantity
		item.quantity = newQuantity;
		item.marketValue = item.price * item.quantity;
		item.pl = (item.price - item.costBasis) * item.quantity;
	}

	savePortfolioToStorage(portfolio);
	updatePortfolioTable();
}

// -------------------- LOCALSTORAGE HELPERS -------------------- //
function loadPortfolioFromStorage() {
	const stored = localStorage.getItem('myPortfolio');
	if (!stored) return [];
	try {
		return JSON.parse(stored);
	} catch (err) {
		console.error('Error parsing portfolio from storage', err);
		return [];
	}
}

function savePortfolioToStorage(data) {
	localStorage.setItem('myPortfolio', JSON.stringify(data));
}

