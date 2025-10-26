import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Utility function to get all days in a month view (including padding days)
const getDaysInMonthView = (year, month) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay(); // 0-6 (Sun-Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  // Fill leading blanks from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      inCurrentMonth: false,
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), inCurrentMonth: true });
  }
  // Trailing blanks to complete the grid
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    days.push({ date: next, inCurrentMonth: false });
  }
  return days;
};

// Format date as YYYY-MM-DD
const formatYMD = (date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Check if a date is between two dates (inclusive)
const isDateBetween = (date, start, end) => {
  const d = new Date(date);
  const s = new Date(start);
  const e = new Date(end);
  d.setHours(0, 0, 0, 0);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return d >= s && d <= e;
};

// Check if date ranges overlap
const datesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  s1.setHours(0, 0, 0, 0);
  e1.setHours(0, 0, 0, 0);
  s2.setHours(0, 0, 0, 0);
  e2.setHours(0, 0, 0, 0);
  return s1 < e2 && e1 > s2;
};

const BookingCalendar = ({ roomId, checkIn, checkOut, onDateSelect, onValidationError }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [occupiedBookings, setOccupiedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectingCheckIn, setSelectingCheckIn] = useState(true);

  // Fetch occupied dates for this room
  useEffect(() => {
    const fetchOccupiedDates = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:8081/api/rooms/${roomId}/occupied-dates`);
        setOccupiedBookings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load occupied dates:', err);
        setOccupiedBookings([]);
      } finally {
        setLoading(false);
      }
    };
    if (roomId) {
      fetchOccupiedDates();
    }
  }, [roomId]);

  // Create a set of occupied date strings for quick lookup
  const occupiedDates = useMemo(() => {
    const dates = new Set();
    occupiedBookings.forEach(booking => {
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      let current = new Date(start);
      
      while (current <= end) {
        dates.add(formatYMD(current));
        current.setDate(current.getDate() + 1);
      }
    });
    return dates;
  }, [occupiedBookings]);

  const days = useMemo(() => getDaysInMonthView(year, month), [year, month]);

  const monthLabel = new Date(year, month, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goPrev = () => {
    const d = new Date(year, month, 1);
    d.setMonth(month - 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const goNext = () => {
    const d = new Date(year, month, 1);
    d.setMonth(month + 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const handleDateClick = (date) => {
    const dateStr = formatYMD(date);
    const clickedDate = new Date(date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Don't allow selecting past dates
    if (clickedDate < todayDate) {
      onValidationError('Cannot select past dates');
      return;
    }
    
    // Don't allow selecting occupied dates
    if (occupiedDates.has(dateStr)) {
      onValidationError('This date is already booked. Please select different dates.');
      return;
    }

    if (selectingCheckIn) {
      // Selecting check-in date
      onDateSelect(dateStr, null);
      setSelectingCheckIn(false);
    } else {
      // Selecting check-out date
      if (!checkIn) {
        onValidationError('Please select a check-in date first');
        return;
      }
      
      const checkInDate = new Date(checkIn);
      if (clickedDate <= checkInDate) {
        onValidationError('Check-out date must be after check-in date');
        return;
      }
      
      // Check if any dates in the range are occupied
      let hasConflict = false;
      let current = new Date(checkInDate);
      current.setDate(current.getDate() + 1); // Start from day after check-in
      
      while (current <= clickedDate) {
        if (occupiedDates.has(formatYMD(current))) {
          hasConflict = true;
          break;
        }
        current.setDate(current.getDate() + 1);
      }
      
      if (hasConflict) {
        onValidationError('Your selected dates overlap with an existing booking. Please adjust your dates.');
        return;
      }
      
      onDateSelect(checkIn, dateStr);
      setSelectingCheckIn(true);
    }
  };

  const isSelected = (date) => {
    const dateStr = formatYMD(date);
    if (!checkIn && !checkOut) return false;
    if (checkIn && !checkOut) return dateStr === checkIn;
    if (checkIn && checkOut) {
      return isDateBetween(dateStr, checkIn, checkOut);
    }
    return false;
  };

  const isCheckInDate = (date) => {
    return checkIn && formatYMD(date) === checkIn;
  };

  const isCheckOutDate = (date) => {
    return checkOut && formatYMD(date) === checkOut;
  };

  const isPastDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Select Your Dates</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={goPrev} 
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="px-3 py-1 text-sm font-medium text-gray-800 min-w-[140px] text-center">
            {monthLabel}
          </div>
          <button 
            onClick={goNext} 
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 rounded border border-red-300"></div>
          <span className="text-gray-600">Occupied</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-gray-600">Past/Unavailable</span>
        </div>
      </div>

      {/* Current selection info */}
      {(checkIn || checkOut) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              {checkIn && !checkOut && (
                <p><strong>Check-in:</strong> {new Date(checkIn).toLocaleDateString()} - Now select your check-out date</p>
              )}
              {checkIn && checkOut && (
                <p><strong>Selected:</strong> {new Date(checkIn).toLocaleDateString()} to {new Date(checkOut).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-600">Loading availability...</div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days.map(({ date, inCurrentMonth }, idx) => {
              const dateStr = formatYMD(date);
              const isOccupied = occupiedDates.has(dateStr);
              const isPast = isPastDate(date);
              const selected = isSelected(date);
              const isCheckIn = isCheckInDate(date);
              const isCheckOut = isCheckOutDate(date);
              const isToday = formatYMD(date) === formatYMD(new Date());
              const isDisabled = isPast || isOccupied;

              return (
                <button
                  key={idx}
                  onClick={() => !isDisabled && handleDateClick(date)}
                  disabled={isDisabled}
                  className={`
                    bg-white min-h-[60px] p-2 flex flex-col items-center justify-center
                    transition-colors relative
                    ${inCurrentMonth ? '' : 'opacity-40'}
                    ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'}
                    ${isPast && !isOccupied ? 'bg-gray-50' : ''}
                    ${isOccupied ? 'bg-red-50 border-red-200' : ''}
                    ${selected && !isOccupied ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${isCheckIn ? 'font-bold ring-2 ring-blue-600 ring-inset' : ''}
                    ${isCheckOut ? 'font-bold ring-2 ring-blue-600 ring-inset' : ''}
                  `}
                >
                  <span className={`text-sm font-medium ${isToday && !selected ? 'font-bold text-blue-600' : ''} ${selected ? 'text-white font-semibold' : isOccupied ? 'text-red-700' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </span>
                  {isCheckIn && (
                    <span className={`text-[9px] mt-0.5 font-medium ${selected ? 'text-white' : 'text-blue-600'}`}>Check-in</span>
                  )}
                  {isCheckOut && (
                    <span className={`text-[9px] mt-0.5 font-medium ${selected ? 'text-white' : 'text-blue-600'}`}>Check-out</span>
                  )}
                  {isOccupied && (
                    <span className="text-[9px] text-red-600 mt-0.5 font-medium">Booked</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset button */}
      {(checkIn || checkOut) && (
        <button
          onClick={() => {
            onDateSelect(null, null);
            setSelectingCheckIn(true);
          }}
          className="mt-4 w-full px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Clear Dates
        </button>
      )}
    </div>
  );
};

export default BookingCalendar;
