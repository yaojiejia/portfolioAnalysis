import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import ManagePortfolio from './pages/ManagePortfolio';
import AIPortfolio from './pages/AIPortfolio';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

// Protected Layout Component
const ProtectedLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

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
            <h3>{user.username || 'User'}</h3>
            <p className="role">Portfolio Manager</p>
            <button onClick={logout} className="sidebar-button">
              Logout
            </button>
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

// Public Layout Component
const PublicLayout = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          } />
          <Route path="/signup" element={
            <PublicLayout>
              <Signup />
            </PublicLayout>
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          } />
          <Route path="/explore" element={
            <ProtectedLayout>
              <Explore />
            </ProtectedLayout>
          } />
          <Route path="/manage-portfolio" element={
            <ProtectedLayout>
              <ManagePortfolio />
            </ProtectedLayout>
          } />
          <Route path="/ai-portfolio" element={
            <ProtectedLayout>
              <AIPortfolio />
            </ProtectedLayout>
          } />

          {/* Catch all route - redirect to dashboard if logged in, otherwise to login */}
          <Route path="*" element={
            <Navigate to="/" replace />
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;