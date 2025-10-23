import React, { useState, useEffect } from 'react';
import { Calendar, User, Home, Clock, Check, X, Loader2, Eye, Trash2 } from 'lucide-react';
import FilterButtonGroup from '../components/FilterButtonGroup';
import axios from 'axios';
import { useAlertDialog } from '../context/AlertDialogContext';
import { useToast } from '../context/ToastContext';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { showConfirm } = useAlertDialog();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get('http://localhost:8081/api/bookings?status=all');
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleBookingAction = async (bookingId, action) => {
    setProcessingId(bookingId);
    try {
      const response = await axios.patch(`http://localhost:8081/api/bookings/${bookingId}`, {
        status: action === 'approve' ? 'confirmed' : 'declined'
      });
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.bookingId === bookingId 
            ? { ...booking, status: action === 'approve' ? 'confirmed' : 'declined' }
            : booking
        )
      );
    } catch (error) {
      console.error('Error updating booking:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const confirmed = await showConfirm('Are you sure you want to delete this booking? This action cannot be undone.', 'Delete Booking');
    
    if (!confirmed) {
      return;
    }
    
    setProcessingId(bookingId);
    try {
      await axios.delete(`http://localhost:8081/api/bookings/${bookingId}`);
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.bookingId !== bookingId)
      );
      showSuccess('Booking deleted successfully');
    } catch (error) {
      console.error('Error deleting booking:', error);
      showError(error.response?.data?.error || 'Failed to delete booking');
    } finally {
      setProcessingId(null);
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

  const getRoomTypeColor = (roomType) => {
    const colors = {
      'Standard Room': 'bg-blue-50 text-blue-700',
      'Deluxe Suite': 'bg-purple-50 text-purple-700',
      'Executive Suite': 'bg-emerald-50 text-emerald-700',
      'Premium Suite': 'bg-amber-50 text-amber-700'
    };
    return colors[roomType] || 'bg-gray-50 text-gray-700';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-50 text-yellow-700',
      'confirmed': 'bg-green-50 text-green-700',
      'declined': 'bg-red-50 text-red-700',
      'cancelled': 'bg-gray-50 text-gray-700'
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 mr-1" />;
      case 'confirmed':
        return <Check className="w-4 h-4 mr-1" />;
      case 'declined':
        return <X className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    if (!matchesStatus) return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const name = (booking.guestName || '').toString().toLowerCase();
    const idStr = (booking.bookingId || '').toString().toLowerCase();
    const roomNumber = (booking.room_number || '').toString().toLowerCase();
    const roomName = (booking.roomName || '').toString().toLowerCase();
    return name.includes(query) || idStr.includes(query) || roomNumber.includes(query) || roomName.includes(query);
  });

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    declined: bookings.filter(b => b.status === 'declined').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  const showBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-600 text-lg font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <div className="mr-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookings Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and review all hotel bookings</p>
          </div>

          <div className="w-full sm:w-80">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or booking ID"
                  className="bg-white w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <FilterButtonGroup 
              statusFilter={statusFilter}
              statusCounts={statusCounts}
              setStatusFilter={setStatusFilter}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm">
          {filteredBookings.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 text-sm">
                {statusFilter === 'all'
                  ? 'No bookings available in the syst em.'
                  : `No ${statusFilter} bookings found.`}
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {statusFilter === 'all' ? 'All Bookings' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings`}
                  </h2>
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                    {filteredBookings.length} {statusFilter === 'all' ? 'total' : statusFilter}
                  </span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.bookingId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{booking.bookingId}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{booking.guestName}</div>
                              <div className="text-sm text-gray-500">{booking.guestContact}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">{booking.room_number ? `#${booking.room_number}` : booking.roomName}</div>
                          {booking.room_number && (
                            <div className="text-gray-500">{booking.roomName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(booking.checkIn)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDate(booking.checkOut)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{booking.guests}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">₱{booking.totalPrice}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(booking.bookingDate)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => showBookingDetails(booking)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              aria-label={`View details for booking ${booking.bookingId}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleBookingAction(booking.bookingId, 'approve')}
                                  disabled={processingId === booking.bookingId}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                                  aria-label={`Approve booking ${booking.bookingId}`}
                                >
                                  {processingId === booking.bookingId ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="w-4 h-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleBookingAction(booking.bookingId, 'decline')}
                                  disabled={processingId === booking.bookingId}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                                  aria-label={`Decline booking ${booking.bookingId}`}
                                >
                                  {processingId === booking.bookingId ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <X className="w-4 h-4 mr-1" />
                                      Decline
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteBooking(booking.bookingId)}
                              disabled={processingId === booking.bookingId}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                              aria-label={`Delete booking ${booking.bookingId}`}
                            >
                              {processingId === booking.bookingId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <div key={booking.bookingId} className="p-4 sm:p-5">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{booking.guestName}</h3>
                            <p className="text-sm text-gray-500">ID: #{booking.bookingId}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            Room
                          </span>
                          <span className={`mt-1 inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getRoomTypeColor(booking.roomName)}`}>
                            {booking.roomName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Guests
                          </span>
                          <p className="mt-1 font-medium text-gray-900">{booking.guests}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Check-in
                          </span>
                          <p className="mt-1 font-medium text-gray-900">{formatDate(booking.checkIn)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Check-out
                          </span>
                          <p className="mt-1 font-medium text-gray-900">{formatDate(booking.checkOut)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Price</span>
                          <p className="mt-1 font-medium text-gray-900">₱{booking.totalPrice}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Booking Date
                          </span>
                          <p className="mt-1 font-medium text-gray-900">{formatDateTime(booking.bookingDate)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3">
                        <button
                          onClick={() => showBookingDetails(booking)}
                          className="flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          aria-label={`View details for booking ${booking.bookingId}`}
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          View
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleBookingAction(booking.bookingId, 'approve')}
                              disabled={processingId === booking.bookingId}
                              className="flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                              aria-label={`Approve booking ${booking.bookingId}`}
                            >
                              {processingId === booking.bookingId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-1.5" />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleBookingAction(booking.bookingId, 'decline')}
                              disabled={processingId === booking.bookingId}
                              className="flex-1 min-w-[100px] inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                              aria-label={`Decline booking ${booking.bookingId}`}
                            >
                              {processingId === booking.bookingId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <X className="w-4 h-4 mr-1.5" />
                                  Decline
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBooking(booking.bookingId)}
                        disabled={processingId === booking.bookingId}
                        className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                        aria-label={`Delete booking ${booking.bookingId}`}
                      >
                        {processingId === booking.bookingId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Booking Details Modal */}
        {showDetailsModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Booking ID</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">#{selectedBooking.bookingId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`mt-1 inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                        {getStatusIcon(selectedBooking.status)}
                        {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Guest Name</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">{selectedBooking.guestName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">{selectedBooking.guestContact}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Room Type</label>
                      <span className={`mt-1 inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getRoomTypeColor(selectedBooking.roomName)}`}>
                        {selectedBooking.roomName}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Guests</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">{selectedBooking.guests}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Check-in</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(selectedBooking.checkIn)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Check-out</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(selectedBooking.checkOut)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Price</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">₱{selectedBooking.totalPrice}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Booking Date</label>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(selectedBooking.bookingDate)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    aria-label="Close modal"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
