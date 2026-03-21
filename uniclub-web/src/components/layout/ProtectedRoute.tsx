import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../api/services/authService";

function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
