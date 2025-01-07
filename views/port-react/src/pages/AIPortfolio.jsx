import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import api from '../utils/axios';
import './AIPortfolio.css';

function AIPortfolio() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expectedReturn, setExpectedReturn] = useState(14); // Default 14%
  const [method, setMethod] = useState('sharpe'); // Default method

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/ml/', {
        params: {
          expected_return: expectedReturn / 100, // Convert percentage to decimal
          method: method
        }
      });
      
      setPortfolioData(response.data);
    } catch (err) {
      console.error('Error fetching AI portfolio data:', err);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPortfolioData();
  };

  const prepareChartData = () => {
    if (!portfolioData) return null;

    const weights = portfolioData.weights;
    const labels = Object.keys(weights);
    const data = Object.values(weights);

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#4CCEAC', '#FF6384', '#36A2EB', '#FFCE56',
          '#4BC0C0', '#9966FF', '#FF9F40', '#4CCEAC', '#FF6384',
          '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
          '#4CCEAC', '#FF6384', '#36A2EB'
        ]
      }]
    };
  };

  return (
    <div className="ai-portfolio">
      <h2>AI-Optimized Portfolio</h2>
      
      <form onSubmit={handleSubmit} className="portfolio-form">
        <div className="form-group">
          <label htmlFor="expected-return">Expected Return (%)</label>
          <input
            id="expected-return"
            type="number"
            min="1"
            max="100"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(parseInt(e.target.value) || 0)}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="method">Optimization Method</label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="form-input"
          >
            <option value="sharpe">Maximize Sharpe Ratio</option>
            <option value="min_volatility">Minimize Volatility</option>
          </select>
        </div>

        <button type="submit" className="optimize-button" disabled={loading}>
          {loading ? 'Optimizing...' : 'Optimize Portfolio'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      
      {portfolioData && (
        <>
          <div className="portfolio-stats">
            <div className="stat-card">
              <h3>Expected Annual Return</h3>
              <p>{(portfolioData.expected_annual_return * 100).toFixed(2)}%</p>
            </div>
            <div className="stat-card">
              <h3>Annual Volatility</h3>
              <p>{(portfolioData.annual_volatility * 100).toFixed(2)}%</p>
            </div>
            <div className="stat-card">
              <h3>Sharpe Ratio</h3>
              <p>{portfolioData.sharpe_ratio.toFixed(2)}</p>
            </div>
          </div>

          <div className="chart-section">
            <div className="chart-container">
              <h3>Portfolio Allocation</h3>
              {prepareChartData() && <Pie data={prepareChartData()} options={chartOptions} />}
            </div>
            
            <div className="holdings-table">
              <h3>Holdings Breakdown</h3>
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(portfolioData.weights)
                    .sort(([, a], [, b]) => b - a)
                    .map(([symbol, weight]) => (
                      <tr key={symbol}>
                        <td>{symbol}</td>
                        <td>{(weight * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#fff',
        font: {
          size: 12
        }
      }
    }
  }
};

export default AIPortfolio;