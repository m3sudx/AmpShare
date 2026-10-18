import { z } from "zod";

// "HH:MM" in 24h format, e.g. "08:00", "17:30"
const startTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM in 24-hour format");

const endTimeSchema = z
  .string()
  .regex(/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/, "Time must be HH:MM in 24-hour format");

const dayOfWeekSchema = z.number().int().min(0).max(6);

function endAfterStart(d: { startTime: string; endTime: string }): boolean {
  return d.endTime > d.startTime;
}

// ---------- params ----------
export const chargerScheduleParamsSchema = z.object({
  chargerId: z.string().uuid(),
});
export type ChargerScheduleParams = z.infer<typeof chargerScheduleParamsSchema>;

export const scheduleIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export type ScheduleIdParams = z.infer<typeof scheduleIdParamsSchema>;

// ---------- POST /api/chargers/:chargerId/schedules ----------
export const createScheduleSchema = z
  .object({
    dayOfWeek: dayOfWeekSchema,
    startTime: startTimeSchema,
    endTime: endTimeSchema,
  })
  .strict()
  .refine(endAfterStart, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

// ---------- PATCH /api/schedules/:id ----------
export const updateScheduleSchema = z
  .object({
    dayOfWeek: dayOfWeekSchema.optional(),
    startTime: startTimeSchema.optional(),
    endTime: endTimeSchema.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (d) => d.startTime === undefined || d.endTime === undefined || d.endTime > d.startTime,
    { message: "endTime must be after startTime", path: ["endTime"] }
  );
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;