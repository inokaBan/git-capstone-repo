import React from 'react';
import { Wifi, Car, Coffee, Waves, Users, Star } from 'lucide-react';

const RoomCard = ({ room, onClick }) => {
  const getAmenityIcon = (amenity) => {
    if (amenity.includes('WiFi')) return <Wifi className="w-4 h-4" />;
    if (amenity.includes('Service') || amenity.includes('Butler') || amenity.includes('Chef')) return <Coffee className="w-4 h-4" />;
    if (amenity.includes('View') || amenity.includes('Ocean') || amenity.includes('Panoramic')) return <Waves className="w-4 h-4" />;
    if (amenity.includes('Parking')) return <Car className="w-4 h-4" />;
    return <Coffee className="w-4 h-4" />;
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group cursor-pointer"
    >
      <div className="relative overflow-hidden">
        <img 
          src={room.image} 
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
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
          <div className="flex items-center space-x-1 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-sm">{room.guests}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {room.description}
        </p>

        <div className="mb-4">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Room Size</span>
          <p className="text-sm text-gray-700">{room.size}</p>
        </div>

        <div className="mb-6">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2 block">Amenities</span>
          <div className="grid grid-cols-2 gap-2">
            {room.amenities.slice(0, 4).map((amenity, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="text-blue-600">
                  {getAmenityIcon(amenity)}
                </div>
                <span className="text-xs text-gray-600">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">{room.price}</span>
            <span className="text-sm text-gray-500 line-through ml-2">{room.originalPrice}</span>
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
