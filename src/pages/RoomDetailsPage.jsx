import React, { useState, useEffect } from 'react';
import { Users, ArrowLeft, Bed, Bath, Maximize, Calendar, Check } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import AmenityIcon from '../components/AmenityIcon';
import BookingCalendar from '../components/BookingCalendar';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_ENDPOINTS } from '../config/api';

const RoomDetailsPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const navigate = useNavigate();
  const { showError } = useToast();
  const { checkIn, checkOut, guests, setCheckIn, setCheckOut, setGuests } = useBooking();
  const { isAuthenticated, user } = useAuth();

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
        const res = await axios.get(`${API_ENDPOINTS.ROOMS}/${id}`);
        setRoom(res.data);
      } catch (e) {
        try {
          const res = await axios.get(API_ENDPOINTS.ROOMS);
          const list = Array.isArray(res.data) ? res.data : [];
          const found = list.find(r => String(r.id) === String(id));
          if (found) setRoom(found);
        } catch (fallbackError) {
          console.error('Failed to load room', fallbackError);
        }
      }
    }
    load();
  }, [id]);

  const handleDateSelect = (newCheckIn, newCheckOut) => {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
  };

  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut) return 0;
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    return nights * getNumericPrice();
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  };

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      showError('Please select check-in and check-out dates');
      return;
    }
    if (!isAuthenticated) {
      showError('Please create an account to make a booking');
      navigate('/register');
      return;
    }

    try {
      const bookingId = `OSNHTL-${Date.now().toString().slice(-6)}`;
      const bookingData = {
        bookingId,
        roomId: room.id,
        roomName: room.type_name || room.name,
        guestName: user.full_name || user.username,
        guestEmail: user.email,
        guestPhone: user.contact_number || null,
        guestGender: user.gender || null,
        guestAge: user.age || null,
        checkIn,
        checkOut,
        guests,
        totalPrice: calculateTotalPrice(),
        status: 'pending'
      };

      const response = await axios.post(API_ENDPOINTS.BOOKINGS, bookingData);
      setBookingDetails({
        bookingId: response.data.bookingId || bookingId,
        roomName: room.type_name || room.name,
        checkIn,
        checkOut,
        guests,
        totalPrice: calculateTotalPrice()
      });

      setIsBookingConfirmationOpen(true);
      setCheckIn('');
      setCheckOut('');
      setGuests(1);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to create booking. Please try again.');
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Room not found</h2>
          <button 
            onClick={() => navigate('/rooms')} 
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
        <button 
          onClick={() => navigate('/rooms')} 
          className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:flex lg:gap-10">
        {/* Left: Images & Info */}
        <div className="flex-1 space-y-6">
          {/* Main Image */}
          <div className="rounded-3xl overflow-hidden shadow-sm">
            <img 
              src={(room.images && room.images[selectedImageIndex]) || room.image || 'https://via.placeholder.com/800x400?text=Room'} 
              alt={room.name} 
              className="w-full h-80 md:h-96 object-cover" 
            />
          </div>

          {/* Thumbnails */}
          {room.images && room.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {room.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === i ? 'border-blue-600 scale-110' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Room Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h1 className="text-3xl font-semibold text-gray-900">{room.type_name || room.name}</h1>
            <p className="text-gray-600">{room.description}</p>
            <div className="text-2xl font-bold text-blue-600">{getDisplayPrice()} <span className="text-sm text-gray-500 font-normal">/ night</span></div>
          </div>

          {/* Key Room Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm grid grid-cols-2 gap-4 text-gray-700">
            <div className="flex items-center gap-2"><Users className="w-5 h-5 text-gray-400" /> {room.guests} Guests</div>
            <div className="flex items-center gap-2"><Bed className="w-5 h-5 text-gray-400" /> {room.beds} Bed{room.beds > 1 ? 's' : ''}</div>
            {room.bathrooms != null && <div className="flex items-center gap-2"><Bath className="w-5 h-5 text-gray-400" /> {room.bathrooms} Bath{room.bathrooms > 1 ? 's' : ''}</div>}
            <div className="flex items-center gap-2"><Maximize className="w-5 h-5 text-gray-400" /> {room.size}</div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg text-gray-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-gray-700">
              {room.amenities.map((amenity, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="text-blue-600"><AmenityIcon name={amenity} /></div>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Booking Sidebar */}
        <div className="lg:w-96 lg:sticky lg:top-20 lg:self-start flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Select Dates
              </h3>
              <BookingCalendar
                roomId={room.id}
                checkIn={checkIn}
                checkOut={checkOut}
                onDateSelect={handleDateSelect}
                onValidationError={showError}
              />
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {[...Array(room.guests)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} Guest{i>0?'s':''}</option>
                  ))}
                </select>
              </div>

              {checkIn && checkOut && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>{getDisplayPrice()} × {calculateNights()} night{calculateNights()>1?'s':''}</span>
                    <span className="font-medium">₱{calculateTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-blue-600">₱{calculateTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!checkIn || !checkOut}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  checkIn && checkOut
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {checkIn && checkOut ? (
                  <>
                    <Check className="w-5 h-5" />
                    Book Now
                  </>
                ) : 'Select Dates to Book'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <BookingConfirmationModal
        isOpen={isBookingConfirmationOpen}
        onClose={() => setIsBookingConfirmationOpen(false)}
        bookingDetails={bookingDetails}
      />
    </div>
  );
};

export default RoomDetailsPage;
