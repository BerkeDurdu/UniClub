import { useEffect } from "react";
import toast from "react-hot-toast";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentUser } from "../../api/services/authService";
import { canViewSection, type AppSection } from "../../auth/permissions";

interface RoleSectionRouteProps {
  section: AppSection;
}

function RoleSectionRoute({ section }: RoleSectionRouteProps) {
  const location = useLocation();
  const userRole = getCurrentUser()?.role;
  const canAccess = canViewSection(userRole, section);

  useEffect(() => {
    if (!canAccess) {
      toast.error("You do not have permission to access this page.");
    }
  }, [canAccess]);

  if (!canAccess) {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default RoleSectionRoute;
