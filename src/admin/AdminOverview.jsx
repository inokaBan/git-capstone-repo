import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bed, Calendar, Users, DollarSign, TrendingUp, User, Clock, Check, X } from 'lucide-react';
import axios from 'axios';

const AdminOverview = () => {

  // Sample data for overview cards
  const overviewStats = [
    { title: 'Total Rooms', value: '124', change: '+2.5%', icon: Bed, color: 'bg-blue-500' },
    { title: 'Active Bookings', value: '89', change: '+12%', icon: Calendar, color: 'bg-green-500' },
    { title: 'Occupancy Rate', value: '78%', change: '+5.2%', icon: Users, color: 'bg-purple-500' },
    { title: 'Revenue Today', value: '$12,450', change: '+8.1%', icon: DollarSign, color: 'bg-orange-500' },
  ];

  const [recentBookings, setRecentBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState(null);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoadingBookings(true);
        const response = await axios.get('http://localhost:8081/api/bookings?status=all');
        const all = Array.isArray(response.data) ? response.data : [];
        const sorted = [...all].sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
        setRecentBookings(sorted.slice(0, 5));
      } catch (err) {
        setBookingsError('Failed to load recent bookings');
      } finally {
        setLoadingBookings(false);
      }
    };
    fetchRecent();
  }, []);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {overviewStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            <div className="flex items-center mt-2">
                              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                              <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl ${stat.color} shadow-lg`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recent Bookings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                        <p className="text-sm text-gray-600 mt-1">Latest reservations and check-ins</p>
                      </div>
                      <NavLink to="/admin/bookings" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        View All
                      </NavLink>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    {loadingBookings ? (
                      <div className="p-6 text-sm text-gray-600">Loading recent bookings...</div>
                    ) : bookingsError ? (
                      <div className="p-6 text-sm text-red-600">{bookingsError}</div>
                    ) : recentBookings.length === 0 ? (
                      <div className="p-6 text-sm text-gray-600">No recent bookings.</div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {recentBookings.map((booking) => (
                            <tr key={booking.bookingId} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{booking.guestName}</div>
                                    <div className="text-xs text-gray-500">#{booking.bookingId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{booking.roomName}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(booking.checkIn)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                  {getStatusIcon(booking.status)}
                                  {booking.status && booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
            
    </div>
  );
};

export default AdminOverview;