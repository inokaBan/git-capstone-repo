import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from '../assets/logo.jpg'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple password check
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Save user data (placeholder)
    console.log("User registered:", formData);
    alert("Registration successful! Please sign in.");

    // Reset form
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="min-h-screen bg-white md:bg-gradient-to-br md:from-gray-50 md:to-gray-100 flex flex-col justify-center p-6 md:items-center">
      <div className="w-full max-w-full md:max-w-md md:bg-white md:p-8 md:rounded-3xl md:shadow-xl">
        {/* Logo */}
        <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-2">
                <img src={logo} alt="Logo" />
              </div>
         </div>
  
        {/* Main Content */}
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign up to Osner</h1>
            <p className="text-gray-500 text-base leading-relaxed">
              Welcome to Osner Hotel, please enter your details to create an account
            </p>
          </div>
  
          {/* Form */}
          <div onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-4 text-base bg-gray-100 border-0 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
  
            {/* Email Field */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-2">
                Email address
              </label>
              <input
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-4 text-base bg-gray-100 border-0 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
  
            {/* Password Field */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-4 text-base bg-gray-100 border-0 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
  
            {/* Confirm Password Field */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-4 text-base bg-gray-100 border-0 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
  
            {/* Sign Up Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg py-4 rounded-xl transition-colors duration-200 mt-8"
            >
              Sign up
            </button>
          </div>
  
          {/* Footer Links */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-gray-600">
              Already have an account?{" "}
              <span className="text-blue-600 hover:underline font-medium cursor-pointer">
                Sign in
              </span>
            </p>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;