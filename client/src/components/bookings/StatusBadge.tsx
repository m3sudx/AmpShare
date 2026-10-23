import type { BookingStatus } from "../../types/booking";

const LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  ACTIVE: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

const STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ACTIVE: "bg-blue-50 text-blue-800 ring-blue-200",
  COMPLETED: "bg-slate-100 text-slate-700 ring-slate-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  EXPIRED: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
