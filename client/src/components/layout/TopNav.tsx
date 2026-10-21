import { Link, NavLink, useLocation, useNavigate } from "react-router";
import {
  Bell,
  CalendarDays,
  CarFront,
  LogOut,
  MapPin,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context";
import { formatPhoneDisplay } from "../../utils/phone";

const navItems = [
  { to: "/chargers", label: "Find Chargers", Icon: MapPin },
  { to: "/bookings", label: "Bookings", Icon: CalendarDays },
  { to: "/vehicles", label: "My Vehicles", Icon: CarFront },
  { to: "/host", label: "Host", Icon: Zap },
];

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayPhone = formatPhoneDisplay(user?.phoneNumber) || "+251 91 234 5678";

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="mx-auto flex min-h-12 max-w-7xl flex-wrap items-center px-4 sm:px-6 lg:px-8">
        {/* Logo and brand */}
        <Link
          to="/chargers"
          className="flex shrink-0 items-center gap-2.5 py-2.5 group"
        >
          <img
            src="/ampshare-logo.png"
            alt="AmpShare Logo"
            className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
          />

          <span className="text-[17px] font-bold tracking-tight text-[#0F9468]">
            AmpShare
          </span>
        </Link>

        {/* Main navigation */}
        <nav
          aria-label="Main navigation"
          className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-slate-100 md:order-0 md:ml-8 md:h-12 md:w-auto md:border-t-0"
        >
          {navItems.map(({ to, label }) => {
            // Highlight My Vehicles on /vehicles, /vehicles/new, and /vehicles/:id/edit
            const isVehicleActive =
              to === "/vehicles" && location.pathname.startsWith("/vehicles");

            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => {
                  const active = isVehicleActive || isActive;
                  return [
                    "relative flex h-12 shrink-0 items-center px-3.5",
                    "text-xs font-semibold transition-colors",
                    "after:absolute after:bottom-0 after:left-3.5",
                    "after:right-3.5 after:h-0.5 after:rounded-t",
                    active
                      ? "text-[#0F9468] after:bg-[#0F9468]"
                      : "text-slate-600 after:bg-transparent hover:text-[#0F9468]",
                  ].join(" ");
                }}
              >
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Notifications and profile */}
        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-4 py-2">
          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Bell size={18} strokeWidth={1.8} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0F9468] ring-2 ring-white" />
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* User profile identifier */}
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F9468] text-[10px] font-bold text-white shadow-xs">
              ET
            </span>
            <span className="hidden text-xs font-semibold text-slate-700 sm:inline-block">
              {displayPhone}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}