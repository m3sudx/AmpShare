import { Link } from "react-router";
import { Car, Clock, MapPin, Zap } from "lucide-react";
import type { Booking } from "../../types/booking";
import { formatTime } from "../../utils/format";
import {
  effectiveStatus,
  formatDuration,
  formatEtb,
  minutesUntil,
  PLUG_LABELS,
} from "../../utils/booking";
import StatusBadge from "./StatusBadge";

interface Props {
  booking: Booking;
  now: number;
  /** "host" is the owner of the charger; only the host can confirm a booking */
  role?: "driver" | "host";
  onCancel: (booking: Booking) => void;
  onConfirm?: (booking: Booking) => void;
  confirming?: boolean;
}

export default function BookingCard({
  booking,
  now,
  role = "driver",
  onCancel,
  onConfirm,
  confirming = false,
}: Props) {
  const status = effectiveStatus(booking, now);
  const start = new Date(booking.startTime);
  const canCancel = status === "PENDING" || status === "CONFIRMED";
  const canConfirm = role === "host" && status === "PENDING" && !!onConfirm;
  const expiresIn =
    status === "PENDING" && booking.expiresAt
      ? minutesUntil(booking.expiresAt, now)
      : null;

  const costLabel =
    status === "COMPLETED" && booking.finalCost !== null
      ? `${formatEtb(booking.finalCost)} total`
      : `${formatEtb(booking.estimatedCost)} estimated`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-[#0F9468]"
        >
          <span className="text-[10px] font-semibold uppercase">
            {start.toLocaleDateString("en-GB", { weekday: "short" })}
          </span>
          <span className="text-xl font-bold leading-none">
            {start.getDate()}
          </span>
          <span className="text-[10px] font-semibold uppercase">
            {start.toLocaleDateString("en-GB", { month: "short" })}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {booking.charger.title}
            </h3>
            <StatusBadge status={status} />
            {expiresIn !== null && (
              <span className="text-xs font-medium text-amber-700">
                Expires in {expiresIn} min
              </span>
            )}
          </div>

          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Clock
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)} (
            {formatDuration(booking.startTime, booking.endTime)})
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Car
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            {booking.vehicle.make} {booking.vehicle.model}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <span className="truncate">
              {role === "driver" && <>Host: {booking.host.fullName} · </>}
              {booking.charger.addressDescription}
            </span>
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Zap
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            {PLUG_LABELS[booking.charger.plugType]} ·{" "}
            {booking.pricePerKwh.toFixed(2)} ETB / kWh ·{" "}
            <span className="font-medium text-slate-800">{costLabel}</span>
          </p>
        </div>

        <div className="flex shrink-0 gap-2 sm:flex-col">
          <Link
            to={`/bookings/${booking.id}`}
            className="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            View details
          </Link>
          {status === "ACTIVE" && (
            <Link
              to="/sessions"
              className="rounded-xl bg-[#0F9468] px-3 py-2 text-center text-sm font-semibold text-white hover:bg-[#0c7d58] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              View session
            </Link>
          )}
          {canConfirm && (
            <button
              type="button"
              onClick={() => onConfirm?.(booking)}
              disabled={confirming}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F9468] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0c7d58] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-70"
            >
              {confirming ? "Confirming..." : "Confirm"}
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(booking)}
              className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
