import { CBD, COVERAGE_KM, estimateAll, haversineKm, routeMatrix } from "@/app/lib/geoapify";

// GET /api/drive-times?lat=-37.79&lng=144.97 → { driveTimes: DriveTime[] }
// Real driving times from Geoapify; if routing fails, distance-based estimates
// (each marked `estimated`) so results still show.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat")), lng = Number(params.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: "lat and lng are required" }, { status: 400 });
  }
  if (haversineKm({ lat, lng }, CBD) > COVERAGE_KM) {
    return Response.json({ error: "Outside Melbourne coverage" }, { status: 400 });
  }
  // ~100 m grid, so nearby searches share one cached routing call
  const origin = { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
  try {
    return Response.json({ driveTimes: await routeMatrix(origin.lat, origin.lng) });
  } catch (err) {
    console.error(err);
    return Response.json({ driveTimes: estimateAll(origin) });
  }
}
