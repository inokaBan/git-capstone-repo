import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.jpg'
import axios from 'axios'

const AdminLogin = () => {

  const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const navigate = useNavigate();
      
      const [apiError, setApiError] = useState("");

      const handleSubmit = (e) => {
        e.preventDefault();
        setApiError("");

        if (!email.trim() || !password.trim()) {
          setApiError("Please fill in both email and password.");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setApiError("Please enter a valid email address.");
          return;
        }

        axios
          .post('http://localhost:8081/admin/login', { email, password })
          .then((res) => {
            if (!res?.data?.admin) {
              setApiError('Unexpected server response');
              return;
            }
            alert('Admin login successful!');
            navigate('/admin/overview');
          })
          .catch((err) => {
            const message = err?.response?.data?.error || 'Invalid email or password';
            setApiError(message);
          })
      }
    
      const handleBackToUser = () => {
        navigate('/')
      };


  return (
    <div className="min-h-screen bg-white md:bg-gradient-to-br md:from-gray-50 md:to-gray-100 flex flex-col justify-center p-6 md:items-center">
      <div className="w-full max-w-full md:max-w-md md:bg-white md:p-8 md:rounded-3xl md:shadow-xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <img src={logo} alt="Logo" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Osner Hotel Admin</h1>
          <p className="text-gray-500 text-base mt-3">Please enter you admin account detailds.</p>
        </div>
        <form onSubmit={handleSubmit}>
          {apiError && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm mb-4">
              {apiError}
            </div>
          )}
          <div className="space-y-6">
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          Admin address
                        </label>
                        <input
                          type="email"
                          className="w-full px-5 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
                          placeholder="Enter admin address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-5 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
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
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Go to User Web Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin