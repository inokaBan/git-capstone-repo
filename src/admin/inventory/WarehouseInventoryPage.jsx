import React, { useState, useEffect } from 'react';
import { Plus, Minus, Package, Search, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WarehouseInventoryPage = () => {
  const { getAuthHeader, user } = useAuth();
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'remove'
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionData, setTransactionData] = useState({
    quantity: '',
    notes: '',
  });
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchWarehouseStock(),
      fetchItems(),
      fetchLogs(),
    ]);
    setLoading(false);
  };

  const fetchWarehouseStock = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/inventory/warehouse', {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      setWarehouseStock(data);
    } catch (error) {
      console.error('Error fetching warehouse stock:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/inventory/items', {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/inventory/logs?limit=50', {
        headers: getAuthHeader(),
      });
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    
    const quantity = parseInt(transactionData.quantity);
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      const response = await fetch('http://localhost:8081/api/inventory/warehouse/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          item_id: selectedItem.item_id,
          change_quantity: modalType === 'add' ? quantity : -quantity,
          reason: modalType === 'add' ? 'Manual restock - added to warehouse' : 'Manual removal from warehouse',
          notes: transactionData.notes,
        }),
      });

      if (response.ok) {
        await fetchData();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
    }
  };

  const handleOpenModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setTransactionData({ quantity: '', notes: '' });
  };

  const getItemDetails = (itemId) => {
    return items.find(item => item.id === itemId);
  };

  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  
  const filteredStock = warehouseStock.filter(stock => {
    const item = getItemDetails(stock.item_id);
    if (!item) return false;
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Stock</h1>
          <p className="text-gray-600">Manage central inventory storage</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <History className="h-5 w-5" />
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStock.map((stock) => {
          const item = getItemDetails(stock.item_id);
          if (!item) return null;
          
          const isLowStock = stock.quantity <= item.low_stock_threshold;

          return (
            <div key={stock.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stock.quantity}</span>
                  <span className="text-gray-600">{item.unit}</span>
                </div>
                {isLowStock && (
                  <div className="mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                    Low Stock (threshold: {item.low_stock_threshold})
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Location: {stock.location || 'Main Storage'}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal('add', stock)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
                <button
                  onClick={() => handleOpenModal('remove', stock)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={stock.quantity === 0}
                >
                  <Minus className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction History */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => {
                  const item = getItemDetails(log.item_id);
                  
                  return (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          log.change_quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {log.change_quantity > 0 ? '+' : ''}{log.change_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.new_stock_level}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.reason}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'add' ? 'Add Stock' : 'Remove Stock'}
            </h2>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold">{getItemDetails(selectedItem.item_id)?.name}</div>
              <div className="text-sm text-gray-600">Current: {selectedItem.quantity} {getItemDetails(selectedItem.item_id)?.unit}</div>
            </div>

            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to {modalType === 'add' ? 'Add' : 'Remove'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={modalType === 'remove' ? selectedItem.quantity : undefined}
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({ ...transactionData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={transactionData.notes}
                  onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
                  rows="3"
                  placeholder="e.g., Purchased from supplier, Used for event, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg ${
                    modalType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {modalType === 'add' ? 'Add Stock' : 'Remove Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseInventoryPage;
