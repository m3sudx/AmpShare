import { api } from "./api";
import type { ApiResponse } from "../types/auth";
import type { Review, ReviewSummary } from "../types/review";

export interface BookingReviewData {
  review: Review | null;
  canReview: boolean;
}

export interface ChargerReviewsData {
  reviews: Review[];
  summary: ReviewSummary;
  page: number;
  limit: number;
}

export async function getBookingReview(bookingId: string): Promise<BookingReviewData> {
  const res = await api.get<ApiResponse<BookingReviewData>>(`/bookings/${bookingId}/review`);
  return res.data.data;
}

export async function createReview(
  bookingId: string,
  input: { rating: number; comment?: string },
): Promise<Review> {
  const res = await api.post<ApiResponse<{ review: Review }>>(
    `/bookings/${bookingId}/review`,
    input,
  );
  return res.data.data.review;
}

export async function listChargerReviews(chargerId: string, limit = 10): Promise<ChargerReviewsData> {
  const res = await api.get<ApiResponse<ChargerReviewsData>>(`/chargers/${chargerId}/reviews`, {
    params: { limit },
  });
  return res.data.data;
}