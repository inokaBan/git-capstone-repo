import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // 'admin' or 'guest'
  const [token, setToken] = useState(null); // Add token state
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedRole && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(storedRole);
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    setIsAuthenticated(true);
    
    // Create a simple auth token (using email as token for now)
    // In production, this would be a JWT token from the backend
    const authToken = `Bearer ${userData.email}`;
    setToken(authToken);
    
    // Persist to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userRole);
    localStorage.setItem('authToken', authToken);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('authToken');
  };

  const isAdmin = () => role === 'admin';
  const isGuest = () => role === 'guest';
  const isStaff = () => role === 'staff';

  const getAuthHeader = () => {
    return token ? { Authorization: token } : {};
  };

  const value = {
    user,
    isAuthenticated,
    role,
    loading,
    token,
    login,
    logout,
    isAdmin,
    isGuest,
    isStaff,
    getAuthHeader
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
