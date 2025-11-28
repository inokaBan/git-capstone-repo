import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Send, CheckCircle } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <div className="relative h-96 md:h-[28rem] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/background.jpg")',
          }}
        ></div>
        
        {/* Gradient Overlay for Text Visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center text-white max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
              We're here to help make your stay in Sagay City comfortable and memorable
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        
        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 md:mb-24">
          <div className="group">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 hover:border-blue-500 hover:shadow-xl h-full">
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                  <MapPin className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Visit Us</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Sagay City<br />
                  Negros Occidental<br />
                  Philippines 6122
                </p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 hover:border-blue-500 hover:shadow-xl h-full">
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                  <Phone className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Call Us</h3>
                <a href="tel:+63XXXXXXXXXX" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                  +63 XXX XXX XXXX
                </a>
                <p className="text-gray-500 text-xs mt-2">Available 24/7</p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 hover:border-blue-500 hover:shadow-xl h-full">
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                  <Mail className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Email Us</h3>
                <a href="mailto:info@osnerhotel.com" className="text-blue-600 hover:text-blue-800 font-medium break-all transition-colors">
                  info@osnerhotel.com
                </a>
                <p className="text-gray-500 text-xs mt-2">Response within 24hrs</p>
              </div>
            </div>
          </div>

          <div className="group">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 transition-all duration-300 hover:border-blue-500 hover:shadow-xl h-full">
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                  <Clock className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Front Desk</h3>
                <p className="text-gray-600 font-medium">24 Hours</p>
                <p className="text-gray-500 text-xs mt-2">Every day of the week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-gray-50 rounded-2xl p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Send a Message</h2>
                <p className="text-gray-600">Have a question? We'd love to hear from you. Fill out the form below.</p>
              </div>

              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800">Message sent successfully!</p>
                    <p className="text-sm text-green-700 mt-1">We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="juan@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="6"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <span>Send Message</span>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Info Card */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-gray-700 font-medium">Check-in</span>
                  <span className="text-gray-900 font-semibold">2:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-gray-700 font-medium">Check-out</span>
                  <span className="text-gray-900 font-semibold">12:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-gray-700 font-medium">Languages</span>
                  <span className="text-gray-900 font-semibold">EN, FIL</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 font-medium">Payment</span>
                  <span className="text-gray-900 font-semibold">Cash, Cards</span>
                </div>
              </div>
            </div>

            {/* Amenities List */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Hotel Amenities</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span>Complimentary Wi-Fi</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span>24/7 Front Desk</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span>Free Parking</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span>Air Conditioning</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span>Wheelchair Accessible</span>
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span>Fresh Towels Daily</span>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div className="bg-gray-900 text-white rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-3">Connect With Us</h3>
              <p className="text-gray-300 text-sm mb-5">
                Follow for updates and special offers
              </p>
              <a
                href="https://www.facebook.com/osnerhotel"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors w-full"
              >
                <Facebook className="w-5 h-5" />
                <span>Facebook Page</span>
              </a>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 md:mt-24">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Find Us</h2>
            <p className="text-gray-600">Located in the heart of Sagay City, Negros Occidental</p>
          </div>
          
          <div className="bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200">
            <div className="relative w-full h-80 md:h-96 flex items-center justify-center">
              <div className="text-center px-6">
                <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Map Coming Soon</h3>
                <p className="text-gray-600">
                  Sagay City, Negros Occidental, Philippines 6122
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-300">
            © 2025 Osner Hotel, Sagay City. Your gateway to comfort and convenience.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
