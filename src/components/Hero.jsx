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
    
    if (!roomType) {
      alert('Please select a room type');
      return;
    }
    
    if (!guests || guests < 1) {
      alert('Please enter a valid number of guests');
      return;
    }
    
    navigate(`/rooms?type=${roomType}&guests=${guests}`);
  };

  const roomTypes = rooms.map(rt => ({
    id: rt.id,
    name: rt.type_name
  }));

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        backgroundImage: 'url("/background.jpg")'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-blue-900/50 to-slate-900/70"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Hero Text */}
          <div className="text-white space-y-8 px-4">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="text-blue-300 text-sm tracking-[0.3em] uppercase font-light">Premium Experience</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-extralight leading-tight tracking-tight">
                Osner
                <span className="block font-serif italic text-blue-200 mt-2">Hotel</span>
              </h1>
              
              <p className="text-xl text-gray-300 font-light leading-relaxed max-w-lg">
                Where elegance meets exceptional service
              </p>
            </div>
          </div>
          
          {/* Right: Booking Form */}
          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              
              <div className="p-10">
                <div className="mb-8">
                  <h3 className="text-3xl font-light text-gray-900 mb-2">
                    Reserve Your Suite
                  </h3>
                  <p className="text-gray-500 text-sm font-light">
                    Begin your luxury experience
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Room Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suite Type
                    </label>
                    <div className="relative">
                      <select
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 appearance-none cursor-pointer"
                        required
                        disabled={loading}
                      >
                        <option value="">
                          {loading ? 'Loading...' : 'Select suite type'}
                        </option>
                        {roomTypes.map((type) => (
                          <option key={type.id} value={type.name.toLowerCase()}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Number of Guests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guests
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900"
                        placeholder="Number of guests"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 mt-2"
                  >
                    Search Available Rooms
                  </button>
                  
                </form>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    Complete your booking on the room details page
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Hero;
