import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Clock,
  Inbox,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import NotHostNotice from "../../components/host/NotHostNotice";
import { useAuth } from "../../context";
import { listBookings } from "../../services/bookings.api";
import { listMyChargers, updateCharger } from "../../services/chargers.api";
import { getMyEarnings } from "../../services/host-payouts.api";
import { listSchedules } from "../../services/schedules.api";
import type { Booking } from "../../types/booking";
import type { Charger } from "../../types/charger";
import type { HostEarningsSummary } from "../../types/payment";
import { effectiveStatus, formatEtb, PLUG_LABELS } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate, formatPrice } from "../../utils/format";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      chargers: Charger[];
      bookings: Booking[];
      windowCounts: Record<string, number>;
      earnings: HostEarningsSummary | null;
    };

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading host dashboard">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      ))}
    </div>
  );
}

export default function HostPage() {
  usePageTitle("Host dashboard");
  const { user } = useAuth();
  const isHost = !!user?.roles.includes("HOST");
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isHost) return;
    let cancelled = false;
    Promise.all([listMyChargers(), listBookings(), getMyEarnings().catch(() => null)])
      .then(async ([chargers, bookings, earnings]) => {
        // How many weekly hour windows each charger has (none = drivers cannot book it)
        const counts = await Promise.all(
          chargers.map((c) =>
            listSchedules(c.id)
              .then((s) => [c.id, s.length] as const)
              .catch(() => [c.id, -1] as const),
          ),
        );
        if (!cancelled) {
          setNow(Date.now());
          setState({
            status: "ready",
            chargers,
            bookings,
            windowCounts: Object.fromEntries(counts),
            earnings,
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(err, "We couldn't load your host dashboard."),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, isHost]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  const hostBookings = useMemo(
    () =>
      state.status === "ready" ? state.bookings.filter((b) => b.host.id === user?.id) : [],
    [state, user?.id],
  );
  const pending = hostBookings.filter((b) => effectiveStatus(b, now) === "PENDING").length;
  const upcoming = hostBookings.filter((b) => {
    const s = effectiveStatus(b, now);
    return s === "CONFIRMED" || s === "ACTIVE";
  }).length;

  async function toggleActive(charger: Charger) {
    if (togglingId) return;
    setTogglingId(charger.id);
    setActionError(null);
    try {
      const updated = await updateCharger(charger.id, { isActive: !charger.isActive });
      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              chargers: prev.chargers.map((c) => (c.id === updated.id ? updated : c)),
            }
          : prev,
      );
      setNotice(
        updated.isActive
          ? `${updated.title} is accepting bookings again.`
          : `${updated.title} is paused and hidden from new bookings.`,
      );
    } catch (err) {
      setActionError(getErrorMessage(err, "We couldn't update this charger. Please try again."));
    } finally {
      setTogglingId(null);
    }
  }

  if (!isHost) return <NotHostNotice />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl font-headline">Host dashboard</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage your chargers, weekly hours and booking requests.
          </p>
        </div>
        <Link
          to="/host/chargers/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c7d58] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add charger
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
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">
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
          <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss message">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {state.status === "loading" && <Skeleton />}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-red-800">Unable to load your dashboard</h2>
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

      {state.status === "ready" && (
        <>
          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">Chargers</p>
                <Zap className="h-6 w-6 text-[#0F9468]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{state.chargers.length}</p>
              <p className="text-sm text-slate-500">
                {state.chargers.filter((c) => c.isActive).length} accepting bookings
              </p>
            </div>
            <Link
              to="/bookings?as=host"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">Pending requests</p>
                <Inbox className="h-6 w-6 text-[#0F9468]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{pending}</p>
              <p className="text-sm text-slate-500">
                {pending > 0 ? "Review and confirm →" : "Nothing waiting for you"}
              </p>
            </Link>
            <Link
              to="/bookings?as=host"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">Upcoming</p>
                <CalendarClock className="h-6 w-6 text-[#0F9468]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{upcoming}</p>
              <p className="text-sm text-slate-500">Confirmed or charging now</p>
            </Link>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">Total Earnings</p>
                <Banknote className="h-6 w-6 text-[#0F9468]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatEtb(state.earnings?.summary.totalEarnings ?? 0)}
              </p>
              <p className="text-sm text-slate-500">
                {formatEtb(state.earnings?.summary.pendingPayoutAmount ?? 0)} pending payout
              </p>
            </div>
          </section>

          {state.chargers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Zap className="h-10 w-10 text-[#0F9468]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-slate-900">No chargers listed yet</h2>
              <p className="max-w-md text-sm text-slate-500">
                Add your first charger, set the hours it's available, and drivers nearby can start
                booking it.
              </p>
              <Link
                to="/host/chargers/new"
                className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
              >
                Add your first charger
              </Link>
            </div>
          ) : (
            <section aria-label="Your chargers" className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Your chargers
              </h2>
              <ul className="space-y-4">
                {state.chargers.map((c) => {
                  const windows = state.windowCounts[c.id];
                  return (
                    <li
                      key={c.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-slate-900">
                              {c.title}
                            </h3>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                c.isActive
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                  : "bg-slate-100 text-slate-600 ring-slate-200"
                              }`}
                            >
                              {c.isActive ? "Accepting bookings" : "Paused"}
                            </span>
                          </div>
                          <p className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                            <span className="truncate">{c.addressDescription}</span>
                          </p>
                          <p className="text-sm text-slate-600">
                            {c.powerKw} kW · {PLUG_LABELS[c.plugType]} · {formatPrice(c.pricePerKwh)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            to={`/host/chargers/${c.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleActive(c)}
                            disabled={togglingId === c.id}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                          >
                            {togglingId === c.id ? "Saving..." : c.isActive ? "Pause" : "Resume"}
                          </button>
                        </div>
                      </div>
                      {windows === 0 && (
                        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            No weekly hours set, so drivers can't book this charger yet.{" "}
                            <Link
                              to={`/host/chargers/${c.id}/edit`}
                              className="font-semibold underline"
                            >
                              Add hours
                            </Link>
                          </span>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Host Earnings & Payouts */}
          <section aria-label="Earnings & Payouts" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Earnings & Payout Status
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Payments collected by AmpShare and transferred to your Telebirr wallet
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Commission: 0% (Initial launch)
              </span>
            </div>

            {(!state.earnings || state.earnings.payouts.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 text-sm">
                No charging session earnings recorded yet. When drivers finish charging and pay, your earnings appear here.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Station</th>
                        <th className="px-5 py-3">Gross Total</th>
                        <th className="px-5 py-3">Net Payout</th>
                        <th className="px-5 py-3">Driver Payment</th>
                        <th className="px-5 py-3">Payout Status</th>
                        <th className="px-5 py-3">Payout Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.earnings.payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {p.chargerTitle || "Charger Station"}
                            <div className="text-xs text-slate-400">
                              {formatDate(p.createdAt)}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">{formatEtb(p.amount)}</td>
                          <td className="px-5 py-3.5 font-semibold text-slate-900">
                            {formatEtb(p.netAmount)}
                          </td>
                          <td className="px-5 py-3.5">
                            {p.customerPaymentStatus === "SUCCEEDED" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                                <Clock className="h-3.5 w-3.5" />
                                Awaiting Driver
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {p.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                Paid Out
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                Pending Payout
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                            {p.providerReference || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
