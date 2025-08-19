import React from 'react';
import { Wifi, Car, Coffee, Waves, Users, Star } from 'lucide-react';
import data from '../data.json'
import { Link, useNavigate } from 'react-router-dom'

const RoomSection = () => {
  const navigate = useNavigate()
  const rooms = data.rooms
  
  const getAmenityIcon = (amenity) => {
    if (amenity.includes('WiFi')) return <Wifi className="w-4 h-4" />;
    if (amenity.includes('Service')) return <Coffee className="w-4 h-4" />;
    if (amenity.includes('View') || amenity.includes('Ocean')) return <Waves className="w-4 h-4" />;
    if (amenity.includes('Parking')) return <Car className="w-4 h-4" />;
    return <Coffee className="w-4 h-4" />;
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 ">
            Our Luxury Rooms
          </h2>
          <p className="text-l text-gray-500 max-w-3xl mx-auto">
            Experience unparalleled comfort and elegance in our carefully designed accommodations
          </p>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <div key={room.id} onClick={() => navigate(`/rooms/${room.id}`)} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group">
              
              {/* Room Image */}
              <div className="relative overflow-hidden">
                <img 
                  src={room.image} 
                  alt={room.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-800">{room.rating}</span>
                  </div>
                </div>
                <div className="absolute top-4 left-4 bg-blue-600 text-white rounded-full px-3 py-1">
                  <span className="text-sm font-semibold">Best Deal</span>
                </div>
              </div>

              {/* Room Details */}
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

                {/* Amenities */}
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

                {/* Pricing */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{room.price}</span>
                    <span className="text-sm text-gray-500 line-through ml-2">{room.originalPrice}</span>
                    <p className="text-xs text-gray-500">per night</p>
                  </div>
                </div>

                {/* Book Button */}
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Rooms Button */}
        <div className="text-center mt-12">
          <Link to='/rooms' className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105">
            View All Rooms
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RoomSection;