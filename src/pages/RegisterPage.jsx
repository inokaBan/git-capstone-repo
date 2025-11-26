import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from '../assets/logo.jpg'
import signUpValidation from "../utils/validation/signUpValidation";
import axios from "axios";
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useToast } from '../context/ToastContext';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [values, setValues] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        fullname: "",
        gender: "",
        age: "",
        address: "",
        contactNumber: ""})

      const navigate = useNavigate();
      const { showSuccess, showError } = useToast();
      const { login } = useAuth();
      const [errors, setErrors] = useState({});
      const handleInput = (e) => {
        setValues(prev => ({
          ...prev, [e.target.name]: e.target.value
        }))
      }
      
      const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = signUpValidation(values);
        setErrors(validationErrors);

        // Check if password and confirmPassword match
        if (values.password !== values.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
          return;
        }

        const hasNoErrors =
          validationErrors.username === "" &&
          validationErrors.email === "" &&
          validationErrors.password === "" &&
          validationErrors.fullname === "" &&
          validationErrors.gender === "" &&
          validationErrors.age === "" &&
          validationErrors.address === "" &&
          validationErrors.contactNumber === "";

        if (hasNoErrors) {
          axios
            .post(API_ENDPOINTS.REGISTER, values)
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
              
              // Registration successful, now log in automatically
              axios
                .post(API_ENDPOINTS.AUTH_LOGIN, {
                  email: values.email,
                  password: values.password
                })
                .then((loginRes) => {
                  const loginData = loginRes?.data;
                  if (!loginData || !loginData.user || !loginData.role) {
                    showError('Registration successful but automatic login failed. Please log in manually.');
                    navigate('/login');
                    return;
                  }
                  
                  // Store authentication state
                  login(loginData.user, loginData.role);
                  
                  // Show success message and redirect to home
                  showSuccess('Registration successful! Welcome to Osner Hotel.');
                  navigate('/');
                })
                .catch((loginErr) => {
                  console.error('Auto-login error:', loginErr);
                  showError('Registration successful but automatic login failed. Please log in manually.');
                  navigate('/login');
                });
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

            {/* Full Name Field */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullname"
                placeholder="Enter your full name"
                onChange={handleInput}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
              <span className="text-red-500 text-sm mt-2">{errors.fullname}</span>
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

            {/* Contact Number Field */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                placeholder="Enter your contact number"
                onChange={handleInput}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
              <span className="text-red-500 text-sm mt-2">{errors.contactNumber}</span>
            </div>

            {/* Gender and Age Fields - 2 Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-base font-medium mb-2">
                  Gender
                </label>
                <select
                  name="gender"
                  onChange={handleInput}
                  value={values.gender}
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <span className="text-red-500 text-sm mt-2">{errors.gender}</span>
              </div>

              <div>
                <label className="block text-gray-700 text-base font-medium mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  placeholder="Enter your age"
                  onChange={handleInput}
                  min="1"
                  max="120"
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
                <span className="text-red-500 text-sm mt-2">{errors.age}</span>
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-gray-700 text-base font-medium mb-2">
                Address
              </label>
              <textarea
                name="address"
                placeholder="Enter your address"
                onChange={handleInput}
                rows="3"
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                required
              />
              <span className="text-red-500 text-sm mt-2">{errors.address}</span>
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
