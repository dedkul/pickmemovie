import type { Cinema } from "./cinemas";
import { dur, hm, clock, dayShort, NB, type Day } from "./format";
import { estimateDriveMinutes, haversineKm } from "./geo";
import type { ShownSession } from "./snapshot";

// Ported from prototypes/v10.html (PRD §5.4). All times are minutes since
// today's Sydney midnight, so tomorrow 7 pm = 1440 + 1140. (A DST change
// inside the 3-day window can make a later day's times an hour off.)

export const BUFFER_MIN = 10; // arriving up to 10 min late still makes it: that's the trailers
export const PRE_ROLL = 15; // ads + trailers before the film; used for the estimated end time
export const TIGHT_MIN = 20; // under this much slack, flag it
export const NOW_WINDOW = 120; // "Leave now" = sessions starting within the next 2 hours
export const PARK_MIN = 4; // drive times are door to door; this covers parking and walking in

export const T_MIN = 360, T_MAX = 1500, T_STEP = 30; // 1500 = 1 am: after-midnight sessions belong to the night before
export const RADII = [5, 15, 30, 50];

// Presets are shortcuts for a start-time window; the hours are always shown.
export const PRESETS = [
  { id: "morning", name: "Morning", from: 360, to: 720 },
  { id: "afternoon", name: "Afternoon", from: 720, to: 1020 },
  { id: "evening", name: "Evening", from: 1020, to: 1260 },
  { id: "late", name: "Late", from: 1260, to: 1500 },
  { id: "all", name: "All day", from: 360, to: 1500 },
];

export type Origin = { name: string; sub: string; lat: number; lng: number };
export type Mode = "now" | "plan";
// mode 'now'  → today, starting within NOW_WINDOW, reachable from right now
// mode 'plan' → one day × one start-time window [from, to)
// The plan settings are kept while in 'now', so switching back restores them.
export type Filters = { mode: Mode; date: number; from: number; to: number; km: number };

export type Status = "easy" | "tight" | "trailers" | "missed";
export type Evaluated = ShownSession & {
  cinema: Cinema;
  dayIdx: number;
  at: number; // start, in minutes since today's midnight
  km: number;
  travel: number; // drive + parking
  slack: number; // minutes to spare if you left right now
  status: Status;
  leaveBy: number;
};
export type FilmGroup = { title: string; sessions: Evaluated[] };

export type Context = {
  dates: string[]; // [today, tomorrow, day after]
  now: number; // minutes since today's Sydney midnight
  origin: Origin;
  cinemas: Cinema[];
  driveMinutes: Record<string, number> | null; // by cinema id, from routing; null = not loaded yet
};

// Starting state. After 10:30 pm nothing's left today, so start on tomorrow evening.
export function initialFilters(now: number): Filters {
  const late = now >= 22 * 60 + 30;
  return { mode: late ? "plan" : "now", date: late ? 1 : 0, from: 1020, to: 1260, km: 30 };
}

export function evaluate(s: ShownSession, dayIdx: number, cinema: Cinema, ctx: Context): Evaluated {
  const km = haversineKm(ctx.origin, cinema);
  const travel = (ctx.driveMinutes?.[cinema.id] ?? estimateDriveMinutes(km)) + PARK_MIN;
  const at = dayIdx * 1440 + s.startMin;
  const slack = at - ctx.now - travel;
  const status: Status = slack < -BUFFER_MIN ? "missed" : slack < 0 ? "trailers" : slack < TIGHT_MIN ? "tight" : "easy";
  return { ...s, cinema, dayIdx, at, km, travel, slack, status, leaveBy: at - travel };
}

// Catchable sessions for the filters, grouped by film; films ordered by their
// soonest catchable session.
export function compute(sessions: ShownSession[], f: Filters, ctx: Context, mode: Mode = f.mode): FilmGroup[] {
  const byId = new Map(ctx.cinemas.map(c => [c.id, c]));
  const live: Evaluated[] = [];
  for (const s of sessions) {
    const dayIdx = ctx.dates.indexOf(s.date);
    const cinema = byId.get(s.cinemaId);
    if (dayIdx < 0 || !cinema) continue;
    const at = dayIdx * 1440 + s.startMin;
    const inPool = mode === "now"
      ? dayIdx === 0 && at - ctx.now > -BUFFER_MIN && at - ctx.now <= NOW_WINDOW
      : dayIdx === f.date && s.startMin >= f.from && s.startMin < f.to;
    if (!inPool) continue;
    const e = evaluate(s, dayIdx, cinema, ctx);
    if (e.km <= f.km && e.status !== "missed") live.push(e);
  }
  live.sort((a, b) => a.at - b.at);

  const byFilm = new Map<string, FilmGroup>();
  for (const e of live) {
    if (!byFilm.has(e.title)) byFilm.set(e.title, { title: e.title, sessions: [] });
    byFilm.get(e.title)!.sessions.push(e);
  }
  return [...byFilm.values()];
}

export type Cue = { cls: "" | "tight" | "trailers"; text: string; note?: string };

export function cue(e: Evaluated): Cue {
  if (e.status === "trailers") return { cls: "trailers", text: "Leave now", note: "You’ll arrive during the trailers" };
  if (e.status === "tight") return { cls: "tight", text: e.slack < 1 ? "Leave now" : `Leave in ${Math.floor(e.slack)}${NB}min` };
  if (e.dayIdx === 0 && e.slack < 90) return { cls: "", text: `Leave in ${dur(Math.floor(e.slack))}` };
  return { cls: "", text: `Leave by ${clock(e.leaveBy)}` };
}

export const urgent = (e: Evaluated) => e.status === "tight" || e.status === "trailers";

// A plan for today whose whole window has already passed.
export const windowOver = (f: Filters, now: number) => f.date === 0 && f.to <= now;
export const windowPartlyOver = (f: Filters, now: number) => f.date === 0 && f.from < now && !windowOver(f, now);

export type Suggestion = { label: string; patch: Partial<Filters> };

// Ways out of an empty result, most likely to help first.
export function suggestions(f: Filters, now: number, days: Day[]): Suggestion[] {
  const out: Suggestion[] = [];
  const nextKm = RADII[RADII.indexOf(f.km) + 1];
  if (nextKm) out.push({ label: `Widen to ${nextKm} km`, patch: { km: nextKm } });
  if (f.mode === "now") {
    const later = Math.ceil((now + NOW_WINDOW) / T_STEP) * T_STEP;
    if (later < T_MAX) out.push({ label: `Later today (from ${hm(later)})`, patch: { mode: "plan", date: 0, from: later, to: T_MAX } });
    out.push({ label: "Tomorrow evening", patch: { mode: "plan", date: 1, from: 1020, to: 1260 } });
  } else if (windowOver(f, now)) {
    out.push({ label: "Same time tomorrow", patch: { date: 1 } });
    if (now < 1440 - 60) out.push({ label: "Leave now instead", patch: { mode: "now" } });
  } else {
    if (f.to < T_MAX) out.push({ label: "Search until 1 am", patch: { to: T_MAX } });
    if (f.from > T_MIN && f.date !== 0) out.push({ label: "Start from 6 am", patch: { from: T_MIN } });
    if (days[f.date + 1]) out.push({ label: `Try ${dayShort(days[f.date + 1])}`, patch: { date: f.date + 1 } });
  }
  return out;
}
