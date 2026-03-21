import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ClubDetailPage from "./pages/ClubDetailPage";
import ClubsPage from "./pages/ClubsPage";
import DashboardPage from "./pages/DashboardPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsPage from "./pages/EventsPage";
import LoginPage from "./pages/LoginPage";
import MembersPage from "./pages/MembersPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/clubs/:id" element={<ClubDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/members" element={<MembersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
