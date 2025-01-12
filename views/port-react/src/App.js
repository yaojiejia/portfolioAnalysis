import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ManagePortfolio from './pages/ManagePortfolio';
import AIPortfolio from './pages/AIPortfolio';
import Explore from './pages/Explore';
import './App.css';

const Layout = ({ children }) => {
  return (
    <div className="container">
      <aside className="sidebar">
        <div className="admin-section">
          <h3>ADMINIS</h3>
          <div className="profile">
            <img 
              src="https://via.placeholder.com/80" 
              alt="Profile" 
              className="profile-img"
            />
            <h3>Guest User</h3>
            <p className="role">Portfolio Manager</p>
          </div>
        </div>

        <nav>
          <div className="nav-section">
            <div className="nav-item">
              <Link to="/" className="nav-link">
                <span className="icon">🏠</span>
                Dashboard
              </Link>
            </div>
            <div className="nav-item">
              <Link to="/explore" className="nav-link">
                <span className="icon">🔍</span>
                Explore
              </Link>
            </div>
            <div className="nav-item">
              <Link to="/manage-portfolio" className="nav-link">
                <span className="icon">📈</span>
                Manage Portfolio
              </Link>
            </div>
            <div className="nav-item">
              <Link to="/ai-portfolio" className="nav-link">
                <span className="icon">🤖</span>
                AI Portfolio
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <div className="header">
          <h1>Stock Portfolio Manager</h1>
          <div className="header-actions">
            <button className="download-btn">DOWNLOAD REPORTS</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/explore" element={
          <Layout>
            <Explore />
          </Layout>
        } />
        <Route path="/manage-portfolio" element={
          <Layout>
            <ManagePortfolio />
          </Layout>
        } />
        <Route path="/ai-portfolio" element={
          <Layout>
            <AIPortfolio />
          </Layout>
        } />
        <Route path="*" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;