import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';



const Hero = () => {
  const [roomType, setRoomType] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadRoomTypes = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:8081/api/room-types');
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
    
    navigate(`/rooms?type=${roomType}`);
  };

  // Extract room types from the fetched data
  const roomTypes = rooms.map(rt => ({
    id: rt.id,
    name: rt.type_name
  }));

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3")'
      }}
    >
      <div className="text-center text-white max-w-4xl md:flex sm:cols-1 items-center gap-0">
        
        <div className="mr-flex text-left">
        {/* Hero Title */}
        <h1 className="text-5xl md:text-5xl font-bold mb-4">
          Welcome to Osner Hotel
        </h1>
        
        <div>
          <p className="text-xl md:text-2xl mb-12 opacity-70">
            Your gateway to comfort and convenience.
          </p>
        </div>
        
        </div>
        
        {/* Booking Form - Simplified */}
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-xl w-full mr-auto">
          <h3 className="text-gray-800 text-2xl font-semibold mb-6">
            Browse Our Rooms
          </h3>
          
          <div className="space-y-4">
            {/* Room Type */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm text-left">
                Select Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-5 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
                required
                disabled={loading}
              >
                <option value="">
                  {loading ? 'Loading room types...' : 'Select Room Type'}
                </option>
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.name.toLowerCase()}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 ease-in-out hover:scale-102 mt-6"
          >
            View Rooms
          </button>
          
          <p className="text-gray-600 text-sm text-center mt-4">
            Select your dates and book directly on the room details page
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero
