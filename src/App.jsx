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

import AdminLogin from "./admin/AdminLogin";
import AdminOverview from "./admin/AdminOverview";
import AdminLayout from "./admin/AdminLayout";
import RoomsManagementPage from "./admin/RoomsManagementPage";
import BookingsPage from "./admin/BookingsPage";
import InventoryPage from "./admin/InventoryPage";
import AnalyticsPage from "./admin/AnalyticsPage";
import SettingsPage from "./admin/SettingsPage";
import BookingsCalendar from "./admin/BookingsCalendar";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage/>} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="rooms" element={<RoomsManagementPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="calendar" element={<BookingsCalendar />} />
      </Route>


      {/* User pages with MainLayout */}
      <Route element={<MainLayout />}>
      <Route path="/" element={<HomePage />} />

        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:id" element={<RoomDetailsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/aboutUs" element={<AboutUsPage />} />
      </Route>
    </>
  )
);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
