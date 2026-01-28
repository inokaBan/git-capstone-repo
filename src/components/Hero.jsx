import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const Hero = () => {
  const navigate = useNavigate();
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch room types from API
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_ENDPOINTS.ROOM_TYPES);
        setRoomTypes(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to load room types', error);
        setRoomTypes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomTypes();
  }, []);

  const handleSearch = () => {
    if (!selectedType) return alert('Please select a suite type');
    const query = `?type=${selectedType}&guests=${guests}`;
    navigate(`/rooms${query}`);
  };

  return (
    <div className="relative h-[550px] md:h-[650px] bg-gray-900">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: 'url("/background.jpg")' }}
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/50 to-transparent" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-start text-left">
        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg leading-tight animate-fade-in">
          Discover Our Rooms & Suites
        </h1>
        <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md animate-fade-in delay-150">
          Find the perfect accommodation for your stay, tailored to your comfort and style.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-4 animate-fade-in delay-300">
          <button
            onClick={() => navigate('/rooms')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
          >
            View Rooms
          </button>
          <button
            onClick={() => navigate('/contacts')}
            className="bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 hover:scale-105"
          >
            Contact Us
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-8 w-full max-w-3xl animate-fade-in delay-500">
          <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4">
            {/* Room Type */}
            <div className="flex-1 flex flex-col">
              <label className="text-gray-500 text-sm mb-1">Room Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {loading ? 'Loading...' : 'Select a suite'}
                </option>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.type_name}>
                    {t.type_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Guests */}
            <div className="flex-1 flex flex-col">
              <label className="text-gray-500 text-sm mb-1">Guests</label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                <Users className="w-5 h-5 text-gray-400" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full outline-none text-gray-700 text-sm"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} Guest{i > 0 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 w-full md:w-auto text-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> Search Rooms
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-gray-900 to-transparent" />
    </div>
  );
};

export default Hero;
