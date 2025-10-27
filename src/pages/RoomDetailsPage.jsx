import React, { useState, useEffect } from 'react';
import {
  Users, Star, ArrowLeft,
  Bed, Bath, Maximize, MapPin, Calendar, Phone, Wind
} from 'lucide-react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import BookingCalendar from '../components/BookingCalendar';
import { useBooking } from '../context/BookingContext'; 
import AmenityIcon from '../context/AmenityIcon';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const RoomDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [room, setRoom] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { checkIn, setCheckIn, checkOut, setCheckOut, guests, setGuests } = useBooking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestGender, setGuestGender] = useState('');
  const [guestAge, setGuestAge] = useState('');

  const navigate = useNavigate();
  const { showError, showWarning } = useToast();

  const today = new Date().toISOString().split('T')[0];

  // Auto-fill email with logged-in user's email
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setGuestEmail(user.email);
    }
  }, [isAuthenticated, user]);

  // Handle date selection from calendar
  const handleDateSelect = (newCheckIn, newCheckOut) => {
    setCheckIn(newCheckIn || '');
    setCheckOut(newCheckOut || '');
  };

  // Handle validation errors from calendar
  const handleCalendarValidationError = (message) => {
    showWarning(message);
  };

  // Normalize price regardless of API representation
  const getNumericPrice = () => {
    const priceNum = room?.priceNum ?? room?.price_num;
    if (priceNum != null && !Number.isNaN(Number(priceNum))) return Number(priceNum);
    const parsed = Number(String(room?.price || '').replace(/[^\d.]/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getDisplayPrice = () => {
    if (typeof room?.price === 'string' && room.price.trim().length > 0) return room.price;
    return `₱${getNumericPrice().toLocaleString()}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`http://localhost:8081/api/rooms/${id}`);
        setRoom(res.data);
      } catch (e) {
        console.warn('Failed to load room', e);
        // Fallback to loading all rooms and finding the specific one
        try {
          const res = await axios.get('http://localhost:8081/api/rooms');
          const list = Array.isArray(res.data) ? res.data : [];
          const found = list.find(r => String(r.id) === String(id));
          if (found) setRoom(found);
        } catch (fallbackError) {
          console.error('Fallback also failed', fallbackError);
        }
      }
    }
    load();
  }, [id]);

  // Mock booking function - simulates a successful booking
  const handleBooking = async () => {
    if (!checkIn || !checkOut) return showWarning('Please select check-in and check-out dates');
    if (!guestName || (!guestEmail && !guestPhone)) return showWarning('Please enter your name and at least one contact method (email or phone)');
    if (!room || !room.id) return showError('Room information is missing. Please refresh the page and try again.');
    
    // Validate dates
    if (new Date(checkIn) >= new Date(checkOut)) {
      return showWarning('Check-out date must be after check-in date');
    }

    // Validate guest count
    if (guests > room.guests) {
      return showWarning(`Maximum ${room.guests} guests allowed for this room`);
    }

    try {
      const bookingId = 'OSNHTL-' + Date.now().toString().slice(-6);
      const bookingData = {
        bookingId,
        roomId: room.id,
        roomName: room.type_name || room.name || `Room #${room.room_number}`,
        guestName,
        guestContact: guestEmail || guestPhone,
        guestEmail: guestEmail || undefined,
        guestPhone: guestPhone || undefined,
        guestGender: guestGender || undefined,
        guestAge: guestAge ? Number(guestAge) : undefined,
        checkIn,
        checkOut,
        guests,
        totalPrice: calculateTotalPrice(),
        status: 'pending'
      };

      console.log('Sending booking data:', bookingData);

      // Send booking data to backend via axios
      const { data: savedBooking } = await axios.post('http://localhost:8081/api/bookings', bookingData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Booking successful:', savedBooking);
      setBookingDetails(savedBooking);
      setIsBookingConfirmationOpen(true);

      // Clear form
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setGuestGender('');
      setGuestAge('');
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      showError(`Booking failed: ${errorMessage}`);
    }
  };

  // Calculate total price based on dates
  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut) return 0;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const pricePerNight = getNumericPrice();
    
    return nights * pricePerNight;
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Room not found</h2>
          <button onClick={() => navigate('/rooms')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Back to Rooms
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <div className="bg-white w-full border-b border-gray-300 mb-4">
        <div className="max-w-7xl mx-auto py-4">
          <button onClick={() => navigate('/rooms')} className="flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Rooms
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Left side images and description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
            <img 
              src={(room.images && room.images[selectedImageIndex]) || (room.images && room.images[0]) || room.image || 'https://via.placeholder.com/800x400?text=Room'} 
              alt={room.name} 
              className="w-full h-64 sm:h-80 object-cover" 
            />
            {/* Price badge in bottom-right corner */}
            <div className="absolute bottom-4 right-4 text-black px-4 py-2">
              <div className="text-xl font-bold">{getDisplayPrice()}</div>
              <div className="text-xs">per night</div>
            </div>
            <div className="flex overflow-x-auto space-x-2 p-4">
              {(room.images || []).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  onClick={() => setSelectedImageIndex(i)}
                  className={`w-16 h-16 object-cover rounded-lg border-2 cursor-pointer transition-colors ${selectedImageIndex === i ? 'border-blue-500' : 'border-gray-200'}`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{room.room_number ? `Room #${room.room_number}` : room.name}</h1>
                {room.room_number && (
                  <p className="text-sm text-gray-900 font-bold">{room.name}</p>
                )}
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {room.category}
              </span>
            </div>
            <p className="text-gray-700 text-sm">{room.description || ''}</p>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-2"><Users className="w-4 h-4" /><span>{room.guests} Guests</span></div>
              <div className="flex items-center space-x-2"><Bed className="w-4 h-4" /><span>{room.beds} Bed{room.beds > 1 ? 's' : ''}</span></div>
              {room.bathrooms != null && (
                <div className="flex items-center space-x-2"><Bath className="w-4 h-4" /><span>{room.bathrooms} Bathroom{room.bathrooms > 1 ? 's' : ''}</span></div>
              )}
              <div className="flex items-center space-x-2"><Maximize className="w-4 h-4" /><span>{room.size}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {room.amenities.map((a, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="text-blue-600"><AmenityIcon name={a} /></div>
                  <div>
                    <p className="font-medium text-gray-900">{a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side booking card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-20 ">
            {/* Note about booked dates - moved to top */}
            {room.status === 'booked' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <strong>Note:</strong> This room has some booked dates. Please check the calendar below for availability.
              </div>
            )}

            {/* Booking Calendar */}
            <div className="mb-4">
              <BookingCalendar
                roomId={room.id}
                checkIn={checkIn}
                checkOut={checkOut}
                onDateSelect={handleDateSelect}
                onValidationError={handleCalendarValidationError}
              />
            </div>

            <div className="mb-4">
              {checkIn && checkOut && (
                <p className="text-md text-green-600 font-medium mt-2">
                  Total: ₱{calculateTotalPrice()} ({Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))} nights)
                </p>
              )}
            </div>
            
            {/* Guests Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full px-4 py-3 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                {[...Array(room.guests)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i + 1 === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2 mt-4">
              {/* Guest Name - Full Width */}
              <input
                type="text"
                placeholder="Full Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />

              {/* Email and Contact Number - 2 Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
                <input
                  type="tel"
                  placeholder="Contact Number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              {/* Guest Gender and Age - 2 Column Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Guest Gender */}
                <select
                  value={guestGender}
                  onChange={(e) => setGuestGender(e.target.value)}
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                {/* Guest Age */}
                <input
                  type="number"
                  placeholder="Age"
                  value={guestAge}
                  onChange={(e) => setGuestAge(e.target.value)}
                  min="1"
                  max="120"
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            

            <button 
              onClick={handleBooking} 
              disabled={!checkIn || !checkOut || !guestName || (!guestEmail && !guestPhone)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg mt-12 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Book Now
            </button>
            <button className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg mt-2 hover:bg-blue-50 transition-colors">
              <Phone className="w-4 h-4 inline mr-2" /> Call for Booking
            </button>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <strong>Free Cancellation:</strong> Free cancellation on eligible rates
            </div>
          </div>
        </div>
      </div>
      <BookingConfirmationModal
        isOpen={isBookingConfirmationOpen}
        onClose={() => setIsBookingConfirmationOpen(false)}
        bookingDetails={bookingDetails}
      />
    </div>
  );
};

export default RoomDetailPage;
