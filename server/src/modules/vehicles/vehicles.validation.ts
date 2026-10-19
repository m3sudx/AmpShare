import { z } from "zod";

export const PLUG_TYPES = ["GB/T", "TYPE_2", "CCS2"] as const;

export const createVehicleSchema = z
  .object({
    make: z
      .string({ message: "Make is required" })
      .trim()
      .min(1, "Make cannot be empty")
      .max(50, "Make must not exceed 50 characters"),
    model: z
      .string({ message: "Model is required" })
      .trim()
      .min(1, "Model cannot be empty")
      .max(50, "Model must not exceed 50 characters"),
    batteryCapacityKwh: z
      .number({ message: "Battery capacity (kWh) is required" })
      .finite("Battery capacity must be a finite number")
      .positive("Battery capacity must be greater than 0")
      .max(9999.99, "Battery capacity must fit NUMERIC(6,2)")
      .refine(
        (val) => Number(val.toFixed(2)) === val,
        { message: "Battery capacity can have at most 2 decimal places" }
      ),
    plugType: z.enum(PLUG_TYPES, {
      message: "plugType must be one of: GB/T, TYPE_2, CCS2",
    }),
  })
  .strict();

export const updateVehicleSchema = z
  .object({
    make: z
      .string({ message: "Make must be a string" })
      .trim()
      .min(1, "Make cannot be empty")
      .max(50, "Make must not exceed 50 characters")
      .optional(),
    model: z
      .string({ message: "Model must be a string" })
      .trim()
      .min(1, "Model cannot be empty")
      .max(50, "Model must not exceed 50 characters")
      .optional(),
    batteryCapacityKwh: z
      .number({ message: "Battery capacity must be a number" })
      .finite("Battery capacity must be a finite number")
      .positive("Battery capacity must be greater than 0")
      .max(9999.99, "Battery capacity must fit NUMERIC(6,2)")
      .refine(
        (val) => Number(val.toFixed(2)) === val,
        { message: "Battery capacity can have at most 2 decimal places" }
      )
      .optional(),
    plugType: z
      .enum(PLUG_TYPES, {
        message: "plugType must be one of: GB/T, TYPE_2, CCS2",
      })
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Update request body cannot be empty" }
  );

export const vehicleIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid vehicle UUID format" }),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleIdParam = z.infer<typeof vehicleIdParamSchema>;
