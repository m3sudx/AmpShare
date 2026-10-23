import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BatteryCharging,
  CircleAlert,
  Clock,
  RefreshCw,
  Zap,
} from "lucide-react";
import { listSessions } from "../../services/bookings.api";
import type { ChargingSession, SessionStatus } from "../../types/booking";
import { formatDuration, PLUG_LABELS } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, formatTime } from "../../utils/format";
import { describeMinutes } from "../../utils/slots";
import type { ReactNode } from "react";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sessions: ChargingSession[] };

type Filter = "ALL" | SessionStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "FINISHED", label: "Finished" },
];

// Missing optional values fall back to the booked time
const startOf = (s: ChargingSession) => s.startedAt ?? s.booking.startTime;

function SessionBadge({ status }: { status: SessionStatus }) {
  const style =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {status === "ACTIVE" ? "Active" : "Finished"}
    </span>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#0F9468]">
        {icon}
      </span>
      <div>
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="text-lg font-bold text-slate-900">{value}</dd>
      </div>
    </div>
  );
}

export default function ChargingSessionsPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [now, setNow] = useState(() => Date.now());

  // Keeps the elapsed time of a running session fresh without any real-time connection
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSessions()
      .then((sessions) => {
        if (!cancelled) setState({ status: "ready", sessions });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(err, "We couldn't load your sessions."),
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

  const sessions = useMemo(
    () => (state.status === "ready" ? state.sessions : []),
    [state],
  );

  const stats = useMemo(() => {
    const finished = sessions.filter((s) => s.status === "FINISHED");
    const energy = finished.reduce((sum, s) => sum + s.energyDeliveredKwh, 0);
    const minutes = finished.reduce((sum, s) => {
      if (!s.startedAt || !s.endedAt) return sum;
      return (
        sum +
        Math.round(
          (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) /
            60000,
        )
      );
    }, 0);
    return { count: finished.length, energy, minutes };
  }, [sessions]);

  const active = sessions.filter((s) => s.status === "ACTIVE");
  const counts: Record<Filter, number> = {
    ALL: sessions.length,
    ACTIVE: active.length,
    FINISHED: stats.count,
  };
  const visible =
    filter === "ALL" ? sessions : sessions.filter((s) => s.status === filter);

  const durationOf = (s: ChargingSession) => {
    if (!s.startedAt) return "-";
    return formatDuration(
      s.startedAt,
      s.endedAt ?? new Date(now).toISOString(),
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <nav
          aria-label="Bookings sections"
          className="mb-3 flex w-fit gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium"
        >
          <Link
            to="/bookings"
            className="rounded-lg px-3 py-1.5 text-slate-600 hover:text-slate-900"
          >
            Bookings
          </Link>
          <span
            aria-current="page"
            className="rounded-lg bg-white px-3 py-1.5 text-slate-900 shadow-sm"
          >
            Charging history
          </span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Charging history</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your charging sessions and energy delivered.
        </p>
      </header>

      {state.status === "loading" && (
        <div
          className="space-y-4"
          aria-busy="true"
          aria-label="Loading sessions"
        >
          <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-red-800">
              Unable to load sessions
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

      {state.status === "ready" && sessions.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Zap className="h-10 w-10 text-[#0F9468]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-900">
            No charging sessions yet
          </h2>
          <p className="max-w-md text-sm text-slate-500">
            Your sessions appear here after you start charging a confirmed
            booking.
          </p>
          <Link
            to="/bookings"
            className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
          >
            View my bookings
          </Link>
        </div>
      )}

      {state.status === "ready" && sessions.length > 0 && (
        <>
          {active.map((s) => (
            <section
              key={s.id}
              aria-label="Charging now"
              className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#0F9468]">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Charging now
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  {s.charger.title}
                </h2>
                <p className="text-sm text-slate-600">
                  {PLUG_LABELS[s.charger.plugType]} · {s.charger.powerKw} kW ·{" "}
                  {s.vehicle.make} {s.vehicle.model}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Elapsed:{" "}
                  <span className="font-semibold text-slate-900">
                    {durationOf(s)}
                  </span>
                  {s.startedAt && ` · Started at ${formatTime(s.startedAt)}`}
                </p>
              </div>
              <Link
                to={`/bookings/${s.bookingId}`}
                className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#0c7d58]"
              >
                View booking
              </Link>
            </section>
          ))}

          <dl className="grid gap-4 sm:grid-cols-3">
            <Stat
              icon={<Zap className="h-5 w-5" aria-hidden="true" />}
              label="Completed sessions"
              value={String(stats.count)}
            />
            <Stat
              icon={<BatteryCharging className="h-5 w-5" aria-hidden="true" />}
              label="Energy delivered"
              value={`${stats.energy.toFixed(2)} kWh`}
            />
            <Stat
              icon={<Clock className="h-5 w-5" aria-hidden="true" />}
              label="Time charging"
              value={describeMinutes(stats.minutes)}
            />
          </dl>

          <div
            role="tablist"
            aria-label="Filter sessions"
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  filter === f.key
                    ? "bg-[#0F9468] text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {f.label}{" "}
                <span className="ml-1 opacity-80">{counts[f.key]}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                No sessions match this filter
              </h2>
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className="mt-3 text-sm font-semibold text-[#0F9468] hover:underline"
              >
                Show all sessions
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">Charging sessions</caption>
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Charger
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Time
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Duration
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Energy
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Vehicle
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {s.charger.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {s.charger.addressDescription}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatDate(startOf(s))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatTime(startOf(s))} -{" "}
                        {s.endedAt ? formatTime(s.endedAt) : "In progress"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {durationOf(s)}
                        {s.status === "ACTIVE" && " (live)"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {s.status === "FINISHED"
                          ? `${s.energyDeliveredKwh.toFixed(2)} kWh`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.vehicle.make} {s.vehicle.model}
                      </td>
                      <td className="px-4 py-3">
                        <SessionBadge status={s.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          to={`/bookings/${s.bookingId}`}
                          className="font-semibold text-[#0F9468] hover:underline"
                        >
                          View booking
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
