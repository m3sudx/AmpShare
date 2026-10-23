import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState } from "react";
import { Link, useParams } from "react-router";
import AvailabilityCard from "../../components/chargers/AvailabilityCard";
import ChargerLocationMap from "../../components/chargers/ChargerLocationMap";
import { useCharger, useChargerSchedules } from "../../hooks/useChargerDetails";
import { getRoute } from "../../services/routing.api";
import {
  formatSlot,
  slotsForDay,
  todayIndex,
} from "../../utils/scheduleFormat";

const PLUG_LABEL = { "GB/T": "GB/T", TYPE_2: "Type 2", CCS2: "CCS2" } as const;

const svgProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const BoltIcon = () => (
  <svg {...svgProps}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const PlugIcon = () => (
  <svg {...svgProps}>
    <path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 01-4 4h-4a4 4 0 01-4-4V8z" />
  </svg>
);
const PriceIcon = () => (
  <svg {...svgProps}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);
const PinIcon = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const BackIcon = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const DirectionsIcon = () => (
  <svg {...svgProps} width={18} height={18}>
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
);

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F6F0] text-[#0B7A55]">
        {icon}
      </span>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="text-xl font-bold text-slate-900">{children}</div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/chargers"
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
    >
      <BackIcon />
      Back to chargers
    </Link>
  );
}

export default function ChargerDetailsPage() {
  const { id } = useParams();
  const chargerQuery = useCharger(id);
  const schedulesQuery = useChargerSchedules(id);

  // Directions state (hooks must stay above the early returns below)
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const charger = chargerQuery.data;
  const routeQuery = useQuery({
    queryKey: ["route", userLocation, id],
    queryFn: () =>
      getRoute(userLocation!, {
        lat: charger!.location.latitude,
        lng: charger!.location.longitude,
      }),
    enabled: showRoute && !!userLocation && !!charger,
  });

  function handleDirections() {
    setShowRoute(true);
    if (userLocation) return;
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {
        setLocationDenied(true);
        setShowRoute(false);
      },
    );
  }

  if (chargerQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (chargerQuery.isError || !chargerQuery.data) {
    const notFound =
      isAxiosError(chargerQuery.error) &&
      chargerQuery.error.response?.status === 404;
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            {notFound ? "Charger not found" : "Couldn't load this charger"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {notFound
              ? "It may have been removed or is no longer listed."
              : "Check your connection and try again."}
          </p>
          {!notFound && (
            <button
              onClick={() => chargerQuery.refetch()}
              className="mt-4 rounded-xl bg-[#0F9468] px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const c = chargerQuery.data;
  const schedules = schedulesQuery.data ?? [];
  const todaySlots = slotsForDay(schedules, todayIndex(c.timezoneName));
  const openToday = schedulesQuery.isLoading
    ? "…"
    : schedules.length === 0
      ? "Not set"
      : todaySlots.length
        ? todaySlots.map(formatSlot).join(", ")
        : "Closed";

  return (
    <div className="space-y-5">
      <BackLink />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl font-extrabold leading-tight text-slate-900">
                {c.title}
              </h1>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  c.isActive
                    ? "bg-[#E7F6F0] text-[#0B7A55]"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${c.isActive ? "bg-[#0F9468]" : "bg-amber-600"}`}
                />
                {c.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="flex items-center gap-2 text-slate-600">
              <PinIcon />
              {c.addressDescription}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                {PLUG_LABEL[c.plugType]}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                {c.powerKw} kW
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">
                {c.timezoneName}
              </span>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat icon={<BoltIcon />} label="Power">
              {c.powerKw} kW
            </Stat>
            <Stat icon={<PlugIcon />} label="Plug type">
              {PLUG_LABEL[c.plugType]}
            </Stat>
            <Stat icon={<PriceIcon />} label="Price">
              {c.pricePerKwh.toFixed(2)}{" "}
              <span className="text-sm font-medium text-slate-500">
                ETB / kWh
              </span>
            </Stat>
          </div>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-900">Location</h2>
              <span className="text-sm text-slate-500">
                {c.location.latitude.toFixed(4)},{" "}
                {c.location.longitude.toFixed(4)}
              </span>
            </div>

            {showRoute && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <span>
                  {routeQuery.isError
                    ? "Couldn't load the route."
                    : !userLocation || routeQuery.isLoading
                      ? "Finding the best route…"
                      : routeQuery.data
                        ? `${(routeQuery.data.distanceMeters / 1000).toFixed(1)} km · ${Math.round(routeQuery.data.durationSeconds / 60)} min by car`
                        : null}
                </span>
                <button
                  onClick={() => setShowRoute(false)}
                  className="font-semibold underline"
                >
                  Clear route
                </button>
              </div>
            )}

            <div className="h-72 overflow-hidden rounded-xl">
              <ChargerLocationMap
                lat={c.location.latitude}
                lng={c.location.longitude}
                userLocation={showRoute ? userLocation : null}
                route={showRoute ? (routeQuery.data?.coords ?? null) : null}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDirections}
                className="inline-flex items-center gap-2 rounded-xl border border-[#0F9468] px-4 py-2.5 text-sm font-semibold text-[#0F9468]"
              >
                <DirectionsIcon />
                Get directions
              </button>
              {locationDenied && (
                <span className="text-sm text-amber-700">
                  Location access was denied, so we can't draw the route from
                  you.
                </span>
              )}
            </div>
          </section>

          <AvailabilityCard
            schedules={schedules}
            timeZone={c.timezoneName}
            isLoading={schedulesQuery.isLoading}
            isError={schedulesQuery.isError}
          />
        </div>

        <aside className="lg:sticky lg:top-6">
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Price
              </div>
              <div className="text-3xl font-extrabold text-[#0B7A55]">
                {c.pricePerKwh.toFixed(2)}{" "}
                <span className="text-base font-medium text-slate-500">
                  ETB / kWh
                </span>
              </div>
            </div>
            <div className="h-px bg-slate-200" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Plug type</dt>
                <dd className="font-semibold">{PLUG_LABEL[c.plugType]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Power</dt>
                <dd className="font-semibold">{c.powerKw} kW</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Open today</dt>
                <dd className="text-right font-semibold">{openToday}</dd>
              </div>
            </dl>

            {c.isActive ? (
              <Link
                to={`/chargers/${c.id}/book`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0F9468] px-4 text-base font-bold text-white hover:bg-[#0c7a56]"
              >
                <BoltIcon />
                Book this charger
              </Link>
            ) : (
              <div className="rounded-xl bg-amber-50 p-3 text-center text-sm font-medium text-amber-800">
                This charger is not accepting bookings right now.
              </div>
            )}
            <p className="text-sm leading-relaxed text-slate-500">
              Next you will choose a vehicle and a time slot inside the hours
              shown on the left.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
