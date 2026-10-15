import type { Session } from "./serpapi";

// Seeded sample sessions, ported from prototypes/v10.html. Deterministic per
// (date, cinema) so the list doesn't shuffle between requests.

// Only used before any real fetch has succeeded (e.g. a fresh deploy).
const FALLBACK_TITLES = [
  "Alien: Romulus", "Inside Out 2", "Deadpool & Wolverine", "Longlegs", "The Substance",
  "Dune: Part Two", "The Wild Robot", "Wicked", "Civil War",
];

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mockSessions(cinemaId: string, cinemaIndex: number, date: string, titles: string[]): Session[] {
  const pool = titles.length ? [...titles].sort() : FALLBACK_TITLES;
  const [y, m, d] = date.split("-").map(Number);
  const r = rng((y * 400 + m * 32 + d) * 97 + cinemaIndex);
  const picks = [...pool].sort(() => r() - 0.5).slice(0, 3);
  return picks.flatMap(title => {
    const starts = [600 + 5 * Math.floor(r() * 78), 1020 + 5 * Math.floor(r() * 48)];
    if (r() < 0.45) starts.push(1260 + 5 * Math.floor(r() * 20));
    if (r() < 0.12) starts.push(1440 + 5 * Math.floor(r() * 10)); // 12:00–12:45 am
    return starts.map(startMin => ({ cinemaId, title, date, startMin, format: "Standard" }));
  });
}
