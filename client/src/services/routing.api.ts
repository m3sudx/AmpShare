export interface RouteResult {
  coords: [number, number][]; // [lat, lng] pairs for Leaflet
  distanceMeters: number;
  durationSeconds: number;
}

export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load the route");
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("No route found");
  return {
    coords: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}