import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Calendar, CheckCircle, Clock, Package, Filter, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_ENDPOINTS } from '../config/api';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const { getAuthHeader } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    alerts: 0,
    pending_bookings: 0,
    due_bookings: 0
  });

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, itemsPerPage, typeFilter, severityFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          type: typeFilter,
          severity: severityFilter
        },
        headers: getAuthHeader(),
      });
      setNotifications(response.data.data || []);
      setTotalItems(response.data.totalItems || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS_COUNT, {
        headers: getAuthHeader(),
      });
      const breakdown = response.data.breakdown || {};
      setStats({
        total: response.data.count || 0,
        alerts: breakdown.alerts || 0,
        pending_bookings: breakdown.pendingBookings || 0,
        due_bookings: breakdown.dueBookings || 0
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const handleResolveAlert = async (notification) => {
    if (notification.type !== 'alert') return;
    
    const alertId = notification.id.replace('alert_', '');
    try {
      await axios.patch(`${API_ENDPOINTS.INVENTORY_ALERTS}/${alertId}/resolve`, {}, {
        headers: getAuthHeader(),
      });
      fetchNotifications();
      fetchStats();
      showSuccess('Alert resolved successfully!');
      window.dispatchEvent(new Event('alertResolved'));
    } catch (error) {
      console.error('Error resolving alert:', error);
      showError('Failed to resolve alert');
    }
  };

  const handleApproveBooking = async (notification) => {
    if (notification.type !== 'pending_booking') return;
    
    try {
      await axios.patch(`${API_ENDPOINTS.BOOKINGS}/${notification.bookingId}`, {
        status: 'confirmed'
      }, {
        headers: getAuthHeader(),
      });
      fetchNotifications();
      fetchStats();
      showSuccess('Booking approved successfully!');
      window.dispatchEvent(new Event('alertResolved'));
    } catch (error) {
      console.error('Error approving booking:', error);
      showError('Failed to approve booking');
    }
  };

  const handleDeclineBooking = async (notification) => {
    if (notification.type !== 'pending_booking') return;
    
    if (!confirm('Are you sure you want to decline this booking?')) return;
    
    try {
      await axios.patch(`${API_ENDPOINTS.BOOKINGS}/${notification.bookingId}`, {
        status: 'declined'
      }, {
        headers: getAuthHeader(),
      });
      fetchNotifications();
      fetchStats();
      showSuccess('Booking declined');
      window.dispatchEvent(new Event('alertResolved'));
    } catch (error) {
      console.error('Error declining booking:', error);
      showError('Failed to decline booking');
    }
  };

  const handleViewDetails = async (notification) => {
    // If it's an unresolved inventory alert, resolve it first
    if (notification.type === 'alert' && !notification.is_resolved) {
      await handleResolveAlert(notification);
    }
    
    // Navigate to the details page if a link exists
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert':
        return <Package className="h-5 w-5" />;
      case 'pending_booking':
        return <Calendar className="h-5 w-5" />;
      case 'due_booking':
        return <Clock className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'alert':
        return 'bg-purple-100 text-purple-800';
      case 'pending_booking':
        return 'bg-orange-100 text-orange-800';
      case 'due_booking':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">Monitor and manage all system notifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Active</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <Bell className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Inventory Alerts</div>
              <div className="text-2xl font-bold">{stats.alerts}</div>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Pending Bookings</div>
              <div className="text-2xl font-bold">{stats.pending_bookings}</div>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Due Check-ins</div>
              <div className="text-2xl font-bold">{stats.due_bookings}</div>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="alerts">Inventory Alerts</option>
            <option value="pending_bookings">Pending Bookings</option>
            <option value="due_bookings">Due Check-ins</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`border-l-4 rounded-lg shadow bg-white ${getSeverityColor(notification.severity)}`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getSeverityIcon(notification.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{notification.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getTypeBadgeColor(notification.type)}`}>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(notification.type)}
                          <span>
                            {notification.type === 'alert' && 'Inventory'}
                            {notification.type === 'pending_booking' && 'Pending Booking'}
                            {notification.type === 'due_booking' && 'Due Check-in'}
                          </span>
                        </div>
                      </span>
                      {notification.is_resolved && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{notification.description}</p>
                    
                    {/* Additional details based on notification type */}
                    <div className="text-sm text-gray-600 space-y-1">
                      {notification.item_name && (
                        <p>Item: <span className="font-medium">{notification.item_name}</span></p>
                      )}
                      {notification.room_name && (
                        <p>Room: <span className="font-medium">{notification.room_name} {notification.room_number ? `(${notification.room_number})` : ''}</span></p>
                      )}
                      {notification.guestName && (
                        <p>Guest: <span className="font-medium">{notification.guestName}</span></p>
                      )}
                      {notification.guest_email && (
                        <p>Email: <span className="font-medium">{notification.guest_email}</span></p>
                      )}
                      {notification.checkIn && (
                        <p>Check-in: <span className="font-medium">{new Date(notification.checkIn).toLocaleDateString()}</span></p>
                      )}
                      {notification.totalPrice && (
                        <p>Amount: <span className="font-medium">₱{parseFloat(notification.totalPrice).toLocaleString()}</span></p>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {notification.actionable && (
                  <div className="flex gap-2 flex-wrap">
                    {notification.type === 'alert' && !notification.is_resolved && (
                      <button
                        onClick={() => handleResolveAlert(notification)}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                        title="Mark as resolved"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </button>
                    )}
                    
                    {notification.type === 'pending_booking' && (
                      <>
                        <button
                          onClick={() => handleApproveBooking(notification)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeclineBooking(notification)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handleViewDetails(notification)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      title="View details"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {notifications.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">No notifications to display</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {notifications.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};

export default NotificationsPage;
