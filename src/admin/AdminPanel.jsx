import React, { useState } from 'react';
import { Bed, Calendar, Package, Users, DollarSign, TrendingUp, Bell, Menu, X, Settings, BarChart3, Home } from 'lucide-react';
import logo from "../assets/logo.jpg"

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sample data for overview cards
  const overviewStats = [
    { title: 'Total Rooms', value: '124', change: '+2.5%', icon: Bed, color: 'bg-blue-500' },
    { title: 'Active Bookings', value: '89', change: '+12%', icon: Calendar, color: 'bg-green-500' },
    { title: 'Occupancy Rate', value: '78%', change: '+5.2%', icon: Users, color: 'bg-purple-500' },
    { title: 'Revenue Today', value: '$12,450', change: '+8.1%', icon: DollarSign, color: 'bg-orange-500' },
  ];

  const recentBookings = [
    { id: '1001', guest: 'John Smith', room: '205', checkIn: '2024-08-24', status: 'confirmed' },
    { id: '1002', guest: 'Sarah Johnson', room: '312', checkIn: '2024-08-25', status: 'pending' },
    { id: '1003', guest: 'Mike Davis', room: '108', checkIn: '2024-08-24', status: 'checked-in' },
    { id: '1004', guest: 'Lisa Wilson', room: '420', checkIn: '2024-08-26', status: 'confirmed' },
  ];

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'rooms', label: 'Rooms', icon: Bed },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const StatusBadge = ({ status }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'confirmed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'checked-in': return 'bg-blue-100 text-blue-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
                <img src={logo} className="h-12 w-12" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Osner Hotel</h1>
                <p className="text-xs text-gray-600">Hotel Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@grandplaza.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
                >
                  <Menu className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">
                    {activeTab === 'overview' ? 'Dashboard Overview' : `${activeTab} Management`}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {activeTab === 'overview' ? 'Welcome back! Here\'s what\'s happening at your hotel today.' : `Manage your hotel ${activeTab} efficiently`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">3</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'overview' && (
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
                      <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Booking ID</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Guest</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check-in</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {recentBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">#{booking.id}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{booking.guest}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{booking.room}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{booking.checkIn}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={booking.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'overview' && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md mx-auto">
                  <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {navigationItems.find(item => item.id === activeTab)?.icon && 
                        React.createElement(navigationItems.find(item => item.id === activeTab).icon, {
                          className: "h-8 w-8 text-blue-600"
                        })
                      }
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                    </h3>
                    <p className="text-gray-600 mb-4">
                      This section will contain the {activeTab} management interface. 
                      Each component will be created separately for modular design.
                    </p>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25">
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;