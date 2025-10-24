import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, Users, Bed, Clock, Download, BarChart3, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AnalyticsPage = () => {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:8081/api/admin/stats', {
        headers: getAuthHeader(),
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch all bookings for analytics
      const bookingsResponse = await fetch('http://localhost:8081/api/bookings?status=all', {
        headers: getAuthHeader(),
      });
      const bookingsData = await bookingsResponse.json();
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics from bookings data
  const calculateAnalytics = () => {
    if (!bookings.length) {
      return {
        totalRevenue: 0,
        totalBookings: 0,
        avgBookingValue: 0,
        completedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        topRooms: [],
        revenueByMonth: [],
        bookingsByStatus: [],
        revenueByDateArray: []
      };
    }

    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    
    // Filter bookings by date range
    const recentBookings = bookings.filter(b => {
      const bookingDate = new Date(b.bookingDate);
      return bookingDate >= daysAgo;
    });

    // Calculate total revenue
    const totalRevenue = recentBookings.reduce((sum, b) => sum + (parseFloat(b.totalPrice) || 0), 0);
    
    // Calculate average booking value
    const avgBookingValue = recentBookings.length > 0 ? totalRevenue / recentBookings.length : 0;

    // Count bookings by status
    const completedBookings = recentBookings.filter(b => b.status === 'completed').length;
    const pendingBookings = recentBookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = recentBookings.filter(b => ['cancelled', 'declined'].includes(b.status)).length;
    const confirmedBookings = recentBookings.filter(b => ['confirmed', 'checked_in'].includes(b.status)).length;

    // Calculate top performing rooms
    const roomRevenue = {};
    recentBookings.forEach(b => {
      const roomName = b.roomName || 'Unknown';
      roomRevenue[roomName] = (roomRevenue[roomName] || 0) + (parseFloat(b.totalPrice) || 0);
    });
    const topRooms = Object.entries(roomRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate bookings by status for chart
    const bookingsByStatus = [
      { status: 'Completed', count: completedBookings, color: 'bg-green-500' },
      { status: 'Confirmed', count: confirmedBookings, color: 'bg-blue-500' },
      { status: 'Pending', count: pendingBookings, color: 'bg-yellow-500' },
      { status: 'Cancelled', count: cancelledBookings, color: 'bg-red-500' }
    ];

    // Calculate revenue by date for trend chart
    const revenueByDate = {};
    recentBookings.forEach(b => {
      const date = new Date(b.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      revenueByDate[date] = (revenueByDate[date] || 0) + (parseFloat(b.totalPrice) || 0);
    });
    
    const sortedDates = Object.keys(revenueByDate).sort((a, b) => {
      return new Date(a) - new Date(b);
    });
    
    const revenueByDateArray = sortedDates.slice(-14).map(date => ({
      date,
      revenue: revenueByDate[date]
    }));

    return {
      totalRevenue,
      totalBookings: recentBookings.length,
      avgBookingValue,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      topRooms,
      bookingsByStatus,
      revenueByDateArray
    };
  };

  const analytics = calculateAnalytics();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold">₱{analytics.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-gray-500 mt-1">Last {dateRange} days</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Bookings</div>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold">{analytics.totalBookings}</div>
          <div className="text-xs text-gray-500 mt-1">Last {dateRange} days</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Avg. Booking Value</div>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold">₱{analytics.avgBookingValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          <div className="text-xs text-gray-500 mt-1">Per booking</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Occupancy Rate</div>
            <Bed className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-2xl font-bold">{stats?.occupancyRate?.value || '0%'}</div>
          <div className="text-xs text-gray-500 mt-1">Current</div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend
          </h2>
        </div>
        <div className="p-6">
          {analytics.revenueByDateArray && analytics.revenueByDateArray.length > 0 ? (
            <div style={{ maxHeight: '300px' }}>
              <Line
                data={{
                  labels: analytics.revenueByDateArray.map(item => item.date),
                  datasets: [
                    {
                      label: 'Daily Revenue',
                      data: analytics.revenueByDateArray.map(item => item.revenue),
                      fill: true,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'rgba(34, 197, 94, 1)',
                      borderWidth: 2,
                      tension: 0.4,
                      pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed.y || 0;
                          return `Revenue: ₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₱' + value.toLocaleString('en-PH');
                        }
                      }
                    },
                    x: {
                      grid: {
                        display: false,
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No revenue data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Bookings by Status - Chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Bookings by Status
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="flex items-center justify-center">
              <div style={{ maxWidth: '300px', maxHeight: '300px' }}>
                <Doughnut
                  data={{
                    labels: analytics.bookingsByStatus.map(item => item.status),
                    datasets: [
                      {
                        label: 'Bookings',
                        data: analytics.bookingsByStatus.map(item => item.count),
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.8)',   // green for completed
                          'rgba(59, 130, 246, 0.8)',   // blue for confirmed
                          'rgba(234, 179, 8, 0.8)',    // yellow for pending
                          'rgba(239, 68, 68, 0.8)',    // red for cancelled
                        ],
                        borderColor: [
                          'rgba(34, 197, 94, 1)',
                          'rgba(59, 130, 246, 1)',
                          'rgba(234, 179, 8, 1)',
                          'rgba(239, 68, 68, 1)',
                        ],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    },
                  }}
                />
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {analytics.bookingsByStatus.map((item, index) => (
                <div key={index} className="text-center border border-gray-200 rounded-lg p-4">
                  <div className={`${item.color} text-white rounded-lg p-3 mb-2`}>
                    <div className="text-2xl font-bold">{item.count}</div>
                  </div>
                  <div className="text-sm text-gray-600">{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Rooms - Chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Performing Rooms
          </h2>
        </div>
        <div className="p-6">
          {analytics.topRooms.length > 0 ? (
            <div className="space-y-6">
              {/* Bar Chart */}
              <div style={{ maxHeight: '400px' }}>
                <Bar
                  data={{
                    labels: analytics.topRooms.map(room => room.name),
                    datasets: [
                      {
                        label: 'Revenue (₱)',
                        data: analytics.topRooms.map(room => room.revenue),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const value = context.parsed.y || 0;
                            return `Revenue: ₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₱' + value.toLocaleString('en-PH');
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topRooms.map((room, index) => {
                      const percentage = analytics.totalRevenue > 0 
                        ? (room.revenue / analytics.totalRevenue) * 100 
                        : 0;
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {room.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₱{room.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No booking data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity Summary
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Completed Bookings</div>
              <div className="text-2xl font-bold text-green-600">{analytics.completedBookings}</div>
              <div className="text-xs text-gray-500 mt-1">Successfully completed</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Pending Bookings</div>
              <div className="text-2xl font-bold text-yellow-600">{analytics.pendingBookings}</div>
              <div className="text-xs text-gray-500 mt-1">Awaiting confirmation</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Cancelled Bookings</div>
              <div className="text-2xl font-bold text-red-600">{analytics.cancelledBookings}</div>
              <div className="text-xs text-gray-500 mt-1">Cancelled or declined</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
