import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../../api/services/authService";
import { isAdmin } from "../../auth/permissions";

function AdminRoute() {
  const user = getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

export default AdminRoute;
