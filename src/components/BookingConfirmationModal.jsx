import React from 'react';
import { useNavigate } from 'react-router-dom';

const BookingConfirmationModal = ({ 
  isOpen, 
  onClose, 
  bookingDetails 
}) => {
  const navigate = useNavigate();

  if (!isOpen || !bookingDetails) return null;

  const handleCopyBookingId = () => {
    navigator.clipboard.writeText(`Booking ID: ${bookingDetails.bookingId}`);
    alert('Booking ID copied to clipboard!');
  };

  const handleBrowseMoreRooms = () => {
    onClose();
    navigate('/rooms');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600">Your reservation has been successfully processed</p>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Booking ID</span>
                <span className="text-sm font-bold text-blue-600">{bookingDetails.bookingId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Room</span>
                <span className="text-sm font-semibold text-gray-900">{bookingDetails.roomName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Guest Name</span>
                <span className="text-sm font-semibold text-gray-900">{bookingDetails.guestName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Contact</span>
                <span className="text-sm font-semibold text-gray-900">{bookingDetails.guestContact}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Check-in</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(bookingDetails.checkIn).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Check-out</span>
                <span className="text-sm font-semibold text-gray-900">
                  {new Date(bookingDetails.checkOut).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Guests</span>
                <span className="text-sm font-semibold text-gray-900">{bookingDetails.guests}</span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <span className="text-lg font-bold text-green-600">${bookingDetails.totalPrice}</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• You will receive a confirmation email shortly</li>
                <li>• Please arrive after 3:00 PM on your check-in date</li>
                <li>• Bring a valid photo ID for verification</li>
                <li>• Contact us for any special requests or changes</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleCopyBookingId}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Copy Booking ID
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
              
              <button
                onClick={handleBrowseMoreRooms}
                className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Browse More Rooms
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationModal;