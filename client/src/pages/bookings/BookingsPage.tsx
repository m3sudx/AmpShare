import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  CircleAlert,
  CircleCheck,
  Loader2,
  Plus,
  RefreshCw,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import BookingCard from "../../components/bookings/BookingCard";
import BookingsSectionNav from "../../components/bookings/BookingsSectionNav";
import RoleToggle, { type ViewRole } from "../../components/bookings/RoleToggle";
import { useAuth } from "../../context";
import {
  cancelBooking,
  confirmBooking,
  listBookings,
} from "../../services/bookings.api";
import type { Booking, BookingStatus } from "../../types/booking";
import { effectiveStatus } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; bookings: Booking[] };

type TabKey =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

function matchesTab(status: BookingStatus, tab: TabKey): boolean {
  switch (tab) {
    case "ALL":
      return true;
    case "PENDING":
      return status === "PENDING";
    case "CONFIRMED":
      return status === "CONFIRMED";
    case "ACTIVE":
      return status === "ACTIVE";
    case "COMPLETED":
      return status === "COMPLETED";
    case "CANCELLED":
      return status === "CANCELLED" || status === "EXPIRED";
  }
}

// Upcoming = still in play; past = finished, cancelled or expired
const isUpcoming = (status: BookingStatus) =>
  status === "PENDING" || status === "CONFIRMED" || status === "ACTIVE";

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
    </h2>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading bookings">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

interface CancelDialogProps {
  booking: Booking;
  busy: boolean;
  error: string | null;
  onKeep: () => void;
  onConfirm: () => void;
}

function CancelDialog({
  booking,
  busy,
  error,
  onKeep,
  onConfirm,
}: CancelDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onKeep();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onKeep]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <TriangleAlert
            className="mt-0.5 h-6 w-6 shrink-0 text-amber-500"
            aria-hidden="true"
          />
          <div>
            <h2
              id="cancel-title"
              className="text-lg font-semibold text-slate-900"
            >
              Cancel this booking?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {booking.charger.title} will be released for other drivers. This
              action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onKeep}
            disabled={busy}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {busy && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {busy ? "Cancelling..." : "Cancel booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<TabKey>("ALL");
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<ViewRole>(
    searchParams.get("as") === "host" ? "host" : "driver",
  );
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Keeps the "expires in N min" labels fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listBookings()
      .then((bookings) => {
        if (!cancelled) setState({ status: "ready", bookings });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(
              err,
              "We couldn't load your bookings right now.",
            ),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  // The API returns bookings where the user is the driver OR the charger's host;
  // the toggle splits them client-side
  const mine = useMemo(
    () =>
      state.status === "ready"
        ? state.bookings.filter((b) =>
            role === "driver" ? b.driverId === user?.id : b.host.id === user?.id,
          )
        : [],
    [state, user?.id, role],
  );

  const counts = useMemo(() => {
    const result = {} as Record<TabKey, number>;
    for (const t of TABS) {
      result[t.key] = mine.filter((b) =>
        matchesTab(effectiveStatus(b, now), t.key),
      ).length;
    }
    return result;
  }, [mine, now]);

  const visible = mine.filter((b) => matchesTab(effectiveStatus(b, now), tab));
  const upcoming = visible
    .filter((b) => isUpcoming(effectiveStatus(b, now)))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const past = visible
    .filter((b) => !isUpcoming(effectiveStatus(b, now)))
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
  const pendingCount = mine.filter(
    (b) => effectiveStatus(b, now) === "PENDING",
  ).length;

  const closeDialog = () => {
    setCancelTarget(null);
    setCancelError(null);
  };

  async function handleConfirmCancel() {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelBooking(cancelTarget.id);
      setState((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              bookings: prev.bookings.map((b) =>
                b.id === updated.id ? updated : b,
              ),
            }
          : prev,
      );
      setCancelTarget(null);
      setNotice("Booking cancelled.");
    } catch (err) {
      setCancelError(
        getErrorMessage(
          err,
          "We couldn't cancel this booking. Please try again.",
        ),
      );
    } finally {
      setCancelling(false);
    }
  }

  async function handleConfirm(booking: Booking) {
    if (confirmingId) return;
    setConfirmingId(booking.id);
    try {
      const updated = await confirmBooking(booking.id);
      setState((prev) =>
        prev.status === "ready"
          ? {
              status: "ready",
              bookings: prev.bookings.map((b) =>
                b.id === updated.id ? updated : b,
              ),
            }
          : prev,
      );
      setNotice("Booking confirmed.");
    } catch (err) {
      setNotice(null);
      setActionError(
        getErrorMessage(err, "We couldn't confirm this booking. Try again."),
      );
    } finally {
      setConfirmingId(null);
    }
  }

  const switchRole = (next: ViewRole) => {
    setRole(next);
    setTab("ALL");
    setBannerDismissed(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <BookingsSectionNav current="bookings" />
            <RoleToggle value={role} onChange={switchRole} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl font-headline">My bookings</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Track your charging reservations across Addis Ababa.
          </p>
        </div>
        <Link
          to="/chargers"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c7d58] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Book a charger
        </Link>
      </header>

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

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {pendingCount > 0 && !bannerDismissed && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <span>
            {pendingCount} {pendingCount === 1 ? "booking is" : "bookings are"}{" "}
            {role === "driver"
              ? "waiting for host confirmation."
              : "waiting for your confirmation."}
          </span>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {state.status === "ready" && mine.length > 0 && (
        <div
          role="tablist"
          aria-label="Filter bookings"
          className="flex flex-wrap gap-2"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                tab === t.key
                  ? "bg-[#0F9468] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t.label} <span className="ml-1 opacity-80">{counts[t.key]}</span>
            </button>
          ))}
        </div>
      )}

      {state.status === "loading" && <ListSkeleton />}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-red-800">
              Unable to fetch booking records
            </h2>
            <p className="mt-1 text-sm text-red-700">{state.message}</p>
          </div>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {state.status === "ready" && mine.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Zap className="h-10 w-10 text-[#0F9468]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900">
            {role === "driver" ? "No bookings yet" : "No bookings on your chargers"}
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            {role === "driver"
              ? "Find a verified charger nearby in Addis Ababa and reserve your time slot."
              : "When a driver books one of your chargers, the request will appear here."}
          </p>
          {role === "driver" && (
            <Link
              to="/chargers"
              className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
            >
              Find chargers
            </Link>
          )}
        </div>
      )}

      {state.status === "ready" && mine.length > 0 && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            No {TABS.find((t) => t.key === tab)?.label.toLowerCase()} bookings
          </h2>
          <button
            type="button"
            onClick={() => setTab("ALL")}
            className="mt-3 text-sm font-semibold text-[#0F9468] hover:underline"
          >
            View all bookings
          </button>
        </div>
      )}

      {state.status === "ready" && upcoming.length > 0 && (
        <section aria-label="Upcoming bookings" className="space-y-4">
          <SectionHeading>Upcoming</SectionHeading>
          <ul className="space-y-4">
            {upcoming.map((booking) => (
              <li key={booking.id}>
                  <BookingCard
                    booking={booking}
                    now={now}
                    role={role}
                    confirming={confirmingId === booking.id}
                    onConfirm={handleConfirm}
                    onCancel={(b) => {
                      setCancelError(null);
                      setCancelTarget(b);
                    }}
                  />
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.status === "ready" && past.length > 0 && (
        <section aria-label="Past bookings" className="space-y-4">
          <SectionHeading>Past</SectionHeading>
          <ul className="space-y-4">
            {past.map((booking) => (
              <li key={booking.id}>
                  <BookingCard
                    booking={booking}
                    now={now}
                    role={role}
                    confirming={confirmingId === booking.id}
                    onConfirm={handleConfirm}
                    onCancel={(b) => {
                      setCancelError(null);
                      setCancelTarget(b);
                    }}
                  />
              </li>
            ))}
          </ul>
        </section>
      )}

      {cancelTarget && (
        <CancelDialog
          booking={cancelTarget}
          busy={cancelling}
          error={cancelError}
          onKeep={closeDialog}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}
