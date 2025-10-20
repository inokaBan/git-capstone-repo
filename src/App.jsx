import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import MainLayout from "./layout/MainLayout";
import RoomsPage from "./pages/RoomsPage";
import AboutUsPage from "./pages/AboutUsPage";
import ContactsPage from "./pages/ContactsPage";
import RoomDetailsPage from "./pages/RoomDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyBookingsPage from "./pages/MyBookingsPage";

import AdminOverview from "./admin/AdminOverview";
import AdminLayout from "./admin/AdminLayout";
import RoomsManagementPage from "./admin/RoomsManagementPage";
import BookingsPage from "./admin/BookingsPage";
import InventoryPage from "./admin/InventoryPage";
import AnalyticsPage from "./admin/AnalyticsPage";
import SettingsPage from "./admin/SettingsPage";
import BookingsCalendar from "./admin/BookingsCalendar";
import WalkinReservationPage from "./admin/WalkinReservationPage";
import UserManagementPage from "./admin/UserManagementPage";

import InventoryItemsPage from "./admin/inventory/InventoryItemsPage";
import RoomInventoryPage from "./admin/inventory/RoomInventoryPage";
import WarehouseInventoryPage from "./admin/inventory/WarehouseInventoryPage";
import HousekeepingTasksPage from "./admin/inventory/HousekeepingTasksPage";
import InventoryAlertsPage from "./admin/inventory/InventoryAlertsPage";
import InventoryReportsPage from "./admin/inventory/InventoryReportsPage";

import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage/>} />
      
      {/* Protected Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdminOrStaff={true}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="rooms" element={<RoomsManagementPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/items" element={<InventoryItemsPage />} />
        <Route path="inventory/room-stock" element={<RoomInventoryPage />} />
        <Route path="inventory/warehouse" element={<WarehouseInventoryPage />} />
        <Route path="inventory/tasks" element={<HousekeepingTasksPage />} />
        <Route path="inventory/alerts" element={<InventoryAlertsPage />} />
        <Route path="inventory/reports" element={<InventoryReportsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="calendar" element={<BookingsCalendar />} />
        <Route path="walkin" element={<WalkinReservationPage />} />
        <Route path="users" element={<UserManagementPage />} />
      </Route>

      {/* User pages with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:id" element={<RoomDetailsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/aboutus" element={<AboutUsPage />} />
        
        {/* Protected Guest Route */}
        <Route path="/my-bookings" element={
          <ProtectedRoute requireGuest={true}>
            <MyBookingsPage />
          </ProtectedRoute>
        } />
      </Route>
    </>
  )
);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
