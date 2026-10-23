import { useEffect, useState } from "react";
import { CircleAlert, Clock, Loader2, Plus, RefreshCw, X } from "lucide-react";
import { createSchedule, deleteSchedule, listSchedules } from "../../services/schedules.api";
import type { Schedule } from "../../types/schedule";
import { getErrorMessage } from "../../utils/errors";
import { clockToMinutes } from "../../utils/zonedTime";

// Monday first; the API uses 0 = Sunday
const DAYS: { dow: number; label: string }[] = [
  { dow: 1, label: "Monday" },
  { dow: 2, label: "Tuesday" },
  { dow: 3, label: "Wednesday" },
  { dow: 4, label: "Thursday" },
  { dow: 5, label: "Friday" },
  { dow: 6, label: "Saturday" },
  { dow: 0, label: "Sunday" },
];

const clock = (time: string, isEnd = false) => {
  const min = clockToMinutes(time, isEnd);
  if (min === 1440) return "24:00";
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; schedules: Schedule[] };

export default function ScheduleEditor({ chargerId }: { chargerId: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("18:00");
  const [untilMidnight, setUntilMidnight] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSchedules(chargerId)
      .then((schedules) => {
        if (!cancelled) setState({ status: "ready", schedules });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(err, "We couldn't load your weekly hours."),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chargerId, attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  async function handleAdd(dow: number) {
    if (busy) return;
    const endTime = untilMidnight ? "24:00" : end;
    if (!start || !endTime || endTime <= start) {
      setError("The end time must be after the start time.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createSchedule(chargerId, {
        dayOfWeek: dow,
        startTime: start,
        endTime,
      });
      setState((prev) =>
        prev.status === "ready" ? { status: "ready", schedules: [...prev.schedules, created] } : prev,
      );
      setAddingDay(null);
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't add these hours. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteSchedule(id);
      setState((prev) =>
        prev.status === "ready"
          ? { status: "ready", schedules: prev.schedules.filter((s) => s.id !== id) }
          : prev,
      );
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't remove these hours. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="hours-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-[#0F9468]" aria-hidden="true" />
        <h2 id="hours-title" className="text-lg font-bold text-slate-900">
          Weekly hours
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Drivers can only book inside these windows. Times are in the charger's time zone. Days with
        no hours are closed.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {state.status === "loading" && (
        <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading weekly hours">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div
          role="alert"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <span className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5" aria-hidden="true" />
            {state.message}
          </span>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <ul className="mt-4 divide-y divide-slate-100">
          {DAYS.map(({ dow, label }) => {
            const windows = state.schedules
              .filter((s) => s.dayOfWeek === dow)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <li key={dow} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-28 text-sm font-semibold text-slate-800">{label}</span>
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {windows.length === 0 && (
                      <span className="text-sm text-slate-400">Closed</span>
                    )}
                    {windows.map((w) => (
                      <span
                        key={w.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-emerald-800"
                      >
                        {clock(w.startTime)} – {clock(w.endTime, true)}
                        <button
                          type="button"
                          onClick={() => handleDelete(w.id)}
                          disabled={busy}
                          aria-label={`Remove ${label} ${clock(w.startTime)} to ${clock(w.endTime, true)}`}
                          className="rounded-full p-0.5 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {addingDay !== dow && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setAddingDay(dow);
                      }}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#0F9468] hover:underline"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add hours
                    </button>
                  )}
                </div>

                {addingDay === dow && (
                  <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <label htmlFor={`start-${dow}`} className="block text-xs font-medium text-slate-600">
                        From
                      </label>
                      <input
                        id={`start-${dow}`}
                        type="time"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`end-${dow}`} className="block text-xs font-medium text-slate-600">
                        To
                      </label>
                      <input
                        id={`end-${dow}`}
                        type="time"
                        value={untilMidnight ? "" : end}
                        disabled={untilMidnight}
                        onChange={(e) => setEnd(e.target.value)}
                        className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                      />
                    </div>
                    <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={untilMidnight}
                        onChange={(e) => setUntilMidnight(e.target.checked)}
                      />
                      Until midnight
                    </label>
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingDay(null);
                          setError(null);
                        }}
                        disabled={busy}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdd(dow)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0F9468] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0c7d58] disabled:opacity-70"
                      >
                        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        Save hours
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
