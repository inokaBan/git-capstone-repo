import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, Users, Bed, Clock, Download, BarChart3, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
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
  const [exporting, setExporting] = useState(false);

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
        bookingsByMonth: [],
        bookingsByStatus: [],
        bookingsByGender: [],
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

    // Calculate bookings by gender for chart
    const maleBookings = recentBookings.filter(b => b.guest_gender && b.guest_gender.toLowerCase() === 'male').length;
    const femaleBookings = recentBookings.filter(b => b.guest_gender && b.guest_gender.toLowerCase() === 'female').length;
    const unknownGenderBookings = recentBookings.filter(b => !b.guest_gender || (b.guest_gender.toLowerCase() !== 'male' && b.guest_gender.toLowerCase() !== 'female')).length;

    const bookingsByGender = [
      { gender: 'Male', count: maleBookings, color: 'bg-blue-500' },
      { gender: 'Female', count: femaleBookings, color: 'bg-pink-500' },
      { gender: 'Not Specified', count: unknownGenderBookings, color: 'bg-gray-500' }
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
      bookingsByGender,
      revenueByDateArray
    };
  };

  const analytics = calculateAnalytics();

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Fetch CSV data from backend
      const response = await fetch(`${API_ENDPOINTS.ANALYTICS_EXPORT}?days=${dateRange}`, {
        headers: getAuthHeader(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      
      // Get the CSV data as blob
      const blob = await response.blob();
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${dateRange}days-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message (optional - you can add a toast notification if you have one)
      console.log('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Common tooltip styles for consistency across charts
  const tooltipStyles = {
    backgroundColor: 'rgba(31, 41, 55, 0.95)', // Dark gray with slight transparency
    titleFont: { size: 14, weight: 'bold', family: "'Inter', sans-serif" },
    bodyFont: { size: 12, family: "'Inter', sans-serif" },
    padding: 12,
    cornerRadius: 8,
    boxPadding: 6,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    caretSize: 6,
    caretPadding: 8,
  };

  // Common animation settings for consistency
  const animationSettings = {
    duration: 1000, // 1 second for smooth transitions
    easing: 'easeOutQuart', // Smooth easing for a natural feel
    delay: (context) => context.dataIndex * 50, // Staggered animation for each data point
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400 animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gain insights into your business performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: `₱${analytics.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-600', sub: `Last ${dateRange} days` },
          { title: 'Total Bookings', value: analytics.totalBookings, icon: Calendar, color: 'text-blue-600', sub: `Last ${dateRange} days` },
          { title: 'Avg. Booking Value', value: `₱${analytics.avgBookingValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-purple-600', sub: 'Per booking' },
          { title: 'Occupancy Rate', value: stats?.occupancyRate?.value || '0%', icon: Bed, color: 'text-orange-600', sub: 'Current' },
        ].map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.title}</div>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metric.sub}</div>
          </div>
        ))}
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden col-span-1 lg:col-span-2">
          <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
          </header>
          <div className="p-6">
            {analytics.revenueByDateArray && analytics.revenueByDateArray.length > 0 ? (
              <div className="h-80">
                <Line
                  data={{
                    labels: analytics.revenueByDateArray.map(item => item.date),
                    datasets: [
                      {
                        label: 'Daily Revenue',
                        data: analytics.revenueByDateArray.map(item => item.revenue),
                        fill: true,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      ...animationSettings,
                      y: { from: 0 }, // Animate from y=0 for a rising effect
                      opacity: { from: 0, to: 1 }, // Fade in
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        ...tooltipStyles,
                        callbacks: {
                          title: (tooltipItems) => `Date: ${tooltipItems[0].label}`,
                          label: (context) => {
                            const value = context.parsed.y || 0;
                            const index = context.dataIndex;
                            const prevValue = index > 0 ? context.dataset.data[index - 1] : null;
                            const change = prevValue ? ((value - prevValue) / prevValue * 100).toFixed(1) : null;
                            return [
                              `Revenue: ₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
                              change ? `Change: ${change > 0 ? '+' : ''}${change}% from previous day` : '',
                            ].filter(Boolean);
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '₱' + value.toLocaleString('en-PH') },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      },
                      x: {
                        grid: { display: false },
                      },
                    },
                    interaction: {
                      mode: 'nearest',
                      intersect: false,
                      axis: 'x',
                    },
                    hover: {
                      animationDuration: 200, // Smooth hover animation
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">No revenue data available</div>
            )}
          </div>
        </section>

        {/* Bookings by Status */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bookings by Status</h2>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs aspect-square">
                <Doughnut
                  data={{
                    labels: analytics.bookingsByStatus.map(item => item.status),
                    datasets: [
                      {
                        data: analytics.bookingsByStatus.map(item => item.count),
                        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(234, 179, 8, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(59, 130, 246, 1)', 'rgba(234, 179, 8, 1)', 'rgba(239, 68, 68, 1)'],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: {
                      ...animationSettings,
                      animateScale: true, // Scale animation for doughnut segments
                      animateRotate: true, // Rotate animation for doughnut
                    },
                    plugins: {
                      legend: { position: 'bottom', labels: { padding: 20 } },
                      tooltip: {
                        ...tooltipStyles,
                        callbacks: {
                          title: (tooltipItems) => `${tooltipItems[0].label} Bookings`,
                          label: (context) => {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return [
                              `Count: ${value}`,
                              `Percentage: ${percentage}%`,
                              `Total Bookings: ${total}`,
                            ];
                          },
                        },
                      },
                    },
                    interaction: {
                      mode: 'nearest',
                      intersect: true,
                    },
                    hover: {
                      animationDuration: 200, // Smooth hover animation
                    },
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {analytics.bookingsByStatus.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-center shadow-sm">
                  <div className={`text-2xl font-bold ${item.color.replace('bg-', 'text-')}`}>{item.count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bookings by Gender */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bookings by Gender</h2>
          </header>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs aspect-square">
                <Doughnut
                  data={{
                    labels: analytics.bookingsByGender.map(item => item.gender),
                    datasets: [
                      {
                        data: analytics.bookingsByGender.map(item => item.count),
                        backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(107, 114, 128, 0.8)'],
                        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(236, 72, 153, 1)', 'rgba(107, 114, 128, 1)'],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: {
                      ...animationSettings,
                      animateScale: true, // Scale animation for doughnut segments
                      animateRotate: true, // Rotate animation for doughnut
                    },
                    plugins: {
                      legend: { position: 'bottom', labels: { padding: 20 } },
                      tooltip: {
                        ...tooltipStyles,
                        callbacks: {
                          title: (tooltipItems) => `${tooltipItems[0].label}`,
                          label: (context) => {
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return [
                              `Bookings: ${value}`,
                              `Percentage: ${percentage}%`,
                              `Total Bookings: ${total}`,
                            ];
                          },
                        },
                      },
                    },
                    interaction: {
                      mode: 'nearest',
                      intersect: true,
                    },
                    hover: {
                      animationDuration: 200, // Smooth hover animation
                    },
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {analytics.bookingsByGender.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-center shadow-sm">
                  <div className={`text-2xl font-bold ${item.color.replace('bg-', 'text-')}`}>{item.count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.gender}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Top Performing Rooms */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Rooms</h2>
        </header>
        <div className="p-6 space-y-8">
          {analytics.topRooms.length > 0 ? (
            <>
              <div className="h-80">
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
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                      ...animationSettings,
                      y: { from: 0 }, // Animate bars from y=0
                      opacity: { from: 0, to: 1 }, // Fade in
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        ...tooltipStyles,
                        callbacks: {
                          title: (tooltipItems) => `Room: ${tooltipItems[0].label}`,
                          label: (context) => {
                            const value = context.parsed.y || 0;
                            const percentage = analytics.totalRevenue > 0 ? ((value / analytics.totalRevenue) * 100).toFixed(1) : 0;
                            return [
                              `Revenue: ₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
                              `Share: ${percentage}% of total revenue`,
                            ];
                          },
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { callback: (value) => '₱' + value.toLocaleString('en-PH') },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                      },
                      x: {
                        grid: { display: false },
                      },
                    },
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    hover: {
                      animationDuration: 200, // Smooth hover animation
                    },
                  }}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Room Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Share</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {analytics.topRooms.map((room, index) => {
                      const percentage = analytics.totalRevenue > 0 ? (room.revenue / analytics.totalRevenue) * 100 : 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{room.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                            ₱{room.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-blue-600 dark:bg-blue-500 h-full" style={{ width: `${percentage}%` }} />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[4rem]">{percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">No booking data available</div>
          )}
        </div>
      </section>

      {/* Recent Activity Summary */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity Summary</h2>
        </header>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Completed Bookings', value: analytics.completedBookings, color: 'text-green-600', sub: 'Successfully completed' },
            { title: 'Pending Bookings', value: analytics.pendingBookings, color: 'text-yellow-600', sub: 'Awaiting confirmation' },
            { title: 'Cancelled Bookings', value: analytics.cancelledBookings, color: 'text-red-600', sub: 'Cancelled or declined' },
          ].map((item, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-md p-6 text-center shadow-sm">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{item.title}</div>
              <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{item.sub}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
