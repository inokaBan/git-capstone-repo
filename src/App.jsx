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
import Bookings from "./admin/BookingsPage"; 
import AdminOverview from "./admin/AdminOverview";


const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage/>} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/bookings" element={<Bookings />} />
      <Route path="/admin/0verview" element={<AdminOverview />} />


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
