/***************************************************************
  script-manage.js - front end logic
***************************************************************/

// Local portfolio array. Each item:
// { stock, quantity, price, costBasis, pl, marketValue }
let portfolio = [];

// DOM elements
const stockSearchInput = document.getElementById('stockSearch');
const searchBtn = document.getElementById('searchBtn');
const searchResultContainer = document.getElementById('searchResultContainer');
const portfolioTableBody = document.getElementById('portfolioTable').querySelector('tbody');

// On page load, load portfolio from storage
document.addEventListener('DOMContentLoaded', () => {
	portfolio = loadPortfolioFromStorage();
	updatePortfolioTable();
});

// 1) SEARCH BUTTON
searchBtn.addEventListener('click', async () => {
	const symbol = stockSearchInput.value.trim();
	if (!symbol) {
		alert('Please enter a stock symbol.');
		return;
	}

	// Clear previous result
	searchResultContainer.innerHTML = '';

	try {
		// e.g. GET /api/stock?symbol=AAPL
		const response = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}`);
		if (!response.ok) {
			throw new Error(`Server responded with status: ${response.status}`);
		}
		const data = await response.json();

		// data should look like the provided JSON structure
		renderSearchResult(data);

	} catch (err) {
		console.error("Error fetching stock info:", err);
		alert("Could not fetch stock info. Check console or server logs.");
	}
});

// 2) RENDER SEARCH RESULT
function renderSearchResult(stockData) {
	// stockData example:
	// {
	//   "symbol": "AAPL",
	//   "period": "today",
	//   "data": {
	//     "Open": 255.37,
	//     "High": 258.21,
	//     "Low": 255.31,
	//     "Close": 258.20,
	//     "Volume": 20965006.0,
	//     "Dividends": 0.0,
	//     "Stock Splits": 0.0
	//   }
	// }

	const { symbol, period, data } = stockData;
	if (!symbol || !data) {
		searchResultContainer.innerHTML = '<p>Invalid data returned.</p>';
		return;
	}

	// We'll consider "Close" to be the "current" price
	const currentPrice = data.Close ?? 0;

	// Create a small info section
	const infoDiv = document.createElement('div');
	infoDiv.innerHTML = `
    <h2>Symbol: ${symbol}</h2>
    <p>Period: ${period}</p>
    <p>Open: $${(data.Open || 0).toFixed(2)}</p>
    <p>High: $${(data.High || 0).toFixed(2)}</p>
    <p>Low: $${(data.Low || 0).toFixed(2)}</p>
    <p>Close: $${currentPrice.toFixed(2)}</p>
    <p>Volume: ${(data.Volume || 0).toLocaleString()}</p>
    <p>Dividends: ${data.Dividends}</p>
    <p>Stock Splits: ${data["Stock Splits"]}</p>
  `;

	// Add-to-Portfolio form
	const formDiv = document.createElement('div');
	formDiv.style.marginTop = '1rem';
	formDiv.innerHTML = `
    <label style="display: inline-block; margin-right: 1rem;">
      Quantity:
      <input type="number" id="quantityToAdd" min="1" placeholder="e.g. 10" />
    </label>
    <button id="addToPortfolioBtn">Add to Portfolio</button>
  `;

	// Append to container
	searchResultContainer.appendChild(infoDiv);
	searchResultContainer.appendChild(formDiv);

	// Wire up the "Add to Portfolio" button
	const addBtn = document.getElementById('addToPortfolioBtn');
	addBtn.addEventListener('click', () => {
		const qtyInput = document.getElementById('quantityToAdd');
		const quantity = parseInt(qtyInput.value, 10);
		if (!quantity || quantity < 1) {
			alert('Please enter a valid quantity >= 1.');
			return;
		}

		// Naive cost basis: random discount from close price
		const costBasis = currentPrice - (Math.random() * 10);
		const marketValue = currentPrice * quantity;
		const pl = (currentPrice - costBasis) * quantity;

		// Add to portfolio array
		portfolio.push({
			stock: symbol,
			quantity: quantity,
			price: +currentPrice.toFixed(2),
			costBasis: +costBasis.toFixed(2),
			pl: +pl.toFixed(2),
			marketValue: +marketValue.toFixed(2)
		});

		// Save & update table
		savePortfolioToStorage(portfolio);
		updatePortfolioTable();

		// (Optional) Clear the search result or the quantity input
		// qtyInput.value = '';
	});
}

// 3) UPDATE PORTFOLIO TABLE
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

// 4) SELL LOGIC
function handleSell(index) {
	const item = portfolio[index];
	if (!item) return;

	const maxShares = item.quantity;
	const input = prompt(`You have ${maxShares} share(s) of ${item.stock}. How many to sell?`, '0');
	if (input === null) return; // canceled

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
		// remove item
		portfolio.splice(index, 1);
	} else {
		// update quantity & recalc
		item.quantity = newQuantity;
		item.marketValue = item.price * item.quantity;
		item.pl = (item.price - item.costBasis) * item.quantity;
	}

	savePortfolioToStorage(portfolio);
	updatePortfolioTable();
}

// 5) LOCALSTORAGE HELPERS
function loadPortfolioFromStorage() {
	const stored = localStorage.getItem('myPortfolio');
	if (!stored) return [];
	try {
		return JSON.parse(stored);
	} catch (err) {
		console.error('Error parsing portfolio from storage:', err);
		return [];
	}
}

function savePortfolioToStorage(data) {
	localStorage.setItem('myPortfolio', JSON.stringify(data));
}

