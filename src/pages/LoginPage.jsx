import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import loginValidation from "../utils/validation/loginValidation";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_ENDPOINTS } from "../config/api";

const LoginPage = () => {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const [particles, setParticles] = useState([]);

  // Floating particles (same style as Sign Up)
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 8,
        opacity: 0.1 + Math.random() * 0.3,
        animationDuration: 15 + Math.random() * 20,
        animationDelay: Math.random() * 10,
      });
    }
    setParticles(newParticles);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = loginValidation(values);
    setErrors(validationErrors);

    const hasNoErrors =
      validationErrors.email === "" && validationErrors.password === "";

    if (hasNoErrors) {
      axios
        .post(API_ENDPOINTS.AUTH_LOGIN, {
          email: values.email,
          password: values.password,
        })
        .then((res) => {
          const data = res?.data;
          if (!data || !data.user || !data.role) {
            showError("Unexpected server response");
            return;
          }

          login(data.user, data.role);

          if (data.role === "admin" || data.role === "staff") {
            showSuccess(
              `${data.role === "admin" ? "Admin" : "Staff"} login successful!`
            );
            navigate("/admin/overview");
          } else {
            showSuccess("Login successful!");
            navigate("/");
          }
        })
        .catch((err) => {
          const message =
            err?.response?.data?.error || "Invalid email or password";
          showError(message);
        });
    }
  };

  const handleInput = (e) => {
    setValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-white lg:bg-gradient-to-br lg:from-blue-50 lg:via-white lg:to-indigo-50 flex items-center justify-center p-6 lg:p-10 relative overflow-hidden">

      {/* Floating particles */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-br from-blue-400 to-indigo-400"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animation: `float ${p.animationDuration}s ease-in-out infinite`,
              animationDelay: `${p.animationDelay}s`,
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

      {/* Main Container */}
      <div className="w-full max-w-5xl lg:grid lg:grid-cols-5 lg:gap-8 lg:items-center relative z-10">

        {/* LEFT SIDE (branding) – hidden on mobile */}
        <div className="hidden lg:flex lg:col-span-2 flex-col justify-center space-y-6 px-6">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
              <img src={logo} alt="Osner Hotel Logo" className="w-full h-full object-cover" />
            </div>

            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              Welcome Back to
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Osner Hotel
              </span>
            </h2>

            <p className="text-gray-600 text-base leading-relaxed">
              Experience comfort and luxury. Log in to continue your journey.
            </p>
          </div>

          {/* Feature pills (same style as RegisterPage) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-gray-700 text-sm font-medium">Secure Login</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-gray-700 text-sm font-medium">Fast Authentication</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (form) */}
        <div className="w-full lg:col-span-3 bg-white lg:rounded-2xl lg:shadow-2xl lg:p-8">

          {/* Mobile logo */}
          <div className="text-center mb-10 lg:hidden">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl overflow-hidden">
              <img src={logo} alt="logo" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Sign in to Osner</h1>
            <p className="text-gray-500 text-sm mt-2">
              Welcome back! Please enter your credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-2">Email address</label>
              <input
                autoFocus
                type="email"
                name="email"
                placeholder="john@example.com"
                onChange={handleInput}
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <span className="text-red-500 text-xs mt-1">{errors.email}</span>
            </div>

            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-2">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                onChange={handleInput}
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <span className="text-red-500 text-xs mt-1">{errors.password}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
            >
              Sign in
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-blue-600 font-medium hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
