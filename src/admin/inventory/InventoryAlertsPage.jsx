import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Plus, ClipboardList, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const InventoryAlertsPage = () => {
  const { getAuthHeader } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showResolvedFilter, setShowResolvedFilter] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/inventory/alerts', {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/inventory/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: getAuthHeader(),
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleQuickAddStock = async (alert) => {
    const quantity = prompt(`How much stock to add for ${alert.item_name}?`);
    if (!quantity || isNaN(quantity)) return;

    try {
      const response = await fetch('http://localhost:8081/api/inventory/warehouse/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          item_id: alert.item_id,
          change_quantity: parseInt(quantity),
          reason: 'Quick restock from alert',
          notes: `Resolved alert #${alert.id}`,
        }),
      });

      if (response.ok) {
        handleResolve(alert.id);
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleCreateTask = async (alert) => {
    if (!alert.room_id) {
      alert('This alert is not associated with a specific room');
      return;
    }

    try {
      const response = await fetch('http://localhost:8081/api/inventory/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          room_id: alert.room_id,
          task_type: 'restocking',
          priority: alert.severity === 'critical' ? 'urgent' : 'high',
          description: `Restock ${alert.item_name} - ${alert.message}`,
        }),
      });

      if (response.ok) {
        handleResolve(alert.id);
        alert('Task created successfully!');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesResolved = showResolvedFilter || !alert.is_resolved;
    return matchesSeverity && matchesResolved;
  });

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
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Alerts</h1>
        <p className="text-gray-600">Monitor and respond to stock warnings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['all', 'critical', 'warning', 'info'].map(severity => {
          const count = severity === 'all' 
            ? alerts.filter(a => !a.is_resolved).length
            : alerts.filter(a => a.severity === severity && !a.is_resolved).length;
          
          return (
            <div key={severity} className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600 mb-1">
                {severity === 'all' ? 'Total Active' : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4 items-center">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showResolvedFilter}
            onChange={(e) => setShowResolvedFilter(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show resolved</span>
        </label>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 rounded-lg shadow p-6 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4 flex-1">
                <div className={`mt-1 ${alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{alert.alert_type.replace('_', ' ').toUpperCase()}</h3>
                    {alert.is_resolved && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  {alert.item_name && (
                    <p className="text-sm text-gray-600">Item: {alert.item_name}</p>
                  )}
                  {alert.room_name && (
                    <p className="text-sm text-gray-600">Room: {alert.room_name}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {!alert.is_resolved && (
                <div className="flex gap-2">
                  {alert.item_id && (
                    <button
                      onClick={() => handleQuickAddStock(alert)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      title="Quick add stock"
                    >
                      <Plus className="h-4 w-4" />
                      Add Stock
                    </button>
                  )}
                  {alert.room_id && (
                    <button
                      onClick={() => handleCreateTask(alert)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      title="Create task"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Create Task
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    title="Mark as resolved"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Resolve
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>No alerts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryAlertsPage;
