import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Eye, Star, Users, Bed, Home, Wifi, Car, Coffee, Waves, Dumbbell, Wind, Bath } from 'lucide-react';

const RoomsManagementPage = () => {
  const MAX_IMAGES = 5;
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [amenities, setAmenities] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({
    name: '',
    category: 'Standard',
    description: '',
    long_description: '',
    rating: 5,
    status: 'Available',
    beds: 1,
    bathrooms: 1,
    price: 0,
    original_price: '',
    guests: 1,
    size: '',
    amenities: [],
    images: []
  });

  const statusOptions = ['Available', 'Occupied', 'Maintenance', 'Cleaning'];
  const categoryOptions = ['Standard', 'Deluxe', 'Suite', 'Presidential'];

  const handleAddRoom = async () => {
    try {
      setError('');
      if (editingRoom) {
        // Optional: implement update endpoint later
        setRooms(rooms.map(room => 
          room.id === editingRoom.id ? { ...newRoom, id: editingRoom.id } : room
        ));
        setEditingRoom(null);
      } else {
        const res = await axios.post('http://localhost:8081/api/rooms', newRoom);
        const createdId = res?.data?.id;
        if (createdId) {
          // Merge the newly created id with the room draft to avoid rendering issues
          setRooms([{ ...newRoom, id: createdId }, ...rooms]);
        } else {
          // Fallback: reload rooms from server
          await loadRooms();
        }
      }
      setNewRoom({
        name: '',
        category: 'Standard',
        description: '',
        long_description: '',
        rating: 5,
        status: 'Available',
        beds: 1,
        bathrooms: 1,
        price: 0,
        original_price: '',
        guests: 1,
        size: '',
        amenities: [],
        images: []
      });
      setShowAddModal(false);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save room');
    }
  };

  const handleEditRoom = (room) => {
    setNewRoom(room);
    setEditingRoom(room);
    setShowAddModal(true);
  };

  const handleDeleteRoom = async (id) => {
    if (confirm('Are you sure you want to delete this room? This will permanently remove the room and all its images.')) {
      try {
        setError('');
        console.log('Deleting room with ID:', id);
        const response = await axios.delete(`http://localhost:8081/api/rooms/${id}`);
        
        if (response.data.success) {
          setRooms(rooms.filter(room => room.id !== id));
          console.log(`Room deleted successfully. Removed ${response.data.deletedFiles} image files.`);
        } else {
          setError('Failed to delete room');
        }
      } catch (error) {
        console.error('Delete room error:', error);
        console.error('Error response:', error.response);
        setError(error?.response?.data?.error || 'Failed to delete room');
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // Filter out very large files (> 3 MB) to avoid 413 Payload Too Large
    const MAX_FILE_MB = 3;
    const filtered = files.filter(f => (f.size || 0) <= MAX_FILE_MB * 1024 * 1024);
    const rejectedCount = files.length - filtered.length;
    if (rejectedCount > 0) {
      setError(`Some images were skipped (>${MAX_FILE_MB}MB).`);
    }
    const imagePromises = filtered.map(file => compressImageFile(file));

    Promise.all(imagePromises).then(images => {
      setNewRoom(prev => {
        const remaining = Math.max(0, MAX_IMAGES - prev.images.length);
        const toAdd = images.slice(0, remaining);
        const next = [...prev.images, ...toAdd];
        return { ...prev, images: next.slice(0, MAX_IMAGES) };
      });
    });
  };

  const compressImageFile = (file) => {
    const MAX_DIMENSION = 1280; // px
    const JPEG_QUALITY = 0.7;  // 0-1

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Prefer JPEG to get better compression
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          resolve(dataUrl);
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setNewRoom(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenity) => {
    setNewRoom(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Occupied': return 'bg-red-100 text-red-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Cleaning': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'WiFi': return <Wifi className="w-4 h-4" />;
      case 'Air Conditioning': return <Wind className="w-4 h-4" />;
      case 'Parking': return <Car className="w-4 h-4" />;
      case 'Gym Access': return <Dumbbell className="w-4 h-4" />;
      case 'Pool Access': return <Waves className="w-4 h-4" />;
      case 'Room Service': return <Coffee className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:8081/api/rooms');
      setRooms(res.data || []);
    } catch (e) {
      console.error('Failed to load rooms', e);
      setError(e?.response?.data?.error || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const loadAmenities = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/amenities');
      setAmenities(res.data || []);
    } catch (e) {
      console.error('Failed to load amenities', e);
    }
  };

  useEffect(() => {
    loadRooms();
    loadAmenities();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
              <p className="text-gray-600 mt-2">Manage your hotel rooms and their details</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Room
            </button>
          </div>
        </div>

        {/* Rooms Table */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadRooms} className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Retry</button>
          </div>
        )}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">Loading rooms...</div>
        )}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Room Details</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Capacity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amenities</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{room.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {room.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{room.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{room.guests} guests</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">₱{Number(room.price || 0).toLocaleString()}</span>
                      {room.original_price && (
                        <div className="text-sm line-through text-gray-500">{room.original_price}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((amenity, index) => (
                          <span key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs">
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit room"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            console.log('Delete button clicked for room:', room);
                            handleDeleteRoom(room.id);
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Room Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRoom ? 'Edit Room' : 'Add New Room'}
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                    <input
                      type="text"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter room name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={newRoom.category}
                      onChange={(e) => setNewRoom({...newRoom, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categoryOptions.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newRoom.status}
                      onChange={(e) => setNewRoom({...newRoom, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={newRoom.rating}
                      onChange={(e) => setNewRoom({...newRoom, rating: parseFloat(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter room description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Long Description</label>
                  <textarea
                    value={newRoom.long_description}
                    onChange={(e) => setNewRoom({...newRoom, long_description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter detailed room description"
                  />
                </div>

                {/* Room Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Beds</label>
                    <input
                      type="number"
                      min="1"
                      value={newRoom.beds}
                      onChange={(e) => setNewRoom({...newRoom, beds: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Bathrooms</label>
                    <input
                      type="number"
                      min="1"
                      value={newRoom.bathrooms}
                      onChange={(e) => setNewRoom({...newRoom, bathrooms: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
                    <input
                      type="number"
                      min="1"
                      value={newRoom.guests}
                      onChange={(e) => setNewRoom({...newRoom, guests: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
                    <input
                      type="number"
                      min="0"
                      value={newRoom.price}
                      onChange={(e) => setNewRoom({...newRoom, price: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₱)</label>
                    <input
                      type="text"
                      value={newRoom.original_price}
                      onChange={(e) => setNewRoom({...newRoom, original_price: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., ₱150"
                    />
                  </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Size</label>
                    <input
                      type="text"
                      value={newRoom.size}
                      onChange={(e) => setNewRoom({...newRoom, size: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 45 sqm"
                  />
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {amenities.map(amenity => (
                      <label key={amenity.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newRoom.amenities.includes(amenity.name)}
                          onChange={() => toggleAmenity(amenity.name)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1">
                          {getAmenityIcon(amenity.name)}
                          <span className="text-sm">{amenity.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Room Images</label>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Add up to 5 images. First image will be the cover.</p>
                    <span className="text-sm font-medium text-gray-700">{newRoom.images.length}/{MAX_IMAGES}</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={newRoom.images.length >= MAX_IMAGES}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-60 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {newRoom.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {newRoom.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Room image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <div className="absolute top-1 left-1 text-[11px] px-1.5 py-0.5 rounded bg-black/60 text-white">{index === 0 ? 'Cover' : `#${index + 1}`}</div>
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoom(null);
                    setNewRoom({
                      name: '',
                      category: 'Standard',
                      description: '',
                      long_description: '',
                      rating: 5,
                      status: 'Available',
                      beds: 1,
                      bathrooms: 1,
                      price: 0,
                      original_price: '',
                      guests: 1,
                      size: '',
                      amenities: [],
                      images: []
                    });
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  disabled={!newRoom.name || !newRoom.description}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsManagementPage