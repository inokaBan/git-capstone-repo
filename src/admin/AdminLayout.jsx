import React, { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopHeader from './TopHeader'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const title = useMemo(() => {
    const path = location.pathname.replace(/^\/admin\/?/, '')
    if (!path) return 'Overview'
    const segment = path.split('/')[0]
    const map = {
      overview: 'Overview',
      rooms: 'Rooms',
      bookings: 'Bookings',
      inventory: 'Inventory',
      analytics: 'Analytics',
      settings: 'Settings',
      calendar: 'Calendar',
    }
    if (map[segment]) return map[segment]
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader setSidebarOpen={setSidebarOpen} title={title} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout


