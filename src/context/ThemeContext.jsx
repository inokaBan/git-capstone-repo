import React, { createContext, useContext, useState, useLayoutEffect, useCallback } from 'react';

const ThemeContext = createContext();

// Helper function to apply theme class to document
const applyTheme = (theme) => {
  const root = document.documentElement;
  // Always remove the dark class first, then add it back if needed
  // This ensures a clean state transition
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('osner-theme');
    return savedTheme || 'dark';
  });

  // Apply theme on mount and whenever it changes
  useLayoutEffect(() => {
    // Persist theme to localStorage whenever it changes
    localStorage.setItem('osner-theme', theme);
    
    // Apply the theme class to the document
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      // Immediately apply the theme change to DOM for instant feedback
      applyTheme(newTheme);
      // Update localStorage immediately
      localStorage.setItem('osner-theme', newTheme);
      return newTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
