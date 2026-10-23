import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { getCharger } from "../../services/chargers.api";
import { createBooking } from "../../services/bookings.api";
import { listSchedules } from "../../services/schedules.api";
import { getVehiclesRequest } from "../../services/vehicles.api";
import type { Booking } from "../../types/booking";
import type { Charger } from "../../types/charger";
import type { Schedule } from "../../types/schedule";
import type { Vehicle } from "../../types/vehicle";
import { formatEtb, minutesUntil, PLUG_LABELS } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { formatPrice } from "../../utils/format";
import {
  addDays,
  clockToMinutes,
  longDate,
  minutesToClock,
  nowInZone,
  toDateKey,
  zonedToIso,
} from "../../utils/zonedTime";
import { isAxiosError } from "axios";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      charger: Charger;
      schedules: Schedule[];
      vehicles: Vehicle[];
    };

const STEP_MIN = 30;
const BOOKABLE_DAYS = 7;
const DURATIONS = [30, 60, 90, 120, 180, 240, 360, 480];

const durationLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

interface Window {
  start: number;
  end: number;
}

function SectionCard({
  step,
  title,
  aside,
  children,
}: {
  step: number;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`step-${step}`}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2
          id={`step-${step}`}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {step}. {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading booking form">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
      {[28, 48, 44, 40].map((h, i) => (
        <div
          key={i}
          style={{ height: `${h * 4}px` }}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

export default function BookChargerPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [startMin, setStartMin] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(60);

  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Booking | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([getCharger(id), listSchedules(id), getVehiclesRequest()])
      .then(([charger, schedules, vehicleList]) => {
        if (cancelled) return;
        setNow(Date.now());
        setState({
          status: "ready",
          charger,
          schedules,
          vehicles: vehicleList.vehicles,
        });
        const first =
          vehicleList.vehicles.find((v) => v.plugType === charger.plugType) ??
          vehicleList.vehicles[0];
        setVehicleId(first?.id ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: getErrorMessage(err, "We couldn't load this charger."),
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

  const ready = state.status === "ready" ? state : null;
  const tz = ready?.charger.timezoneName ?? "UTC";

  // Next 7 calendar days in the charger's own time zone, with bookable start times per day
  const days = useMemo(() => {
    if (!ready) return [];
    const today = nowInZone(tz, now);
    const todayKey = toDateKey(today.y, today.m, today.d);
    return Array.from({ length: BOOKABLE_DAYS }, (_, i) => {
      const day = addDays(todayKey, i);
      const windows: Window[] = ready.schedules
        .filter((s) => s.dayOfWeek === day.dayOfWeek)
        .map((s) => ({
          start: clockToMinutes(s.startTime),
          end: clockToMinutes(s.endTime, true),
        }))
        .sort((a, b) => a.start - b.start);

      const starts: number[] = [];
      for (const w of windows) {
        for (let t = w.start; t + STEP_MIN <= w.end; t += STEP_MIN) {
          if (i === 0 && t <= today.minutes) continue; // already started
          starts.push(t);
        }
      }
      const reason: "closed" | "passed" | null =
        starts.length > 0 ? null : windows.length === 0 ? "closed" : "passed";
      return { ...day, windows, starts, reason };
    });
  }, [ready, tz, now]);

  // Default to the first day that can actually be booked
  const activeDateKey =
    dateKey && days.some((d) => d.key === dateKey && d.starts.length > 0)
      ? dateKey
      : (days.find((d) => d.starts.length > 0)?.key ?? null);
  const activeDay = days.find((d) => d.key === activeDateKey) ?? null;

  const activeStart =
    activeDay && startMin !== null && activeDay.starts.includes(startMin)
      ? startMin
      : (activeDay?.starts[0] ?? null);

  const windowForStart = activeDay?.windows.find(
    (w) => activeStart !== null && activeStart >= w.start && activeStart < w.end,
  );
  const maxDuration = windowForStart && activeStart !== null ? windowForStart.end - activeStart : 0;
  const durationOptions = DURATIONS.filter((d) => d <= maxDuration);
  const activeDuration = durationOptions.includes(duration)
    ? duration
    : (durationOptions.filter((d) => d <= 60).pop() ?? durationOptions[0] ?? null);

  const vehicle = ready?.vehicles.find((v) => v.id === vehicleId) ?? null;
  const charger = ready?.charger ?? null;
  const hours = activeDuration ? activeDuration / 60 : 0;
  const estEnergy = charger ? Math.round(charger.powerKw * hours * 100) / 100 : 0;
  const estCost = charger ? Math.round(estEnergy * charger.pricePerKwh * 100) / 100 : 0;

  const canSubmit =
    !!charger?.isActive &&
    !!vehicle &&
    !!activeDateKey &&
    activeStart !== null &&
    activeDuration !== null &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit || !charger || !vehicle || !activeDateKey || activeStart === null || !activeDuration)
      return;
    setSubmitting(true);
    setConflict(null);
    setSubmitError(null);
    try {
      const booking = await createBooking({
        chargerId: charger.id,
        vehicleId: vehicle.id,
        startTime: zonedToIso(activeDateKey, activeStart, tz),
        endTime: zonedToIso(activeDateKey, activeStart + activeDuration, tz),
      });
      setBooked(booking);
      window.scrollTo({ top: 0 });
    } catch (err) {
      const message = getErrorMessage(err, "We couldn't send your booking request.");
      if (isAxiosError(err) && err.response?.status === 409) {
        setConflict(message);
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const header = (title: string) => (
    <header>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/chargers" className="hover:text-slate-800">
          Find Chargers
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-slate-500">{title}</span>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="font-medium text-slate-800">Book</span>
      </nav>
      <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-3xl font-headline">Book a charger</h1>
      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
        Choose your vehicle and a time slot. The host confirms your request.
      </p>
    </header>
  );

  if (state.status === "loading") return <PageSkeleton />;

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {header("Charger")}
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <CircleAlert className="h-8 w-8 text-red-500" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-red-800">Unable to load this charger</h2>
            <p className="mt-1 text-sm text-red-700">{state.message}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={retry}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
            <Link
              to="/chargers"
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Back to chargers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { charger: c, vehicles } = state;
  const startLabel = activeStart !== null ? minutesToClock(activeStart) : "--:--";
  const endLabel =
    activeStart !== null && activeDuration
      ? minutesToClock(activeStart + activeDuration)
      : "--:--";
  const mismatch = vehicle ? vehicle.plugType !== c.plugType : false;
  const todayHasSlots = days[0]?.starts.length ? true : false;

  if (booked) {
    const holdMin = booked.expiresAt ? minutesUntil(booked.expiresAt, now) : null;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {header(c.title)}
        <section
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm"
        >
          <CircleCheck className="mx-auto h-10 w-10 text-[#0F9468]" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold text-slate-900">Booking request sent</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            {c.title} on {activeDateKey ? longDate(activeDateKey) : ""}, {startLabel} –{" "}
            {endLabel}. The host has to confirm before your booking is final
            {holdMin !== null && `; the request is held for about ${holdMin} min`}.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={`/bookings/${booked.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F9468] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
            >
              View booking
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/bookings"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go to my bookings
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {header(c.title)}

      {!c.isActive && (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          This charger isn't accepting bookings right now.
        </p>
      )}

      {conflict && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">That slot is no longer available</p>
            <p className="mt-0.5">{conflict} Pick a different time and try again.</p>
          </div>
        </div>
      )}

      <SectionCard
        step={1}
        title="Selected charger"
        aside={
          todayHasSlots ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0F9468]" aria-hidden="true" />
              Available today
            </span>
          ) : undefined
        }
      >
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#0F9468]"
          >
            <Zap className="h-9 w-9" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              {c.addressDescription}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
                {c.powerKw} kW
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
                {PLUG_LABELS[c.plugType]}
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
                {formatPrice(c.pricePerKwh)}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        step={2}
        title="Choose your vehicle"
        aside={
          vehicles.length > 0 ? (
            <Link
              to="/vehicles/new"
              state={{ from: `/chargers/${id}/book` }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0F9468] hover:underline"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a vehicle
            </Link>
          ) : undefined
        }
      >
        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <h3 className="font-semibold text-slate-900">No vehicles added yet</h3>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Add the EV you'll charge so we can check it fits this charger.
            </p>
            <Link
              to="/vehicles/new"
              state={{ from: `/chargers/${id}/book` }}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0F9468] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c7d58]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a vehicle
            </Link>
          </div>
        ) : (
          <div role="radiogroup" aria-label="Vehicle" className="space-y-3">
            {vehicles.map((v) => {
              const selected = v.id === vehicleId;
              const fits = v.plugType === c.plugType;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setVehicleId(v.id)}
                  className={`block w-full rounded-xl border p-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    selected
                      ? "border-[#0F9468] bg-emerald-50/50 ring-1 ring-[#0F9468]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">
                      {v.make} {v.model}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        selected ? "border-[#0F9468] bg-[#0F9468] text-white" : "border-slate-300"
                      }`}
                    >
                      {selected && <CircleCheck className="h-4 w-4" />}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    Plug: {PLUG_LABELS[v.plugType]}
                    {fits && " (compatible)"} · Battery: {v.batteryCapacityKwh} kWh
                  </span>
                  {!fits && (
                    <span className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                      <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                      This vehicle's plug ({PLUG_LABELS[v.plugType]}) doesn't match this
                      charger ({PLUG_LABELS[c.plugType]}).
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        step={3}
        title="Pick a date"
        aside={<span className="text-xs text-slate-500">Host weekly hours</span>}
      >
        {state.schedules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            The host hasn't set any available hours for this charger yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {days.map((d) => {
              const disabled = d.starts.length === 0;
              const selected = d.key === activeDateKey;
              return (
                <button
                  key={d.key}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => setDateKey(d.key)}
                  className={`rounded-xl border px-2 py-3 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    selected
                      ? "border-[#0c7d58] bg-[#0c7d58] text-white"
                      : disabled
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="block text-[11px] font-semibold uppercase">{d.weekday}</span>
                  <span className="block text-2xl font-bold leading-tight">{d.day}</span>
                  <span className="block text-xs">
                    {d.reason === "closed" ? "Closed" : d.reason === "passed" ? "Passed" : d.month}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard step={4} title="Pick a time">
        {!activeDay || activeStart === null ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            No time slots are available in the next {BOOKABLE_DAYS} days.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              <Clock className="h-4 w-4 text-[#0F9468]" aria-hidden="true" />
              Available windows on {longDate(activeDay.key)}:
              {activeDay.windows.map((w) => (
                <span
                  key={w.start}
                  className="rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                >
                  {minutesToClock(w.start)} – {minutesToClock(w.end)}
                </span>
              ))}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="start-time" className="text-sm font-semibold text-slate-800">
                  Start time
                </label>
                <select
                  id="start-time"
                  value={activeStart}
                  onChange={(e) => setStartMin(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {activeDay.starts.map((t) => (
                    <option key={t} value={t}>
                      {minutesToClock(t)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="duration" className="text-sm font-semibold text-slate-800">
                  Duration
                </label>
                <select
                  id="duration"
                  value={activeDuration ?? ""}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {durationOptions.map((d) => (
                    <option key={d} value={d}>
                      {durationLabel(d)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
              <Zap className="h-4 w-4" aria-hidden="true" />
              Ends at {endLabel}
            </p>
            {Intl.DateTimeFormat().resolvedOptions().timeZone !== tz && (
              <p className="text-xs text-slate-500">Times are shown in {tz}.</p>
            )}
          </div>
        )}
      </SectionCard>

      <section
        aria-labelledby="summary-title"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h2 id="summary-title" className="text-lg font-bold text-slate-900">
          Booking summary
        </h2>
        <dl className="mt-4 divide-y divide-slate-100 text-sm">
          {[
            ["Charger", c.title],
            ["Vehicle", vehicle ? `${vehicle.make} ${vehicle.model} (${PLUG_LABELS[vehicle.plugType]})` : "—"],
            ["Date", activeDateKey ? longDate(activeDateKey) : "—"],
            ["Time", activeStart !== null ? `${startLabel} – ${endLabel}` : "—"],
            ["Duration", activeDuration ? durationLabel(activeDuration) : "—"],
            ["Price per kWh", formatPrice(c.pricePerKwh)],
            ["Estimated energy", activeDuration ? `${estEnergy.toFixed(2)} kWh` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium text-slate-900">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-3">
            <dt className="font-semibold text-slate-700">Estimated total</dt>
            <dd className="text-right text-lg font-bold text-[#0F9468]">
              {activeDuration ? formatEtb(estCost) : "—"}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500">
          The price per kWh is locked when you book. The final cost is calculated from the energy
          actually delivered.
        </p>

        {mismatch && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Your vehicle's plug doesn't match this charger. You can still request the booking, but
            check connector compatibility with the host.
          </p>
        )}
        {submitError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F9468] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0c7d58] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending request...
            </>
          ) : (
            <>
              Request booking
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          The host has to confirm before your booking is final.
        </p>
      </section>
    </div>
  );
}
