import React from 'react'
import {  Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopHeader = ({activeTab, setSidebarOpen}) => {
  const { user } = useAuth();
  
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
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.username || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                  <div className="h-9 w-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
    </>
  )
}

export default TopHeader
