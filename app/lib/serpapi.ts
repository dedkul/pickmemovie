import type { Cinema } from "./cinemas";
import { addDays, melbourneDate } from "./melbourne-time";

// One session at one cinema. `date` is the night you go out (Melbourne), and
// `startMin` is minutes after that date's midnight; after-midnight sessions run
// past 1440 so they stay with the night before, as in the prototype.
export type Session = {
  cinemaId: string;
  title: string;
  date: string;
  startMin: number;
  format: string;
};

type SerpShowing = { time?: string[]; type?: string };
type SerpMovie = { name?: string; showing?: SerpShowing[] };
type SerpDay = { day?: string; date?: string; movies?: SerpMovie[] };
export type SerpResponse = {
  search_metadata?: { created_at?: string };
  showtimes?: SerpDay[];
};

const AFTER_MIDNIGHT_UNTIL = 5 * 60; // a 1:30 am session belongs to the previous night
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "1:40pm" → 820; "12:15am" → 1455 (after midnight). null if unreadable.
export function parseTime(text: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i.exec(text.trim());
  if (!m) return null;
  const h = Number(m[1]) % 12 + (m[3].toLowerCase() === "p" ? 12 : 0);
  const min = h * 60 + Number(m[2]);
  return min < AFTER_MIDNIGHT_UNTIL ? min + 1440 : min;
}

// Google labels the first two days "Today"/"Tomorrow" with no date, and the rest
// "Fri" + "16 Oct". Resolve each to an ISO date relative to when the search ran.
function resolveDay(day: SerpDay, base: string): string | null {
  if (day.day === "Today") return base;
  if (day.day === "Tomorrow") return addDays(base, 1);
  const m = /^(\d{1,2}) (\w{3})/.exec(day.date ?? "");
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]) + 1;
  for (let i = 0; i < 14; i++) {
    const iso = addDays(base, i);
    if (Number(iso.slice(5, 7)) === month && Number(iso.slice(8, 10)) === Number(m[1])) return iso;
  }
  return null;
}

export function parseShowtimes(res: SerpResponse, cinemaId: string): { sessions: Session[]; problems: string[] } {
  const sessions: Session[] = [];
  const problems: string[] = [];
  const created = res.search_metadata?.created_at;
  if (!created || !res.showtimes?.length) return { sessions, problems: ["no showtimes in response"] };

  // created_at looks like "2026-10-14 00:27:16 UTC"
  const base = melbourneDate(new Date(created.replace(" UTC", "Z").replace(" ", "T")));
  for (const day of res.showtimes) {
    const date = resolveDay(day, base);
    if (!date) { problems.push(`unreadable day: ${day.day} ${day.date ?? ""}`.trim()); continue; }
    for (const movie of day.movies ?? []) {
      if (!movie.name) continue;
      for (const showing of movie.showing ?? []) {
        for (const t of showing.time ?? []) {
          const startMin = parseTime(t);
          if (startMin === null) { problems.push(`unreadable time: ${t}`); continue; }
          sessions.push({ cinemaId, title: movie.name, date, startMin, format: showing.type ?? "Standard" });
        }
      }
    }
  }
  return { sessions, problems };
}

// One paid search. Only the daily refresh job calls this — never a page request.
export async function fetchShowtimes(cinema: Cinema): Promise<SerpResponse> {
  const params = new URLSearchParams({
    engine: "google",
    q: cinema.query,
    gl: "au",
    hl: "en",
    location: "Melbourne,Victoria,Australia",
    api_key: process.env.SERPAPI_KEY ?? "",
  });
  const res = await fetch(`https://serpapi.com/search.json?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`SerpAPI ${res.status} for ${cinema.id}`);
  return res.json();
}

// Free call: account status doesn't count against the monthly searches.
export async function searchesLeft(): Promise<number> {
  const res = await fetch(`https://serpapi.com/account.json?api_key=${process.env.SERPAPI_KEY ?? ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`SerpAPI account ${res.status}`);
  const data: { total_searches_left?: number } = await res.json();
  return data.total_searches_left ?? 0;
}
