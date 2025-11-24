import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import RoomCard from './RoomCard';
import { API_ENDPOINTS } from '../config/api';

const RoomSection = () => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await axios.get(API_ENDPOINTS.ROOMS)
        setRooms(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        setError('Failed to load rooms')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  
  const handleRoomClick = (roomId) => {
    navigate(`/rooms/${roomId}`)
  }

  return (
    <section className="py-20 bg-blue-50">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center text-gray-600">Loading rooms…</div>
          ) : error ? (
            <div className="col-span-3 text-center text-red-600">{error}</div>
          ) : rooms.slice(0, 6).map((room) => (
            <RoomCard 
              key={room.id} 
              room={room} 
              onClick={() => handleRoomClick(room.id)}
            />
          ))}
        </div>

        {/* View All Rooms Button */}
        <div className="text-center mt-12">
          <Link to='/rooms' className="bg-white border-1 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105">
            View All Rooms
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RoomSection;
