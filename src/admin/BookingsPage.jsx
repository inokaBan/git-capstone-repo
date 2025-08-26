import React, { useState, useEffect } from 'react';
import { Calendar, User, Home, Clock, Check, X, Loader2, Filter, Eye } from 'lucide-react';
import axios from 'axios';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch all bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get('http://localhost:8081/api/bookings?status=all');
        console.log('Fetched all bookings:', response.data); // Debug log
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
      // Send PATCH request to update booking status
      const response = await axios.patch(`http://localhost:8081/api/bookings/${bookingId}`, {
        status: action === 'approve' ? 'confirmed' : 'declined'
      });
      
      // Update the booking in the local state
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
      'Standard Room': 'bg-blue-100 text-blue-800',
      'Deluxe Suite': 'bg-purple-100 text-purple-800',
      'Executive Suite': 'bg-emerald-100 text-emerald-800',
      'Premium Suite': 'bg-amber-100 text-amber-800'
    };
    return colors[roomType] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'declined': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'confirmed':
        return <Check className="w-3 h-3 mr-1" />;
      case 'declined':
        return <X className="w-3 h-3 mr-1" />;
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
    return name.includes(query) || idStr.includes(query);
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
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-600 font-medium">Loading all bookings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Filter Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 mb-6 overflow-x-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="w-full lg:max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or booking ID"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', count: statusCounts.all },
                  { key: 'pending', label: 'Pending', count: statusCounts.pending },
                  { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
                  { key: 'declined', label: 'Declined', count: statusCounts.declined },
                  { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      statusFilter === filter.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-slate-400">
          {filteredBookings.length === 0 ? (
            /* Empty State */
            <div className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {statusFilter === 'all' 
                  ? 'There are no bookings in the database yet.'
                  : `There are no ${statusFilter} bookings at the moment.`
                }
              </p>
            </div>
          ) : (
            <>
              {/* Header with count */}
              <div className="px-4 md:px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {statusFilter === 'all' ? 'All Bookings' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings`}
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {filteredBookings.length} {statusFilter === 'all' ? 'total' : statusFilter}
                  </span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.bookingId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{booking.bookingId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.guestName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.guestContact}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoomTypeColor(booking.roomName)}`}>
                            {booking.roomName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(booking.checkIn)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(booking.checkOut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.guests}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₱{booking.totalPrice}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(booking.bookingDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => showBookingDetails(booking)}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <div key={booking.bookingId} className="p-4 space-y-4">
                    {/* Customer Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.guestName}
                          </h3>
                          <p className="text-sm text-gray-500">{booking.guestContact}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <Home className="w-4 h-4" />
                          <span>Room Type</span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoomTypeColor(booking.roomName)}`}>
                          {booking.roomName}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <User className="w-4 h-4" />
                          <span>Guests</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.guests}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>Check-in</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.checkIn)}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>Check-out</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.checkOut)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <span>Total Price</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ₱{booking.totalPrice}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => showBookingDetails(booking)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleBookingAction(booking.bookingId, 'approve')}
                            disabled={processingId === booking.bookingId}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                          >
                            {processingId === booking.bookingId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking.bookingId, 'decline')}
                            disabled={processingId === booking.bookingId}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                          >
                            {processingId === booking.bookingId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Decline
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking ID</label>
                    <p className="text-sm text-gray-900">{selectedBooking.bookingId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusIcon(selectedBooking.status)}
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Guest Name</label>
                    <p className="text-sm text-gray-900">{selectedBooking.guestName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact</label>
                    <p className="text-sm text-gray-900">{selectedBooking.guestContact}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Room Type</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoomTypeColor(selectedBooking.roomName)}`}>
                      {selectedBooking.roomName}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Number of Guests</label>
                    <p className="text-sm text-gray-900">{selectedBooking.guests}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-in Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedBooking.checkIn)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-out Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedBooking.checkOut)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Price</label>
                    <p className="text-sm text-gray-900">₱{selectedBooking.totalPrice}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking Date</label>
                    <p className="text-sm text-gray-900">{formatDateTime(selectedBooking.bookingDate)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;