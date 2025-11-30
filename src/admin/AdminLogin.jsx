import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.jpg'
import axios from 'axios'
import { useToast } from '../context/ToastContext';
import { API_ENDPOINTS } from '../config/api';

const AdminLogin = () => {

  const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const navigate = useNavigate();
      const { showSuccess, showError } = useToast();

      const handleSubmit = (e) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
          showError("Please fill in both email and password.");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showError("Please enter a valid email address.");
          return;
        }

        axios
          .post(API_ENDPOINTS.ADMIN_LOGIN, { email, password })
          .then((res) => {
            if (!res?.data?.admin) {
              showError('Unexpected server response');
              return;
            }
            showSuccess('Admin login successful!');
            navigate('/admin/overview');
          })
          .catch((err) => {
            const message = err?.response?.data?.error || 'Invalid email or password';
            showError(message);
          })
      }
    
      const handleBackToUser = () => {
        navigate('/')
      };


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 md:bg-gradient-to-br md:from-gray-50 md:to-gray-100 dark:md:from-gray-900 dark:md:to-gray-800 flex flex-col justify-center p-6 md:items-center">
      <div className="w-full max-w-full md:max-w-md md:bg-white dark:md:bg-gray-800 md:p-8 md:rounded-3xl md:shadow-xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <img src={logo} alt="Logo" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Osner Hotel Admin</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base mt-3">Please enter you admin account detailds.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
                      <div>
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Admin address
                        </label>
                        <input
                          autoFocus
                          type="email"
                          className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base"
                          placeholder="Enter admin address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base"
                          placeholder="Enter pasword"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-lg text-base"
                      >
                        Sign in
                      </button>
                    </div>
        </form>

        <div className="mt-4 text-center">
          <button 
            onClick={handleBackToUser}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Go to User Web Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
