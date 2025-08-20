import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Home, 
  Calendar, 
  BarChart3, 
  HelpCircle, 
  Settings, 
  LogOut,
  Search,
  Bell,
  MessageSquare,
  Star,
  ChevronDown,
  MoreHorizontal,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Admin = () => {
  const [activeItem, setActiveItem] = useState('overview');
  const [currentMonth, setCurrentMonth] = useState('Sept');
  const [currentYear, setCurrentYear] = useState('2023');

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, active: true },
    { id: 'rooms', label: 'Rooms', icon: Home },
    { id: 'booking', label: 'Booking', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'setting', label: 'Setting', icon: Settings },
    { id: 'logout', label: 'Log out', icon: LogOut },
  ];

  const travelPackages = [
    {
      id: 1,
      image: '/api/placeholder/300/200',
      title: 'Seoul, South Korea',
      duration: '4 Days, 7 Nights',
      price: 2200,
      rating: 4.3
    },
    {
      id: 2,
      image: '/api/placeholder/300/200',
      title: 'Kyoto, Japan',
      duration: '6 Days, 4 Nights',
      price: 2200,
      rating: 4.3
    },
    {
      id: 3,
      image: '/api/placeholder/300/200',
      title: 'Doha, Qatar',
      duration: '8 Days, 7 Nights',
      price: 2200,
      rating: 4.3
    }
  ];

  const destinations = [
    { name: 'Seoul, South Korea', percentage: 75 },
    { name: 'Abu Dhabi, UAE', percentage: 55 },
    { name: 'Greece, Europe', percentage: 35 }
  ];

  const upcomingTrips = [
    {
      destination: 'Cusco and Machu Picchu, Peru',
      date: '16 - 18 Apr 2025',
      people: 8,
      image: '/api/placeholder/60/60'
    },
    {
      destination: 'Cusco and Machu Picchu, Peru',
      date: '6 - 11 May 2025',
      people: 8,
      image: '/api/placeholder/60/60'
    },
    {
      destination: 'Cusco and Machu Picchu, Peru',
      date: '5 - 11 Jun 2025',
      people: 8,
      image: '/api/placeholder/60/60'
    }
  ];

  const recentActivity = [
    {
      user: 'Bill Trevor (admin)',
      action: 'updated the "Kyoto, Japan" travel package',
      time: '12:30 PM',
      avatar: '/api/placeholder/32/32'
    },
    {
      user: 'Customer service',
      action: 'responded to an inquiry from Sara Nguyen',
      time: '12:30 PM',
      avatar: '/api/placeholder/32/32'
    },
    {
      user: 'Alex Rivera\'s',
      action: 'payment was received for booking code ADV2024-008',
      time: '12:30 PM',
      avatar: '/api/placeholder/32/32'
    }
  ];

  const calendarDays = [
    'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'
  ];

  const generateCalendarDays = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    return days;
  };

  const handleNavClick = (itemId) => {
    setActiveItem(itemId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">L</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Logo</span>
          </div>
        </div>

        <nav className="px-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src="/api/placeholder/40/40"
                  alt="Darlene Robertson"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-900">Darlene Robertson</span>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, voucher, price..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-start space-x-6">
            {/* Left Column */}
            <div className="flex-1 space-y-6">
              {/* Travel Packages Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Travel Packages</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <button className="flex items-center space-x-1 text-sm text-blue-600">
                      <span>Latest</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {travelPackages.map((pkg) => (
                    <div key={pkg.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="relative">
                        <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600"></div>
                        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{pkg.rating}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{pkg.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">{pkg.duration}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-bold text-orange-600">${pkg.price}</span>
                            <span className="text-sm text-gray-500">/night</span>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trip Overview */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Trip Overview</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative">
                    <div className="w-32 h-32 mx-auto mb-6">
                      <svg className="w-full h-full" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="10"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 50 * 0.7} ${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * 0.25}`}
                          className="transform -rotate-90 origin-center"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">2,839</span>
                        <span className="text-sm text-gray-500">Total Trips</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">6.5%</div>
                        <div className="text-xs text-gray-500">Cancelled</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">26.5%</div>
                        <div className="text-xs text-gray-500">Booked</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">67%</div>
                        <div className="text-xs text-gray-500">Done</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Destinations */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Top Destinations</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900">245,930</div>
                    <div className="text-sm text-gray-500">Total Customers</div>
                  </div>

                  <div className="space-y-4">
                    {destinations.map((dest, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-gray-800 rounded-sm"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{dest.name}</span>
                            <span className="text-sm text-gray-500">{dest.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${dest.percentage}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Booking History */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Booking History</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <button className="flex items-center space-x-1 text-sm text-blue-600">
                      <span>Select</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-500">ID</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">DATE</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">DURATION</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">AMOUNT</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-4 text-sm text-gray-900">BL692F IndiGO</td>
                        <td className="py-4 text-sm text-gray-900">Apr 16, 2025</td>
                        <td className="py-4 text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span>16:28</span>
                            <div className="flex-1 h-1 bg-green-200 rounded"></div>
                            <span>18:45</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">India → Seoul</div>
                        </td>
                        <td className="py-4 text-sm text-gray-900">$5,000</td>
                        <td className="py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Completed
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 space-y-6">
              {/* Calendar */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Calendar</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900">{currentMonth}</span>
                    <span className="text-gray-500">{currentYear}</span>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {calendarDays.map((day) => (
                    <div key={day} className="text-center text-xs text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day) => (
                    <button
                      key={day}
                      className={`
                        text-center text-sm py-2 hover:bg-gray-100 rounded
                        ${day === 11 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700'}
                      `}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upcoming Trips */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Trips</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700">View All</button>
                </div>

                <div className="space-y-4">
                  {upcomingTrips.map((trip, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg"></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{trip.destination}</h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{trip.date}</span>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{trip.people}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {activity.user.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user}</span>{' '}
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;