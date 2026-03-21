import { Compass, Users, CalendarDays, Blocks } from "lucide-react";
import toast from "react-hot-toast";
import { NavLink, Outlet } from "react-router-dom";
import { getCurrentUser, logout } from "../../api/services/authService";
import Button from "../common/Button";
import HealthIndicator from "./HealthIndicator";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Compass },
  { to: "/clubs", label: "Clubs", icon: Blocks },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/members", label: "Members", icon: Users },
];

function AppLayout() {
  const user = getCurrentUser();

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-20 border-b border-slate/20 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="headline text-xl font-bold">UniClub Web</h1>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-ink text-white"
                      : "text-slate hover:bg-[#EAF0F8] hover:text-ink"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
            <div className="ml-2 hidden text-right sm:block">
              <p className="text-xs text-slate">Signed in as</p>
              <p className="text-sm font-semibold text-ink">{user?.fullName ?? "User"}</p>
            </div>
            <Button
              variant="ghost"
              className="ml-2"
              onClick={() => {
                logout();
                toast.success("Logged out.");
                window.location.href = "/auth/login";
              }}
            >
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate/20 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-slate sm:px-6">
          <p>UniClub Web • React + FastAPI integration playground</p>
          <HealthIndicator />
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
