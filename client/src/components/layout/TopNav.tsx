import { Link, NavLink } from "react-router";
import {
  Bell,
  CalendarDays,
  CarFront,
  MapPin,
  Zap,
} from "lucide-react";

const navItems = [
  { to: "/chargers", label: "Find Chargers", Icon: MapPin },
  { to: "/bookings", label: "Bookings", Icon: CalendarDays },
  { to: "/vehicles", label: "My Vehicles", Icon: CarFront },
  { to: "/host", label: "Host", Icon: Zap },
];

export default function TopNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-11 max-w-360 flex-wrap items-center px-4 sm:px-5">

        {/* Logo and brand */}
        <Link
          to="/chargers"
          className="flex shrink-0 items-center gap-2 py-2"
        >
          <img
            src="/ampshare-logo.png"
            alt=""
            className="h-7 w-7 object-contain"
          />

          <span className="text-[15px] font-bold tracking-tight text-[#006B4F]">
            AmpShare
          </span>
        </Link>

        {/* Main navigation */}
        <nav
          aria-label="Main navigation"
          className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-slate-100 md:order-0 md:ml-7 md:h-11 md:w-auto md:border-t-0"
        >
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "relative flex h-11 shrink-0 items-center px-3",
                  "text-[11px] font-medium transition-colors",
                  "after:absolute after:bottom-0 after:left-3",
                  "after:right-3 after:h-0.5 after:rounded-t",
                  isActive
                    ? "text-[#006B4F] after:bg-[#0F9468]"
                    : "text-slate-600 after:bg-transparent hover:text-[#0F9468]",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Notifications and profile */}
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">

          <span
            role="img"
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center text-slate-600"
          >
            <Bell size={17} strokeWidth={1.7} />

            <span className="absolute right-1.5 top-1.25 h-1.5 w-1.5 rounded-full bg-[#0F9468]" />
          </span>

          <div className="h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006B4F] text-[9px] font-bold text-white">
              ET
            </span>

            <span className="hidden text-[11px] font-medium text-slate-700 sm:block">
              +251 91 234 5678
            </span>
          </div>

        </div>
      </div>
    </header>
  );
}