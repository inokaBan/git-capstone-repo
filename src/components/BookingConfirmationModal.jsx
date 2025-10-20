import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertDialog } from '../context/AlertDialogContext';

const BookingConfirmationModal = ({ 
  isOpen, 
  onClose, 
  bookingDetails 
}) => {
  const navigate = useNavigate();
  const { showSuccess } = useAlertDialog();

  if (!isOpen || !bookingDetails) return null;

  const handleCopyBookingId = () => {
    navigator.clipboard.writeText(`Booking ID: ${bookingDetails.bookingId}`);
    showSuccess('Booking ID copied to clipboard!');
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Submitted Successfully!</h2>
            <p className="text-gray-600">Your reservation request has been received and is pending confirmation</p>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            {/* Important Notice */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <div>
                  <h4 className="text-sm font-bold text-yellow-900 mb-1">Important: Save Your Booking Details!</h4>
                  <p className="text-xs text-yellow-800">
                    Please save your <strong>Booking ID</strong> and <strong>Contact Number</strong>. You'll need these to check your booking status or cancel your reservation.
                  </p>
                </div>
              </div>
            </div>

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
                <span className="text-lg font-bold text-green-600">₱{bookingDetails.totalPrice}</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-xs text-blue-800 space-y-1.5">
                <li>• Your booking is currently <strong>pending confirmation</strong> from our team</li>
                <li>• You will receive a confirmation notification once approved</li>
                <li>• Please check your booking status using your Booking ID</li>
                <li>• You can cancel your booking anytime before confirmation</li>
                <li>• If confirmed, arrive after 3:00 PM on your check-in date</li>
                <li>• Bring a valid photo ID for verification</li>
              </ul>
            </div>

            {/* How to Manage Booking */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">How to Manage Your Booking</h4>
              <p className="text-xs text-gray-700 mb-2">
                To check your booking status or cancel your reservation:
              </p>
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>Go to "My Bookings" page</li>
                <li>Enter your <strong>Booking ID: {bookingDetails.bookingId}</strong></li>
                <li>Enter your <strong>Contact Number: {bookingDetails.guestContact}</strong></li>
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleCopyBookingId}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📋 Copy Booking ID
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onClose();
                  navigate('/my-bookings');
                }}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                View My Booking
              </button>
              
              <button
                onClick={handleBrowseMoreRooms}
                className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
              >
                Browse More Rooms
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationModal;
