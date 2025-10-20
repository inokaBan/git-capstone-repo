import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.jpg'
import LoginValidation from "../context/LoginValidation"
import axios from 'axios'
import { useAuth } from '../context/AuthContext';
import { useAlertDialog } from '../context/AlertDialogContext';


const LoginPage = () => {
    const [values, setValues] = useState({
      email: "",
      password: ""})

    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const { login } = useAuth();
    const { showSuccess } = useAlertDialog();
    
    const handleSubmit = (e) => {
      e.preventDefault();
      const validationErrors = LoginValidation(values);
      setErrors(validationErrors);

      const hasNoErrors = validationErrors.email === "" && validationErrors.password === "";
      if (hasNoErrors) {
        axios.post('http://localhost:8081/api/auth/login', {
          email: values.email,
          password: values.password
        })
        .then((res) => {
          const data = res?.data;
          if (!data || !data.user || !data.role) {
            setErrors((prev) => ({ ...prev, api: 'Unexpected server response' }));
            return;
          }
          
          // Store authentication state
          login(data.user, data.role);
          
          // Redirect based on role
          if (data.role === 'admin' || data.role === 'staff') {
            showSuccess(`${data.role === 'admin' ? 'Admin' : 'Staff'} login successful!`);
            navigate('/admin/overview');
          } else {
            showSuccess('Login successful!');
            navigate('/home');
          }
        })
        .catch((err) => {
          const message = err?.response?.data?.error || 'Invalid email or password';
          setErrors((prev) => ({ ...prev, api: message }));
        })
      }
    }

    const handleInput = (e) => {
      setValues(prev => ({
        ...prev, [e.target.name]: e.target.value
      }))
    }
  
    const handleSignUp = () => {
      navigate('/register')
    };

    const handleContinueAsGuest = () => {
      navigate('/home');
    };

  return (
    <div className="min-h-screen bg-white md:bg-gradient-to-br md:from-gray-50 md:to-gray-100 flex flex-col justify-center p-6 md:items-center">
      <div className="w-full max-w-full md:max-w-md md:bg-white md:p-8 md:rounded-3xl md:shadow-xl">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6">
            <img src={logo} alt="Logo" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sign in to Osner</h1>
          <p className="text-gray-500 text-base mt-3">Welcome to Osner Hotel, please enter your details</p>
        </div>
        <form onSubmit={handleSubmit}>
          {errors.api && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm mb-4">
              {errors.api}
            </div>
          )}
          <div className="space-y-6">
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          Email address
                        </label>
                        <input
                          autoFocus
                          type="email"
                          className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          placeholder="john@example.com"
                          onChange={handleInput}
                          name="email"
                        />
                        <span className="text-red-500 text-sm mt-2">{errors.email}</span>
                      </div>
                      
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-3">
                          Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          placeholder="Enter your pasword"
                          onChange={handleInput}
                          name="password"
                        />
                        <span className="text-red-500 text-sm mt-2">{errors.password}</span>  
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-lg text-base"
                      >
                        Sign in
                      </button>
                    </div>
        </form>
        

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-base">
            Don't have an account?{" "}
            <button
              onClick={handleSignUp}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleContinueAsGuest}
            className="w-full bg-gray-100 text-gray-700 py-4 px-4 rounded-xl font-medium hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 transition-all duration-200 text-base"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
