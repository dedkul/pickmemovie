import { cacheLife } from "next/cache";
import { addDays } from "./sydney-time";

export type Film = {
  tmdbId: number;
  title: string;
  year: string;
  runtime: number | null;
  genres: string[];
  cert: string | null; // AU classification, e.g. "MA 15+"
  overview: string;
  poster: string | null; // TMDb image path, e.g. "/abc.jpg"
  backdrop: string | null;
  trailer: string | null; // YouTube video key
};

export type SearchResult = { id: number; title: string; popularity: number; release_date?: string };

// Cinema listings decorate titles: "Akira 4K", "Don`t Look Now".
export function cleanTitle(title: string): string {
  return title.replace(/`/g, "'").replace(/\s+(4K|3D|IMAX)$/i, "").trim();
}

// Listings and TMDb disagree on accents and ampersands ("Les Heros du Louvre",
// "Sense & Sensibility"), so compare without them.
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/&/g, " and ").replace(/[’']/g, "'").replace(/[^\p{L}\p{N}']+/gu, " ").trim();

// Exact title matches only: a wrong poster and synopsis is worse than none.
// Titles repeat ("Silenced" 2011 vs 2026), so a recent release wins over a more
// famous namesake. A "4K" listing is a restoration, so there the classic wins.
export function pickMatch(title: string, results: SearchResult[], today: string): number | null {
  const want = norm(cleanTitle(title));
  const exact = results.filter(r => norm(r.title) === want);
  if (!exact.length) return null;
  const from = addDays(today, -548), to = addDays(today, 90); // ~18 months back, 3 ahead
  const recent = exact.filter(r => r.release_date && r.release_date >= from && r.release_date <= to);
  const pool = recent.length && !/\s4K$/i.test(title) ? recent : exact;
  return pool.reduce((a, b) => (b.popularity > a.popularity ? b : a)).id;
}

type TmdbDetails = {
  id: number;
  title: string;
  release_date?: string;
  runtime?: number;
  genres?: { name: string }[];
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  videos?: { results: { site: string; type: string; official: boolean; key: string }[] };
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string }[] }[] };
};

export function toFilm(d: TmdbDetails): Film {
  const au = d.release_dates?.results.find(r => r.iso_3166_1 === "AU");
  const trailers = (d.videos?.results ?? []).filter(v => v.site === "YouTube" && v.type === "Trailer");
  return {
    tmdbId: d.id,
    title: d.title,
    year: d.release_date?.slice(0, 4) ?? "",
    runtime: d.runtime || null,
    genres: (d.genres ?? []).map(g => g.name),
    cert: au?.release_dates.map(r => r.certification).find(Boolean) ?? null,
    overview: d.overview ?? "",
    poster: d.poster_path ?? null,
    backdrop: d.backdrop_path ?? null,
    trailer: (trailers.find(v => v.official) ?? trailers[0])?.key ?? null,
  };
}

async function tmdb<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, api_key: process.env.TMDB_API_KEY ?? "", language: "en-AU" });
  const res = await fetch(`https://api.themoviedb.org/3${path}?${qs}`);
  if (!res.ok) throw new Error(`TMDb ${res.status} for ${path}`);
  return res.json();
}

// `today` (Sydney ISO date) is an argument so it's part of the cache key.
export async function matchFilm(title: string, today: string): Promise<number | null> {
  "use cache";
  cacheLife("days");
  const data = await tmdb<{ results: SearchResult[] }>("/search/movie", { query: cleanTitle(title), region: "AU" });
  return pickMatch(title, data.results, today);
}

export async function getFilm(tmdbId: number): Promise<Film> {
  "use cache";
  cacheLife("days");
  return toFilm(await tmdb<TmdbDetails>(`/movie/${tmdbId}`, { append_to_response: "videos,release_dates" }));
}
