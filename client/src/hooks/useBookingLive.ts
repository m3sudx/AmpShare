import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "../services/socket";

export interface BookingUpdate {
  bookingId: string;
  reason: string;
  at: string;
}

// Run a callback whenever a booking, session or payment you are part of changes.
// Use it directly in pages that load data with useEffect/useState: useBookingEvents(() => reload());
export function useBookingEvents(onUpdate: (update: BookingUpdate) => void) {
  const latest = useRef(onUpdate);

  useEffect(() => {
    latest.current = onUpdate;
  });

  useEffect(() => {
    const handler = (update: BookingUpdate) => latest.current(update);
    socket.on("booking:updated", handler);
    return () => {
      socket.off("booking:updated", handler);
    };
  }, []);
}

// Mounted once for the whole app: refreshes every TanStack Query list or page
// about bookings, sessions or payments.
export function useRealtimeBookings() {
  const queryClient = useQueryClient();

  useBookingEvents(() => {
    queryClient.invalidateQueries({
      predicate: (q) => {
        const first = q.queryKey[0];
        return typeof first === "string" && /booking|session|payment/i.test(first);
      },
    });
  });
}