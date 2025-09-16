import React from 'react'
import {  Bell, Menu } from 'lucide-react';

const TopHeader = ({activeTab, setSidebarOpen}) => {
  return (
    <>
        <header className="bg-white border-b border-slate-200 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
                >
                  <Menu className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">3</span>
                </button>
              </div>
            </div>
          </div>
        </header>
    </>
  )
}

export default TopHeader