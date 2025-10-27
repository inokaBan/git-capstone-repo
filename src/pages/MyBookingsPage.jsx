import React, { useState, useEffect } from 'react';
import { Calendar, User, Clock, AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAlertDialog } from '../context/AlertDialogContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const MyBookingsPage = () => {
  const { user, isAuthenticated, getAuthHeader } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const { showConfirm } = useAlertDialog();
  const { showSuccess, showError } = useToast();

  // Fetch user's bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated || !user?.email) {
        setError('Please log in to view your bookings');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8081/api/user/bookings', {
          headers: getAuthHeader()
        });
        setBookings(response.data || []);
        setError('');
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, user, getAuthHeader]);

  const handleCancelBooking = async (bookingId) => {
    const confirmed = await showConfirm('Are you sure you want to cancel this booking? This action cannot be undone.', 'Cancel Booking');
    
    if (!confirmed) {
      return;
    }

    setCancelling(bookingId);
    try {
      await axios.patch(`http://localhost:8081/api/bookings/${bookingId}`, {
        status: 'cancelled'
      });
      
      // Update the booking in the list
      setBookings(bookings.map(b => 
        b.bookingId === bookingId ? { ...b, status: 'cancelled' } : b
      ));
      showSuccess('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      showError(err.response?.data?.error || 'Failed to cancel booking. Please try again or contact support.');
    } finally {
      setCancelling(null);
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

  const canCancelBooking = (booking) => {
    return booking && ['pending', 'confirmed'].includes(booking.status);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-3xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your bookings.</p>
          <a href="/login" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your hotel reservations</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading your bookings...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* No Bookings State */}
        {!loading && !error && bookings.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h2>
            <p className="text-gray-600 mb-6">You haven't made any bookings yet. Start exploring our rooms!</p>
            <a href="/rooms" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Browse Rooms
            </a>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.bookingId} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Booking #{booking.bookingId}</h2>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span className="font-semibold capitalize">{booking.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Booking Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500">Guest Name</label>
                      <p className="text-lg font-semibold text-gray-900">{booking.guestName}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-500">Contact Number</label>
                      <p className="text-lg font-semibold text-gray-900">{booking.guestContact}</p>
                    </div>

                    {(booking.guest_gender || booking.guest_age) && (
                      <>
                        {booking.guest_gender && (
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500">Gender</label>
                            <p className="text-lg font-semibold text-gray-900">{booking.guest_gender}</p>
                          </div>
                        )}

                        {booking.guest_age && (
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500">Age</label>
                            <p className="text-lg font-semibold text-gray-900">{booking.guest_age} years</p>
                          </div>
                        )}
                      </>
                    )}

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
                  {canCancelBooking(booking) && (
                    <div className="pt-6 border-t border-gray-200">
                      <button
                        onClick={() => handleCancelBooking(booking.bookingId)}
                        disabled={cancelling === booking.bookingId}
                        className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {cancelling === booking.bookingId ? (
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
            ))}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help with your booking? Contact our support team at{' '}
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
