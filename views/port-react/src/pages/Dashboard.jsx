import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale, ArcElement } from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import api from '../utils/axios';
import './Dashboard.css';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [lineData, setLineData] = useState({});
  const [holdingsData, setHoldingsData] = useState({});
  const [sectorData, setSectorData] = useState({});
  const [summary, setSummary] = useState({
    todayGain: 0,
    totalGain: 0,
    bestPerformer: null,
    worstPerformer: null
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Clean the token by removing extra quotes
      const cleanToken = token ? token.replace(/^"|"$/g, '') : '';
      
      const response = await api.get('/transactions/', {
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        }
      });
  
      const transactionData = response.data.transactions || [];
      setTransactions(transactionData);
      
      if (transactionData.length > 0) {
        buildHoldingsChart(transactionData);
        buildSectorChart(transactionData);
        calculateSummary(transactionData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const buildLineChart = (transactions) => {
    // Assuming we have 7 days of historical data
    const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const data = labels.map(() => Math.random() * 100 - 50); // Mock data for demonstration

    setLineData({
      labels,
      datasets: [
        {
          label: 'Total P/L',
          data: data,
          borderColor: '#36A2EB',
          tension: 0.4,
          fill: false
        }
      ]
    });
  };

  const buildHoldingsChart = (transactions) => {
    // Group transactions by symbol and calculate total value
    const holdings = transactions.reduce((acc, [_, __, symbol, ___, price, quantity]) => {
      if (!acc[symbol]) {
        acc[symbol] = 0;
      }
      acc[symbol] += price * quantity;
      return acc;
    }, {});

    setHoldingsData({
      labels: Object.keys(holdings),
      datasets: [{
        data: Object.values(holdings),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
        ]
      }]
    });
  };

  const buildSectorChart = (transactions) => {
    // Group transactions by sector and calculate total value
    const sectors = transactions.reduce((acc, [_, __, ___, sector, price, quantity]) => {
      if (!acc[sector]) {
        acc[sector] = 0;
      }
      acc[sector] += price * quantity;
      return acc;
    }, {});

    setSectorData({
      labels: Object.keys(sectors),
      datasets: [{
        data: Object.values(sectors),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
        ]
      }]
    });
  };

  const calculateSummary = (transactions) => {
    // Group transactions by symbol to calculate latest positions
    const positions = transactions.reduce((acc, [_, __, symbol, ___, price, quantity]) => {
      if (!acc[symbol]) {
        acc[symbol] = { quantity: 0, totalValue: 0 };
      }
      acc[symbol].quantity += quantity;
      acc[symbol].totalValue += price * quantity;
      return acc;
    }, {});

    // Calculate simple summary metrics
    const totalValue = Object.values(positions).reduce((sum, pos) => sum + pos.totalValue, 0);
    
    setSummary({
      todayGain: totalValue * 0.01, // Simplified daily gain calculation
      totalGain: totalValue * 0.05, // Simplified total gain calculation
      bestPerformer: { stock: Object.keys(positions)[0], gain: 5.2 }, // Simplified
      worstPerformer: { stock: Object.keys(positions)[0], gain: -2.1 } // Simplified
    });
  };

  return (
    <div className="dashboard">
      <div className="summary-section">
        <div className="summary-card">
          <h3>Today's Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Today's Gain/Loss</label>
              <span className={summary.todayGain >= 0 ? 'profit' : 'loss'}>
                ${summary.todayGain.toFixed(2)}
              </span>
            </div>
            <div className="summary-item">
              <label>Total Gain/Loss</label>
              <span className={summary.totalGain >= 0 ? 'profit' : 'loss'}>
                ${summary.totalGain.toFixed(2)}
              </span>
            </div>
            {summary.bestPerformer && (
              <div className="summary-item">
                <label>Best Performer</label>
                <span className="profit">
                  {summary.bestPerformer.stock} (+{summary.bestPerformer.gain}%)
                </span>
              </div>
            )}
            {summary.worstPerformer && (
              <div className="summary-item">
                <label>Worst Performer</label>
                <span className="loss">
                  {summary.worstPerformer.stock} ({summary.worstPerformer.gain}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Portfolio Performance</h3>
          <div className="chart-container">
            {lineData.labels && <Line data={lineData} options={lineOptions} />}
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Holdings Distribution</h3>
          <div className="chart-container">
            {holdingsData.labels && <Pie data={holdingsData} options={pieOptions} />}
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Sector Allocation</h3>
          <div className="chart-container">
            {sectorData.labels && <Pie data={sectorData} options={pieOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#fff' }
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255,255,255,0.1)' },
      ticks: { color: '#fff' }
    },
    x: {
      grid: { color: 'rgba(255,255,255,0.1)' },
      ticks: { color: '#fff' }
    }
  }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'right',
      labels: { color: '#fff' }
    }
  }
};

export default Dashboard;