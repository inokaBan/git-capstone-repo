import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const Hero = () => {
  const [roomType, setRoomType] = useState('');
  const [guests, setGuests] = useState('1');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadRoomTypes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_ENDPOINTS.ROOM_TYPES);
        setRooms(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Failed to load room types', e);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    loadRoomTypes();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomType) return alert('Please select a suite type');
    if (!guests || guests < 1) return alert('Please enter a valid number of guests');
    navigate(`/rooms?type=${roomType}&guests=${guests}`);
  };

  const roomTypes = rooms.map(rt => ({
    id: rt.id,
    name: rt.type_name
  }));

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: 'url("/background.jpg")' }}
    >
      {/* Lighter overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-900/30 to-slate-900/50"></div>
      
 {/* Centered content container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center justify-center lg:justify-between px-6 lg:px-8">
          
 {/* Hero Text - visible again & perfectly centered on mobile, left-aligned on desktop */}
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <div className="space-y-6">
              <span className="text-blue-300 text-sm tracking-[0.4em] uppercase font-light block">
                Premium Experience
              </span>
              
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-extralight leading-tight tracking-tight text-white">
                Osner
                <span className="block font-serif italic text-blue-200 mt-2 text-5xl md:text-6xl lg:text-7xl">
                  Hotel
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-200 font-light leading-relaxed">
                Where elegance meets exceptional service
              </p>
            </div>
          </div>
          
 {/* Compact Booking Form - centered on mobile, right side on desktop */}
          <div className="w-full max-w-sm mx-auto lg:mx-0">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
              <div className="p-6">
                <h3 className="text-2xl font-light text-gray-900 mb-1 text-center lg:text-left">
                  Reserve Your Suite
                </h3>
                <p className="text-xs text-gray-500 font-light mb-5 text-center lg:text-left">
                  Instant availability check
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Suite Type</label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                      required
                      disabled={loading}
                    >
                      <option value="">{loading ? 'Loading...' : 'Choose suite'}</option>
                      {roomTypes.map((type) => (
                        <option key={type.id} value={type.name.toLowerCase()}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Guests</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="1"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium text-sm py-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Find Available Rooms
                  </button>
                </form>

                <p className="text-[11px] text-gray-400 text-center mt-4">
                  Booking completed on next step
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
