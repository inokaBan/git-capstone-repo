import React, { useState, useRef, useEffect } from 'react'
import { Menu, X, User, ChevronDown, ChevronRight } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.jpg'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { isAuthenticated, role, logout, user } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMenu();
    setIsUserMenuOpen(false);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const navItems = React.useMemo(() => {
    const items = [
      { name: 'Home', to: '/' },
      { name: 'Rooms', to: '/rooms' },
    ];

    // Add role-specific items
    if (isAuthenticated) {
      if (role === 'guest') {
        items.push({ name: 'My Bookings', to: '/my-bookings' });
      } else if (role === 'admin') {
        items.push({ name: 'Admin Dashboard', to: '/admin/overview' });
      }
    }

    // Add common items
    items.push(
      { name: 'Contacts', to: '/contacts' },
      { name: 'About us', to: '/aboutus' }
    );

    // Add auth buttons
    if (isAuthenticated) {
      items.push({ 
        name: 'Logout', 
        to: '#', 
        onClick: handleLogout,
        className: 'logout-btn',
        mobileOnly: true // Flag to indicate this should only show on mobile
      });
    } else {
      items.push(
        { name: 'Log in', to: '/login', className: 'login-btn' },
        { name: 'Sign up', to: '/register', className: 'signup-btn' }
      );
    }

    return items;
  }, [isAuthenticated, role]);

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to="/">
            <div className="flex items-center flex-shrink-0">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
              <h1 className="text-xl font-bold text-gray-800 font-inter">Osner Hotel</h1>
            </div>
          </NavLink>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {navItems.map((item) => {
                // Skip mobile-only items in desktop view
                if (item.mobileOnly) {
                  return null;
                }

                let customClass = "";
                if (item.className === "login-btn") {
                  customClass = "bg-white border-1 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-6 rounded-lg text-sm transition-all duration-300 transform hover:scale-105";
                } else if (item.className === "signup-btn") {
                  customClass = "bg-blue-700 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-transform duration-300 ease-in-out hover:scale-105";
                }
                
                if (item.onClick) {
                  return (
                    <button
                      key={item.name}
                      onClick={item.onClick}
                      className={customClass}
                    >
                      {item.name}
                    </button>
                  );
                }
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) => {
                      let baseClass = isActive
                        ? "text-blue-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
                      if (customClass) baseClass = customClass;
                      return baseClass;
                    }}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
              
              {/* User Avatar Dropdown - Only show when authenticated */}
              {isAuthenticated && (
                <div className="relative ml-3" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="true"
                  >
                    <User className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 ease-out">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.username || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {user?.email || ''}
                          </p>
                        </div>
                        
                        {/* Logout Button */}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center space-x-2"
                          role="menuitem"
                        >
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button - User Avatar with Arrow */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center gap-1 p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white">
                <User className="w-4 h-4" aria-hidden="true" />
              </div>
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                aria-hidden="true" 
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu - Slide in from right */}
        {isOpen && (
          <div className="md:hidden fixed top-0 right-0 h-full w-4/5 max-w-xs bg-blue-50 shadow-lg z-50 transition-transform duration-700 ease-in-out transform translate-x-0 pr-4">
            <div className="px-4 pt-8 pb-6 space-y-2 flex flex-col items-stretch h-full"> 
              {/* Close button for mobile menu */}
              <button
                onClick={closeMenu}
                className="self-end mb-4 text-gray-700 hover:text-blue-600 focus:outline-none"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
              {navItems.map((item) => {
                let customClass = "";
                let isAuthButton = false;
                
                if (item.className === "login-btn") {
                  customClass = "bg-blue-700 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-base transition-transform duration-300 ease-in-out hover:scale-105 block w-full text-center mt-56";
                  isAuthButton = true;
                } else if (item.className === "signup-btn") {
                  customClass = "bg-white border-1 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-3 px-6 rounded-lg text-base transition-all duration-300 transform hover:scale-105 block w-full text-center";
                  isAuthButton = true;
                } else if (item.className === "logout-btn") {
                  customClass = "bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-base transition-transform duration-300 ease-in-out hover:scale-105 block w-full text-center";
                }
                
                if (item.onClick) {
                  return (
                    <button
                      key={item.name}
                      onClick={item.onClick}
                      className={customClass}
                    >
                      {item.name}
                    </button>
                  );
                }
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={closeMenu}
                    className={({ isActive }) => {
                      let baseClass = isActive
                        ? "text-blue-700 hover:text-blue-600 hover:bg-white px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 font-inter flex items-center gap-2"
                        : "text-gray-700 hover:text-blue-600 hover:bg-white px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 font-inter flex items-center gap-2";
                      if (customClass) baseClass = customClass;
                      return baseClass;
                    }}
                  >
                    {!isAuthButton && <ChevronRight className="w-5 h-5 flex-shrink-0" />}
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar