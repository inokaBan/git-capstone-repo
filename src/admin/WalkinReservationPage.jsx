import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Users, MapPin, AlertCircle, CheckCircle, Loader, ChevronRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const todayISO = () => new Date().toISOString().slice(0,10);
const addDays = (d, n) => {
  const t = new Date(d); t.setDate(t.getDate()+n); return t.toISOString().slice(0,10);
};

const priceRanges = [
  { label: 'All Prices', test: () => true },
  { label: 'Under ₱2,000', test: p => p < 2000 },
  { label: '₱2,000–₱4,000', test: p => p >= 2000 && p <= 4000 },
  { label: 'Above ₱4,000', test: p => p > 4000 },
];

// Simple axios-like implementation
const axios = {
  get: async (url, config) => {
    const params = new URLSearchParams(config?.params || {}).toString();
    const response = await fetch(`${url}${params ? '?' + params : ''}`);
    return { data: await response.json() };
  },
  post: async (url, data) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return { data: await response.json() };
  }
};

const WalkinReservationPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(addDays(todayISO(), 1));
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestGender, setGuestGender] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState(priceRanges[0].label);
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(['All']); 
    (rooms||[]).forEach(r => r?.category && set.add(r.category)); 
    return Array.from(set);
  }, [rooms]);

  const loadAvailable = async () => {
    setLoading(true);
    try {
      // Load all rooms from database
      const { data } = await axios.get('http://localhost:8081/api/rooms');
      // Handle paginated response structure: { data: [...], totalItems, totalPages, currentPage }
      const roomsArray = data.data || data || [];
      const availableRooms = (Array.isArray(roomsArray) ? roomsArray : []).filter(room => 
        room.status && room.status.toLowerCase() === 'available'
      );
      setRooms(availableRooms);
      if (availableRooms?.length) setSelectedRoomId(String(availableRooms[0].id));
    } catch (e) {
      showError('Failed to load available rooms');
      console.error('Error loading rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAvailable(); }, []);

  const filteredRooms = useMemo(() => {
    const pf = priceRanges.find(p => p.label === priceFilter)?.test ?? priceRanges[0].test;
    const filtered = (rooms || []).filter(r => {
      const byCat = categoryFilter === 'All' || r.category === categoryFilter;
      const price = Number(r.price) || 0;
      return byCat && pf(price);
    });

    // Sort the filtered rooms
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'room-number':
          return (a.room_number || '').localeCompare(b.room_number || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'type':
          return (a.type_name || '').localeCompare(b.type_name || '');
        case 'price-low':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price-high':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'rating':
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        default:
          return 0;
      }
    });
  }, [rooms, categoryFilter, priceFilter, sortBy]);

  const selectedRoom = useMemo(
    () => (rooms || []).find(r => String(r.id) === String(selectedRoomId)),
    [rooms, selectedRoomId]
  );

  const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
  const totalPrice = selectedRoom ? Number(selectedRoom.price) * nights : 0;

  const createWalkIn = async () => {
    if (!selectedRoom) {
      showError('Please select a room to proceed');
      return;
    }
    if (!selectedRoom.id) {
      showError('Selected room is invalid. Please refresh and try again.');
      return;
    }
    if (!guestName.trim() || (!guestEmail.trim() && !guestPhone.trim())) {
      showError('Please enter guest name and at least one contact method (email or phone)');
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      showError('Check-out date must be after check-in date');
      return;
    }
    if (guests > selectedRoom.guests) {
      showError(`Maximum ${selectedRoom.guests} guests allowed for this room`);
      return;
    }

    const bookingId = 'OSINTAL' + Date.now().toString().slice(-6);
    const payload = {
      bookingId,
      roomId: Number(selectedRoom.id),
      roomName: selectedRoom.type_name || selectedRoom.name || `Room #${selectedRoom.room_number}`,
      guestName,
      guestContact: guestEmail || guestPhone,
      guestEmail: guestEmail || undefined,
      guestPhone: guestPhone || undefined,
      guestGender: guestGender || undefined,
      guestAge: guestAge ? Number(guestAge) : undefined,
      checkIn,
      checkOut,
      guests: Number(guests),
      totalPrice: totalPrice,
      status: 'checked_in'
    };

    try {
      console.log('Sending walkin booking data:', payload);
      const { data } = await axios.post('http://localhost:8081/api/bookings', payload);
      
      console.log('Walkin booking successful:', data);
      showSuccess(`Walk-in created successfully! Booking ID: ${data?.bookingId}`);
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setGuestGender('');
      setGuestAge('');
      await loadAvailable();
    } catch (e) {
      console.error('Error creating walkin booking:', e);
      console.error('Error response:', e.response);
      console.error('Error data:', e.response?.data);
      
      const errorMessage = e.response?.data?.error || e.message || 'Unknown error occurred';
      showError(`Failed to create booking: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-slate-900">Find Your Room</h1>
          <p className="text-slate-600 mt-2">Quick walk-in booking for available rooms</p>
          <p className="text-sm text-slate-500 mt-1">All available rooms from the database are displayed below</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Search Criteria</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Check-in */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Check-in
              </label>
              <input 
                type="date" 
                value={checkIn} 
                min={todayISO()} 
                onChange={e => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Check-out */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Check-out
              </label>
              <input 
                type="date" 
                value={checkOut} 
                min={checkIn || todayISO()} 
                onChange={e => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Guests */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Guests
              </label>
              <input 
                type="number" 
                min={1} 
                max={10}
                value={guests} 
                onChange={e => setGuests(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Category */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Category
              </label>
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Price */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Price Range</label>
              <select 
                value={priceFilter} 
                onChange={e => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                {priceRanges.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
              </select>
            </div>

            {/* Sort By */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="name">Room Name</option>
                <option value="room-number">Room Number</option>
                <option value="category">Category</option>
                <option value="type">Room Type</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating: High to Low</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end lg:col-span-1">
              <button 
                onClick={loadAvailable} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading
                  </>
                ) : (
                  <>Refresh</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Available Rooms</h2>
              <p className="text-sm text-slate-600">{filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} available</p>
            </div>
            <button 
              onClick={() => navigate('/rooms')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <Eye className="w-4 h-4" />
              View All Rooms
            </button>
          </div>

          {filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map(room => (
                <div 
                  key={room.id}
                  onClick={() => setSelectedRoomId(String(room.id))}
                  className={`rounded-xl border-2 transition cursor-pointer ${
                    String(room.id) === String(selectedRoomId)
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {room.room_number ? `Room #${room.room_number}` : room.type_name}
                    </h3>
                    {room.room_number && (
                      <p className="text-sm text-slate-500">{room.type_name}</p>
                    )}
                    <p className="text-sm text-slate-600">{room.category}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-slate-600">Price per night</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ₱{Number(room.price).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedRoomId(String(room.id))}
                      className={`mt-4 w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        String(room.id) === String(selectedRoomId)
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {String(room.id) === String(selectedRoomId) ? 'Selected' : 'Select Room'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No available rooms match your search criteria</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or click "View All Rooms" to see all rooms</p>
            </div>
          )}
        </div>

        {/* Booking Summary & Guest Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Guest Details */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Guest Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="Enter guest name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Information</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input 
                    type="email"
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                  <input 
                    type="tel"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    placeholder="Contact number"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              {/* Gender and Age - 2 Column Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                  <select
                    value={guestGender}
                    onChange={e => setGuestGender(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                  <input 
                    type="number"
                    value={guestAge}
                    onChange={e => setGuestAge(e.target.value)}
                    placeholder="Age"
                    min="1"
                    max="120"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <button 
                onClick={createWalkIn}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition text-lg"
              >
                Complete Check-in
              </button>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-8 h-fit">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Booking Summary</h2>
            
            {selectedRoom ? (
              <div className="space-y-4">
                <div className="pb-4 border-b border-blue-200">
                  <p className="text-sm text-slate-600">Room</p>
                  <p className="text-xl font-semibold text-slate-900">
                    {selectedRoom.room_number ? `Room #${selectedRoom.room_number}` : selectedRoom.type_name}
                  </p>
                  {selectedRoom.room_number && (
                    <p className="text-sm text-slate-500">{selectedRoom.type_name}</p>
                  )}
                </div>

                <div className="pb-4 border-b border-blue-200">
                  <p className="text-sm text-slate-600">Check-in</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(checkIn).toLocaleDateString()}</p>
                </div>

                <div className="pb-4 border-b border-blue-200">
                  <p className="text-sm text-slate-600">Check-out</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(checkOut).toLocaleDateString()}</p>
                </div>

                <div className="pb-4 border-b border-blue-200">
                  <p className="text-sm text-slate-600">Nights</p>
                  <p className="text-sm font-medium text-slate-900">{nights}</p>
                </div>

                <div className="pb-4 border-b border-blue-200">
                  <p className="text-sm text-slate-600">Guests</p>
                  <p className="text-sm font-medium text-slate-900">{guests}</p>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-slate-600 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-blue-600">
                    ₱{totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-600 text-center py-8">Select a room to see summary</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkinReservationPage;
