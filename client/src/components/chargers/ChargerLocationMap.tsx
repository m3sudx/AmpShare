import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { stationIcon, userIcon } from "./mapIcons";

function FitRoute({
  route,
  lat,
  lng,
}: {
  route: [number, number][] | null;
  lat: number;
  lng: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 1) map.fitBounds(route, { padding: [40, 40] });
    else map.setView([lat, lng], 15); // back to the charger when the route is cleared
  }, [route, map, lat, lng]);
  return null;
}

interface Props {
  lat: number;
  lng: number;
  userLocation: { lat: number; lng: number } | null;
  route: [number, number][] | null;
}

export default function ChargerLocationMap({ lat, lng, userLocation, route }: Props) {
  const icon = useMemo(() => stationIcon(false), []);
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitRoute route={route} lat={lat} lng={lng} />

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

      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  );
}