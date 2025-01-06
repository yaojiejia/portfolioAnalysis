import React, { useState } from 'react';
import api from '../utils/axios';
import './Explore.css';

function Explore() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!searchSymbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setStockData(null);

    try {
      const response = await api.get(`/yahoo/stock?symbol=${encodeURIComponent(searchSymbol)}`);
      setStockData(response.data);
    } catch (err) {
      setError('Failed to fetch stock data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="explore-page">
      <h2>Explore Stocks</h2>

      <div className="search-section">
        <input
          type="text"
          value={searchSymbol}
          onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="Enter stock symbol (e.g. TXRH)"
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {stockData && (
        <div className="stock-details">
          <div className="stock-header">
            <div className="stock-title">
              <h3>{stockData.symbol}</h3>
              <span className="company-name">{stockData.longName}</span>
            </div>
            <div className="stock-price">
              <span className="current-price">${stockData.data}</span>
              <span className="price-change">
                {stockData.change > 0 ? '+' : ''}{stockData.change}%
              </span>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-section">
              <h4>Valuation</h4>
              <div className="metric-items">
                <div className="metric-item">
                  <label>Market Cap</label>
                  <span>${stockData.marketCap}B</span>
                </div>
                <div className="metric-item">
                  <label>P/E Ratio</label>
                  <span>{stockData.peRatio}</span>
                </div>
                <div className="metric-item">
                  <label>Price/Book</label>
                  <span>{stockData.priceToBook}</span>
                </div>
              </div>
            </div>

            <div className="metric-section">
              <h4>Cash Flow</h4>
              <div className="metric-items">
                <div className="metric-item">
                  <label>Operating Cash Flow</label>
                  <span>${stockData.operatingCashFlow}M</span>
                </div>
                <div className="metric-item">
                  <label>Free Cash Flow</label>
                  <span>${stockData.freeCashFlow}M</span>
                </div>
                <div className="metric-item">
                  <label>Cash Flow Yield</label>
                  <span>{stockData.cashFlowYield}%</span>
                </div>
              </div>
            </div>

            <div className="metric-section">
              <h4>Growth & Margins</h4>
              <div className="metric-items">
                <div className="metric-item">
                  <label>Revenue Growth</label>
                  <span>{stockData.revenueGrowth}%</span>
                </div>
                <div className="metric-item">
                  <label>Profit Margin</label>
                  <span>{stockData.profitMargin}%</span>
                </div>
                <div className="metric-item">
                  <label>Operating Margin</label>
                  <span>{stockData.operatingMargin}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Explore;