import { searchPlaces } from "@/app/lib/geoapify";

// GET /api/location-suggestions?q=fitz → { places: Place[] }
// Proxies Geoapify so the key stays on the server.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 60) return Response.json({ places: [] });
  try {
    return Response.json({ places: await searchPlaces(q) });
  } catch (err) {
    console.error(err);
    return Response.json({ places: [], error: "Suggestions are unavailable right now" }, { status: 502 });
  }
}
