import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from '../assets/logo.jpg';
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
    contactNumber: ""
  });

  const [particles, setParticles] = useState([]);

  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { login } = useAuth();
  const [errors, setErrors] = useState({});

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 100,
          animationDuration: 15 + Math.random() * 20,
          animationDelay: Math.random() * 10,
          size: 4 + Math.random() * 8,
          opacity: 0.1 + Math.random() * 0.3
        });
      }
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const handleInput = (e) => {
    setValues(prev => ({
      ...prev, 
      [e.target.name]: e.target.value
    }));
  };

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
  };

  return (
    <div className="min-h-screen bg-white lg:bg-gradient-to-br lg:from-blue-50 lg:via-white lg:to-indigo-50 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Animated Particles */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-blue-400 to-indigo-400"
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animation: `float ${particle.animationDuration}s ease-in-out infinite`,
              animationDelay: `${particle.animationDelay}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(100vh) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10vh) translateX(20px) rotate(180deg);
          }
        }
      `}</style>

      <div className="w-full max-w-5xl lg:grid lg:grid-cols-5 lg:gap-8 lg:items-center relative z-10">
        
        {/* Left Side - Branding Section (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-2 flex-col justify-center space-y-6 px-6">
          <div className="space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
              <img src={logo} alt="Osner Hotel Logo" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Welcome to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Osner Hotel
                </span>
              </h2>
              <p className="text-base text-gray-600 leading-relaxed">
                Experience luxury and comfort like never before. Join our community and unlock exclusive benefits.
              </p>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium text-sm">Priority Booking Access</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium text-sm">Member Exclusive Deals</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium text-sm">24/7 Customer Support</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="w-full lg:col-span-3 bg-white lg:rounded-2xl lg:shadow-2xl lg:p-8">
          {/* Mobile Logo */}
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-3 overflow-hidden">
              <img src={logo} alt="Osner Hotel Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Sign up to Osner</h1>
            <p className="text-gray-500 text-sm">
              Welcome to Osner Hotel, please enter your details to create an account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Username & Full Name - 2 Column on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your name"
                  onChange={handleInput}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                {errors.username && <span className="text-red-500 text-xs mt-1 block">{errors.username}</span>}
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullname"
                  placeholder="Enter your full name"
                  onChange={handleInput}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                {errors.fullname && <span className="text-red-500 text-xs mt-1 block">{errors.fullname}</span>}
              </div>
            </div>

            {/* Email & Contact Number - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  onChange={handleInput}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email}</span>}
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="Enter your contact number"
                  onChange={handleInput}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                {errors.contactNumber && <span className="text-red-500 text-xs mt-1 block">{errors.contactNumber}</span>}
              </div>
            </div>

            {/* Gender and Age - 2 Column Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Gender
                </label>
                <select
                  name="gender"
                  onChange={handleInput}
                  value={values.gender}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="text-red-500 text-xs mt-1 block">{errors.gender}</span>}
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  placeholder="Enter your age"
                  onChange={handleInput}
                  min="1"
                  max="120"
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                {errors.age && <span className="text-red-500 text-xs mt-1 block">{errors.age}</span>}
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                Address
              </label>
              <textarea
                name="address"
                placeholder="Enter your address"
                onChange={handleInput}
                rows="2"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all resize-none"
                required
              />
              {errors.address && <span className="text-red-500 text-xs mt-1 block">{errors.address}</span>}
            </div>

            {/* Password Fields - 2 Column on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  onChange={handleInput}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                <PasswordStrengthMeter password={values.password} />
                {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password}</span>}
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  onChange={handleInput}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                {errors.confirmPassword && <span className="text-red-500 text-xs mt-1 block">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base py-3 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 mt-5"
            >
              Sign up
            </button>
          </form>

          {/* Footer Links */}
          <div className="text-center mt-5">
            <p className="text-gray-600 text-sm">
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