import { z } from "zod";

export const bookingIdParams = z.object({ bookingId: z.string().uuid() });
export const chargerIdParams = z.object({ chargerId: z.string().uuid() });

export const createReviewBody = z.object({
  rating: z.number().int().min(1, "Choose 1 to 5 stars").max(5, "Choose 1 to 5 stars"),
  comment: z
    .string()
    .trim()
    .max(500, "Comment must be 500 characters or fewer")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const listReviewsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateReviewInput = z.infer<typeof createReviewBody>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuery>;