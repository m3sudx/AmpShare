import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "../../utils/geo";

const pin = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:9999px;background:#0F9468;border:3px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function ClickToPlace({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ value }: { value: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([value.latitude, value.longitude]);
  }, [value.latitude, value.longitude, map]);
  return null;
}

interface Props {
  value: LatLng;
  onChange: (v: LatLng) => void;
}

export default function LocationPicker({ value, onChange }: Props) {
  return (
    <div className="h-72 overflow-hidden rounded-xl border border-slate-300">
      <MapContainer
        center={[value.latitude, value.longitude]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPlace onChange={onChange} />
        <Recenter value={value} />
        <Marker position={[value.latitude, value.longitude]} icon={pin} />
      </MapContainer>
    </div>
  );
}
