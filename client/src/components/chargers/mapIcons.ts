import { icon } from "@fortawesome/fontawesome-svg-core";
import { faChargingStation } from "@fortawesome/free-solid-svg-icons";
import L from "leaflet";

export function stationIcon(active: boolean) {
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

export const userIcon = L.divIcon({
  className: "",
  html: '<span class="user-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});