import React, { useState, useEffect } from 'react';
import { Calendar, User, Home, Clock, Check, X, Loader2 } from 'lucide-react';

// Remove mockBookings, use backend data

const AdminPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Fetch bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('http://localhost:8081/api/bookings?status=pending');
        const data = await response.json();
        console.log('Fetched bookings:', data); // Debug log
        setBookings(data);
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
      const response = await fetch(`http://localhost:8081/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action === 'approve' ? 'confirmed' : 'declined' })
      });
      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }
      // Remove booking from UI
      setBookings(prevBookings => prevBookings.filter(booking => booking.bookingId !== bookingId));
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

  const getRoomTypeColor = (roomType) => {
    const colors = {
      'Standard Room': 'bg-blue-100 text-blue-800',
      'Deluxe Suite': 'bg-purple-100 text-purple-800',
      'Executive Suite': 'bg-emerald-100 text-emerald-800',
      'Premium Suite': 'bg-amber-100 text-amber-800'
    };
    return colors[roomType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-600 font-medium">Loading pending bookings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Admin Bookings Management
            </h1>
          </div>
          <p className="text-gray-600">
            Review and manage pending booking requests
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {bookings.length === 0 ? (
            /* Empty State */
            <div className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                All caught up!
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                There are no pending bookings at the moment. New requests will appear here for your review.
              </p>
            </div>
          ) : (
            <>
              {/* Header with count */}
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Pending Bookings
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {bookings.length} pending
                  </span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.bookingId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.guestName}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <div key={booking.bookingId} className="p-4 space-y-4">
                    {/* Customer Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.guestName}
                        </h3>
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      </div>
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
                          <Calendar className="w-4 h-4" />
                          <span>Check-in</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.checkIn)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>Check-out</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(booking.checkOut)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-2">
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
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;