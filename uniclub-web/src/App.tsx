import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RoleSectionRoute from "./components/layout/RoleSectionRoute";
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
import RegisterPage from "./pages/RegisterPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import SponsorshipsPage from "./pages/SponsorshipsPage";
import VenuesPage from "./pages/VenuesPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

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
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
