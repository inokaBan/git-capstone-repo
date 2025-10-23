import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from '../assets/logo.jpg'
import SignUpValidation from "../context/SignUpValidation";
import axios from "axios";
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useToast } from '../context/ToastContext';

const RegisterPage = () => {
  const [values, setValues] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""})

      const navigate = useNavigate();
      const { showSuccess, showError } = useToast();
      const [errors, setErrors] = useState({});
      const handleInput = (e) => {
        setValues(prev => ({
          ...prev, [e.target.name]: e.target.value
        }))
      }
      
      const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = SignUpValidation(values);
        setErrors(validationErrors);

        // Check if password and confirmPassword match
        if (values.password !== values.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
          return;
        }

        const hasNoErrors =
          validationErrors.username === "" &&
          validationErrors.email === "" &&
          validationErrors.password === "";

        if (hasNoErrors) {
          axios
            .post('http://localhost:8081/osner_db', values)
            .then((res) => {
              const responseData = res?.data;
              const isStringError = typeof responseData === 'string' && responseData.toLowerCase().includes('error');
              const isObjectError = responseData && typeof responseData === 'object' && responseData.error;

              if (isStringError || isObjectError) {
                const message = isObjectError ? responseData.error : String(responseData);
                console.error('Server error:', message);
                showError(`Server error: ${message}`);
                return;
              }
              showSuccess("Registration successful!");
              navigate('/login');
            })
            .catch((err) => {
              console.error(err);
              showError('Network or server error');
            });
        }
      }

      

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="Enter your name"
                onChange={handleInput}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
              <span className="text-red-500 text-sm mt-2">{errors.username}</span>
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
                onChange={handleInput}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
              <span className="text-red-500 text-sm mt-2">{errors.email}</span>
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
                onChange={handleInput}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
              <PasswordStrengthMeter password={values.password} />
              {errors.password && (
                <span className="text-red-500 text-sm mt-2 block">{errors.password}</span>
              )}
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
                onChange={handleInput}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
              <span className="text-red-500 text-sm mt-2">{errors.confirmPassword}</span>
            </div>
  
            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg py-4 rounded-xl transition-colors duration-200 mt-8"
            >
              Sign up
            </button>
          </form>
  
          {/* Footer Links */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline font-medium cursor-pointer">
                Sign in
              </Link>
            </p>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
