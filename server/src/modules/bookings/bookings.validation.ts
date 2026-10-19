import { z } from "zod";

export const createBookingSchema = z
  .object({
    chargerId: z.string().uuid(),
    vehicleId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "endTime must be after startTime",
      });
    }
    if (start <= new Date()) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "startTime must be in the future",
      });
    }
  });

export const bookingIdParamSchema = z.object({ id: z.string().uuid() });

export const listBookingsQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "ACTIVE",
      "COMPLETED",
      "CANCELLED",
      "EXPIRED",
    ])
    .optional(),
});
