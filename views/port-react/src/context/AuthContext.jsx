import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token && token !== 'none' && token !== 'undefined' && token !== 'null') {
        try {
          const response = await api.get('/user/');
          setUser(response.data);
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Clear invalid token
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const logout = () => {
    setUser(null);
    // Remove token completely instead of setting to 'none'
    localStorage.removeItem('access_token');
    // Remove Authorization header
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    setUser,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;