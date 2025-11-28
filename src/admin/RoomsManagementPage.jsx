import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Star, Users, Bed, Bath, X } from 'lucide-react';
import AmenityIcon from '../components/AmenityIcon';
import { useAlertDialog } from '../context/AlertDialogContext';
import { useToast } from '../context/ToastContext';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import Pagination from '../components/Pagination';

const RoomsManagementPage = () => {
  const MAX_IMAGES = 5;
  
  const { showConfirm } = useAlertDialog();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomCategories, setRoomCategories] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newRoomType, setNewRoomType] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_type_id: '',
    category: 'Standard',
    description: '',
    rating: 5,
    status: 'available',
    beds: 1,
    bathrooms: 1,
    price: 0,
    original_price: '',
    guests: 1,
    size: '',
    amenities: [],
    images: []
  });

  const statusOptions = ['available', 'booked', 'maintenance', 'unavailable'];

  const handleAddRoom = async () => {
    try {
      console.log('Submitting room data:', newRoom);
      
      if (editingRoom) {
        await axios.patch(`${API_ENDPOINTS.ROOMS}/${editingRoom.id}`, {
          room_number: newRoom.room_number,
          room_type_id: newRoom.room_type_id,
          category: newRoom.category,
          description: newRoom.description,
          rating: newRoom.rating,
          status: newRoom.status,
          beds: newRoom.beds,
          bathrooms: newRoom.bathrooms,
          price: newRoom.price,
          original_price: newRoom.original_price,
          guests: newRoom.guests,
          size: newRoom.size,
          amenities: newRoom.amenities
        });
        await loadRooms();
        showSuccess('Room updated successfully!');
        setEditingRoom(null);
      } else {
        const formData = new FormData();
        formData.append('room_number', newRoom.room_number);
        formData.append('room_type_id', newRoom.room_type_id);
        formData.append('category', newRoom.category);
        formData.append('description', newRoom.description);
        formData.append('rating', newRoom.rating);
        formData.append('status', newRoom.status);
        formData.append('beds', newRoom.beds);
        formData.append('bathrooms', newRoom.bathrooms);
        formData.append('price', newRoom.price);
        formData.append('original_price', newRoom.original_price);
        formData.append('guests', newRoom.guests);
        formData.append('size', newRoom.size);
        newRoom.amenities.forEach(amenity => {
          formData.append('amenities', amenity);
        });
        newRoom.images.forEach((imageData, index) => {
          const byteString = atob(imageData.split(',')[1]);
          const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const file = new File([blob], `image${index}.jpg`, { type: mimeString });
          formData.append('images', file);
        });
        
        const res = await axios.post(API_ENDPOINTS.ROOMS, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        const createdId = res?.data?.id;
        if (createdId) {
          setRooms([{ ...newRoom, id: createdId }, ...rooms]);
        } else {
          await loadRooms();
        }
        
        showSuccess('Room created successfully!');
      }
      setNewRoom({
        room_number: '',
        room_type_id: '',
        category: 'Standard',
        description: '',
        rating: 5,
        status: 'available',
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
      console.error('Add room error:', e);
      console.error('Error response:', e.response);
      console.error('Error data:', e.response?.data);
      showError(e?.response?.data?.error || 'Failed to save room');
    }
  };

  const handleEditRoom = (room) => {
    setNewRoom(room);
    setEditingRoom(room);
    setShowAddModal(true);
  };

  const handleDeleteRoom = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this room? This will permanently remove the room and all its images.', 'Delete Room');
    
    if (!confirmed) {
      return;
    }
    
    try {
      console.log('Deleting room with ID:', id);
      const response = await axios.delete(`${API_ENDPOINTS.ROOMS}/${id}`);
      
      if (response.data.success) {
        setRooms(rooms.filter(room => room.id !== id));
        showSuccess('Room deleted successfully!');
        console.log(`Room deleted successfully. Removed ${response.data.deletedFiles} image files.`);
      } else {
        showError('Failed to delete room');
      }
    } catch (error) {
      console.error('Delete room error:', error);
      console.error('Error response:', error.response);
      showError(error?.response?.data?.error || 'Failed to delete room');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const MAX_FILE_MB = 2;
    const filtered = files.filter(f => (f.size || 0) <= MAX_FILE_MB * 1024 * 1024);
    const rejectedCount = files.length - filtered.length;
    if (rejectedCount > 0) {
      showWarning(`Some images were skipped (>${MAX_FILE_MB}MB).`);
    }

    const imagePromises = filtered.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let { width, height } = img;
            
            if (width > height) {
              if (width > MAX_SIZE) {
                height = (height * MAX_SIZE) / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = (width * MAX_SIZE) / height;
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(compressedDataUrl);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(images => {
      setNewRoom(prev => {
        const remaining = Math.max(0, MAX_IMAGES - prev.images.length);
        const toAdd = images.slice(0, remaining);
        const next = [...prev.images, ...toAdd];
        return { ...prev, images: next.slice(0, MAX_IMAGES) };
      });
    }).catch(error => {
      console.error('Error processing images:', error);
      showError('Failed to process some images. Please try again.');
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
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_ENDPOINTS.ROOMS}?page=${currentPage}&limit=${itemsPerPage}`);
      setRooms(res.data.data || res.data || []);
      setTotalItems(res.data.totalItems || (res.data.data || res.data || []).length);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      console.error('Failed to load rooms', e);
      showError(e?.response?.data?.error || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const loadAmenities = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.AMENITIES);
      setAmenities(res.data || []);
    } catch (e) {
      console.error('Failed to load amenities', e);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.ROOM_TYPES);
      setRoomTypes(res.data || []);
    } catch (e) {
      console.error('Failed to load room types', e);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await axios.get(buildApiUrl('api/room-categories'));
      setRoomCategories(res.data || []);
    } catch (e) {
      console.error('Failed to load room categories', e);
    }
  };

  const loadItemCategories = async () => {
    try {
      const res = await axios.get(buildApiUrl('api/inventory/categories'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userEmail') || ''}`
        }
      });
      setItemCategories(res.data || []);
    } catch (e) {
      console.error('Failed to load item categories', e);
    }
  };

  const handleSyncCategoriesToAmenities = async () => {
    const confirmed = await showConfirm('This will add all inventory item categories as amenities. Continue?', 'Sync Categories');
    
    if (!confirmed) {
      return;
    }
    
    try {
      const res = await axios.post(buildApiUrl('api/inventory/categories/sync-to-amenities'), {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userEmail') || ''}`
        }
      });
      
      if (res.data.success) {
        showSuccess(res.data.message);
        await loadAmenities();
      }
    } catch (e) {
      console.error('Failed to sync categories', e);
      showError(e?.response?.data?.error || 'Failed to sync categories to amenities');
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
      setShowRoomTypeModal(false);
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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      showError('Room category name is required');
      return;
    }
    
    try {
      await axios.post(buildApiUrl('api/room-categories'), {
        category_name: newCategory.trim()
      });
      setNewCategory('');
      setShowCategoryModal(false);
      await loadCategories();
      showSuccess('Room category added successfully!');
    } catch (e) {
      console.error('Failed to add room category', e);
      showError(e?.response?.data?.error || 'Failed to add room category');
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this room category?', 'Delete Room Category');
    
    if (!confirmed) {
      return;
    }
    
    try {
      await axios.delete(buildApiUrl(`api/room-categories/${id}`));
      await loadCategories();
      showSuccess('Room category deleted successfully!');
    } catch (e) {
      console.error('Failed to delete room category', e);
      showError(e?.response?.data?.error || 'Failed to delete room category');
    }
  };

  const handleAddAmenity = async () => {
    if (!newAmenity.trim()) {
      showError('Amenity name is required');
      return;
    }
    
    try {
      await axios.post(API_ENDPOINTS.AMENITIES, {
        name: newAmenity.trim()
      });
      setNewAmenity('');
      setShowAmenityModal(false);
      await loadAmenities();
      showSuccess('Amenity added successfully!');
    } catch (e) {
      console.error('Failed to add amenity', e);
      showError(e?.response?.data?.error || 'Failed to add amenity');
    }
  };

  const handleDeleteAmenity = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this amenity?', 'Delete Amenity');
    
    if (!confirmed) {
      return;
    }
    
    try {
      await axios.delete(`${API_ENDPOINTS.AMENITIES}/${id}`);
      await loadAmenities();
      showSuccess('Amenity deleted successfully!');
    } catch (e) {
      console.error('Failed to delete amenity', e);
      showError(e?.response?.data?.error || 'Failed to delete amenity');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadRooms();
    loadAmenities();
    loadRoomTypes();
    loadCategories();
    loadItemCategories();
  }, [currentPage, itemsPerPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Room Management</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your hotel rooms</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Add new room"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Room
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 text-gray-500 text-center">
          <div className="animate-pulse">Loading rooms...</div>
        </div>
      )}

      {/* Rooms Display: Table for sm and above, Cards for xs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Table Layout (sm and above) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room Details</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Capacity</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amenities</th>
                <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map((room) => (
                <tr 
                  key={room.id} 
                  onClick={() => handleEditRoom(room)}
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {room.images[0] && (
                        <img
                          src={room.images[0]}
                          alt={`${room.name} preview`}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{room.room_number ? `#${room.room_number}` : room.type_name}</h3>
                        {room.room_number && (
                          <div className="text-xs text-gray-900 font-bold">{room.type_name}</div>
                        )}
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-500">
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
                    <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {room.category}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{room.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{room.guests} guests</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-sm font-medium text-gray-900">₱{Number(room.price || 0).toLocaleString()}</span>
                    {room.original_price && (
                      <div className="text-xs text-gray-400 line-through">{room.original_price}</div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="inline-flex px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRoom(room);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        title="Edit room"
                        aria-label={`Edit ${room.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room.id);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                        title="Delete room"
                        aria-label={`Delete ${room.name}`}
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

        {/* Card Layout (below sm) */}
        <div className="sm:hidden grid gap-4 p-4">
          {rooms.map((room) => (
            <div 
              key={room.id} 
              onClick={() => handleEditRoom(room)}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  {room.images[0] && (
                    <img
                      src={room.images[0]}
                      alt={`${room.name} preview`}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{room.type_name}</h3>
                    <span className="inline-flex px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium mt-1">
                      {room.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {room.room_number && (
                    <span className="font-bold text-gray-900">Room #{room.room_number}</span>
                  )}
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
                    <span className="text-sm font-medium">{room.rating}</span>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                    {room.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{room.guests} guests</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">₱{Number(room.price || 0).toLocaleString()}</span>
                  {room.original_price && (
                    <div className="text-xs text-gray-400 line-through">{room.original_price}</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {room.amenities.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                      <AmenityIcon name={amenity} className="w-3 h-3" />
                      {amenity}
                    </span>
                  ))}
                  {room.amenities.length > 3 && (
                    <span className="inline-flex px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-600">
                      +{room.amenities.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditRoom(room);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    title="Edit room"
                    aria-label={`Edit ${room.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoom(room.id);
                    }}
                    className="text-red-600 hover:text-red-800 p-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                    title="Delete room"
                    aria-label={`Delete ${room.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {rooms.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Add/Edit Room Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" 
          role="dialog" 
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setEditingRoom(null);
              setNewRoom({
                room_number: '',
                room_type_id: '',
                category: 'Standard',
                description: '',
                rating: 5,
                status: 'available',
                beds: 1,
                bathrooms: 1,
                price: 0,
                original_price: '',
                guests: 1,
                size: '',
                amenities: [],
                images: []
              });
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoom(null);
                  setNewRoom({
                    room_number: '',
                    room_type_id: '',
                    category: 'Standard',
                    description: '',
                    rating: 5,
                    status: 'available',
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
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6">
              {/* Basic Information */}
              <section aria-labelledby="basic-info-heading">
                <h3 id="basic-info-heading" className="text-base sm:text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="room-number" className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input
                      id="room-number"
                      type="text"
                      value={newRoom.room_number}
                      onChange={(e) => setNewRoom({...newRoom, room_number: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 201-A"
                    />
                  </div>
                  <div>
                    <label htmlFor="room-type" className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                    <div className="flex gap-2">
                      <select
                        id="room-type"
                        value={newRoom.room_type_id}
                        onChange={(e) => setNewRoom({...newRoom, room_type_id: e.target.value})}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        aria-required="true"
                      >
                        <option value="">Select Room Type</option>
                        {roomTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.type_name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowRoomTypeModal(true)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Add new room type"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <div className="flex gap-2">
                        <select
                          id="category"
                          value={newRoom.category}
                          onChange={(e) => setNewRoom({...newRoom, category: e.target.value})}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Category</option>
                          {roomCategories.map(category => (
                            <option key={category.id} value={category.category_name}>{category.category_name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Add new room category"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        id="status"
                        value={newRoom.status}
                        onChange={(e) => setNewRoom({...newRoom, status: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={newRoom.rating || ''}
                      onChange={(e) => setNewRoom({...newRoom, rating: parseFloat(e.target.value) || 5})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-describedby="rating-help"
                    />
                    <p id="rating-help" className="text-xs text-gray-500 mt-1">Enter a value between 1 and 5</p>
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      id="description"
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter room description"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>
              </section>

              {/* Room Specifications */}
              <section aria-labelledby="specifications-heading">
                <h3 id="specifications-heading" className="text-base sm:text-lg font-medium text-gray-900 mb-3">Room Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="beds" className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
                    <input
                      id="beds"
                      type="number"
                      min="1"
                      value={newRoom.beds || ''}
                      onChange={(e) => setNewRoom({...newRoom, beds: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">Number of Bathrooms</label>
                    <input
                      id="bathrooms"
                      type="number"
                      min="1"
                      value={newRoom.bathrooms || ''}
                      onChange={(e) => setNewRoom({...newRoom, bathrooms: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                    <input
                      id="guests"
                      type="number"
                      min="1"
                      value={newRoom.guests || ''}
                      onChange={(e) => setNewRoom({...newRoom, guests: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Room Size</label>
                    <input
                      id="size"
                      type="text"
                      value={newRoom.size}
                      onChange={(e) => setNewRoom({...newRoom, size: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 45 sqm"
                    />
                  </div>
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label>
                    <input
                      id="price"
                      type="number"
                      min="0"
                      value={newRoom.price || ''}
                      onChange={(e) => setNewRoom({...newRoom, price: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="original-price" className="block text-sm font-medium text-gray-700 mb-1">Original Price (₱)</label>
                    <input
                      id="original-price"
                      type="text"
                      value={newRoom.original_price}
                      onChange={(e) => setNewRoom({...newRoom, original_price: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., ₱150"
                    />
                  </div>
                </div>
              </section>

              {/* Amenities */}
              <section aria-labelledby="amenities-heading">
                <div className="flex items-center justify-between mb-3">
                  <h3 id="amenities-heading" className="text-base sm:text-lg font-medium text-gray-900">Amenities</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSyncCategoriesToAmenities}
                      className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      title="Sync inventory categories to amenities"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Sync Categories
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAmenityModal(true)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      title="Manage amenities"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Manage
                    </button>
                  </div>
                </div>
                
                {/* Show item categories as a separate section */}
                {itemCategories.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-2">Inventory Categories (auto-detected):</p>
                    <div className="flex flex-wrap gap-2">
                      {itemCategories.map((category, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                          {category}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Click "Sync Categories" to add these as amenity options
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map(amenity => (
                    <label key={amenity.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoom.amenities.includes(amenity.name)}
                        onChange={() => toggleAmenity(amenity.name)}
                        className="w-4 h-4 text-blue-600 border-gray-200 rounded focus:ring-blue-500"
                        aria-label={`Toggle ${amenity.name} amenity`}
                      />
                      <div className="flex items-center gap-1.5">
                        <AmenityIcon name={amenity.name} className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{amenity.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* Image Upload */}
              <section aria-labelledby="images-heading">
                <h3 id="images-heading" className="text-base sm:text-lg font-medium text-gray-900 mb-3">Room Images</h3>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">Add up to 5 images. First image will be the cover.</p>
                  <span className="text-sm font-medium text-gray-700">{newRoom.images.length}/{MAX_IMAGES}</span>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={newRoom.images.length >= MAX_IMAGES}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Upload room images"
                  onError={(e) => {
                    console.error('File input error:', e);
                    showError('Error with file input. Please try again.');
                  }}
                />
                {newRoom.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {newRoom.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Room image ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-black/70 text-white">{index === 0 ? 'Cover' : `#${index + 1}`}</div>
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoom(null);
                  setNewRoom({
                    room_number: '',
                    room_type_id: '',
                    category: 'Standard',
                    description: '',
                    rating: 5,
                    status: 'available',
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
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Cancel room editing"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRoom}
                disabled={!newRoom.room_type_id || !newRoom.description}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={editingRoom ? 'Update room' : 'Add room'}
              >
                {editingRoom ? 'Update Room' : 'Add Room'}
              </button>
            </div>
          </div>
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
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Manage Room Types</h2>
              <button
                onClick={() => {
                  setShowRoomTypeModal(false);
                  setNewRoomType('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Add New Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Room Type</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter room type name"
                  />
                  <button
                    onClick={handleAddRoomType}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Room Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Existing Room Types</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {roomTypes.map(type => (
                    <div key={type.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-900">{type.type_name}</span>
                      <button
                        onClick={() => handleDeleteRoomType(type.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete room type"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" 
          role="dialog" 
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategoryModal(false);
              setNewCategory('');
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Manage Room Categories</h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Add New Room Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Room Category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter category name"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Room Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Existing Room Categories</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {roomCategories.map(category => (
                    <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-900">{category.category_name}</span>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete room category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amenity Management Modal */}
      {showAmenityModal && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50" 
          role="dialog" 
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAmenityModal(false);
              setNewAmenity('');
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Manage Amenities</h2>
              <button
                onClick={() => {
                  setShowAmenityModal(false);
                  setNewAmenity('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Add New Amenity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Amenity</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amenity name"
                  />
                  <button
                    onClick={handleAddAmenity}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Existing Amenities</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {amenities.map(amenity => (
                    <div key={amenity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AmenityIcon name={amenity.name} className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-900">{amenity.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAmenity(amenity.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete amenity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowAmenityModal(false);
                  setNewAmenity('');
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
};

export default RoomsManagementPage;
