import {
  Compass,
  Users,
  CalendarDays,
  Blocks,
  GraduationCap,
  Shield,
  MapPin,
  DollarSign,
  ClipboardList,
  Handshake,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getCurrentUser, logout } from "../../api/services/authService";
import Button from "../common/Button";
import HealthIndicator from "./HealthIndicator";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: Compass },
      { to: "/clubs", label: "Clubs", icon: Blocks },
      { to: "/events", label: "Events", icon: CalendarDays },
    ],
  },
  {
    title: "People",
    items: [
      { to: "/members", label: "Members", icon: Users },
      { to: "/advisors", label: "Advisors", icon: GraduationCap },
      { to: "/board-members", label: "Board", icon: Shield },
    ],
  },
  {
    title: "Operations",
    items: [
      { to: "/venues", label: "Venues", icon: MapPin },
      { to: "/budgets", label: "Budgets", icon: DollarSign },
      { to: "/registrations", label: "Registrations", icon: ClipboardList },
      { to: "/sponsorships", label: "Sponsors", icon: Handshake },
      { to: "/messages", label: "Messages", icon: MessageSquare },
    ],
  },
];

function AppLayout() {
  const user = getCurrentUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-20 border-b border-slate/20 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="headline text-xl font-bold">UniClub Web</h1>

          {/* Mobile menu toggle */}
          <button
            className="rounded-lg p-2 text-slate hover:bg-[#EAF0F8] sm:hidden"
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navGroups.map((group) =>
              group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-ink text-white"
                        : "text-slate hover:bg-[#EAF0F8] hover:text-ink"
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </NavLink>
              ))
            )}
            <div className="ml-2 hidden text-right lg:block">
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

        {/* Mobile navigation dropdown */}
        {mobileNavOpen ? (
          <div className="border-t border-slate/20 bg-white px-4 py-3 sm:hidden">
            {navGroups.map((group) => (
              <div key={group.title} className="mb-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? "bg-ink text-white"
                            : "text-slate hover:bg-[#EAF0F8] hover:text-ink"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-slate/20 pt-3">
              <p className="text-sm text-slate">
                Signed in as <span className="font-semibold text-ink">{user?.fullName ?? "User"}</span>
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  toast.success("Logged out.");
                  window.location.href = "/auth/login";
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate/20 bg-white/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-slate sm:px-6">
          <p>UniClub Web • React + FastAPI integration playground</p>
          <HealthIndicator />
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
