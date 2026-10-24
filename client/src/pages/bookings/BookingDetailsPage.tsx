import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { isAxiosError } from "axios";
import {
  Car,
  CircleAlert,
  CircleCheck,
  Clock,
  Loader2,
  MapPin,
  Play,
  RefreshCw,
  SearchX,
  X,
  Zap,
} from "lucide-react";
import ConfirmDialog from "../../components/bookings/ConfirmDialog";
import StatusBadge from "../../components/bookings/StatusBadge";
import PaymentSection from "../../components/payments/PaymentSection";
import { useAuth } from "../../context";
import {
  cancelBooking,
  getBooking,
  startSession,
} from "../../services/bookings.api";
import type { Booking, BookingStatus } from "../../types/booking";
import {
  effectiveStatus,
  formatDuration,
  formatEtb,
  minutesUntil,
  PLUG_LABELS,
  shortRef,
} from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, formatTime } from "../../utils/format";
import { usePageTitle } from "../../hooks/usePageTitle";

type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; booking: Booking };

type PendingAction = "cancel" | "start" | null;

const STEPS = ["Requested", "Confirmed", "Charging", "Completed"];
const STEP_INDEX: Partial<Record<BookingStatus, number>> = {
  PENDING: 0,
  CONFIRMED: 1,
  ACTIVE: 2,
  COMPLETED: 3,
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-start sm:gap-6">
      <dt className="w-44 shrink-0 text-sm font-medium text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading booking">
      <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}

export default function BookingDetailsPage() {
  usePageTitle("Booking details");
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getBooking(id)
      .then((booking) => {
        if (!cancelled) setState({ status: "ready", booking });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (code === 404 || code === 400) {
          setState({ status: "not-found" });
        } else {
          setState({
            status: "error",
            message: getErrorMessage(err, "We couldn't load this booking."),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  // Quietly re-reads the booking so the page matches the server after a conflict
  const refreshQuietly = useCallback(async () => {
    if (!id) return;
    try {
      const booking = await getBooking(id);
      setState({ status: "ready", booking });
    } catch {
      /* keep what is on screen */
    }
  }, [id]);

  const closeDialog = () => {
    setPending(null);
    setActionError(null);
  };

  async function runAction() {
    if (!id || !pending || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      if (pending === "cancel") {
        const updated = await cancelBooking(id);
        setState({ status: "ready", booking: updated });
        setNotice("Booking cancelled.");
      } else {
        await startSession(id);
        const updated = await getBooking(id);
        setState({ status: "ready", booking: updated });
        setNotice("Charging session started.");
      }
      setPending(null);
    } catch (err) {
      setActionError(
        getErrorMessage(err, "That didn't work. Please try again."),
      );
      if (isAxiosError(err) && err.response?.status === 409) {
        void refreshQuietly();
      }
    } finally {
      setBusy(false);
    }
  }

  if (state.status === "loading") return <Skeleton />;

  if (state.status === "not-found") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <SearchX className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-slate-900">
          Booking not found
        </h1>
        <p className="max-w-md text-sm text-slate-500">
          We couldn't find this booking. It may have been removed, or the link
          may be wrong.
        </p>
        <Link
          to="/bookings"
          className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
        >
          Back to bookings
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
      >
        <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
        <p className="text-sm text-red-700">{state.message}</p>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  const { booking } = state;
  const status = effectiveStatus(booking, now);
  const canCancel = status === "PENDING" || status === "CONFIRMED";
  const canStart = status === "CONFIRMED";
  const stepIndex = STEP_INDEX[status];
  const expiresIn =
    status === "PENDING" && booking.expiresAt
      ? minutesUntil(booking.expiresAt, now)
      : null;
  const isHost = booking.host.id === user?.id;
  const personName = isHost
    ? booking.driver?.fullName || "Driver"
    : booking.host.fullName;
  const initials = personName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/bookings" className="hover:text-slate-800 hover:underline">
          Bookings
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Booking #{shortRef(booking.id)}</span>
      </nav>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <span className="flex items-center gap-2">
            <CircleCheck className="h-4 w-4" aria-hidden="true" />
            {notice}
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {booking.charger.title}
            </h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-slate-500">
            Booked on {formatDate(booking.createdAt)},{" "}
            {formatTime(booking.createdAt)} · Ref #{shortRef(booking.id)}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
            {booking.charger.addressDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canStart && (
            <button
              type="button"
              onClick={() => setPending("start")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Start charging
            </button>
          )}
          {status === "ACTIVE" && (
            <Link
              to={booking.sessionId ? `/sessions/${booking.sessionId}` : "/sessions"}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              {isHost ? "Finish charging session" : "View session"}
            </Link>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => setPending("cancel")}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Cancel booking
            </button>
          )}
        </div>
      </header>

      {status === "PENDING" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Waiting for the host to confirm.
          {expiresIn !== null && ` This request expires in ${expiresIn} min.`}
        </p>
      )}
      {status === "CANCELLED" && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          This booking was cancelled and the time slot has been released.
        </p>
      )}
      {status === "EXPIRED" && (
        <p className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm text-slate-700">
          The host did not confirm in time, so this request expired.
        </p>
      )}

      {stepIndex !== undefined && (
        <section
          aria-labelledby="lifecycle-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2
            id="lifecycle-heading"
            className="mb-4 text-base font-semibold text-slate-900"
          >
            Booking lifecycle
          </h2>
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((label, index) => {
              const done = index <= stepIndex;
              return (
                <li
                  key={label}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      done
                        ? "bg-[#0F9468] text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`text-xs font-medium ${done ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {label}
                    {index === stepIndex && (
                      <span className="sr-only"> (current step)</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {booking.finalCost !== null && (
            <PaymentSection
              bookingId={booking.id}
              finalCost={booking.finalCost}
              isDriver={booking.driverId === user?.id}
              defaultPhone={user?.phoneNumber}
              onPaymentSuccess={retry}
            />
          )}

          <section
            aria-labelledby="details-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2
              id="details-heading"
              className="mb-2 text-base font-semibold text-slate-900"
            >
              Reservation details
            </h2>
            <dl className="divide-y divide-slate-100">
              <Row label="Date">{formatDate(booking.startTime)}</Row>
              <Row label="Time and duration">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}{" "}
                  ({formatDuration(booking.startTime, booking.endTime)})
                </span>
              </Row>
              <Row label="Vehicle">
                <span className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {booking.vehicle.make} {booking.vehicle.model}
                </span>
              </Row>
              <Row label="Connector">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {PLUG_LABELS[booking.charger.plugType]} ·{" "}
                  {booking.charger.powerKw} kW
                </span>
              </Row>
              <Row label="Rate">
                {booking.pricePerKwh.toFixed(2)} ETB / kWh (locked at booking)
              </Row>
              {booking.estimatedEnergyKwh !== null && (
                <Row label="Estimated energy">
                  {booking.estimatedEnergyKwh} kWh
                </Row>
              )}
              <Row label="Estimated cost">{formatEtb(booking.estimatedCost)}</Row>
              {booking.finalCost !== null && (
                <Row label="Final cost">
                  <span className="font-semibold">
                    {formatEtb(booking.finalCost)}
                  </span>
                </Row>
              )}
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section
            aria-labelledby="person-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2
              id="person-heading"
              className="mb-3 text-base font-semibold text-slate-900"
            >
              {isHost ? "Booking Requester" : "Station host"}
            </h2>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-[#0F9468]"
              >
                {initials}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900">
                  {personName}
                </span>
                {isHost && booking.driver?.phoneNumber && (
                  <span className="text-xs text-slate-500">
                    {booking.driver.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section
            aria-labelledby="guide-heading"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2
              id="guide-heading"
              className="mb-3 text-base font-semibold text-slate-900"
            >
              Good to know
            </h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>You can cancel while the booking is Pending or Confirmed.</li>
              <li>Tap Start charging once your vehicle is plugged in.</li>
              <li>
                Direct Telebirr mobile payment is used once charging completes.
              </li>
            </ul>
          </section>
        </div>
      </div>

      {pending === "cancel" && (
        <ConfirmDialog
          title="Cancel this booking?"
          message={`${booking.charger.title} will be released for other drivers. This action cannot be undone.`}
          confirmLabel="Cancel booking"
          busyLabel="Cancelling..."
          closeLabel="Keep booking"
          tone="danger"
          busy={busy}
          error={actionError}
          onConfirm={runAction}
          onClose={closeDialog}
        />
      )}
      {pending === "start" && (
        <ConfirmDialog
          title="Start charging?"
          message="Make sure your vehicle is plugged in. The session begins as soon as you confirm."
          confirmLabel="Start charging"
          busyLabel="Starting..."
          closeLabel="Not yet"
          tone="primary"
          busy={busy}
          error={actionError}
          onConfirm={runAction}
          onClose={closeDialog}
        />
      )}

      {busy && (
        <span className="sr-only" role="status">
          <Loader2 className="h-4 w-4" />
          Working
        </span>
      )}
    </div>
  );
}
