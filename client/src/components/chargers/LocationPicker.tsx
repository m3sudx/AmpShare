import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { stationIcon } from "./mapIcons";

function ClickToSet({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) });
  return null;
}

// when the point is typed or comes from "Use my location", pan only if it left the view
function KeepInView({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getBounds().contains([lat, lng])) map.panTo([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const icon = useMemo(() => stationIcon(false), []);
  return (
    <div className="relative h-72 overflow-hidden rounded-xl">
      <MapContainer center={[lat, lng]} zoom={14} className="z-0 h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToSet onChange={onChange} />
        <KeepInView lat={lat} lng={lng} />
        <Marker
          position={[lat, lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = (e.target as L.Marker).getLatLng();
              onChange(p.lat, p.lng);
            },
          }}
        />
      </MapContainer>
      <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow">
        Click the map or drag the pin
      </span>
    </div>
  );
}