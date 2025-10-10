import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Users, MapPin, AlertCircle, CheckCircle, Loader, ChevronRight } from 'lucide-react';

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
  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(addDays(todayISO(), 1));
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState(priceRanges[0].label);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(['All']); 
    (rooms||[]).forEach(r => r?.category && set.add(r.category)); 
    return Array.from(set);
  }, [rooms]);

  const loadAvailable = async () => {
    if (new Date(checkIn) >= new Date(checkOut)) return;
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:8081/api/availability', {
        params: { checkIn, checkOut, guests }
      });
      setRooms(Array.isArray(data) ? data : []);
      if (data?.length) setSelectedRoomId(String(data[0].id));
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to load available rooms' });
      console.error('Error loading rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAvailable(); }, []);
  useEffect(() => { loadAvailable(); }, [checkIn, checkOut, guests]);

  const filteredRooms = useMemo(() => {
    const pf = priceRanges.find(p => p.label === priceFilter)?.test ?? priceRanges[0].test;
    return (rooms || []).filter(r => {
      const byCat = categoryFilter === 'All' || r.category === categoryFilter;
      const price = Number(r.price) || 0;
      return byCat && pf(price);
    });
  }, [rooms, categoryFilter, priceFilter]);

  const selectedRoom = useMemo(
    () => (rooms || []).find(r => String(r.id) === String(selectedRoomId)),
    [rooms, selectedRoomId]
  );

  const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
  const totalPrice = selectedRoom ? Number(selectedRoom.price) * nights : 0;

  const createWalkIn = async () => {
    if (!selectedRoom) {
      setNotification({ type: 'error', message: 'Please select a room to proceed' });
      return;
    }
    if (!guestName.trim() || !guestContact.trim()) {
      setNotification({ type: 'error', message: 'Please enter guest name and contact information' });
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      setNotification({ type: 'error', message: 'Check-out date must be after check-in date' });
      return;
    }

    const payload = {
      roomId: Number(selectedRoom.id),
      roomName: selectedRoom.name,
      guestName,
      guestContact,
      checkIn,
      checkOut,
      guests: Number(guests),
      status: 'checked_in'
    };

    try {
      const { data } = await axios.post('http://localhost:8081/api/walkin-bookings', payload);
      
      setNotification({ 
        type: 'success', 
        message: `Walk-in created successfully! Booking ID: ${data?.bookingId}` 
      });
      setGuestName('');
      setGuestContact('');
      await loadAvailable();
    } catch (e) {
      setNotification({ type: 'error', message: 'Failed to create booking' });
      console.error('Error creating booking:', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-slate-900">Find Your Room</h1>
          <p className="text-slate-600 mt-2">Quick walk-in booking for available rooms</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            notification.type === 'error' 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-green-50 border border-green-200'
          }`}>
            {notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className={notification.type === 'error' ? 'text-red-900' : 'text-green-900'}>
                {notification.message}
              </p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Search Criteria</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                    Searching
                  </>
                ) : (
                  <>Search</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Available Rooms</h2>
            <p className="text-sm text-slate-600">{filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} available</p>
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
                    <h3 className="text-lg font-semibold text-slate-900">{room.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{room.category}</p>
                    
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
              <p className="text-slate-600">No rooms match your search criteria</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Information</label>
                <input 
                  type="text"
                  value={guestContact}
                  onChange={e => setGuestContact(e.target.value)}
                  placeholder="Email or phone number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <button 
                onClick={createWalkIn}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition text-lg"
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
                  <p className="text-xl font-semibold text-slate-900">{selectedRoom.name}</p>
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
