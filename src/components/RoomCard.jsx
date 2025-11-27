import React, { useState } from 'react';
import { Wifi, Car, Coffee, Waves, Users, Star } from 'lucide-react';
import AmenityIcon from '../context/AmenityIcon';

const RoomCard = ({ room, onClick, className = '', roomTypeStatus }) => {
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

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer border border-gray-100 ${className}`}
    >
      <div className="relative w-full h-48 sm:h-56">
        <img 
          src={(room.images && room.images[0]) || 'https://via.placeholder.com/400x300'} 
          alt={room.name || room.type_name || 'Room'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full px-2 py-1">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-semibold text-gray-800">{room.rating || 'N/A'}</span>
          </div>
        </div>
        <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full px-2 py-1">
          <span className="text-xs font-semibold">{room.category || 'N/A'}</span>
        </div>
        {roomTypeStatus && (
          <div className={`absolute top-11 left-2 rounded-full px-2 py-1 text-xs font-semibold ${
            roomTypeStatus === 'Available' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {roomTypeStatus}
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-white bg-opacity-95 rounded-lg px-3 py-2 shadow-md">
          <p className="text-lg font-bold text-gray-900">
            ₱{Number(room.price).toLocaleString() || 'N/A'}
            <span className="text-xs text-gray-600 font-normal">/night</span>
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {room.type_name || room.name || 'Room'}
          </h3>
          <div className="flex items-center space-x-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{room.guests || 'N/A'}</span>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
            {showFullDescription ? room.description : truncateDescription(room.description)}
          </p>
          {room.description && room.description.length > MAX_DESCRIPTION_LENGTH && (
            <button
              onClick={handleDescriptionClick}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
            >
              {showFullDescription ? 'See less' : 'See more'}
            </button>
          )}
        </div>

        <div className="mb-4">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-1">
            Amenities
          </span>
          <div className="grid grid-cols-3 gap-1">
            {room.amenities.slice(0, 3).map((amenity, index) => (
              <div key={index} className="flex items-center space-x-1">
                <div className="text-blue-600 w-4 h-4">
                  <AmenityIcon name={amenity} />
                </div>
                <span className="text-xs text-gray-600 truncate">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{room.guests || 'N/A'} guests</span>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors min-w-[44px] min-h-[44px]"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
