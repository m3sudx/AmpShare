import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
import SelectField from "../../components/ui/SelectField";
import { useCharger, useChargerSchedules } from "../../hooks/useChargerDetails";
import { updateCharger } from "../../services/chargers.api";
import { createSchedule, deleteSchedule, updateSchedule } from "../../services/schedules.api";
import type { Schedule } from "../../types/schedule";
import { DAY_ORDER, slotsForDay, toHHMM, toMinutes } from "../../utils/scheduleFormat";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PLUG_LABEL = { "GB/T": "GB/T", TYPE_2: "Type 2", CCS2: "CCS2" } as const;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateSlot(start: string, end: string) {
  if (!TIME.test(start)) return "Start must be a time like 09:00";
  if (end !== "24:00" && !TIME.test(end)) return "End must be a time like 17:00 (or 24:00)";
  if (toMinutes(end) <= toMinutes(start)) return "End must be after start";
  return null;
}

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return "Please sign in as a host to change schedules.";
    if (status === 403) return "Only hosts can change schedules.";
    if (status === 404) return "Not found. You can only change your own chargers.";
    return error.response?.data?.message ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

const svgProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const PencilIcon = () => (
  <svg {...svgProps}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
  </svg>
);
const TrashIcon = () => (
  <svg {...svgProps}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
);
const PlusIcon = () => (
  <svg {...svgProps}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const timeInput =
  "h-11 w-full rounded-xl border border-slate-400 bg-white px-3.5 text-center text-[15px] font-semibold tabular-nums text-slate-900 focus:border-[#0F9468] focus:outline-none focus:ring-2 focus:ring-[#0F9468]/20";

export default function ManageSchedulesPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const chargerQuery = useCharger(id);
  const schedulesQuery = useChargerSchedules(id);
  const schedules = schedulesQuery.data ?? [];

  const [day, setDay] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("13:00");
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const startRef = useRef<HTMLInputElement>(null);

  const refreshSchedules = () =>
    queryClient.invalidateQueries({ queryKey: ["charger", id, "schedules"] });

  const addMutation = useMutation({
    mutationFn: () => createSchedule(id!, { dayOfWeek: day, startTime: start, endTime: end }),
    onSuccess: () => {
      setFormError(null);
      refreshSchedules();
    },
    onError: (e) => setFormError(errorMessage(e)),
  });

  const saveMutation = useMutation({
    mutationFn: (slot: Schedule) =>
      updateSchedule(slot.id, { startTime: editStart, endTime: editEnd }),
    onSuccess: () => {
      setEditingId(null);
      setEditError(null);
      refreshSchedules();
    },
    onError: (e) => setEditError(errorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => deleteSchedule(slotId),
    onSuccess: () => {
      setActionError(null);
      refreshSchedules();
    },
    onError: (e) => setActionError(errorMessage(e)),
  });

  const activateMutation = useMutation({
    mutationFn: (next: boolean) => updateCharger(id!, { isActive: next }),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["charger", id] });
      queryClient.invalidateQueries({ queryKey: ["chargers"] });
    },
    onError: (e) => setActionError(errorMessage(e)),
  });

  function addSlotFor(d: number) {
    setDay(d);
    setFormError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    startRef.current?.focus();
  }

  function startEdit(slot: Schedule) {
    setEditingId(slot.id);
    setEditStart(toHHMM(slot.startTime));
    setEditEnd(toHHMM(slot.endTime));
    setEditError(null);
  }

  function saveEdit(slot: Schedule) {
    const problem = validateSlot(editStart, editEnd);
    if (problem) return setEditError(problem);
    saveMutation.mutate(slot);
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateSlot(start, end);
    if (problem) return setFormError(problem);
    setFormError(null);
    addMutation.mutate();
  }

  if (chargerQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-16 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (chargerQuery.isError || !chargerQuery.data) {
    return (
      <div className="space-y-4">
        <Link to="/host" className="text-sm font-semibold text-slate-600">
          ← My chargers
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Charger not found</p>
        </div>
      </div>
    );
  }

  const c = chargerQuery.data;

  const totalMinutes = schedules.reduce((sum, s) => sum + toMinutes(s.endTime) - toMinutes(s.startTime), 0);
  const openDays = new Set(schedules.map((s) => s.dayOfWeek)).size;

  return (
    <div className="space-y-5">
      <Link to="/host" className="inline-flex text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← My chargers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold text-slate-900">Manage schedules</h1>
          <div className="flex flex-wrap items-center gap-2.5 text-slate-600">
            <span className="font-semibold text-slate-900">{c.title}</span>
            <span>·</span>
            <span>{PLUG_LABEL[c.plugType]}</span>
            <span>·</span>
            <span>{c.powerKw} kW</span>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                c.isActive ? "bg-[#E7F6F0] text-[#0B7A55]" : "bg-amber-100 text-amber-800"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${c.isActive ? "bg-[#0F9468]" : "bg-amber-600"}`} />
              {c.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <button
          onClick={() => activateMutation.mutate(!c.isActive)}
          disabled={activateMutation.isPending}
          className={`rounded-xl px-6 py-3 text-base font-bold disabled:opacity-60 ${
            c.isActive
              ? "border border-slate-400 bg-white text-slate-800"
              : "bg-[#0F9468] text-white hover:bg-[#0c7a56]"
          }`}
        >
          {c.isActive ? "Deactivate listing" : "Activate listing"}
        </button>
      </div>

      {actionError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700">
          {actionError}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">Weekly hours</h2>
            <p className="text-sm text-slate-600">
              Drivers can only book inside these slots. Times use {c.timezoneName}.
            </p>
          </div>

          {schedulesQuery.isLoading ? (
            <div className="m-6 h-64 animate-pulse rounded-xl bg-slate-100" />
          ) : schedulesQuery.isError ? (
            <p className="m-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">Couldn't load the schedule.</p>
          ) : (
            DAY_ORDER.map((d) => {
              const slots = slotsForDay(schedules, d);
              return (
                <div
                  key={d}
                  className="flex flex-wrap items-center gap-4 border-b border-slate-200 px-6 py-4 last:border-b-0"
                >
                  <div className="w-28 shrink-0">
                    <div className="font-bold text-slate-900">{DAY_NAMES[d]}</div>
                    <div className="text-xs text-slate-500">
                      {slots.length === 0 ? "No slots" : `${slots.length} slot${slots.length > 1 ? "s" : ""}`}
                    </div>
                  </div>

                  <div className="flex min-w-60 flex-1 flex-wrap items-center gap-2">
                    {slots.length === 0 && (
                      <span className="text-sm text-slate-500">Closed. Drivers cannot book on this day.</span>
                    )}
                    {slots.map((s) =>
                      editingId === s.id ? (
                        <div
                          key={s.id}
                          className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-[#0F9468] bg-[#F0FAF6] p-1.5"
                        >
                          <input
                            aria-label={`${DAY_NAMES[d]} slot start time`}
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            className={`${timeInput} h-10! w-20! rounded-lg!`}
                          />
                          <span aria-hidden="true">–</span>
                          <input
                            aria-label={`${DAY_NAMES[d]} slot end time`}
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            className={`${timeInput} h-10! w-20! rounded-lg!`}
                          />
                          <button
                            onClick={() => saveEdit(s)}
                            disabled={saveMutation.isPending}
                            className="h-10 rounded-lg bg-[#0F9468] px-4 text-sm font-bold text-white disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-700"
                          >
                            Cancel
                          </button>
                          {editError && (
                            <p role="alert" className="w-full px-1 text-[13px] font-medium text-red-700">
                              {editError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div
                          key={s.id}
                          className="inline-flex items-center rounded-xl border border-slate-300 bg-white pl-3.5"
                        >
                          <span className="text-[15px] font-semibold tabular-nums text-slate-900">
                            {toHHMM(s.startTime)} – {toHHMM(s.endTime)}
                          </span>
                          <button
                            onClick={() => startEdit(s)}
                            aria-label={`Edit ${DAY_NAMES[d]} ${toHHMM(s.startTime)} to ${toHHMM(s.endTime)}`}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${DAY_NAMES[d]} ${toHHMM(s.startTime)} – ${toHHMM(s.endTime)}?`))
                                deleteMutation.mutate(s.id);
                            }}
                            aria-label={`Delete ${DAY_NAMES[d]} ${toHHMM(s.startTime)} to ${toHHMM(s.endTime)}`}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-red-700 hover:bg-red-50"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() => addSlotFor(d)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-[#0B7A55] hover:bg-[#F0FAF6]"
                  >
                    <PlusIcon />
                    Add slot
                  </button>
                </div>
              );
            })
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <form
            ref={formRef}
            onSubmit={submitAdd}
            noValidate
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900">Add a time slot</h2>

            {formError && (
              <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-800">Day</span>
              <SelectField
                ariaLabel="Day"
                value={String(day)}
                onChange={(v) => setDay(Number(v))}
                options={DAY_ORDER.map((d) => ({ value: String(d), label: DAY_NAMES[d] }))}
              />
            </div>

            <div className="flex gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label htmlFor="slot-start" className="text-sm font-semibold text-slate-800">
                  Start
                </label>
                <input
                  id="slot-start"
                  ref={startRef}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  placeholder="HH:MM"
                  className={timeInput}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <label htmlFor="slot-end" className="text-sm font-semibold text-slate-800">
                  End
                </label>
                <input
                  id="slot-end"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  placeholder="HH:MM"
                  className={timeInput}
                />
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-500">
              24-hour time. End must be after start. Use 24:00 for midnight. Slots on the same day can't overlap.
            </p>

            <button
              type="submit"
              disabled={addMutation.isPending}
              className="min-h-12 w-full rounded-xl bg-[#0F9468] text-base font-bold text-white hover:bg-[#0c7a56] disabled:opacity-60"
            >
              {addMutation.isPending ? "Adding…" : "Add slot"}
            </button>
          </form>

          <section className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Weekly summary</h2>
            <div className="flex gap-3">
              <div className="flex-1 rounded-xl bg-[#F0FAF6] p-3.5">
                <div className="text-2xl font-extrabold text-[#0B7A55]">
                  {Math.round((totalMinutes / 60) * 10) / 10}
                </div>
                <div className="text-xs text-slate-600">hours / week</div>
              </div>
              <div className="flex-1 rounded-xl bg-slate-100 p-3.5">
                <div className="text-2xl font-extrabold text-slate-900">{schedules.length}</div>
                <div className="text-xs text-slate-600">time slots</div>
              </div>
              <div className="flex-1 rounded-xl bg-slate-100 p-3.5">
                <div className="text-2xl font-extrabold text-slate-900">{openDays}</div>
                <div className="text-xs text-slate-600">open days</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {c.isActive
                ? "Your listing is active and drivers can find it."
                : "Once you are happy with the hours, activate the listing so drivers can find it."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}