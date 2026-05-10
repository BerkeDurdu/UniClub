import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/layout/AdminRoute";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RoleSectionRoute from "./components/layout/RoleSectionRoute";
import AdminPermissionsPage from "./pages/AdminPermissionsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdvisorsPage from "./pages/AdvisorsPage";
import BoardMembersPage from "./pages/BoardMembersPage";
import BudgetsPage from "./pages/BudgetsPage";
import ClubOnboardingPage from "./pages/ClubOnboardingPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import ClubsPage from "./pages/ClubsPage";
import DashboardPage from "./pages/DashboardPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsPage from "./pages/EventsPage";
import LoginPage from "./pages/LoginPage";
import MembersPage from "./pages/MembersPage";
import MessagesPage from "./pages/MessagesPage";
import NotFoundPage from "./pages/NotFoundPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import RegisterPage from "./pages/RegisterPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import SecurityPage from "./pages/SecurityPage";
import SponsorshipsPage from "./pages/SponsorshipsPage";
import VenuesPage from "./pages/VenuesPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding/club" element={<ClubOnboardingPage />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/clubs/:id" element={<ClubDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/advisors" element={<AdvisorsPage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/settings/security" element={<SecurityPage />} />

          <Route element={<RoleSectionRoute section="board_manage" />}>
            <Route path="/board-members" element={<BoardMembersPage />} />
          </Route>

          <Route element={<RoleSectionRoute section="budgets" />}>
            <Route path="/budgets" element={<BudgetsPage />} />
          </Route>

          <Route element={<RoleSectionRoute section="sponsorships" />}>
            <Route path="/sponsorships" element={<SponsorshipsPage />} />
          </Route>

          <Route element={<RoleSectionRoute section="registrations_manage" />}>
            <Route path="/registrations" element={<RegistrationsPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/permissions" element={<AdminPermissionsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
