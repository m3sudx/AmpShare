import { z } from "zod";

// ---------- Shared ----------

const plugTypeSchema = z.enum(["GB/T", "TYPE_2", "CCS2"]);

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

// ---------- GET /api/chargers/nearby ----------

export const nearbyChargersQuerySchema = z.object({
  lat: z.coerce
    .number()
    .finite()
    .min(-90)
    .max(90),

  lng: z.coerce
    .number()
    .finite()
    .min(-180)
    .max(180),

  radius: z.coerce
    .number()
    .int()
    .positive()
    .max(50000)
    .default(5000),

  plugType: plugTypeSchema.optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export type NearbyChargersQuery = z.infer<
  typeof nearbyChargersQuerySchema
>;

// ---------- POST /api/chargers ----------

export const createChargerSchema = z
  .object({
    title: z.string().trim().min(1).max(100),

    addressDescription: z.string().trim().min(1),

    // NUMERIC(6,2): at most 9999.99
    powerKw: z.number().finite().positive().max(9999.99),

    plugType: plugTypeSchema,

    // NUMERIC(8,2): at most 999999.99, in ETB per kWh
    pricePerKwh: z.number().finite().positive().max(999999.99),

    timezoneName: z
      .string()
      .refine(isValidTimezone, { message: "Invalid IANA time zone" })
      .default("Africa/Addis_Ababa"),

    location: z.object({
      latitude: z.number().finite().min(-90).max(90),
      longitude: z.number().finite().min(-180).max(180),
    }),
  })
  .strict(); // rejects unknown keys such as hostId, id, isActive, createdAt

export type CreateChargerInput = z.infer<typeof createChargerSchema>;

// ---------- GET /api/chargers ----------

export const listChargersQuerySchema = z.object({
  plugType: plugTypeSchema.optional(),

  // minimum power in kW
  minPowerKw: z.coerce.number().finite().min(0).optional(),

  // maximum price in ETB per kWh
  maxPricePerKwh: z.coerce.number().finite().positive().optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListChargersQuery = z.infer<typeof listChargersQuerySchema>;

// ---------- Shared: :id route param (GET /:id, and later PATCH, DELETE) ----------

export const chargerIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type ChargerIdParams = z.infer<typeof chargerIdParamsSchema>;


// ---------- PATCH /api/chargers/:id ----------

export const updateChargerSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),

    addressDescription: z.string().trim().min(1).optional(),

    // NUMERIC(6,2): at most 9999.99
    powerKw: z.number().finite().positive().max(9999.99).optional(),

    plugType: plugTypeSchema.optional(),

    // NUMERIC(8,2): at most 999999.99, in ETB per kWh
    pricePerKwh: z.number().finite().positive().max(999999.99).optional(),

    timezoneName: z
      .string()
      .refine(isValidTimezone, { message: "Invalid IANA time zone" })
      .optional(),

    location: z
      .object({
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
      })
      .optional(),

    isActive: z.boolean().optional(),
  })
  .strict() // rejects unknown keys such as hostId, id, createdAt
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateChargerInput = z.infer<typeof updateChargerSchema>;