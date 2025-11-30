import React from 'react'
import { Filter } from 'lucide-react'

const FilterButtonGroup = ({ statusFilter, statusCounts, setStatusFilter}) => {
    const filter = [
        { key: 'all', label: 'All', count: statusCounts.all },
        { key: 'pending', label: 'Pending', count: statusCounts.pending },
        { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
        { key: 'declined', label: 'Declined', count: statusCounts.declined },
        { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled }
    ]
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
        </div>
        <div className="flex gap-2">
            {filter.map((filter) => (
            <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                statusFilter === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
                {filter.label} ({filter.count})
            </button>
            ))}
        </div>
    </div>
  )
}

export default FilterButtonGroup
