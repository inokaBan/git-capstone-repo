import React, { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAlertDialog } from '../../context/AlertDialogContext';
import { API_ENDPOINTS } from '../../config/api';

const RoomInventoryPage = () => {
  const { getAuthHeader } = useAuth();
  const { showSuccess, showError } = useToast();
  const { showConfirm } = useAlertDialog();
  const [rooms, setRooms] = useState([]);
  const [roomInventory, setRoomInventory] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryFormData, setInventoryFormData] = useState({
    item_id: '',
    quantity: 0,
    action: 'set'
  });
  const [selectedRoomForInventory, setSelectedRoomForInventory] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchItems();
    fetchRoomInventory();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ROOMS, {
        headers: getAuthHeader(),
      });
      setRooms(response.data.data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.INVENTORY_ITEMS, {
        headers: getAuthHeader(),
      });
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchRoomInventory = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.INVENTORY_ROOM, {
        headers: getAuthHeader(),
      });
      
      // Group by room_id
      const grouped = {};
      response.data.forEach(item => {
        if (!grouped[item.room_id]) {
          grouped[item.room_id] = [];
        }
        grouped[item.room_id].push(item);
      });
      setRoomInventory(grouped);
    } catch (error) {
      console.error('Error fetching room inventory:', error);
    }
  };

  const createRestockTask = async (roomId) => {
    try {
      await axios.post(API_ENDPOINTS.INVENTORY_TASKS, {
        room_id: roomId,
        task_type: 'restocking',
        priority: 'medium',
        description: 'Restock room after checkout',
      }, {
        headers: getAuthHeader(),
      });
      showSuccess('Restocking task created successfully!');
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
      showError('Failed to create restocking task');
    }
  };

  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRoomForInventory) return;
    
    try {
      await axios.post(API_ENDPOINTS.INVENTORY_ROOM, {
        room_id: selectedRoomForInventory.id,
        item_id: inventoryFormData.item_id,
        quantity: inventoryFormData.quantity,
        action: inventoryFormData.action
      }, {
        headers: getAuthHeader(),
      });
      showSuccess('Inventory updated successfully!');
      fetchRoomInventory();
      setShowInventoryModal(false);
      setInventoryFormData({ item_id: '', quantity: 0, action: 'set' });
    } catch (error) {
      console.error('Error updating inventory:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update inventory';
      showError(`Error: ${errorMessage}`);
    }
  };

  const handleBulkRestock = async (roomId) => {
    const confirmed = await showConfirm('This will restock all items to standard levels. Continue?', 'Bulk Restock');
    
    if (!confirmed) {
      return;
    }
    
    try {
      const response = await axios.post(`${API_ENDPOINTS.INVENTORY_ROOM}/restock`, {
        room_id: roomId
      }, {
        headers: getAuthHeader(),
      });
      showSuccess(response.data.message || 'Room restocked successfully!');
      fetchRoomInventory();
      if (selectedRoom && selectedRoom.id === roomId) {
        setSelectedRoom(rooms.find(r => r.id === roomId));
      }
    } catch (error) {
      console.error('Error restocking room:', error);
      const errorMessage = error.response?.data?.error || 'Failed to restock room';
      showError(`Error: ${errorMessage}`);
    }
  };

  const handleRemoveItem = async (roomId, itemId) => {
    const confirmed = await showConfirm('Remove this item from room inventory?', 'Remove Item');
    
    if (!confirmed) {
      return;
    }
    
    try {
      await axios.delete(`${API_ENDPOINTS.INVENTORY_ROOM}/${roomId}/${itemId}`, {
        headers: getAuthHeader(),
      });
      showSuccess('Item removed successfully!');
      fetchRoomInventory();
    } catch (error) {
      console.error('Error removing item:', error);
      const errorMessage = error.response?.data?.error || 'Failed to remove item';
      showError(`Error: ${errorMessage}`);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (statusFilter === 'all') return true;
    return room.status === statusFilter;
  });

  const getInventoryStatus = (roomId) => {
    const inventory = roomInventory[roomId] || [];
    if (inventory.length === 0) return { status: 'unknown', color: 'gray' };
    
    const lowStockItems = inventory.filter(item => item.status === 'low' || item.status === 'out_of_stock');
    if (lowStockItems.length > 0) {
      return { status: 'needs_restock', color: 'red', count: lowStockItems.length };
    }
    
    return { status: 'sufficient', color: 'green' };
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-900 dark:text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Inventory</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor and manage inventory in each room</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Rooms</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => {
          const inventoryStatus = getInventoryStatus(room.id);
          const inventory = roomInventory[room.id] || [];

          return (
            <div
              key={room.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedRoom(room)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{room.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Room {room.room_number}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  room.status === 'available' ? 'bg-green-100 text-green-800' :
                  room.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {room.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Package className={`h-5 w-5 text-${inventoryStatus.color}-600 dark:text-${inventoryStatus.color}-400`} />
                <span className={`text-sm font-medium text-${inventoryStatus.color}-600 dark:text-${inventoryStatus.color}-400`}>
                  {inventoryStatus.status === 'sufficient' && 'Fully Stocked'}
                  {inventoryStatus.status === 'needs_restock' && `${inventoryStatus.count} items low`}
                  {inventoryStatus.status === 'unknown' && 'Not checked'}
                </span>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {inventory.length} items tracked
              </div>

              {inventoryStatus.status === 'needs_restock' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createRestockTask(room.id);
                  }}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <ClipboardList className="h-4 w-4" />
                  Create Restock Task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRoom.name} - Room {selectedRoom.room_number}</h2>
                <p className="text-gray-600 dark:text-gray-400">Current inventory status</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {(roomInventory[selectedRoom.id] || []).map((item) => {
                const itemDetails = items.find(i => i.id === item.item_id);
                
                return (
                  <div key={item.id} className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{itemDetails?.name || 'Unknown Item'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last checked: {item.last_checked ? new Date(item.last_checked).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">{item.current_quantity}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{itemDetails?.unit || 'units'}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.status === 'sufficient' ? 'bg-green-100 text-green-800' :
                        item.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(selectedRoom.id, item.item_id)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              {(!roomInventory[selectedRoom.id] || roomInventory[selectedRoom.id].length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No inventory tracked for this room yet
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedRoomForInventory(selectedRoom);
                  setShowInventoryModal(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add/Update Item
              </button>
              <button
                onClick={() => handleBulkRestock(selectedRoom.id)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Restock to Standard
              </button>
              <button
                onClick={() => createRestockTask(selectedRoom.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Restock Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Update Inventory Modal */}
      {showInventoryModal && selectedRoomForInventory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add/Update Inventory Item</h2>
              <button onClick={() => {
                setShowInventoryModal(false);
                setInventoryFormData({ item_id: '', quantity: 0, action: 'set' });
              }} className="text-gray-500 dark:text-gray-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleInventorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Item *
                </label>
                <select
                  required
                  value={inventoryFormData.item_id}
                  onChange={(e) => setInventoryFormData({ ...inventoryFormData, item_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Action *
                </label>
                <select
                  required
                  value={inventoryFormData.action}
                  onChange={(e) => setInventoryFormData({ ...inventoryFormData, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="set">Set Quantity</option>
                  <option value="add">Add to Current</option>
                  <option value="subtract">Subtract from Current</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={inventoryFormData.quantity}
                  onChange={(e) => setInventoryFormData({ ...inventoryFormData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomInventoryPage;
