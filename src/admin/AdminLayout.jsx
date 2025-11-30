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
    
    // Handle inventory sub-routes
    if (path.startsWith('inventory/')) {
      const subPath = path.replace('inventory/', '')
      const inventoryTitles = {
        'items': 'Inventory Items',
        'room-stock': 'Room Inventory',
        'warehouse': 'Warehouse Stock',
        'tasks': 'Housekeeping Tasks',
        'alerts': 'Inventory Alerts',
        'reports': 'Inventory Reports'
      }
      return inventoryTitles[subPath] || 'Inventory'
    }
    
    // Handle rooms sub-routes
    if (path.startsWith('rooms/')) {
      const subPath = path.replace('rooms/', '')
      const roomsTitles = {
        'management': 'Rooms Management',
        'categories': 'Room Types'
      }
      return roomsTitles[subPath] || 'Rooms'
    }
    
    const segment = path.split('/')[0]
    const map = {
      overview: 'Overview',
      rooms: 'Rooms',
      bookings: 'Bookings',
      inventory: 'Inventory',
      analytics: 'Analytics',
      settings: 'Settings',
      calendar: 'Calendar',
      walkin: 'Walk-in Reservation',
      users: 'User Management',
      notifications: 'Notifications',
    }
    if (map[segment]) return map[segment]
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  }, [location.pathname])

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader setSidebarOpen={setSidebarOpen} title={title} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-2 sm:px-2 lg:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
