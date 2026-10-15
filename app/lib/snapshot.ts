import { CINEMAS } from "./cinemas";
import { mockSessions } from "./mock-sessions";
import { parseShowtimes, type Session, type SerpResponse } from "./serpapi";

// The daily refresh writes one of these; pages only ever read it.
export type CinemaSnapshot = {
  attemptedAt: string; // ISO instant of the last search, successful or not
  fetchedAt: string; // ISO instant of the last successful fetch ("" if none yet)
  sessions: Session[];
  problems: string[]; // lines the parser couldn't read on that fetch
  lastError?: string; // set when the latest attempt failed and we kept the old data
};

export type Snapshot = {
  version: 1;
  updatedAt: string;
  cinemas: Record<string, CinemaSnapshot>;
  films: Record<string, number | null>; // listing title → TMDb id (null = no exact match)
};

export const EMPTY_SNAPSHOT: Snapshot = { version: 1, updatedAt: "", cinemas: {}, films: {} };

// Each search costs 1 of 250 a month. A cinema searched in the last 20 hours —
// even unsuccessfully — is skipped, so a re-run job can't spend the quota twice.
const REFETCH_AFTER_MS = 20 * 60 * 60 * 1000;

export function needsFetch(prev: Snapshot, cinemaId: string, now: Date): boolean {
  const entry = prev.cinemas[cinemaId];
  return !entry || now.getTime() - Date.parse(entry.attemptedAt) >= REFETCH_AFTER_MS;
}

export type FetchOutcome = { ok: true; res: SerpResponse } | { ok: false; error: string };

// A failed or empty fetch keeps the cinema's last good sessions. One search
// covers about 7 days, so yesterday's data still answers the next 3.
export function mergeRefresh(prev: Snapshot, outcomes: Record<string, FetchOutcome>, now: Date): Snapshot {
  const cinemas = { ...prev.cinemas };
  for (const [id, outcome] of Object.entries(outcomes)) {
    const parsed = outcome.ok ? parseShowtimes(outcome.res, id) : null;
    const at = now.toISOString();
    if (parsed && parsed.sessions.length) {
      cinemas[id] = { attemptedAt: at, fetchedAt: at, sessions: parsed.sessions, problems: parsed.problems };
    } else {
      const lastError = outcome.ok ? parsed!.problems.join("; ") || "no sessions" : outcome.error;
      const kept = cinemas[id] ?? { fetchedAt: "", sessions: [], problems: [] };
      cinemas[id] = { ...kept, attemptedAt: at, lastError };
    }
  }
  return { ...prev, version: 1, updatedAt: now.toISOString(), cinemas };
}

export type ShownSession = Session & { sample: boolean };

// Sessions for the given dates. Each cinema-date uses real sessions when the
// cinema's snapshot reaches that far; otherwise seeded sample sessions, flagged
// so the UI never passes invented times off as real.
export function sessionsFor(snapshot: Snapshot, dates: string[]): ShownSession[] {
  const realTitles = [...new Set(Object.values(snapshot.cinemas).flatMap(c => c.sessions.map(s => s.title)))];
  const out: ShownSession[] = [];
  CINEMAS.forEach((cinema, i) => {
    const sessions = snapshot.cinemas[cinema.id]?.sessions ?? [];
    const reach = sessions.reduce((max, s) => (s.date > max ? s.date : max), "");
    for (const date of dates) {
      if (date <= reach) out.push(...sessions.filter(s => s.date === date).map(s => ({ ...s, sample: false })));
      else out.push(...mockSessions(cinema.id, i, date, realTitles).map(s => ({ ...s, sample: true })));
    }
  });
  return out;
}
