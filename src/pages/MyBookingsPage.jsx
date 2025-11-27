import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  Phone, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { useAlertDialog } from '../context/AlertDialogContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

const MyBookingsPage = () => {
  const { user, isAuthenticated, getAuthHeader } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const { showConfirm } = useAlertDialog();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated || !user?.email) {
        setError('Please log in to view your bookings');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(API_ENDPOINTS.USER_BOOKINGS, {
          headers: getAuthHeader()
        });
        setBookings(response.data || []);
      } catch (err) {
        setError('Failed to load bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, user, getAuthHeader]);

  const handleCancelBooking = async (bookingId) => {
    const confirmed = await showConfirm(
      'Cancel this booking?',
      'This action cannot be undone.',
      'Cancel Booking'
    );

    if (!confirmed) return;

    setCancelling(bookingId);
    try {
      await axios.patch(`${API_ENDPOINTS.BOOKINGS}/${bookingId}`, { status: 'cancelled' });
      setBookings(bookings.map(b => 
        b.bookingId === bookingId ? { ...b, status: 'cancelled' } : b
      ));
      showSuccess('Booking cancelled successfully');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
  });

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-amber-100 text-amber-800', icon: Clock, label: 'Pending' },
      confirmed: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Confirmed' },
      cancelled: { color: 'bg-gray-100 text-gray-700', icon: XCircle, label: 'Cancelled' },
      declined: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Declined' },
      checked_in: { color: 'bg-blue-100 text-blue-800', icon: MapPin, label: 'Checked In' },
      completed: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Completed' },
    };
    return configs[status] || configs.pending;
  };

  const canCancel = (booking) => ['pending', 'confirmed'].includes(booking.status);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in Required</h2>
          <p className="text-gray-600 mb-8">Please log in to view your bookings</p>
          <a href="/login" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-medium">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-16 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8 pt-4">
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-2">Manage your hotel reservations</p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-gray-600 mt-4">Loading your bookings...</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && bookings.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-8">Start your journey by booking a room</p>
              <a href="/rooms" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
                Explore Rooms
              </a>
            </div>
          )}

          {/* Bookings List */}
          {!loading && !error && bookings.length > 0 && (
            <div className="space-y-5">
              {bookings.map((booking) => {
                const status = getStatusConfig(booking.status);
                const StatusIcon = status.icon;
                const isExpanded = expandedBooking === booking.bookingId;

                return (
                  <div 
                    key={booking.bookingId} 
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all"
                  >
                    {/* Header - Always Visible */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              Booking #{booking.bookingId}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                            </span>
                          </div>
                          <p className="text-base font-medium text-gray-900 mt-2">
                            {booking.room_number ? `Room #${booking.room_number} · ` : ''}{booking.roomName}
                          </p>
                        </div>
                        <button
                          onClick={() => setExpandedBooking(isExpanded ? null : booking.bookingId)}
                          className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 px-5 py-6 space-y-5">
                        <div className="grid grid-cols-2 gap-5 text-sm">
                          <div>
                            <p className="text-gray-500">Guest</p>
                            <p className="font-semibold text-gray-900">{booking.guestName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Contact</p>
                            <p className="font-semibold text-gray-900">{booking.guestContact}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Guests</p>
                            <p className="font-semibold text-gray-900 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {booking.guests}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Paid</p>
                            <p className="font-bold text-lg text-emerald-600">₱{booking.totalPrice}</p>
                          </div>
                        </div>

                        {booking.guest_gender && (
                          <div className="text-sm">
                            <span className="text-gray-500">Gender: </span>
                            <span className="font-medium">{booking.guest_gender}</span>
                          </div>
                        )}

                        {booking.guest_age && (
                          <div className="text-sm">
                            <span className="text-gray-500">Age: </span>
                            <span className="font-medium">{booking.guest_age} years</span>
                          </div>
                        )}

                        <div className="text-xs text-gray-500">
                          Booked on {new Date(booking.bookingDate).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 space-y-3">
                          {canCancel(booking) && (
                            <button
                              onClick={() => handleCancelBooking(booking.bookingId)}
                              disabled={cancelling === booking.bookingId}
                              className="w-full bg-red-600 text-white py-3.5 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                            >
                              {cancelling === booking.bookingId ? (
                                <> <Loader2 className="w-5 h-5 animate-spin" /> Cancelling... </>
                              ) : (
                                <> <XCircle className="w-5 h-5" /> Cancel Booking </>
                              )}
                            </button>
                          )}

                          {(booking.status === 'cancelled' || booking.status === 'declined') && (
                            <div className={`p-4 rounded-xl border ${booking.status === 'cancelled' ? 'bg-gray-50 border-gray-300' : 'bg-red-50 border-red-300'}`}>
                              <p className={`text-sm font-medium ${booking.status === 'cancelled' ? 'text-gray-700' : 'text-red-700'}`}>
                                {booking.status === 'cancelled' 
                                  ? 'This booking has been cancelled.' 
                                  : 'This booking was declined by the hotel.'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Contact support if you need assistance.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Support Button - Mobile Only */}
        <div className="fixed bottom-6 right-6 z-10 md:hidden">
          <a
            href="tel:+1234567890"
            className="bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition transform active:scale-95"
          >
            <MessageCircle className="w-6 h-6" />
          </a>
        </div>

        {/* Desktop Support Info */}
        <div className="hidden md:block text-center py-8 text-sm text-gray-600">
          Need help? Call us at{' '}
          <a href="tel:+1234567890" className="text-blue-600 font-medium hover:underline">+123 456 7890</a>
          {' '}or email{' '}
          <a href="mailto:support@osnerhotel.com" className="text-blue-600 font-medium hover:underline">
            support@osnerhotel.com
          </a>
        </div>
      </div>
    </>
  );
};

export default MyBookingsPage;