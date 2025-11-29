// API Configuration
// Vite exposes environment variables prefixed with VITE_ via import.meta.env
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Export commonly used endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/osner_db`,
  ADMIN_LOGIN: `${API_BASE_URL}/admin/login`,
  
  // Rooms
  ROOMS: `${API_BASE_URL}/api/rooms`,
  ROOM_TYPES: `${API_BASE_URL}/api/room-types`,
  ROOM_CATEGORIES: `${API_BASE_URL}/api/room-categories`,
  AVAILABILITY: `${API_BASE_URL}/api/availability`,
  
  // Bookings
  BOOKINGS: `${API_BASE_URL}/api/bookings`,
  USER_BOOKINGS: `${API_BASE_URL}/api/user/bookings`,
  
  // Admin
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  ADMIN_STATS: `${API_BASE_URL}/api/admin/stats`,
  ADMIN_NOTIFICATIONS: `${API_BASE_URL}/api/admin/notifications`,
  ADMIN_NOTIFICATIONS_COUNT: `${API_BASE_URL}/api/admin/notifications/count`,
  
  // Reports Export
  ANALYTICS_EXPORT: `${API_BASE_URL}/api/admin/reports/analytics/export`,
  INVENTORY_REPORTS_EXPORT: `${API_BASE_URL}/api/inventory/reports/export`,
  
  // Amenities
  AMENITIES: `${API_BASE_URL}/api/amenities`,
  
  // Inventory
  INVENTORY_ITEMS: `${API_BASE_URL}/api/inventory/items`,
  INVENTORY_WAREHOUSE: `${API_BASE_URL}/api/inventory/warehouse`,
  INVENTORY_ROOM: `${API_BASE_URL}/api/inventory/room-inventory`,
  INVENTORY_TASKS: `${API_BASE_URL}/api/inventory/tasks`,
  INVENTORY_ALERTS: `${API_BASE_URL}/api/inventory/alerts`,
  INVENTORY_LOGS: `${API_BASE_URL}/api/inventory/logs`,
  INVENTORY_REPORTS: `${API_BASE_URL}/api/inventory/reports`,
};

export default API_BASE_URL;
