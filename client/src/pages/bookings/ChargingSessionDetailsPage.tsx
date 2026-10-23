import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { CircleAlert, CircleCheck, RefreshCw, X, Zap } from "lucide-react";
import FinishSessionDialog from "../../components/bookings/FinishSessionDialog";
import StatusBadge from "../../components/bookings/StatusBadge";
import { useAuth } from "../../context";
import { finishSession, getBooking, getSession } from "../../services/bookings.api";
import type { Booking, ChargingSession } from "../../types/booking";
import { formatEtb, PLUG_LABELS } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, formatPrice, formatTime } from "../../utils/format";
import { formatElapsed, formatHoursMinutesText } from "../../utils/session";
import { isAxiosError } from "axios";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string; notFound: boolean }
  | { status: "ready"; session: ChargingSession; booking: Booking };

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading session">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}

export default function ChargingSessionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getSession(id)
      .then(async (session) => {
        // The booking tells us who the driver and host are
        const booking = await getBooking(session.bookingId);
        if (!cancelled) {
          setNow(Date.now());
          setState({ status: "ready", session, booking });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            notFound: isAxiosError(err) && err.response?.status === 404,
            message: getErrorMessage(err, "We couldn't load this session."),
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

  const isActive = state.status === "ready" && state.session.status === "ACTIVE";
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  const breadcrumb = (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <Link to="/bookings" className="hover:text-slate-800">
        Bookings
      </Link>
      <span className="mx-2" aria-hidden="true">
        /
      </span>
      <Link to="/sessions" className="hover:text-slate-800">
        Charging history
      </Link>
      <span className="mx-2" aria-hidden="true">
        /
      </span>
      <span className="font-medium text-slate-800">Session</span>
    </nav>
  );

  if (state.status === "loading") return <Skeleton />;

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {breadcrumb}
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
          <div>
            <h1 className="font-semibold text-red-800">
              {state.notFound ? "Session not found" : "Unable to load this session"}
            </h1>
            <p className="mt-1 text-sm text-red-700">{state.message}</p>
          </div>
          <div className="flex gap-3">
            {!state.notFound && (
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            )}
            <Link
              to="/sessions"
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Back to charging history
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { session, booking } = state;
  const isHost = booking.host.id === user?.id;
  const start = session.startedAt ?? session.booking.startTime;
  const endMs = session.endedAt ? new Date(session.endedAt).getTime() : now;
  const elapsedMs = Math.max(0, endMs - new Date(start).getTime());

  async function handleFinish(energyKwh: number) {
    if (finishing) return;
    setFinishing(true);
    setFinishError(null);
    try {
      const result = await finishSession(session.id, energyKwh);
      setState({
        status: "ready",
        session: result.session,
        booking: { ...booking, status: result.bookingStatus },
      });
      setFinishOpen(false);
      setNotice("Session finished.");
    } catch (err) {
      setFinishError(
        getErrorMessage(err, "We couldn't finish this session. Please try again."),
      );
    } finally {
      setFinishing(false);
    }
  }

  const rows: [string, string][] = [
    ["Vehicle", `${session.vehicle.make} ${session.vehicle.model}`],
    ["Charger", `${session.charger.powerKw} kW · ${PLUG_LABELS[session.charger.plugType]}`],
    ["Started", `${formatDate(start)} · ${formatTime(start)}`],
    [
      "Ended",
      session.endedAt ? `${formatDate(session.endedAt)} · ${formatTime(session.endedAt)}` : "In progress",
    ],
    ["Booked slot", `${formatTime(session.booking.startTime)} – ${formatTime(session.booking.endTime)}`],
    ["Price per kWh", formatPrice(session.pricePerKwh)],
    [
      "Energy delivered",
      session.status === "FINISHED" ? `${session.energyDeliveredKwh.toFixed(1)} kWh` : "Recorded when the session finishes",
    ],
    [
      "Final cost",
      session.finalCost !== null ? formatEtb(session.finalCost) : "Calculated when the session finishes",
    ],
  ];
  if (!isHost) rows.splice(1, 0, ["Host", booking.host.fullName]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        {breadcrumb}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl font-headline">{session.charger.title}</h1>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
              session.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-slate-100 text-slate-700 ring-slate-200"
            }`}
          >
            {session.status === "ACTIVE" ? "Charging now" : "Finished"}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">{session.charger.addressDescription}</p>
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

      <section
        aria-label="Session time"
        className={`rounded-2xl border p-5 shadow-sm ${
          isActive ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F9468] text-white"
          >
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              {isActive ? "Elapsed time" : "Total time"}
            </p>
            {isActive ? (
              <p className="font-mono text-3xl font-bold tracking-wider text-[#0F9468]">
                {formatElapsed(elapsedMs)}
              </p>
            ) : (
              <p className="text-3xl font-bold text-slate-900">{formatHoursMinutesText(elapsedMs)}</p>
            )}
          </div>
        </div>
        {isActive && isHost && (
          <button
            type="button"
            onClick={() => {
              setFinishError(null);
              setFinishOpen(true);
            }}
            className="mt-4 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Finish session
          </button>
        )}
        {isActive && !isHost && (
          <p className="mt-4 text-sm text-slate-600">
            The host ends the session and records the energy delivered.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Session details</h2>
        <dl className="mt-3 divide-y divide-slate-100 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">Booking</span>
          <StatusBadge status={booking.status} />
          <Link
            to={`/bookings/${booking.id}`}
            className="font-semibold text-[#0F9468] hover:underline"
          >
            View booking →
          </Link>
        </div>
      </section>

      {finishOpen && (
        <FinishSessionDialog
          session={session}
          busy={finishing}
          error={finishError}
          onClose={() => {
            setFinishOpen(false);
            setFinishError(null);
          }}
          onSubmit={handleFinish}
        />
      )}
    </div>
  );
}
