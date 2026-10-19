import { z } from "zod";

export const startSessionSchema = z
  .object({ bookingId: z.string().uuid() })
  .strict();

export const sessionIdParamSchema = z.object({ id: z.string().uuid() });

export const finishSessionSchema = z
  .object({
    // NUMERIC(10,3) holds up to 9,999,999.999
    energyDeliveredKwh: z.number().finite().nonnegative().max(9999999),
  })
  .strict();
