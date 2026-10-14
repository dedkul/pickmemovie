import { cacheLife } from "next/cache";
import { CINEMAS } from "./cinemas";

export type Place = { name: string; sub: string; lat: number; lng: number };
export type DriveTime = { cinemaId: string; minutes: number; estimated: boolean };

export const CBD = { lat: -37.8136, lng: 144.9631 };
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

type GeoapifyPlace = { suburb?: string; name?: string; city?: string; postcode?: string; state_code?: string; lat: number; lon: number };

export function toPlace(r: GeoapifyPlace): Place {
  return {
    name: r.suburb ?? r.name ?? r.city ?? "",
    sub: [r.state_code, r.postcode].filter(Boolean).join(" "),
    lat: r.lat,
    lng: r.lon,
  };
}

type MatrixCell = { time: number; distance: number } | null;

// Seconds → whole minutes, rounded up; cinemas the router couldn't reach get an estimate.
export function toDriveTimes(origin: { lat: number; lng: number }, row: MatrixCell[] | undefined): DriveTime[] {
  return CINEMAS.map((c, i) => {
    const cell = row?.[i];
    return cell && Number.isFinite(cell.time)
      ? { cinemaId: c.id, minutes: Math.ceil(cell.time / 60), estimated: false }
      : { cinemaId: c.id, minutes: estimateDriveMinutes(haversineKm(origin, c)), estimated: true };
  });
}

export function estimateAll(origin: { lat: number; lng: number }): DriveTime[] {
  return toDriveTimes(origin, undefined);
}

// Suburbs and postcodes within the coverage circle. Geoapify's type=postcode
// returns suburb-level results ("Fitzroy VIC 3065"); type=suburb returns nothing.
export async function searchPlaces(text: string): Promise<Place[]> {
  "use cache";
  cacheLife("days");
  const qs = new URLSearchParams({
    text,
    type: "postcode",
    filter: `circle:${CBD.lng},${CBD.lat},${COVERAGE_KM * 1000}`,
    bias: `proximity:${CBD.lng},${CBD.lat}`,
    limit: "6",
    lang: "en",
    format: "json",
    apiKey: process.env.GEOAPIFY_API_KEY ?? "",
  });
  const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${qs}`);
  if (!res.ok) throw new Error(`Geoapify autocomplete ${res.status}`);
  const data: { results?: GeoapifyPlace[] } = await res.json();
  return (data.results ?? []).map(toPlace);
}

// One call for origin × every cinema. Throws on failure so errors aren't cached;
// the caller falls back to estimateAll(). Pass an origin already rounded, so
// nearby searches share a cache entry.
export async function routeMatrix(lat: number, lng: number): Promise<DriveTime[]> {
  "use cache";
  cacheLife("days");
  const res = await fetch(`https://api.geoapify.com/v1/routematrix?apiKey=${process.env.GEOAPIFY_API_KEY ?? ""}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "drive",
      sources: [{ location: [lng, lat] }],
      targets: CINEMAS.map(c => ({ location: [c.lng, c.lat] })),
    }),
  });
  if (!res.ok) throw new Error(`Geoapify routematrix ${res.status}`);
  const data: { sources_to_targets?: MatrixCell[][] } = await res.json();
  return toDriveTimes({ lat, lng }, data.sources_to_targets?.[0]);
}
