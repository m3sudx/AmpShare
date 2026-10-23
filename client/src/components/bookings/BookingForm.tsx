import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { isAxiosError } from "axios";
import {
  CalendarClock,
  Car,
  CircleAlert,
  CircleCheck,
  Loader2,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { createBooking } from "../../services/bookings.api";
import type { Booking } from "../../types/booking";
import type { Charger } from "../../types/charger";
import type { Schedule } from "../../types/schedule";
import type { Vehicle } from "../../types/vehicle";
import { formatEtb, PLUG_LABELS } from "../../utils/booking";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, formatTime } from "../../utils/format";
import {
  addDays,
  dateLabel,
  dateParts,
  dayOfWeek,
  describeMinutes,
  DURATION_OPTIONS,
  formatMinutes,
  startTimes,
  todayKey,
  windowsFor,
  zonedTimeToUtc,
} from "../../utils/slots";

interface Props {
  charger: Charger;
  vehicles: Vehicle[];
  schedules: Schedule[] | null;
}

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-red-600">
      {message}
    </p>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default function BookingForm({ charger, vehicles, schedules }: Props) {
  const timeZone = charger.timezoneName || "Africa/Addis_Ababa";
  const powerKw = Number(charger.powerKw);
  const pricePerKwh = Number(charger.pricePerKwh);

  const [now, setNow] = useState(() => Date.now());
  const [vehicleId, setVehicleId] = useState<string | null>(
    vehicles.length === 1 ? vehicles[0].id : null,
  );
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [startMin, setStartMin] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{
    message: string;
    conflict: boolean;
  } | null>(null);
  const [created, setCreated] = useState<Booking | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const today = todayKey(now, timeZone);
  const dateKeys = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, i)),
    [today],
  );

  const windows = useMemo(
    () => (dateKey ? windowsFor(schedules, dayOfWeek(dateKey)) : []),
    [dateKey, schedules],
  );

  const startOptions = useMemo(() => {
    if (!dateKey) return [];
    return startTimes(windows, duration).filter(
      (t) => zonedTimeToUtc(dateKey, t, timeZone).getTime() > now + 60_000,
    );
  }, [dateKey, windows, duration, timeZone, now]);

  // A previously chosen start time is dropped automatically if it stops being valid
  const selectedStart =
    startMin !== null && startOptions.includes(startMin) ? startMin : null;

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const plugMismatch =
    vehicle !== null && vehicle.plugType !== charger.plugType;

  const estimatedEnergy = Math.round(powerKw * (duration / 60) * 1000) / 1000;
  const estimatedCost = Math.round(estimatedEnergy * pricePerKwh * 100) / 100;

  const errors = {
    vehicle: vehicleId ? null : "Choose a vehicle for this booking.",
    date: dateKey ? null : "Pick a date.",
    time: selectedStart !== null ? null : "Pick a start time.",
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (submitting || !vehicleId || !dateKey || selectedStart === null) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const booking = await createBooking({
        chargerId: charger.id,
        vehicleId,
        startTime: zonedTimeToUtc(
          dateKey,
          selectedStart,
          timeZone,
        ).toISOString(),
        endTime: zonedTimeToUtc(
          dateKey,
          selectedStart + duration,
          timeZone,
        ).toISOString(),
      });
      setCreated(booking);
    } catch (err) {
      setSubmitError({
        message: getErrorMessage(
          err,
          "We couldn't send your booking request. Please try again.",
        ),
        conflict: isAxiosError(err) && err.response?.status === 409,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <section
        role="status"
        className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm"
      >
        <CircleCheck
          className="mx-auto h-10 w-10 text-[#0F9468]"
          aria-hidden="true"
        />
        <h2 className="mt-3 text-xl font-bold text-slate-900">Request sent</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
          Your booking is pending. The host has to confirm it before it is
          final.
          {created.expiresAt &&
            ` The request expires at ${formatTime(created.expiresAt)} if it is not confirmed.`}
        </p>
        <dl className="mx-auto mt-5 max-w-sm space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <SummaryRow label="Charger" value={created.charger.title} />
          <SummaryRow label="Date" value={formatDate(created.startTime)} />
          <SummaryRow
            label="Time"
            value={`${formatTime(created.startTime)} - ${formatTime(created.endTime)}`}
          />
          <SummaryRow
            label="Vehicle"
            value={`${created.vehicle.make} ${created.vehicle.model}`}
          />
          <SummaryRow
            label="Rate"
            value={`${created.pricePerKwh.toFixed(2)} ETB / kWh`}
          />
        </dl>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to={`/bookings/${created.id}`}
            className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
          >
            View booking
          </Link>
          <Link
            to="/chargers"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to chargers
          </Link>
        </div>
      </section>
    );
  }

  if (vehicles.length === 0) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <Car className="h-10 w-10 text-slate-400" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-900">
          No vehicles added yet
        </h2>
        <p className="max-w-md text-sm text-slate-500">
          Add your electric vehicle so we can check it fits {charger.title}.
        </p>
        <Link
          to="/vehicles/new"
          className="rounded-xl bg-[#0F9468] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c7d58]"
        >
          Add your vehicle
        </Link>
      </section>
    );
  }

  const hoursNote =
    dateKey === null
      ? null
      : schedules === null
        ? "The host's hours could not be loaded. Your time will be checked when you send the request."
        : windows.length === 0
          ? "The host is not available on this day."
          : `Host hours on ${dateLabel(dateKey)}: ${windows
              .map((w) => `${formatMinutes(w.start)} - ${formatMinutes(w.end)}`)
              .join(", ")}`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-6 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        {submitError && (
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              submitError.conflict
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {submitError.conflict ? (
              <TriangleAlert
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />
            )}
            <div>
              <p className="font-semibold">
                {submitError.conflict
                  ? "That time is not available. Please choose another slot."
                  : "We couldn't send your request."}
              </p>
              <p className="mt-0.5">{submitError.message}</p>
            </div>
          </div>
        )}

        <fieldset
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-describedby={
            submitted && errors.vehicle ? "vehicle-error" : undefined
          }
        >
          <legend className="px-1 text-base font-semibold text-slate-900">
            1. Choose your vehicle
          </legend>
          <div className="mt-3 space-y-3">
            {vehicles.map((v) => {
              const selected = v.id === vehicleId;
              const mismatch = v.plugType !== charger.plugType;
              return (
                <label
                  key={v.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-emerald-500 ${
                    selected
                      ? "border-[#0F9468] bg-emerald-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="vehicle"
                    value={v.id}
                    checked={selected}
                    onChange={() => setVehicleId(v.id)}
                    className="mt-1 accent-[#0F9468]"
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Car
                        className="h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                      {v.make} {v.model}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Plug: {PLUG_LABELS[v.plugType]}
                      {v.batteryCapacityKwh != null &&
                        ` · Battery: ${v.batteryCapacityKwh} kWh`}
                    </span>
                    {mismatch && (
                      <span className="mt-1 block text-xs font-medium text-amber-700">
                        This plug differs from the charger's{" "}
                        {PLUG_LABELS[charger.plugType]}. You may need an
                        adapter.
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {submitted && (
            <FieldError id="vehicle-error" message={errors.vehicle} />
          )}
          <Link
            to="/vehicles/new"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F9468] hover:underline"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add a vehicle
          </Link>
        </fieldset>

        <section
          aria-labelledby="date-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2
            id="date-heading"
            className="text-base font-semibold text-slate-900"
          >
            2. Pick a date
          </h2>
          <div
            role="group"
            aria-label="Available dates"
            className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7"
          >
            {dateKeys.map((key) => {
              const off = windowsFor(schedules, dayOfWeek(key)).length === 0;
              const selected = key === dateKey;
              const parts = dateParts(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={off}
                  aria-pressed={selected}
                  onClick={() => setDateKey(key)}
                  className={`flex flex-col items-center rounded-xl border px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    selected
                      ? "border-[#0F9468] bg-[#0F9468] text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                >
                  <span className="text-[11px] font-semibold uppercase">
                    {parts.weekday}
                  </span>
                  <span className="text-lg font-bold leading-tight">
                    {parts.day}
                  </span>
                  <span className="text-[11px]">
                    {off ? "Off" : parts.month}
                  </span>
                </button>
              );
            })}
          </div>
          {submitted && <FieldError id="date-error" message={errors.date} />}
        </section>

        <section
          aria-labelledby="time-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2
            id="time-heading"
            className="text-base font-semibold text-slate-900"
          >
            3. Pick a time
          </h2>
          {hoursNote && (
            <p className="mt-2 flex items-start gap-2 text-sm text-slate-600">
              <CalendarClock
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              {hoursNote}
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="duration"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Duration
              </label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {describeMinutes(minutes)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="start-time"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Start time
              </label>
              <select
                id="start-time"
                value={selectedStart ?? ""}
                disabled={!dateKey || startOptions.length === 0}
                onChange={(e) =>
                  setStartMin(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                aria-invalid={submitted && errors.time ? true : undefined}
                aria-describedby={
                  submitted && errors.time ? "time-error" : undefined
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {dateKey ? "Select a time" : "Pick a date first"}
                </option>
                {startOptions.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatMinutes(minutes)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {dateKey && windows.length > 0 && startOptions.length === 0 && (
            <p className="mt-3 text-sm text-amber-700">
              No start times are available for this date and duration. Try
              another date or a shorter duration.
            </p>
          )}
          {selectedStart !== null && (
            <p className="mt-3 text-sm text-slate-600">
              Ends at {formatMinutes(selectedStart + duration)}
            </p>
          )}
          {submitted && <FieldError id="time-error" message={errors.time} />}
        </section>
      </div>

      <aside
        aria-labelledby="summary-heading"
        className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"
      >
        <h2
          id="summary-heading"
          className="text-base font-semibold text-slate-900"
        >
          Booking summary
        </h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          <SummaryRow label="Charger" value={charger.title} />
          <SummaryRow
            label="Vehicle"
            value={vehicle ? `${vehicle.make} ${vehicle.model}` : "-"}
          />
          <SummaryRow label="Date" value={dateKey ? dateLabel(dateKey) : "-"} />
          <SummaryRow
            label="Time"
            value={
              selectedStart !== null
                ? `${formatMinutes(selectedStart)} - ${formatMinutes(selectedStart + duration)}`
                : "-"
            }
          />
          <SummaryRow label="Duration" value={describeMinutes(duration)} />
          <SummaryRow
            label="Price per kWh"
            value={`${pricePerKwh.toFixed(2)} ETB`}
          />
          <SummaryRow label="Estimated cost" value={formatEtb(estimatedCost)} />
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          The estimate assumes the charger delivers its full power for the whole
          booking. The rate is locked when you book.
        </p>
        {plugMismatch && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Check the plug type before you go: your vehicle may need an adapter.
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F9468] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0c7d58] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70"
        >
          {submitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {submitting ? "Sending request..." : "Request booking"}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          No payment is taken in the app. The host has to confirm before your
          booking is final.
        </p>
      </aside>
    </form>
  );
}
