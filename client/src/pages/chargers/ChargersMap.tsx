import { icon } from "@fortawesome/fontawesome-svg-core";
import { faChargingStation } from "@fortawesome/free-solid-svg-icons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { Link } from "react-router";
import type { NearbyCharger } from "../../types/charger";

const PLUG_LABEL = { "GB/T": "GB/T", TYPE_2: "Type 2", CCS2: "CCS2" } as const;

const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

function stationIcon(active: boolean) {
  const color = active ? "#0F172A" : "#0F9468";
  const size = active ? 44 : 38;
  const svg = icon(faChargingStation, {
    styles: { width: `${Math.round(size * 0.5)}px`, height: `${Math.round(size * 0.5)}px` },
  }).html[0];

  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 4px rgba(15,23,42,0.35))">
      <div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center">${svg}</div>
      <div style="width:0;height:0;margin-top:-2px;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid ${color}"></div>
    </div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
    tooltipAnchor: [0, -(size + 8)],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: '<span class="user-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

function FitRoute({ route }: { route: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 1) map.fitBounds(route, { padding: [40, 40] });
  }, [route, map]);
  return null;
}

function DirectionsButton({ onClick }: { onClick: () => void }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => {
        map.closePopup();
        onClick();
      }}
      className="flex-1 rounded-xl border border-[#0F9468] px-3 py-2 text-center text-sm font-semibold text-[#0F9468]"
    >
      Directions
    </button>
  );
}

interface Props {
  center: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  chargers: NearbyCharger[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  route: [number, number][] | null;
  onDirections: (charger: NearbyCharger) => void;
}

export default function ChargersMap({
  center,
  userLocation,
  chargers,
  activeId,
  onHover,
  route,
  onDirections,
}: Props) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="z-0 h-full w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center.lat} lng={center.lng} />
      <FitRoute route={route} />

      {route && (
        <Polyline positions={route} pathOptions={{ color: "#2563EB", weight: 5, opacity: 0.85 }} />
      )}

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userIcon}
          interactive={false}
          zIndexOffset={1000}
        />
      )}

      {chargers.map((c) => (
        <Marker
          key={c.id}
          position={[c.location.latitude, c.location.longitude]}
          icon={stationIcon(c.id === activeId)}
          eventHandlers={{
            mouseover: (e) => {
              onHover(c.id);
              // don't show the small tooltip on top of an open popup
              const marker = e.target as L.Marker;
              if (marker.isPopupOpen()) window.setTimeout(() => marker.closeTooltip(), 0);
            },
            mouseout: () => onHover(null),
            popupopen: (e) => (e.target as L.Marker).closeTooltip(),
          }}
        >
          <Tooltip direction="top" opacity={1} className="charger-tooltip">
            <span className="font-semibold text-slate-900">{c.title}</span>
            <span className="text-slate-500"> · </span>
            <span className="font-semibold text-[#0F9468]">{c.pricePerKwh.toFixed(2)} ETB/kWh</span>
          </Tooltip>

          <Popup
            className="charger-popup"
            closeButton={false}
            minWidth={270}
            autoPan
            autoPanPadding={[24, 24]}
          >
            <div className="p-4">
              <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
              <p className="text-sm text-slate-500">Electric vehicle charging station</p>
              <p className="mt-1 text-sm font-semibold text-[#0F9468]">
                {c.pricePerKwh.toFixed(2)} ETB / kWh
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{PLUG_LABEL[c.plugType]}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{c.powerKw} kW</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">
                  {formatDistance(c.distanceMeters)} away
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <DirectionsButton onClick={() => onDirections(c)} />
                <Link
                  to={`/chargers/${c.id}`}
                  className="flex-1 rounded-xl bg-[#0F9468] px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  View details
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}