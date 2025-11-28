import React, { useEffect, useMemo, useState } from 'react';
import { Wifi, Car, Coffee, Waves, Users, Star, Filter, Search, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import RoomCard from '../components/RoomCard'
import { API_ENDPOINTS } from '../config/api';

const capitalize = str => str?.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const RoomsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const checkIn = queryParams.get('checkIn');
  const checkOut = queryParams.get('checkOut');
  const guestCount = queryParams.get('guests');
  const categoryFromUrl = queryParams.get('type');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRoomType, setSelectedRoomType] = useState(
    categoryFromUrl ? categoryFromUrl.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ') : 'All'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const roomsRes = await axios.get(API_ENDPOINTS.ROOMS);
        setRooms(Array.isArray(roomsRes.data.data) ? roomsRes.data.data : (Array.isArray(roomsRes.data) ? roomsRes.data : []));
        
        const typesRes = await axios.get(API_ENDPOINTS.ROOM_TYPES);
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

  const categories = useMemo(() => {
    const set = new Set(['All']);
    rooms.forEach(r => {
      if (r?.category) set.add(r.category);
    });
    return Array.from(set);
  }, [rooms]);

  const priceRanges = ['All', 'Under ₱2000', '₱2000-₱4000', 'Above ₱4000'];

  // First pass: Filter with guest capacity requirement
  const filteredWithGuests = rooms.filter(room => {
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
  });

  // Second pass: If no rooms match with guest filter AND guest count was specified, 
  // try again without the guest capacity requirement
  const filteredRooms = (filteredWithGuests.length === 0 && guestCount) 
    ? rooms.filter(room => {
        const matchesCategory = selectedCategory === 'All' || room.category === selectedCategory;
        const matchesRoomType = selectedRoomType === 'All' || room.type_name === selectedRoomType;
        const matchesSearch = (room.type_name || room.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             room.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrice = priceRange === 'All' || 
                            (priceRange === 'Under ₱2000' && Number(room.price) < 2000) ||
                            (priceRange === '₱2000-₱4000' && Number(room.price) >= 2000 && Number(room.price) <= 4000) ||
                            (priceRange === 'Above ₱4000' && Number(room.price) > 4000);
        // Note: No guest capacity filter in this pass
        return matchesCategory && matchesRoomType && matchesSearch && matchesPrice;
      })
    : filteredWithGuests;

  // Sort the filtered rooms
  const sortedFilteredRooms = filteredRooms.sort((a, b) => {
    // First, prioritize by guest capacity match if guestCount is specified
    if (guestCount) {
      const requestedGuests = parseInt(guestCount);
      const aIsExactMatch = a.guests === requestedGuests;
      const bIsExactMatch = b.guests === requestedGuests;
      
      // If one is exact match and other isn't, exact match comes first
      if (aIsExactMatch && !bIsExactMatch) return -1;
      if (!aIsExactMatch && bIsExactMatch) return 1;
      
      // If both are not exact matches, sort by how close they are to requested capacity
      if (!aIsExactMatch && !bIsExactMatch) {
        const aDiff = Math.abs(a.guests - requestedGuests);
        const bDiff = Math.abs(b.guests - requestedGuests);
        if (aDiff !== bDiff) return aDiff - bDiff;
      }
    }
    
    // Then apply the selected sort option
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

  // Group filtered rooms by guest capacity only
  const roomsByType = useMemo(() => {
    const grouped = {};
    sortedFilteredRooms.forEach(room => {
      // Create a key from guest capacity only
      const compositeKey = `GUESTS_${room.guests || 0}`;
      
      if (!grouped[compositeKey]) {
        grouped[compositeKey] = {
          rooms: [],
          displayName: room.type_name || 'Other',
          guests: room.guests || 0
        };
      }
      grouped[compositeKey].rooms.push(room);
    });
    return grouped;
  }, [sortedFilteredRooms]);

  // Get room types to display (either all or just the selected one)
  const roomTypesToDisplay = useMemo(() => {
    if (selectedRoomType !== 'All') {
      // Filter groups that contain the selected room type
      return Object.keys(roomsByType).filter(key => 
        roomsByType[key].rooms.some(room => room.type_name === selectedRoomType)
      );
    }
    // Show all groups
    return Object.keys(roomsByType).sort((a, b) => {
      // Sort by display name
      return roomsByType[a].displayName.localeCompare(roomsByType[b].displayName);
    });
  }, [roomsByType, selectedRoomType]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Background Image */}
      <div className="relative h-80 bg-black overflow-hidden">
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'url("/background.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Our Rooms & Suites
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl drop-shadow-md">
            Discover the perfect accommodation for your stay
          </p>
        </div>
      </div>

      {/* Sticky Navigation Bar - Twitter Style */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center">
            {/* Category Tabs - Twitter Style */}
            <div className="flex-1 flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`relative px-6 py-4 text-sm font-semibold transition-colors hover:bg-gray-50 flex-shrink-0 ${
                  selectedCategory === 'All'
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                All Rooms
                {selectedCategory === 'All' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
              {categories.filter(cat => cat !== 'All').map((category) => {
                const categoryCount = rooms.filter(room => room.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`relative px-6 py-4 text-sm font-semibold transition-colors hover:bg-gray-50 flex-shrink-0 ${
                      selectedCategory === category
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {category}
                    <span className="ml-1.5 text-xs opacity-60">({categoryCount})</span>
                    {selectedCategory === category && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop Search Bar - Only on larger screens */}
            <div className="hidden lg:flex items-center px-4 border-l border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-4 text-gray-600 hover:bg-gray-50 transition-colors border-l border-gray-200"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Compact Filters Section - Only shown when filter button clicked */}
        {showFilters && (
          <div className="sticky top-24 z-30 mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors"
              >
                <option value="All">All Types</option>
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.type_name}>{type.type_name}</option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors"
              >
                {priceRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors"
              >
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>

              <button
                onClick={() => setShowFilters(false)}
                className="ml-auto text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {selectedRoomType !== 'All' 
              ? `Showing ${sortedFilteredRooms.length} ${selectedRoomType} room${sortedFilteredRooms.length !== 1 ? 's' : ''}`
              : `Showing ${sortedFilteredRooms.length} room${sortedFilteredRooms.length !== 1 ? 's' : ''} in ${roomTypesToDisplay.length} group${roomTypesToDisplay.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Rooms Grid - Show rooms grouped by amenities and capacity */}
        {!loading && !error && (
          <>
            {roomTypesToDisplay.length > 0 ? (
              roomTypesToDisplay.map((groupKey, index) => {
                const group = roomsByType[groupKey];
                return (
                  <div key={groupKey} className={index > 0 ? 'mt-12' : ''}>
                    {/* Room Type Section Header */}
                    <div className={`${index > 0 ? 'border-t border-gray-200 pt-8' : ''} mb-6`}>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {group.displayName}
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {group.guests} guest{group.guests !== 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span>{group.rooms.length} room{group.rooms.length !== 1 ? 's' : ''} available</span>
                      </div>
                    </div>

                    {/* Room Cards Grid - Horizontal scroll on mobile, grid on larger screens */}
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 overflow-x-auto md:overflow-x-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                      {group.rooms.map(room => (
                        <RoomCard 
                          key={room.id} 
                          room={room} 
                          onClick={() => navigate(`/rooms/${room.id}`)}
                          className="w-80 flex-shrink-0 md:w-auto"
                          roomTypeStatus={group.rooms.length > 0 ? 'Available' : 'Fully Booked'}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {selectedRoomType !== 'All' 
                    ? `No ${selectedRoomType} rooms found.`
                    : 'No rooms match your criteria.'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Search Button - Twitter Style */}
      <button
        onClick={() => setShowSearch(true)}
        className="lg:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110 z-40"
      >
        <Search className="h-6 w-6" />
      </button>

      {/* Search Modal - Twitter Style */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center p-4 border-b border-gray-200">
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="flex-1 text-lg outline-none"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                }}
                className="ml-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            {searchTerm && (
              <div className="max-h-96 overflow-y-auto p-4">
                {sortedFilteredRooms.length > 0 ? (
                  <div className="space-y-2">
                    {sortedFilteredRooms.slice(0, 5).map(room => (
                      <button
                        key={room.id}
                        onClick={() => {
                          navigate(`/rooms/${room.id}`);
                          setShowSearch(false);
                          setSearchTerm('');
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="font-bold text-blue-600">{room.type_name || room.name}</div>
                        <div className="text-sm text-gray-600 truncate">{room.description}</div>
                        <div className="text-sm font-semibold text-blue-600 mt-1">₱{Number(room.price).toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No rooms found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
