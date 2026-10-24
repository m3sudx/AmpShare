import { z } from "zod";
import { isValidPhoneNumber, normalizePhoneNumber } from "../../utils/phone";

export const initiatePaymentBodySchema = z.object({
  bookingId: z.string().uuid({ message: "A valid booking ID is required" }),
  customerPhone: z
    .string()
    .min(9, { message: "Customer phone number is too short" })
    .max(20, { message: "Customer phone number is too long" })
    .refine((val) => isValidPhoneNumber(val), {
      message: "Please enter a valid phone number (e.g., 0911234567 or +251911234567)",
    })
    .transform((val) => normalizePhoneNumber(val)),
});

export const paymentIdParamsSchema = z.object({
  id: z.string().uuid({ message: "A valid payment ID is required" }),
});

export const bookingIdParamsSchema = z.object({
  bookingId: z.string().uuid({ message: "A valid booking ID is required" }),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentBodySchema>;
