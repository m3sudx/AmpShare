import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BatteryCharging,
  CircleAlert,
  CircleCheck,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  X,
  Zap,
} from "lucide-react";
import BookingsSectionNav from "../../components/bookings/BookingsSectionNav";
import FinishSessionDialog from "../../components/bookings/FinishSessionDialog";
import RoleToggle, { type ViewRole } from "../../components/bookings/RoleToggle";
import { useAuth } from "../../context";
import {
  finishSession,
  listBookings,
  listSessions,
} from "../../services/bookings.api";
import type { Booking, ChargingSession } from "../../types/booking";
import { PLUG_LABELS } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, formatTime } from "../../utils/format";
import {
  formatElapsed,
  formatHoursMinutes,
  formatHoursMinutesText,
} from "../../utils/session";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sessions: ChargingSession[]; bookings: Booking[] };

type TabKey = "ALL" | "ACTIVE" | "FINISHED";
type RangeKey = "30" | "90" | "ALL";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "ALL", label: "All time" },
];

const PAGE_SIZE = 10;
const DAY_MS = 86_400_000;

// Sessions only carry started/ended times; fall back to the booking slot if a start is missing
const startOf = (s: ChargingSession) => s.startedAt ?? s.booking.startTime;

const durationMs = (s: ChargingSession, now: number) => {
  const start = new Date(startOf(s)).getTime();
  const end = s.endedAt ? new Date(s.endedAt).getTime() : now;
  return Math.max(0, end - start);
};

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading sessions">
      <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}

export default function ChargingSessionsPage() {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [role, setRole] = useState<ViewRole>("driver");
  const [tab, setTab] = useState<TabKey>("ALL");
  const [range, setRange] = useState<RangeKey>("30");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [now, setNow] = useState(() => Date.now());

  const [finishTarget, setFinishTarget] = useState<ChargingSession | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Sessions don't say who the driver/host is, so bookings are loaded to split by role
    Promise.all([listSessions(), listBookings()])
      .then(([sessions, bookings]) => {
        if (!cancelled) {
          setNow(Date.now());
          setState({ status: "ready", sessions, bookings });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(
              err,
              "We couldn't load your sessions. Please check your network connection and try again.",
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

  const bookingById = useMemo(() => {
    const map = new Map<string, Booking>();
    if (state.status === "ready") state.bookings.forEach((b) => map.set(b.id, b));
    return map;
  }, [state]);

  const mine = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.sessions
      .filter((s) => {
        const b = bookingById.get(s.bookingId);
        if (!b) return false;
        return role === "driver" ? b.driverId === user?.id : b.host.id === user?.id;
      })
      .sort((a, b) => startOf(b).localeCompare(startOf(a)));
  }, [state, bookingById, role, user?.id]);

  const active = mine.find((s) => s.status === "ACTIVE") ?? null;

  // Ticks every second while a session is running (live clock), otherwise once a minute
  const hasActive = active !== null;
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), hasActive ? 1000 : 60_000);
    return () => clearInterval(timer);
  }, [hasActive]);

  const finished = mine.filter((s) => s.status === "FINISHED");
  const totalEnergy = finished.reduce((sum, s) => sum + s.energyDeliveredKwh, 0);
  const totalMs = finished.reduce((sum, s) => sum + durationMs(s, now), 0);
  const total = formatHoursMinutes(totalMs);

  const counts: Record<TabKey, number> = {
    ALL: mine.length,
    ACTIVE: mine.filter((s) => s.status === "ACTIVE").length,
    FINISHED: finished.length,
  };

  const filtered = mine.filter((s) => {
    if (tab !== "ALL" && s.status !== tab) return false;
    if (range !== "ALL") {
      const cutoff = now - Number(range) * DAY_MS;
      if (new Date(startOf(s)).getTime() < cutoff) return false;
    }
    const q = query.trim().toLowerCase();
    return !q || s.charger.title.toLowerCase().includes(q);
  });
  const visible = filtered.slice(0, shown);
  const remaining = filtered.length - visible.length;

  const resetPaging = () => setShown(PAGE_SIZE);

  async function handleFinish(energyKwh: number) {
    if (!finishTarget || finishing) return;
    setFinishing(true);
    setFinishError(null);
    try {
      const { session } = await finishSession(finishTarget.id, energyKwh);
      setState((prev) =>
        prev.status === "ready"
          ? {
              ...prev,
              sessions: prev.sessions.map((s) => (s.id === session.id ? session : s)),
            }
          : prev,
      );
      setFinishTarget(null);
      setNotice("Session finished.");
    } catch (err) {
      setFinishError(
        getErrorMessage(err, "We couldn't finish this session. Please try again."),
      );
    } finally {
      setFinishing(false);
    }
  }

  const switchRole = (next: ViewRole) => {
    setRole(next);
    setTab("ALL");
    resetPaging();
  };

  const bookingFor = (s: ChargingSession) => bookingById.get(s.bookingId);

  return (
    <div className="space-y-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link to="/bookings" className="hover:text-slate-800">
            Bookings
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="font-medium text-slate-800">Charging history</span>
        </nav>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-3xl font-headline">Charging history</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          {role === "driver" ? "Your charging sessions." : "Sessions at your chargers."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BookingsSectionNav current="sessions" />
          <RoleToggle value={role} onChange={switchRole} />
        </div>
      </header>

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            {state.message}
          </span>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

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

      {state.status === "loading" && <Skeleton />}

      {state.status === "ready" && mine.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Zap className="h-10 w-10 text-[#0F9468]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900">No charging sessions yet</h2>
          <p className="max-w-md text-sm text-slate-500">
            {role === "driver"
              ? "Sessions appear here once you start charging on a confirmed booking."
              : "Sessions at your chargers will appear here once drivers start charging."}
          </p>
          <Link
            to="/bookings"
            className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
          >
            Go to bookings
          </Link>
        </div>
      )}

      {state.status === "ready" && mine.length > 0 && (
        <>
          {active && (
            <section
              aria-label="Charging now"
              className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0F9468] text-white"
                >
                  <Zap className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-emerald-800">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#0F9468]" aria-hidden="true" />
                      Charging now
                    </span>
                    <span className="rounded border border-emerald-200 bg-white px-1.5 py-0.5 normal-case">
                      {active.charger.powerKw} kW {PLUG_LABELS[active.charger.plugType]}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {active.charger.title}
                  </h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    {role === "driver" && bookingFor(active) && (
                      <span>Host: {bookingFor(active)?.host.fullName}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      {active.charger.addressDescription}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Elapsed time
                </p>
                <p
                  className="mt-1 font-mono text-3xl font-bold tracking-wider text-[#0F9468]"
                  aria-live="off"
                >
                  {formatElapsed(durationMs(active, now))}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Started at {formatTime(startOf(active))}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {role === "host" && (
                  <button
                    type="button"
                    onClick={() => {
                      setFinishError(null);
                      setFinishTarget(active);
                    }}
                    className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Finish session
                  </button>
                )}
                <Link
                  to={`/sessions/${active.id}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0c7d58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0a6a4a] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  View session
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </section>
          )}

          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">Sessions</p>
                <BatteryCharging className="h-6 w-6 text-[#0F9468]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">{finished.length}</p>
              <p className="text-sm text-slate-500">Completed charging events</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Energy delivered
                </p>
                <Zap className="h-6 w-6 text-[#0F9468]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalEnergy.toFixed(1)}{" "}
                <span className="text-lg font-semibold text-slate-500">kWh</span>
              </p>
              <p className="text-sm text-slate-500">Across completed sessions</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Time charging
                </p>
                <Clock className="h-6 w-6 text-[#0F9468]" aria-hidden="true" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {total.hours}{" "}
                <span className="text-lg font-semibold text-slate-500">h</span>{" "}
                {total.minutes}{" "}
                <span className="text-lg font-semibold text-slate-500">min</span>
              </p>
              <p className="text-sm text-slate-500">Total connect duration</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div
              role="tablist"
              aria-label="Filter sessions"
              className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium"
            >
              {(
                [
                  ["ALL", "All"],
                  ["ACTIVE", "Active"],
                  ["FINISHED", "Finished"],
                ] as [TabKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => {
                    setTab(key);
                    resetPaging();
                  }}
                  className={`rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    tab === key
                      ? "bg-white text-[#0F9468] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label} ({counts[key]})
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="range">
                Date range
              </label>
              <select
                id="range"
                value={range}
                onChange={(e) => {
                  setRange(e.target.value as RangeKey);
                  resetPaging();
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {RANGES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <label className="sr-only" htmlFor="charger-search">
                  Search by charger
                </label>
                <input
                  id="charger-search"
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPaging();
                  }}
                  placeholder="Search by charger..."
                  className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <h2 className="font-semibold text-slate-900">No sessions match</h2>
                <button
                  type="button"
                  onClick={() => {
                    setTab("ALL");
                    setRange("ALL");
                    setQuery("");
                    resetPaging();
                  }}
                  className="mt-2 text-sm font-semibold text-[#0F9468] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {visible.map((s) => (
                  <li key={s.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s.status === "ACTIVE" ? "Active" : "Finished"}
                        </span>
                        <h3 className="mt-1 truncate font-semibold text-slate-900">
                          {s.charger.title}
                        </h3>
                        <p className="truncate text-sm text-slate-500">
                          {s.charger.addressDescription}
                        </p>
                      </div>
                      <Link
                        to={`/sessions/${s.id}`}
                        className="shrink-0 text-sm font-semibold text-[#0F9468] hover:underline"
                      >
                        View →
                      </Link>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-slate-500">Date &amp; time</dt>
                        <dd className="font-medium text-slate-900">
                          {formatDate(startOf(s))} · {formatTime(startOf(s))}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Duration</dt>
                        <dd className="font-medium text-slate-900">
                          {formatHoursMinutesText(durationMs(s, now))}
                          {s.status === "ACTIVE" && " (live)"}
                        </dd>
                      </div>
                      {s.status === "FINISHED" && (
                        <div>
                          <dt className="text-slate-500">Delivered</dt>
                          <dd className="font-medium text-slate-900">
                            {s.energyDeliveredKwh.toFixed(1)} kWh
                          </dd>
                        </div>
                      )}
                    </dl>
                  </li>
                ))}
              </ul>
            )}

            {remaining > 0 && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Load more sessions ({remaining} remaining)
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {finishTarget && (
        <FinishSessionDialog
          session={finishTarget}
          busy={finishing}
          error={finishError}
          onClose={() => {
            setFinishTarget(null);
            setFinishError(null);
          }}
          onSubmit={handleFinish}
        />
      )}
    </div>
  );
}
