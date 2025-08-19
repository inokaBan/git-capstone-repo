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
    { name: 'Contacts', to: '/contacts' },
    { name: 'About us', to: '/aboutUs' }
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to='/'>
            <div className="flex items-center flex-shrink-0">
                      <img src={logo} alt="Logo" className="w-8 h-8 rounded-full object-cover"
                      />
            
                        <h1 className=":text-2xl font-bold text-gray-800 font-inter">Osner Hotel</h1>
            </div>
          </NavLink>
          

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) => isActive ? "text-blue-700  hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200" : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"}
                >
                  {item.name}
                </NavLink>
              ))}
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

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'max-h-64 opacity-100 visible' 
            : 'max-h-0 opacity-0 invisible overflow-hidden'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 rounded-lg mt-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) => isActive ? "text-blue-700 hover:text-blue-600 hover:bg-white block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 font-inter" : "text-gray-700 hover:text-blue-600 hover:bg-white block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 font-inter"}
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar