import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import './ManagePortfolio.css';

function ManagePortfolio() {
  const [transactions, setTransactions] = useState([]);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [foundStock, setFoundStock] = useState(null);
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [sellShares, setSellShares] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions/');
      console.log('Transaction response:', response.data);
      const transactionData = response.data.transactions || [];
      setTransactions(transactionData);
      setError(null);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchSymbol.trim()) {
      alert('Please enter a stock symbol (e.g. AAPL).');
      return;
    }
    setFoundStock(null);
    setShares('');

    try {
      const response = await api.get(`/yahoo/stock?symbol=${encodeURIComponent(searchSymbol)}`);
      console.log('Stock search response:', response.data);
      
      const stockData = response.data;
      
      if (stockData) {
        setFoundStock({
          symbol: stockData.symbol,
          price: stockData.data,
          sector: stockData.sector || 'N/A',
          period: stockData.period
        });
      } else {
        throw new Error('Invalid stock data received');
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      alert('Could not fetch data for that symbol. Please try again.');
    }
  };

  const handleAddToPortfolio = async () => {
    if (!foundStock) {
      alert('Please search for a stock first.');
      return;
    }
    if (!shares || shares < 1) {
      alert('Please enter a valid number of shares (>= 1).');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const cleanToken = token ? token.replace(/^"|"$/g, '') : '';

      const response = await api.post('/db/', {
        action: 'buy',
        symbol: foundStock.symbol,
        shares: parseInt(shares)
      }, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      await fetchTransactions();
      setFoundStock(null);
      setSearchSymbol('');
      setShares('');
      alert('Successfully added to portfolio!');
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      alert(`Failed to add to portfolio: ${error.message || 'Unknown error occurred'}`);
    }
  };

  const handleSell = async (symbol, availableShares) => {
    setSelectedStock({ symbol, availableShares });
    setShowSellModal(true);
    setSellShares('');
  };

  const handleConfirmSell = async () => {
    if (!selectedStock) {
      alert('Please select a stock to sell.');
      return;
    }
    if (!sellShares || sellShares < 1 || sellShares > selectedStock.availableShares) {
      alert(`Please enter a valid number of shares (1-${selectedStock.availableShares}).`);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const cleanToken = token ? token.replace(/^"|"$/g, '') : '';

      const response = await api.post('/db/', {
        action: 'sell',
        symbol: selectedStock.symbol,
        shares: parseInt(sellShares)
      }, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      await fetchTransactions();
      setShowSellModal(false);
      setSelectedStock(null);
      setSellShares('');
      alert('Successfully sold shares!');
    } catch (error) {
      console.error('Error selling shares:', error);
      alert(`Failed to sell shares: ${error.message || 'Unknown error occurred'}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const calculatePositions = () => {
    const positions = {};
    
    transactions.forEach(transaction => {
      const [id, userId, symbol, sector, price, quantity, date, totalValue] = transaction;
      
      if (!positions[symbol]) {
        positions[symbol] = {
          symbol,
          sector,
          quantity: 0,
          totalCost: 0,
          averagePrice: 0,
          lastUpdated: date
        };
      }
      
      positions[symbol].quantity += quantity;
      positions[symbol].totalCost += totalValue;
      positions[symbol].averagePrice = positions[symbol].totalCost / positions[symbol].quantity;
      
      if (new Date(date) > new Date(positions[symbol].lastUpdated)) {
        positions[symbol].lastUpdated = date;
      }
    });
    
    return positions;
  };

  if (loading) return <div className="loading">Loading portfolio...</div>;
  if (error) return <div className="error">{error}</div>;

  const positions = calculatePositions();

  return (
    <div className="portfolio-page">
      <h2>Manage Portfolio</h2>

      <div className="search-box">
        <input
          type="text"
          value={searchSymbol}
          onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="Enter a symbol (e.g. AAPL)"
          className="search-input"
        />
        <button onClick={handleSearch} className="green-button">
          Search
        </button>
      </div>

      {foundStock && (
        <div className="stock-info-card">
          <div className="stock-header">
            <h3 className="stock-symbol">{foundStock.symbol}</h3>
            <span className="period-tag">{foundStock.period}</span>
          </div>
          
          <div className="stock-grid">
            <div className="stock-data-item">
              <label>Company</label>
              <span>{foundStock.symbol}</span>
            </div>
            <div className="stock-data-item">
              <label>Current Price</label>
              <span>${typeof foundStock.price === 'number' ? foundStock.price.toFixed(2) : 'N/A'}</span>
            </div>
            <div className="stock-data-item">
              <label>Sector</label>
              <span>{foundStock.sector}</span>
            </div>
          </div>
          
          <div className="add-stock-section">
            <input
              type="number"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="Number of shares"
              className="quantity-input"
            />
            <button onClick={handleAddToPortfolio} className="green-button">
              Buy Shares
            </button>
          </div>
        </div>
      )}

      <div className="portfolio-table-container">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Sector</th>
              <th>Quantity</th>
              <th>Average Price</th>
              <th>Total Value</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(positions).length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-message">
                  No stocks in portfolio
                </td>
              </tr>
            ) : (
              Object.values(positions).map((position) => (
                <tr key={position.symbol}>
                  <td>{position.symbol}</td>
                  <td>{position.sector}</td>
                  <td>{position.quantity}</td>
                  <td>${position.averagePrice.toFixed(2)}</td>
                  <td>${position.totalCost.toFixed(2)}</td>
                  <td>{new Date(position.lastUpdated).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleSell(position.symbol, position.quantity)}
                      className="sell-button"
                      disabled={position.quantity <= 0}
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showSellModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Sell {selectedStock?.symbol}</h3>
            <p>Available shares: {selectedStock?.availableShares}</p>
            <input
              type="number"
              min="1"
              max={selectedStock?.availableShares}
              value={sellShares}
              onChange={(e) => setSellShares(e.target.value)}
              placeholder="Number of shares to sell"
              className="quantity-input"
            />
            <div className="modal-actions">
              <button onClick={() => setShowSellModal(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleConfirmSell} className="confirm-button">
                Confirm Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagePortfolio;