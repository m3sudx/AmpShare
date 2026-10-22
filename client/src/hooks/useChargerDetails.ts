import { useQuery } from "@tanstack/react-query";
import { getCharger } from "../services/chargers.api";
import { listSchedules } from "../services/schedules.api";

export function useCharger(id: string | undefined) {
  return useQuery({
    queryKey: ["charger", id],
    queryFn: () => getCharger(id!),
    enabled: !!id,
    retry: false, // a 404 should show right away
  });
}

export function useChargerSchedules(id: string | undefined) {
  return useQuery({
    queryKey: ["charger", id, "schedules"],
    queryFn: () => listSchedules(id!),
    enabled: !!id,
  });
}