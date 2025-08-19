import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';



const Hero = () => {
  const { checkIn, setCheckIn, checkOut, setCheckOut, guests, setGuests } = useBooking();
  
  const [roomType, setRoomType] = useState('');
  
  const navigate = useNavigate();


  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut || !roomType) {
      alert('Please fill in all fields');
      return;
    }
    
    if (checkIn >= checkOut) {
      alert('Check-out date must be after check-in date');
      return;
    }
    
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&type=${roomType}`)
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-cover bg-center bg-no-repeat "
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3")'
      }}
    >
      <div className="text-center text-white max-w-4xl w-full mt-32 md:flex sm:flex items-center">
        
        <div className="mr-24 text-left">
        {/* Hero Title */}
        <h1 className="text-5xl md:text-5xl font-bold mb-4">
          Welcome to Osner Hotel
        </h1>
        
        <p className="text-xl md:text-2xl mb-12 opacity-70">
          Your gateway to comfort and convenience.
        </p>
        </div>
        
        {/* Booking Form */}
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-xl w-full mr-auto">
          <h3 className="text-gray-800 text-2xl font-semibold mb-8">
            Book Your Stay
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Check-in Date */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm text-left">
                Check-in Date
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
                required
              />
            </div>
            
            {/* Check-out Date */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm text-left">
                Check-out Date
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-5 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
                required
              />
            </div>
            
            {/* Number of Guests */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm text-left">
                Number of Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full px-5 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
                <option value={5}>5 Guests</option>
                <option value={6}>6+ Guests</option>
              </select>
            </div>
            
            {/* Room Type */}
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-sm text-left">
                Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-5 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-base"
                required
              >
                <option value="">Select Room Type</option>
                <option value="standard">Standard Room</option>
                <option value="deluxe">Deluxe Room</option>
                <option value="suite">Suite</option>
                <option value="presidential">Presidential Suite</option>
              </select>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-700 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform duration-300 ease-in-out hover:scale-105"
          >
            Check Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero