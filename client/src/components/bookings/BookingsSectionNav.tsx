import { Link } from "react-router";

interface Props {
  current: "bookings" | "sessions";
}

const ITEMS = [
  { key: "bookings", label: "Bookings", to: "/bookings" },
  { key: "sessions", label: "Charging history", to: "/sessions" },
] as const;

export default function BookingsSectionNav({ current }: Props) {
  return (
    <nav
      aria-label="Bookings sections"
      className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium"
    >
      {ITEMS.map((item) =>
        item.key === current ? (
          <span
            key={item.key}
            aria-current="page"
            className="rounded-lg bg-white px-3 py-1.5 text-[#0F9468] shadow-sm"
          >
            {item.label}
          </span>
        ) : (
          <Link
            key={item.key}
            to={item.to}
            className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
