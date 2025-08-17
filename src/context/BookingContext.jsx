import React, { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [checkIn, setCheckIn] = useState(() => {
    const saved = localStorage.getItem('booking');
    return saved ? JSON.parse(saved).checkIn : '';
  });
  const [checkOut, setCheckOut] = useState(() => {
    const saved = localStorage.getItem('booking');
    return saved ? JSON.parse(saved).checkOut : '';
  });
  const [guests, setGuests] = useState(() => {
    const saved = localStorage.getItem('booking');
    return saved ? JSON.parse(saved).guests : 1;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('booking', JSON.stringify({ checkIn, checkOut, guests }));
  }, [checkIn, checkOut, guests]);

  return (
    <BookingContext.Provider value={{
      checkIn, setCheckIn,
      checkOut, setCheckOut,
      guests, setGuests
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used inside BookingProvider');
  return context;
};
