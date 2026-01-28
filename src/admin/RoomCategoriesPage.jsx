import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Bed, Users, Star, Bath, Filter, Plus, Trash2, X, Settings } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAlertDialog } from '../context/AlertDialogContext';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import Pagination from '../components/Pagination';

const RoomCategoriesPage = () => {
  const { showError, showSuccess } = useToast();
  const { showConfirm } = useAlertDialog();
  
  const [roomTypes, setRoomTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [newRoomType, setNewRoomType] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const loadRoomTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.ROOM_TYPES);
      setRoomTypes(res.data || []);
    } catch (e) {
      console.error('Failed to load room types', e);
      showError(e?.response?.data?.error || 'Failed to load room types');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.ROOM_CATEGORIES);
      setCategories(res.data || []);
    } catch (e) {
      console.error('Failed to load room categories', e);
      showError(e?.response?.data?.error || 'Failed to load room categories');
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      // Fetch all rooms without pagination for filtering
      const res = await axios.get(`${API_ENDPOINTS.ROOMS}?limit=1000`);
      setRooms(res.data.data || res.data || []);
    } catch (e) {
      console.error('Failed to load rooms', e);
      showError(e?.response?.data?.error || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoomType = async () => {
    if (!newRoomType.trim()) {
      showError('Room type name is required');
      return;
    }
    
    try {
      await axios.post(API_ENDPOINTS.ROOM_TYPES, {
        type_name: newRoomType.trim()
      });
      setNewRoomType('');
      await loadRoomTypes();
      showSuccess('Room type added successfully!');
    } catch (e) {
      console.error('Failed to add room type', e);
      showError(e?.response?.data?.error || 'Failed to add room type');
    }
  };

  const handleDeleteRoomType = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this room type?', 'Delete Room Type');
    
    if (!confirmed) {
      return;
    }
    
    try {
      await axios.delete(`${API_ENDPOINTS.ROOM_TYPES}/${id}`);
      await loadRoomTypes();
      showSuccess('Room type deleted successfully!');
    } catch (e) {
      console.error('Failed to delete room type', e);
      showError(e?.response?.data?.error || 'Failed to delete room type');
    }
  };

  const handleRoomTypeClick = async (roomType) => {
    setSelectedRoomType(roomType);
    setSelectedCategoryFilter('all');
    setCurrentPage(1);
    
    // If rooms not loaded yet, load them
    if (rooms.length === 0) {
      await loadRooms();
    }
    
    // Filter rooms by room type
    const filtered = rooms.filter(room => 
      room.type_name === roomType.type_name || 
      room.room_type_id === roomType.id
    );
    setFilteredRooms(filtered);
  };

  const handleBackToRoomTypes = () => {
    setSelectedRoomType(null);
    setFilteredRooms([]);
    setSelectedCategoryFilter('all');
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (categoryName) => {
    setSelectedCategoryFilter(categoryName);
    setCurrentPage(1);
  };

  const getRoomCountForType = (typeName) => {
    return rooms.filter(room => 
      room.type_name === typeName || 
      room.room_type_id === typeName
    ).length;
  };

  // Apply category filter on top of room type filter
  const displayedRooms = selectedCategoryFilter === 'all' 
    ? filteredRooms 
    : filteredRooms.filter(room => room.category === selectedCategoryFilter);

  const totalItems = displayedRooms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRooms = displayedRooms.slice(startIndex, endIndex);

  useEffect(() => {
    loadRoomTypes();
    loadCategories();
    loadRooms();
  }, []);

  // If no room type is selected, show room types grid
  if (!selectedRoomType) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 border border-slate-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Room Types</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Browse rooms by type</p>
            </div>
            <button
              onClick={() => setShowRoomTypeModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Manage room types"
            >
              <Settings className="w-5 h-5 mr-2" />
              Manage Room Types
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 mb-6 text-gray-500 dark:text-gray-400 text-center">
            <div className="animate-pulse">Loading room types...</div>
          </div>
        )}

        {/* Room Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {roomTypes.map((roomType) => {
            const roomCount = getRoomCountForType(roomType.type_name);
            return (
              <div
                key={roomType.id}
                onClick={() => handleRoomTypeClick(roomType)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Bed className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{roomCount}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {roomType.type_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {roomCount} {roomCount === 1 ? 'room' : 'rooms'} available
                </p>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {!loading && roomTypes.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-8 text-center">
            <Bed className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Room Types Found</h3>
            <p className="text-gray-500 dark:text-gray-400">Room types will appear here once they are created.</p>
          </div>
        )}

        {/* Room Type Management Modal */}
        {showRoomTypeModal && (
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" 
            role="dialog" 
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowRoomTypeModal(false);
                setNewRoomType('');
              }
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Room Types</h2>
                <button
                  onClick={() => {
                    setShowRoomTypeModal(false);
                    setNewRoomType('');
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Add New Room Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add New Room Type</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRoomType}
                      onChange={(e) => setNewRoomType(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddRoomType();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter room type name"
                    />
                    <button
                      onClick={handleAddRoomType}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Existing Room Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing Room Types</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {roomTypes.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No room types yet. Add one above to get started.
                      </div>
                    ) : (
                      roomTypes.map(roomType => (
                        <div key={roomType.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-900 dark:text-white">{roomType.type_name}</span>
                          <button
                            onClick={() => handleDeleteRoomType(roomType.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                            title="Delete room type"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => {
                    setShowRoomTypeModal(false);
                    setNewRoomType('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show rooms table for selected room type
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Back Button */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 border border-slate-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackToRoomTypes}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Back to room types"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              {selectedRoomType.type_name} Rooms
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {displayedRooms.length} {displayedRooms.length === 1 ? 'room' : 'rooms'} 
              {selectedCategoryFilter !== 'all' && ` in ${selectedCategoryFilter} category`}
            </p>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilterChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryFilterChange(category.category_name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategoryFilter === category.category_name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.category_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 mb-6 text-gray-500 dark:text-gray-400 text-center">
          <div className="animate-pulse">Loading rooms...</div>
        </div>
      )}

      {/* Rooms Table */}
      {!loading && displayedRooms.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 overflow-hidden">
            {/* Table Layout (sm and above) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Room Details</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Rating</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Amenities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {paginatedRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {room.images[0] && (
                            <img
                              src={room.images[0]}
                              alt={`${room.type_name} preview`}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                          )}
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                              {room.room_number ? `#${room.room_number}` : room.type_name}
                            </h3>
                            {room.room_number && (
                              <div className="text-xs text-gray-900 dark:text-white font-bold">{room.type_name}</div>
                            )}
                            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                {room.beds} beds
                              </span>
                              <span className="flex items-center gap-1">
                                {room.bathrooms} baths
                              </span>
                              <span>{room.size}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{room.rating}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{room.guests} guests</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">₱{Number(room.price || 0).toLocaleString()}</span>
                        {room.original_price && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 line-through">{room.original_price}</div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {room.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-300">
                              {amenity}
                            </span>
                          ))}
                          {room.amenities.length > 3 && (
                            <span className="inline-flex px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-300">
                              +{room.amenities.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card Layout (below sm) */}
            <div className="sm:hidden grid gap-4 p-4">
              {paginatedRooms.map((room) => (
                <div 
                  key={room.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      {room.images[0] && (
                        <img
                          src={room.images[0]}
                          alt={`${room.type_name} preview`}
                          className="w-16 h-16 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{room.type_name}</h3>
                        {room.room_number && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">Room #{room.room_number}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        {room.beds} beds
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {room.bathrooms} baths
                      </span>
                      <span>{room.size}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{room.rating}</span>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">{room.guests} guests</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">₱{Number(room.price || 0).toLocaleString()}</span>
                      {room.original_price && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 line-through">{room.original_price}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-300">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="inline-flex px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-300">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {displayedRooms.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={() => {}} // Fixed items per page for this view
            />
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && displayedRooms.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-8 text-center">
          <Bed className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Rooms Found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedCategoryFilter === 'all' 
              ? `There are no rooms of type ${selectedRoomType.type_name} yet.`
              : `There are no ${selectedRoomType.type_name} rooms in the ${selectedCategoryFilter} category.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomCategoriesPage;
