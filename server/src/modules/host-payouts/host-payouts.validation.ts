import { z } from "zod";

export const recordManualPayoutBodySchema = z.object({
  providerReference: z
    .string()
    .min(3, { message: "External transfer or Telebirr reference is required" })
    .max(150),
  notes: z.string().max(500).optional(),
});

export const payoutIdParamsSchema = z.object({
  id: z.string().uuid({ message: "A valid payout ID is required" }),
});

export type RecordManualPayoutInput = z.infer<typeof recordManualPayoutBodySchema>;
