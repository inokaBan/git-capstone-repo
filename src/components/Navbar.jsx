import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.jpg'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const navItems = [
    { name: 'Home', to: '/' },
    { name: 'Rooms', to: '/rooms' },
    { name: 'My Bookings', to: '/my-bookings' },
    { name: 'Contacts', to: '/contacts' },
    { name: 'About us', to: '/aboutus' },
    { name: 'Log in', to: '/login', className: 'login-btn' },
    { name: 'Sign up', to: '/register', className: 'signup-btn' }
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to='/'>
            <div className="flex items-center flex-shrink-0">
                      <img src={logo} alt="Logo" className="w-10 h-10 rounded-full object-cover"
                      />
            
                        <h1 className=":text-2xl font-bold text-gray-800 font-inter">Osner Hotel</h1>
            </div>
          </NavLink>
          

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {navItems.map((item) => {
                let customClass = "";
                if (item.className === "login-btn") {
                  customClass = "bg-white border-1 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-2 px-6 rounded-lg text-sm transition-all duration-300 transform hover:scale-105";
                } else if (item.className === "signup-btn") {
                  customClass = "bg-blue-700 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-transform duration-300 ease-in-out hover:scale-105";
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
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Slide in from left */}
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
                if (item.className === "login-btn") {
                  customClass = "bg-blue-700 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-base transition-transform duration-300 ease-in-out hover:scale-105 block w-full text-center mt-56";
                } else if (item.className === "signup-btn") {
                  customClass = "bg-white border-1 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-3 px-6 rounded-lg text-base transition-all duration-300 transform hover:scale-105 block w-full text-center";
                }
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={closeMenu}
                    className={({ isActive }) => {
                      let baseClass = isActive
                        ? "text-blue-700 hover:text-blue-600 hover:bg-white block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 font-inter"
                        : "text-gray-700 hover:text-blue-600 hover:bg-white block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 font-inter";
                      if (customClass) baseClass = customClass;
                      return baseClass;
                    }}
                  >
                    {item.name}
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
