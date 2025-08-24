import React, { useState } from 'react';
import { Wifi, Car, Coffee, Waves, Users, Star, Filter, Search } from 'lucide-react';
import data from '../data.json';
import { useNavigate, useLocation } from 'react-router-dom';
import RoomCard from '../components/RoomCard'

const capitalize = str => str?.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const RoomsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const checkIn = queryParams.get('checkIn');
  const checkOut = queryParams.get('checkOut');
  const guestCount = queryParams.get('guests');
  const roomType = queryParams.get('type');

  const [selectedCategory, setSelectedCategory] = useState(roomType ? capitalize(roomType) : 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('All');

  const categories = data.categories;
  const priceRanges = data.priceRanges;
  const allRooms = data.rooms;

  const filteredRooms = allRooms.filter(room => {
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = priceRange === 'All' || 
                        (priceRange === 'Under $200' && room.priceNum < 200) ||
                        (priceRange === '$200-$400' && room.priceNum >= 200 && room.priceNum <= 400) ||
                        (priceRange === 'Above $400' && room.priceNum > 400);
    const matchesGuests = guestCount ? room.guests >= parseInt(guestCount) : true;

    return matchesCategory && matchesSearch && matchesPrice && matchesGuests;
  });

  const availableRooms = filteredRooms.filter(room => room.status === 'available');
  const otherRooms = filteredRooms.filter(room => room.status !== 'available');

  return (
    <div className="min-h-screen bg-gray-50 mt-24">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Our Rooms & Suites
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Discover the perfect accommodation for your stay.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-4 flex items-center md:right-8">
        <div className="flex-1 overflow-x-auto flex space-x-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="ml-4 flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {priceRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {availableRooms.length > 0 ? (
            availableRooms.map(room => (
              <RoomCard key={room.id} room={room} onClick={() => navigate(`/rooms/${room.id}`)} />
            ))
          ) : (
            <p className="text-gray-500">No available rooms for the selected criteria.</p>
          )}
        </div>

        {/* Other Rooms */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Other Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {otherRooms.length > 0 ? (
            otherRooms.map(room => (
              <RoomCard key={room.id} room={room} onClick={() => navigate(`/rooms/${room.id}`)} />
            ))
          ) : (
            <p className="text-gray-500">No other rooms found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomsPage;
