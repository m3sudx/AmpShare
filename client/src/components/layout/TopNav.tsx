import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { CalendarDays, CarFront, LogOut, MapPin, Zap } from "lucide-react";
import { useAuth } from "../../context";
import { formatPhoneDisplay } from "../../utils/phone";
import LogoutConfirmDialog from "./LogoutConfirmDialog";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/chargers", label: "Find Chargers", Icon: MapPin },
  { to: "/bookings", label: "Bookings", Icon: CalendarDays },
  { to: "/vehicles", label: "My Vehicles", Icon: CarFront },
  { to: "/host", label: "Host", Icon: Zap },
];

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/login", { replace: true });
  };

  const displayPhone = formatPhoneDisplay(user?.phoneNumber) || "";
  const isAdmin = user?.roles.includes("ADMIN");

  const items = [
    ...navItems,
    ...(isAdmin
      ? [{ to: "/admin/payouts", label: "Admin Payouts", Icon: Zap }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center px-4 sm:px-6 lg:px-8">
        {/* Logo and brand */}
        <Link
          to="/chargers"
          className="group flex h-16 shrink-0 items-center gap-3 md:h-18"
        >
          <img
            src="/ampshare-logo.png"
            alt=""
            className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
          />
          <span className="text-[22px] font-bold tracking-tight text-[#0B7A55]">
            AmpShare
          </span>
        </Link>

        {/* Main navigation */}
        <nav
          aria-label="Main navigation"
          className="no-scrollbar order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto border-t border-slate-100 py-2 md:order-0 md:mx-0 md:ml-10 md:w-auto md:border-t-0 md:py-0"
        >
          {items.map(({ to, label, Icon }) => {
            // Highlight My Vehicles on /vehicles, /vehicles/new, and /vehicles/:id/edit
            const isVehicleActive =
              to === "/vehicles" && location.pathname.startsWith("/vehicles");
            // Keep Bookings highlighted on the charging history pages (/sessions, /sessions/:id)
            const isBookingsActive =
              to === "/bookings" && location.pathname.startsWith("/sessions");

            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => {
                  const active =
                    isVehicleActive || isBookingsActive || isActive;
                  return [
                    "flex h-11 shrink-0 items-center gap-2 rounded-xl px-4",
                    "whitespace-nowrap text-[15px] font-semibold transition-colors",
                    active
                      ? "bg-[#E7F6F0] text-[#0B7A55]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ");
                }}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Notifications and profile */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificationBell />
          <ThemeToggle />

          <div className="h-8 w-px bg-slate-200" aria-hidden="true" />

          {/* Profile */}
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-4 max-[420px]:pr-1">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B7A55] text-sm font-bold text-white">
              {initials(user?.fullName)}
            </span>
            <span className="leading-tight max-[420px]:hidden">
              {user?.fullName && (
                <span className="hidden text-sm font-semibold text-slate-900 lg:block">
                  {user.fullName}
                </span>
              )}
              <span className="block whitespace-nowrap text-sm font-medium text-slate-600 lg:text-xs">
                {displayPhone}
              </span>
            </span>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} strokeWidth={1.9} />
          </button>
        </div>
      </div>

      {/* Logout confirmation dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
}
