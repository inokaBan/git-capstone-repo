import React, { useState, useEffect } from 'react'
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const TopHeader = ({title, setSidebarOpen}) => {
  const { user, getAuthHeader } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS_COUNT, {
        headers: getAuthHeader(),
      });
      setNotificationCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      // Don't show error to user, just keep the count at current value
    }
  };

  // Fetch on mount and set up polling
  useEffect(() => {
    fetchNotificationCount();
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchNotificationCount, 30000);
    
    // Listen for alert resolution events for immediate updates
    const handleAlertResolved = () => {
      fetchNotificationCount();
    };
    window.addEventListener('alertResolved', handleAlertResolved);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('alertResolved', handleAlertResolved);
    };
  }, []);
  
  return (
    <>
        <header className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
                >
                  <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className="relative p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  type="button"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                <button 
                  onClick={() => {
                    setNotificationCount(0);
                    navigate('/admin/notifications');
                  }}
                  className="relative p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.username || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                  </div>
                  <div className="h-9 w-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
    </>
  )
}

export default TopHeader
