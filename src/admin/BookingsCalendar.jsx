import React, { useEffect, useMemo, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import axios from 'axios'

const getDaysInMonthView = (year, month) => {
  const firstDayOfMonth = new Date(year, month, 1)
  const startDay = firstDayOfMonth.getDay() // 0-6 (Sun-Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []
  // Fill leading blanks from previous month
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      inCurrentMonth: false,
    })
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), inCurrentMonth: true })
  }
  // Trailing blanks to complete 6 weeks (42 cells)
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date
    const next = new Date(last)
    next.setDate(last.getDate() + 1)
    days.push({ date: next, inCurrentMonth: false })
  }
  // Ensure 6 rows (some months fit in 5 weeks, we still show 6 for stability)
  while (days.length < 42) {
    const last = days[days.length - 1].date
    const next = new Date(last)
    next.setDate(last.getDate() + 1)
    days.push({ date: next, inCurrentMonth: false })
  }
  return days
}

const formatYMD = (date) => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

const BookingsCalendar = () => {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-based
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const res = await axios.get('http://localhost:8081/api/bookings?status=all')
        setBookings(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        setError('Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const countsByDate = useMemo(() => {
    const counts = new Map()
    for (const b of bookings) {
      const checkIn = new Date(b.checkIn)
      const ymd = formatYMD(checkIn)
      counts.set(ymd, (counts.get(ymd) || 0) + 1)
    }
    return counts
  }, [bookings])

  const days = useMemo(() => getDaysInMonthView(year, month), [year, month])

  const monthLabel = new Date(year, month, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const goPrev = () => {
    const d = new Date(year, month, 1)
    d.setMonth(month - 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }
  const goNext = () => {
    const d = new Date(year, month, 1)
    d.setMonth(month + 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bookings Calendar</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={goPrev} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-200">{monthLabel}</div>
            <button onClick={goNext} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="px-3 py-2 text-center">{d}</div>
            ))}
          </div>
          {loading ? (
            <div className="p-6 text-sm text-gray-600 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-gray-700">
              {days.map(({ date, inCurrentMonth }, idx) => {
                const ymd = formatYMD(date)
                const count = countsByDate.get(ymd) || 0
                const isToday = formatYMD(date) === formatYMD(new Date())
                return (
                  <div
                    key={idx}
                    className={`bg-white dark:bg-gray-800 min-h-[100px] p-2 flex flex-col ${
                      inCurrentMonth ? '' : 'opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{date.getDate()}</span>
                      {count > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                          {count} booking{count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingsCalendar
