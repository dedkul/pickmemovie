// Pure geometry, kept apart from geoapify.ts (which uses next/cache) so client
// components can import it.

export const CBD = { lat: -33.8688, lng: 151.2093 };
export const COVERAGE_KM = 60;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Used when routing fails: road ≈ 1.3× straight line, slower in the inner city.
// Same model as the prototype, minus its parking allowance (that belongs to reachability).
export function estimateDriveMinutes(km: number): number {
  return Math.round(((km * 1.3) / (km < 5 ? 22 : 34)) * 60);
}
