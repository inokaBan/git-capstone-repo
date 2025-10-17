import React, { useState } from 'react';
import { Search, Calendar, User, Home, Clock, AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import axios from 'axios';

const MyBookingsPage = () => {
  const [searchData, setSearchData] = useState({
    bookingId: '',
    guestContact: ''
  });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleInputChange = (e) => {
    setSearchData({
      ...searchData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchData.bookingId.trim() || !searchData.guestContact.trim()) {
      setError('Please enter both Booking ID and Contact Number');
      return;
    }

    setLoading(true);
    setError('');
    setBooking(null);

    try {
      // Fetch all bookings and filter on client side
      const response = await axios.get('http://localhost:8081/api/bookings?status=all');
      const bookings = response.data;
      
      // Find booking by ID and contact
      const foundBooking = bookings.find(
        b => b.bookingId === searchData.bookingId && 
             b.guestContact === searchData.guestContact
      );

      if (foundBooking) {
        setBooking(foundBooking);
      } else {
        setError('No booking found with the provided Booking ID and Contact Number. Please check your details and try again.');
      }
    } catch (err) {
      console.error('Error searching for booking:', err);
      setError('An error occurred while searching for your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    setCancelling(true);
    try {
      await axios.patch(`http://localhost:8081/api/bookings/${booking.bookingId}`, {
        status: 'cancelled'
      });
      
      setBooking({ ...booking, status: 'cancelled' });
      alert('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.error || 'Failed to cancel booking. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'confirmed': 'bg-green-50 text-green-700 border-green-200',
      'declined': 'bg-red-50 text-red-700 border-red-200',
      'cancelled': 'bg-gray-50 text-gray-700 border-gray-200',
      'checked_in': 'bg-blue-50 text-blue-700 border-blue-200',
      'completed': 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'declined':
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const canCancelBooking = booking && ['pending', 'confirmed'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Search for your booking using your Booking ID and contact number</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking ID
              </label>
              <input
                type="text"
                name="bookingId"
                value={searchData.bookingId}
                onChange={handleInputChange}
                placeholder="Enter your Booking ID (e.g., BK-1234567890)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                name="guestContact"
                value={searchData.guestContact}
                onChange={handleInputChange}
                placeholder="Enter your contact number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search Booking
                </>
              )}
            </button>
          </form>
        </div>

        {/* Booking Details */}
        {booking && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Booking Details</h2>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  <span className="font-semibold capitalize">{booking.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Booking Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Booking ID</label>
                  <p className="text-lg font-semibold text-gray-900">#{booking.bookingId}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Guest Name</label>
                  <p className="text-lg font-semibold text-gray-900">{booking.guestName}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Contact Number</label>
                  <p className="text-lg font-semibold text-gray-900">{booking.guestContact}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Room</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {booking.room_number ? `#${booking.room_number} - ` : ''}{booking.roomName}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Check-in Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(booking.checkIn)}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Check-out Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(booking.checkOut)}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Number of Guests
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{booking.guests}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-lg font-semibold text-green-600">₱{booking.totalPrice}</p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Booking Date
                  </label>
                  <p className="text-lg font-semibold text-gray-900">{formatDateTime(booking.bookingDate)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {canCancelBooking && (
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Cancel Booking
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Please note: Cancelled bookings cannot be restored. Contact support if you need assistance.
                  </p>
                </div>
              )}

              {booking.status === 'cancelled' && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      This booking has been cancelled. If you have any questions, please contact our support team.
                    </p>
                  </div>
                </div>
              )}

              {booking.status === 'declined' && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      This booking has been declined. Please contact our support team for more information.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Can't find your booking? Please contact our support team at{' '}
            <a href="tel:+1234567890" className="text-blue-600 hover:underline font-medium">
              +123 456 7890
            </a>
            {' '}or email{' '}
            <a href="mailto:support@osnerhotel.com" className="text-blue-600 hover:underline font-medium">
              support@osnerhotel.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;
