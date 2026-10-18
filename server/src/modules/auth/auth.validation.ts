import { z } from "zod";
import { isValidPhoneNumber, normalizePhoneNumber } from "../../utils/phone";

export const registerSchema = z.object({
  fullName: z
    .string({ message: "Full name is required" })
    .trim()
    .min(1, "Full name cannot be empty")
    .max(100, "Full name must not exceed 100 characters"),
  phoneNumber: z
    .string({ message: "Phone number is required" })
    .trim()
    .min(1, "Phone number cannot be empty")
    .max(20, "Phone number must not exceed 20 characters")
    .refine((val) => isValidPhoneNumber(val), {
      message: "Invalid phone number format",
    })
    .transform((val) => normalizePhoneNumber(val)),
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .refine((val) => Buffer.byteLength(val, "utf8") <= 72, {
      message: "Password cannot exceed 72 bytes",
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phoneNumber: z
    .string({ message: "Phone number is required" })
    .trim()
    .min(1, "Phone number cannot be empty")
    .max(20, "Phone number must not exceed 20 characters")
    .refine((val) => isValidPhoneNumber(val), {
      message: "Invalid phone number format",
    })
    .transform((val) => normalizePhoneNumber(val)),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password cannot be empty"),
});

export type LoginInput = z.infer<typeof loginSchema>;
