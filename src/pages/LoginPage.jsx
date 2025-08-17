  import React, { useState } from "react";
  import { useNavigate } from 'react-router-dom'
  import logo from '../assets/logo.jpg'
  
  
  const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    
    const handleSubmit = (e) => {
      e.preventDefault();
      axios.post('http://localhost/8081/user', {email, password})
      .then(res => console.log(res))
      .catch(err => console.log(err))
    }
  
    const handleLogin = (e) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) {
          alert("Please fill in both email and password.");
          return;
        }
        
        navigate("/home");
      
        // Optional: Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert("Please enter a valid email address.");
          return;
        }
        
    };
    
  
    const handleSignUp = () => {
      navigate('/register')
    };
  
    const handleAdminAccess = () => {
      alert("Navigate to admin page");
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
            <div className="space-y-6">
                        <div>
                          <label className="block text-base font-medium text-gray-700 mb-3">
                            Email address
                          </label>
                          <input
                            type="email"
                            className="w-full px-5 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
                            placeholder="john@example.com"
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
                            placeholder="Enter your pasword"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        
                        <button
                          onClick={handleLogin}
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
  
          <div className="mt-4 text-center">
            <button 
              onClick={handleAdminAccess}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Admin Access
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default LoginPage;