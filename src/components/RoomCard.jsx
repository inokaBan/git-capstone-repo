import React, { useState } from 'react';
import { Wifi, Car, Coffee, Waves, Users, Star } from 'lucide-react';
import AmenityIcon from '../context/AmenityIcon';

const RoomCard = ({ room, onClick }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const MAX_DESCRIPTION_LENGTH = 100;

  const truncateDescription = (text) => {
    if (!text) return '';
    if (text.length <= MAX_DESCRIPTION_LENGTH) return text;
    return text.substring(0, MAX_DESCRIPTION_LENGTH) + '...';
  };

  const handleDescriptionClick = (e) => {
    e.stopPropagation();
    setShowFullDescription(!showFullDescription);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500 text-white';
      case 'booked': return 'bg-red-500 text-white';
      case 'maintenance': return 'bg-yellow-500 text-white';
      case 'cleaning': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'maintenance': return 'Maintenance';
      case 'cleaning': return 'Cleaning';
      default: return 'Unknown';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group cursor-pointer"
    >
      <div className="relative overflow-hidden">
        <img 
          src={(room.images && room.images[0]) || 'https://via.placeholder.com/600x400?text=Room'} 
          alt={room.name}
          className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-semibold text-gray-800">{room.rating}</span>
          </div>
        </div>
        <div className="absolute top-4 left-4 bg-blue-600 text-white rounded-full px-3 py-1">
          <span className="text-sm font-semibold">{room.category}</span>
        </div>
        <div className={`absolute top-16 left-4 ${getStatusColor(room.status)} rounded-full px-3 py-1`}>
          <span className="text-sm font-semibold">{getStatusText(room.status)}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{room.room_number ? `#${room.room_number}` : room.name}</h3>
            {room.type_name && (
              <p className="text-sm text-gray-600 font-medium mt-1">{room.type_name}</p>
            )}
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-sm">{room.guests}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {showFullDescription ? room.description : truncateDescription(room.description)}
          </p>
          {room.description && room.description.length > MAX_DESCRIPTION_LENGTH && (
            <button
              onClick={handleDescriptionClick}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 transition-colors"
            >
              {showFullDescription ? 'See less' : 'See more'}
            </button>
          )}
        </div>

        <div className="mb-6">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 block">Amenities</span>
          <div className="grid grid-cols-2 gap-2">
            {room.amenities.slice(0, 4).map((amenity, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="text-blue-600">
                  {<AmenityIcon name={amenity} />}
                </div>
                <span className="text-xs text-gray-600">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">₱{Number(room.price).toLocaleString()}</span>
            {/* originalPrice omitted */}
            <p className="text-xs text-gray-500">per night</p>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-102">
          View Details
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
