import type { Schedule } from "../../types/schedule";
import {
  DAY_ORDER,
  DAY_SHORT,
  formatSlot,
  slotsForDay,
  toMinutes,
  todayIndex,
} from "../../utils/scheduleFormat";

interface Props {
  schedules: Schedule[];
  timeZone: string;
  isLoading: boolean;
  isError: boolean;
}

const grid = "grid grid-cols-[3rem_1fr] items-center gap-x-4 sm:grid-cols-[3rem_1fr_10rem]";

export default function AvailabilityCard({ schedules, timeZone, isLoading, isError }: Props) {
  const today = todayIndex(timeZone);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Weekly availability</h2>
        <p className="text-sm text-slate-600">
          Times are in {timeZone}. You can book inside these hours.
        </p>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      ) : isError ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Couldn't load the schedule.</p>
      ) : schedules.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          The host hasn't set weekly hours yet.
        </p>
      ) : (
        <div className="space-y-1">
          <div className={`${grid} px-2 text-xs text-slate-500`}>
            <span />
            <div className="flex justify-between">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

          {DAY_ORDER.map((day) => {
            const slots = slotsForDay(schedules, day);
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`${grid} gap-y-1 rounded-xl px-2 py-2 ${isToday ? "bg-[#F0FAF6]" : ""}`}
              >
                <span className={`text-sm font-semibold ${isToday ? "text-[#0B7A55]" : "text-slate-800"}`}>
                  {DAY_SHORT[day]}
                </span>
                <div className="relative h-3.5 rounded-full bg-slate-200">
                  {slots.map((s) => {
                    const start = toMinutes(s.startTime);
                    const end = toMinutes(s.endTime);
                    return (
                      <div
                        key={s.id}
                        className="absolute inset-y-0 rounded-full bg-[#0F9468]"
                        style={{
                          left: `${(start / 1440) * 100}%`,
                          width: `${((end - start) / 1440) * 100}%`,
                        }}
                      />
                    );
                  })}
                </div>
                <span className="col-start-2 text-xs text-slate-700 sm:col-start-3 sm:text-right sm:text-sm">
                  {slots.length ? slots.map(formatSlot).join(", ") : "Closed"}
                  {isToday && <strong className="ml-1 text-[#0B7A55]">· Today</strong>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}