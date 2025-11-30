import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Calendar, CheckCircle, Clock, Package, ExternalLink, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_ENDPOINTS } from '../config/api';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';

// Skeleton Card Component
const NotificationSkeleton = () => (
  <div className="bg-white rounded-2xl border-l-4 border-transparent shadow-sm animate-pulse">
    <div className="p-5 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
        <div className="flex gap-4 flex-1">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-6 bg-gray-300 rounded w-64"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="flex gap-4 mt-4">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-32 mt-4"></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
        </div>
      </div>
    </div>
  </div>
);

const NotificationsPage = () => {
  const { getAuthHeader } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverity] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, itemsPerPage, typeFilter, severityFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          type: typeFilter === 'all' ? undefined : typeFilter,
          severity: severityFilter === 'all' ? undefined : severityFilter,
        },
        headers: getAuthHeader(),
      });
      setNotifications(res.data.data || []);
      setTotalItems(res.data.totalItems || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      showError('Failed to load notifications');
    } finally {
      // Add small delay so skeleton is visible even on fast connections
      setTimeout(() => setLoading(false), 600);
    }
  };

  // Action handlers (shortened for brevity – same logic as before)
  const handleResolveAlert = async (n) => {
    if (n.type !== 'alert') return;
    const alertId = n.id.replace('alert_', '');
    try {
      await axios.patch(`${API_ENDPOINTS.INVENTORY_ALERTS}/${alertId}/resolve`, {}, { headers: getAuthHeader() });
      fetchNotifications();
      showSuccess('Alert resolved');
      window.dispatchEvent(new Event('alertResolved'));
    } catch { showError('Failed to resolve'); }
  };

  const handleApproveBooking = async (n) => {
    try {
      await axios.patch(`${API_ENDPOINTS.BOOKINGS}/${n.bookingId}`, { status: 'confirmed' }, { headers: getAuthHeader() });
      fetchNotifications();
      showSuccess('Approved');
    } catch { showError('Failed'); }
  };

  const handleDeclineBooking = async (n) => {
    if (!confirm('Decline this booking?')) return;
    try {
      await axios.patch(`${API_ENDPOINTS.BOOKINGS}/${n.bookingId}`, { status: 'declined' }, { headers: getAuthHeader() });
      fetchNotifications();
      showSuccess('Declined');
    } catch { showError('Failed'); }
  };

  const handleMarkCompleted = async (n) => {
    try {
      await axios.patch(`${API_ENDPOINTS.BOOKINGS}/${n.bookingId}/check-out`, {}, { headers: getAuthHeader() });
      fetchNotifications();
      showSuccess('Checked out');
    } catch { showError('Failed'); }
  };

  const handleViewDetails = async (n) => {
    if (n.type === 'alert' && !n.is_resolved) await handleResolveAlert(n);
    if (n.link) navigate(n.link);
  };

  const getSeverityStyle = (s) => {
    switch (s) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning':  return 'border-amber-500 bg-amber-50';
      case 'info':     return 'border-blue-500 bg-blue-50';
      default:         return 'border-gray-300 bg-gray-50';
    }
  };

  const getTypeConfig = (type) => {
    const map = {
      alert:           { Icon: Package,        color: 'text-purple-600', label: 'Inventory' },
      pending_booking: { Icon: Calendar,       color: 'text-orange-600', label: 'Pending' },
      due_booking:     { Icon: Clock,          color: 'text-blue-600',   label: 'Due In' },
      due_checkout:    { Icon: CheckCircle,    color: 'text-green-600',  label: 'Due Out' },
      late_checkout:   { Icon: AlertTriangle,  color: 'text-red-600',    label: 'Overdue' },
    };
    return map[type] || { Icon: Bell, color: 'text-gray-600', label: 'Notification' };
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setSeverityFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
              Notifications
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Stay updated with important alerts</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="all">All Types</option>
              <option value="alert">Alerts</option>
              <option value="pending_booking">Pending</option>
              <option value="due_booking">Due In</option>
              <option value="due_checkout">Due Out</option>
              <option value="late_checkout">Overdue</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            {(typeFilter !== 'all' || severityFilter !== 'all') && (
              <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <X className="h-4 w-4" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            // Show 4–6 skeleton cards while loading
            <>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-800">All caught up!</p>
              <p className="text-gray-500 mt-2">No pending notifications</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { Icon, color, label } = getTypeConfig(n.type);

              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-2xl border-l-4 ${getSeverityStyle(n.severity)} shadow-sm hover:shadow-lg transition-shadow`}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                      <div className="flex gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base sm:text-lg text-gray-900">{n.title}</h3>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${color} bg-opacity-10`}>
                              {label}
                            </span>
                            {n.is_resolved && (
                              <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                Resolved
                              </span>
                            )}
                          </div>

                          <p className="text-gray-700 text-sm sm:text-base mb-3">{n.description}</p>

                          <div className="text-sm text-gray-600 space-y-1">
                            {n.item_name && <p>• Item: <strong>{n.item_name}</strong></p>}
                            {n.room_name && <p>• Room: <strong>{n.room_name} {n.room_number && `(${n.room_number})`}</strong></p>}
                            {n.guestName && <p>• Guest: <strong>{n.guestName}</strong></p>}
                          </div>

                          <p className="text-xs text-gray-400 mt-4">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {n.actionable && (
                        <div className="flex flex-wrap gap-2 sm:gap-3 lg:flex-col lg:items-end">
                          {n.type === 'alert' && !n.is_resolved && (
                            <button onClick={() => handleResolveAlert(n)} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" /> Resolve
                            </button>
                          )}
                          {n.type === 'pending_booking' && (
                            <>
                              <button onClick={() => handleApproveBooking(n)} className="px-5 py-2.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg">Approve</button>
                              <button onClick={() => handleDeclineBooking(n)} className="px-5 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">Decline</button>
                            </>
                          )}
                          {(n.type === 'due_checkout' || n.type === 'late_checkout') && (
                            <button onClick={() => handleMarkCompleted(n)} className="px-5 py-2.5 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" /> Check Out
                            </button>
                          )}
                          <button onClick={() => handleViewDetails(n)} className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" /> View
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;