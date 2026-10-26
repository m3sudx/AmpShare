import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReview,
  getBookingReview,
  listChargerReviews,
} from "../services/reviews.api";

export function useBookingReview(bookingId: string) {
  return useQuery({
    queryKey: ["booking-review", bookingId],
    queryFn: () => getBookingReview(bookingId),
    enabled: Boolean(bookingId),
  });
}

export function useChargerReviews(chargerId: string) {
  return useQuery({
    queryKey: ["charger-reviews", chargerId],
    queryFn: () => listChargerReviews(chargerId),
    enabled: Boolean(chargerId),
  });
}
export function useCreateReview(bookingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { rating: number; comment?: string }) => createReview(bookingId, input),
    onSuccess: (review) => {
      void queryClient.invalidateQueries({ queryKey: ["booking-review", bookingId] });
      void queryClient.invalidateQueries({ queryKey: ["charger-reviews", review.chargerId] });
      // refresh every charger list/detail query so the new average shows up
      void queryClient.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).toLowerCase().includes("charger"),
      });
    },
  });
}