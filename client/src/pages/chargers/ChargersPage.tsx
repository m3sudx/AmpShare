import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ChargerFilters from "../chargers/ChargerFilters";
import ChargerList from "../../components/chargers/ChargerList";
import ChargersMap from "../chargers/ChargersMap";
import { useChargerSearch } from "../../hooks/useChargerSearch";
import { useChargersLive } from "../../hooks/useChargerLive"; 
import { getRoute } from "../../services/routing.api";
import type { NearbyCharger } from "../../types/charger";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function ChargersPage() {
    usePageTitle("Find Chargers")
  const { chargers, query, filters, update, reset } = useChargerSearch();
  useChargersLive(); // NEW: refetch the list when a host pauses, activates or edits a charger
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [locationDenied, setLocationDenied] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeTo, setRouteTo] = useState<NearbyCharger | null>(null);

  const routeQuery = useQuery({
    queryKey: ["route", userLocation, routeTo?.id],
    queryFn: () =>
      getRoute(userLocation!, {
        lat: routeTo!.location.latitude,
        lng: routeTo!.location.longitude,
      }),
    enabled: !!userLocation && !!routeTo,
  });

  function locateMe() {
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        update({ lat: latitude, lng: longitude });
      },
      () => setLocationDenied(true),
    );
  }

  function handleDirections(charger: NearbyCharger) {
    if (!userLocation) locateMe(); // the route loads once the location arrives
    setRouteTo(charger);
    setView("map");
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Find Chargers</h1>
        <p className="text-slate-600">Discover nearby EV charging stations.</p>
      </div>

      <ChargerFilters
        values={filters}
        onChange={update}
        onReset={reset}
        onLocate={locateMe}
      />

      {locationDenied && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Location access was denied. Showing chargers around Addis Ababa instead.
        </p>
      )}

      {routeTo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <span>
            {routeQuery.isError
              ? "Couldn't load the route."
              : !userLocation
                ? "Share your location to see directions."
                : routeQuery.isLoading
                  ? "Finding the best route…"
                  : routeQuery.data
                    ? `Route to ${routeTo.title}: ${(routeQuery.data.distanceMeters / 1000).toFixed(1)} km · ${Math.round(routeQuery.data.durationSeconds / 60)} min by car`
                    : null}
          </span>
          <button onClick={() => setRouteTo(null)} className="font-semibold underline">
            Clear route
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {chargers.length} chargers within {filters.radius / 1000} km
        </p>
        <div className="flex overflow-hidden rounded-xl border border-slate-200 text-sm lg:hidden">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 capitalize ${
                view === v ? "bg-[#0F9468] text-white" : "bg-white text-slate-700"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <div
          className={`lg:h-[calc(100vh-22rem)] lg:overflow-y-auto ${
            view === "map" ? "hidden lg:block" : ""
          }`}
        >
          <ChargerList
            chargers={chargers}
            isLoading={query.isLoading}
            isError={query.isError}
            onRetry={() => query.refetch()}
            onWiden={() => update({ radius: Math.min(filters.radius * 2, 50000) })}
            activeId={activeId}
            onHover={setActiveId}
          />
        </div>

        <div
          className={`h-105 lg:h-[calc(100vh-22rem)] ${
            view === "list" ? "hidden lg:block" : ""
          }`}
        >
          <ChargersMap
            key={view}
            center={{ lat: filters.lat, lng: filters.lng }}
            userLocation={userLocation}
            chargers={chargers}
            activeId={activeId}
            onHover={setActiveId}
            route={routeTo ? (routeQuery.data?.coords ?? null) : null}
            onDirections={handleDirections}
          />
        </div>
      </div>
    </section>
  );
}