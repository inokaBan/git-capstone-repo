import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Bed, Calendar, Package, X, Settings, BarChart3, Home, LogOut, Users, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from "../assets/logo.jpg"

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [expandedMenus, setExpandedMenus] = useState({});

    const handleLogout = () => {
      logout();
      navigate('/');
      setSidebarOpen(false);
    };

    const toggleMenu = (label) => {
      setExpandedMenus(prev => ({
        ...prev,
        [label]: !prev[label]
      }));
    };

    const navigationItems = [
      { to: '/admin/overview', label: 'Overview', icon: Home },
      { to: '/admin/rooms', label: 'Rooms', icon: Bed },
      { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
      { to: '/admin/calendar', label: 'Calendar', icon: Calendar },
      { to: '/admin/walkin', label: 'Walkin Reservation', icon: UserPlus },
      { 
        label: 'Manage Inventory', 
        icon: Package,
        subItems: [
          { to: '/admin/inventory/items', label: 'Items' },
          { to: '/admin/inventory/room-stock', label: 'Room Stock' },
          { to: '/admin/inventory/warehouse', label: 'Warehouse' },
          { to: '/admin/inventory/tasks', label: 'Tasks' },
          { to: '/admin/inventory/alerts', label: 'Alerts' },
          { to: '/admin/inventory/reports', label: 'Reports' },
        ]
      },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ];

  return (
    <>
    {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black-100 bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
                <img src={logo} className="h-8 w-8" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Osner Hotel</h1>
                <p className="text-xs text-gray-600">Hotel Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const { to, label, icon: Icon, subItems } = item;
              const isExpanded = expandedMenus[label];
              
              // If item has subItems, render collapsible menu
              if (subItems) {
                return (
                  <div key={label}>
                    <button
                      onClick={() => toggleMenu(label)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {subItems.map((subItem) => (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              `block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`
                            }
                          >
                            {subItem.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Regular menu item
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mb-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@osner.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
