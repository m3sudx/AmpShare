import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { getNearbyChargers } from "../services/chargers.api";
import type { PlugType } from "../types/charger";

export const DEFAULT_CENTER = { lat: 9.03, lng: 38.74 }; // Addis Ababa
export type SortKey = "nearest" | "price" | "power";

const PLUGS: PlugType[] = ["GB/T", "TYPE_2", "CCS2"];

const num = (v: string | null) => {
  const n = v === null || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export function useChargerSearch() {
  const [params, setParams] = useSearchParams();

  const plug = params.get("plugType") as PlugType | null;
  const filters = {
    lat: num(params.get("lat")) ?? DEFAULT_CENTER.lat,
    lng: num(params.get("lng")) ?? DEFAULT_CENTER.lng,
    radius: num(params.get("radius")) ?? 5000, // meters
    plugType: plug && PLUGS.includes(plug) ? plug : undefined,
    minPowerKw: num(params.get("minPower")),
    maxPrice: num(params.get("maxPrice")),
    sort: (params.get("sort") as SortKey) || "nearest",
  };

  const query = useQuery({
    queryKey: ["chargers", "nearby", filters.lat, filters.lng, filters.radius, filters.plugType],
    queryFn: () =>
      getNearbyChargers({
        lat: filters.lat,
        lng: filters.lng,
        radius: filters.radius,
        plugType: filters.plugType,
        limit: 100,
      }),
    placeholderData: keepPreviousData,
  });

  const chargers = useMemo(() => {
    const list = (query.data ?? []).filter(
      (c) =>
        (filters.minPowerKw === undefined || c.powerKw >= filters.minPowerKw) &&
        (filters.maxPrice === undefined || c.pricePerKwh <= filters.maxPrice),
    );
    const by = {
      nearest: (a: typeof list[0], b: typeof list[0]) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0),
      price: (a: typeof list[0], b: typeof list[0]) => a.pricePerKwh - b.pricePerKwh,
      power: (a: typeof list[0], b: typeof list[0]) => b.powerKw - a.powerKw,
    }[filters.sort];
    return [...list].sort(by);
  }, [query.data, filters.minPowerKw, filters.maxPrice, filters.sort]);

  // Pass undefined/"" to remove a param. Keys: lat, lng, radius, plugType, minPower, maxPrice, sort
  function update(changes: Record<string, string | number | undefined>) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) {
          if (v === undefined || v === "") next.delete(k);
          else next.set(k, String(v));
        }
        return next;
      },
      { replace: true },
    );
  }

  return { filters, chargers, query, update, reset: () => setParams({}, { replace: true }) };
}