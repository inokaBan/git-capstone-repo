import React, { useEffect, useMemo, useState } from 'react';
import { Wifi, Car, Coffee, Waves, Users, Star, Filter, Search } from 'lucide-react';
import axios from 'axios';
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

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRoomType, setSelectedRoomType] = useState(roomType ? capitalize(roomType) : 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load rooms and room types from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load rooms
        const roomsRes = await axios.get('http://localhost:8081/api/rooms');
        setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : []);
        
        // Load room types
        const typesRes = await axios.get('http://localhost:8081/api/room-types');
        const types = Array.isArray(typesRes.data) ? typesRes.data : [];
        setRoomTypes(types);
      } catch (e) {
        setError('Failed to load data');
        setRooms([]);
        setRoomTypes([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Derive categories from rooms, include 'All'
  const categories = useMemo(() => {
    const set = new Set(['All']);
    rooms.forEach(r => {
      if (r?.category) set.add(r.category);
    });
    return Array.from(set);
  }, [rooms]);

  // Static price ranges used by UI
  const priceRanges = ['All', 'Under ₱2000', '₱2000-₱4000', 'Above ₱4000'];

  const filteredRooms = rooms.filter(room => {
    const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
    const matchesRoomType = selectedRoomType === 'All' || room.type_name === selectedRoomType;
    const matchesSearch = (room.type_name || room.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = priceRange === 'All' || 
                        (priceRange === 'Under ₱2000' && Number(room.price) < 2000) ||
                        (priceRange === '₱2000-₱4000' && Number(room.price) >= 2000 && Number(room.price) <= 4000) ||
                        (priceRange === 'Above ₱4000' && Number(room.price) > 4000);
    const matchesGuests = guestCount ? room.guests >= parseInt(guestCount) : true;

    return matchesCategory && matchesRoomType && matchesSearch && matchesPrice && matchesGuests;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.type_name || a.name || '').localeCompare(b.type_name || b.name || '');
      case 'price-low':
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      case 'price-high':
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      case 'rating':
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      case 'type':
        return (a.type_name || '').localeCompare(b.type_name || '');
      default:
        return 0;
    }
  });

  // Filter rooms by availability
  const availableRooms = filteredRooms.filter(room => (room.status || '').toLowerCase() === 'available');
  const otherRooms = filteredRooms.filter(room => (room.status || '').toLowerCase() !== 'available');

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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Room Types Navigation */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Filter by Room Type</h3>
            <div className="flex-1 overflow-x-auto flex space-x-3 scrollbar-hide">
              <button
                onClick={() => setSelectedRoomType('All')}
                className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedRoomType === 'All'
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                All Types
                <span className="ml-2 text-xs opacity-75">
                  ({rooms.length})
                </span>
              </button>
              {loading ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Loading room types...</span>
                </div>
              ) : roomTypes.length > 0 ? (
                roomTypes.map((type) => {
                  const typeCount = rooms.filter(room => room.type_name === type.type_name).length;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedRoomType(type.type_name)}
                      className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        selectedRoomType === type.type_name
                          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                      }`}
                    >
                      {type.type_name}
                      <span className="ml-2 text-xs opacity-75">
                        ({typeCount})
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">
                  No room types available
                </div>
              )}
            </div>
          </div>
          
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filter Dropdowns */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Categories</option>
                {categories.filter(cat => cat !== 'All').map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
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
            
            {/* Sorting Buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 font-medium">Sort by:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'name' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortBy('price-low')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'price-low' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Price ↑
                </button>
                <button
                  onClick={() => setSortBy('price-high')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'price-high' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Price ↓
                </button>
                <button
                  onClick={() => setSortBy('rating')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    sortBy === 'rating' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Rating
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Rooms */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedRoomType === 'All' ? 'All Rooms' : `${selectedRoomType} Rooms`}
          </h2>
          <div className="text-sm text-gray-600">
            Showing {availableRooms.length} of {filteredRooms.length} rooms
            {selectedRoomType !== 'All' && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Filtered by {selectedRoomType}
              </span>
            )}
          </div>
        </div>
        {loading && <p className="text-gray-500">Loading rooms...</p>}
        {error && !loading && <p className="text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {availableRooms.length > 0 ? (
            availableRooms.map(room => (
              <RoomCard key={room.id} room={room} onClick={() => navigate(`/rooms/${room.id}`)} />
            ))
          ) : (
            !loading && !error && <p className="text-gray-500">No available rooms for the selected criteria.</p>
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
