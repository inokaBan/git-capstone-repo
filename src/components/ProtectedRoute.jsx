import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowed = ["user", "admin"], redirectTo = "/auth" }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={redirectTo} replace />;
  if (!allowed.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
