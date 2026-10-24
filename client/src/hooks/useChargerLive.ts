import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "../services/socket";

// True when a query key mentions this charger id anywhere
// (covers ["charger", id], ["charger", id, "schedules"], ["schedules", id], ...)
function keyHasId(key: readonly unknown[], id: string) {
  return key.some((part) => part === id);
}

// Charger details page: watch one charger and refetch when it changes
export function useChargerLive(chargerId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chargerId) return;

    const watch = () => socket.emit("charger:watch", chargerId);

    const onAvailability = (payload: { chargerId: string }) => {
      if (payload.chargerId !== chargerId) return;
      queryClient.invalidateQueries({
        predicate: (q) => keyHasId(q.queryKey, chargerId),
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    };

    watch(); // emitted now, or buffered until the socket connects
    socket.on("connect", watch); // re-watch after a reconnect
    socket.on("charger:availability", onAvailability);

    return () => {
      socket.off("connect", watch);
      socket.off("charger:availability", onAvailability);
      socket.emit("charger:unwatch", chargerId);
    };
  }, [chargerId, queryClient]);
}

// Find Chargers page: refetch the list when any charger is paused, activated or edited
export function useChargersLive() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onChanged = () => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const first = q.queryKey[0];
          return typeof first === "string" && first.toLowerCase().includes("charger");
        },
      });
    };

    socket.on("chargers:changed", onChanged);
    return () => {
      socket.off("chargers:changed", onChanged);
    };
  }, [queryClient]);
}