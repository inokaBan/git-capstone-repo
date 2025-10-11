import React, { useState, useEffect } from 'react';
import {
  Users, Star, ArrowLeft,
  Bed, Bath, Maximize, MapPin, Calendar, Phone, Wind
} from 'lucide-react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import { useBooking } from '../context/BookingContext'; 
import AmenityIcon from '../context/AmenityIcon';

const RoomDetailPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { checkIn, setCheckIn, checkOut, setCheckOut, guests, setGuests } = useBooking();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');

  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

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
    if (!checkIn || !checkOut) return alert('Please select check-in and check-out dates');
    if (!guestName || !guestContact) return alert('Please enter your name and contact information');
    if (!room || !room.id) return alert('Room information is missing. Please refresh the page and try again.');
    
    // Validate dates
    if (new Date(checkIn) >= new Date(checkOut)) {
      return alert('Check-out date must be after check-in date');
    }

    // Validate guest count
    if (guests > room.guests) {
      return alert(`Maximum ${room.guests} guests allowed for this room`);
    }

    try {
      const bookingId = 'OSNHTL-' + Date.now().toString().slice(-6);
      const bookingData = {
        bookingId,
        roomId: room.id,
        roomName: room.type_name || room.name || `Room #${room.room_number}`,
        guestName,
        guestContact,
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
      setGuestContact('');
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`❌ Booking failed: ${errorMessage}`);
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
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 px-4">
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
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <img 
              src={(room.images && room.images[selectedImageIndex]) || (room.images && room.images[0]) || room.image || 'https://via.placeholder.com/800x400?text=Room'} 
              alt={room.name} 
              className="w-full h-64 sm:h-80 object-cover" 
            />
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
                <h1 className="text-2xl font-bold text-gray-900">{room.room_number ? `#${room.room_number}` : room.name}</h1>
                {room.room_number && (
                  <p className="text-sm text-gray-500">{room.name}</p>
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
            <div className="mb-4">
              <div className="text-2xl font-bold text-gray-900">{getDisplayPrice()}</div>
              {room.original_price && (
                <div className="text-sm line-through text-gray-500">{room.original_price}</div>
              )}
              <p className="text-xs text-gray-600">Per night</p>
              {checkIn && checkOut && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Total: ₱{calculateTotalPrice()} ({Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))} nights)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest/s</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  {[...Array(room.guests)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </div>
            </div>
            
            <div className="space-y-2 grid grid-cols-1 mt-4">
              {/* Guest Name */}
              <input
                type="text"
                placeholder="Full Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            
              {/* Guest Email or Contact Number */}
              <input
                type="text"
                placeholder="Email or Contact Number"
                value={guestContact}
                onChange={(e) => setGuestContact(e.target.value)}
                className="w-full px-4 py-4 text-base bg-gray-100 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                required
              />
            </div>

            <button 
              onClick={handleBooking} 
              // TEMPORARILY DISABLED VALIDATION FOR TESTING - Uncomment line below to re-enable
              //  disabled={!checkIn || !checkOut || !guestName || !guestContact}
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