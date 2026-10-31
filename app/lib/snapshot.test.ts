import { describe, expect, it } from "vitest";
import hoyts from "./__fixtures__/serpapi-hoyts-melbourne-central.json";
import { CINEMAS } from "./cinemas";
import { mockSessions } from "./mock-sessions";
import type { SerpResponse } from "./serpapi";
import { EMPTY_SNAPSHOT, mergeRefresh, needsFetch, sessionsFor, type Snapshot } from "./snapshot";

const HOYTS = "event-george-st"; // any listed cinema; the fixture is a recorded Hoyts response
const DAY1 = new Date("2026-10-14T18:00:00Z"); // the daily run: 5 am Thursday in Sydney
const HOURS = (h: number) => new Date(DAY1.getTime() + h * 3600_000);
const ok = { ok: true as const, res: hoyts as SerpResponse };
const down = { ok: false as const, error: "SerpAPI 503" };
const firstRun = mergeRefresh(EMPTY_SNAPSHOT, { [HOYTS]: ok }, DAY1);

describe("needsFetch (protects the 250-a-month SerpAPI quota)", () => {
  it("fetches a cinema it has never fetched", () => {
    expect(needsFetch(EMPTY_SNAPSHOT, HOYTS, DAY1)).toBe(true);
  });

  // A cron retry or a manual re-run on the same day must not spend a second search.
  it("skips a cinema searched in the last 20 hours", () => {
    expect(needsFetch(firstRun, HOYTS, HOURS(3))).toBe(false);
    expect(needsFetch(firstRun, HOYTS, HOURS(24))).toBe(true);
  });

  // Otherwise a cinema that keeps failing would burn a search on every re-run.
  it("counts a failed search as an attempt too", () => {
    const failedToday = mergeRefresh(firstRun, { [HOYTS]: down }, HOURS(24));
    expect(needsFetch(failedToday, HOYTS, HOURS(27))).toBe(false);
    const neverWorked = mergeRefresh(EMPTY_SNAPSHOT, { [HOYTS]: down }, DAY1);
    expect(needsFetch(neverWorked, HOYTS, HOURS(3))).toBe(false);
  });
});

describe("mergeRefresh", () => {
  it("stores the parsed sessions on success", () => {
    const c = firstRun.cinemas[HOYTS];
    expect(c.sessions.length).toBeGreaterThan(100);
    expect(c.fetchedAt).toBe(DAY1.toISOString());
  });

  // One search covers ~7 days, so a bad day must not wipe out good data.
  it("keeps the last good sessions when a fetch fails", () => {
    const next = mergeRefresh(firstRun, { [HOYTS]: down }, HOURS(24));
    expect(next.cinemas[HOYTS].sessions).toEqual(firstRun.cinemas[HOYTS].sessions);
    expect(next.cinemas[HOYTS].fetchedAt).toBe(DAY1.toISOString());
    expect(next.cinemas[HOYTS].lastError).toBe("SerpAPI 503");
  });

  // Google sometimes answers without a showtimes card; that's a failure, not "no sessions".
  it("treats a response without showtimes as a failure, not an empty cinema", () => {
    const next = mergeRefresh(firstRun, { [HOYTS]: { ok: true, res: {} } }, HOURS(24));
    expect(next.cinemas[HOYTS].sessions.length).toBeGreaterThan(100);
    expect(next.cinemas[HOYTS].lastError).toBe("no showtimes in response");
  });

  it("leaves cinemas it didn't fetch untouched", () => {
    const next = mergeRefresh(firstRun, {}, HOURS(24));
    expect(next.cinemas[HOYTS]).toEqual(firstRun.cinemas[HOYTS]);
  });

  // After a city switch the stored snapshot still holds the old city's cinemas;
  // their films must not leak into the new city's samples or TMDb lookups.
  it("drops cinemas that are no longer in the list", () => {
    const stale: Snapshot = { ...firstRun, cinemas: { ...firstRun.cinemas, "cinema-nova": firstRun.cinemas[HOYTS] } };
    const next = mergeRefresh(stale, {}, HOURS(24));
    expect(Object.keys(next.cinemas)).toEqual([HOYTS]);
  });
});

describe("sessionsFor", () => {
  const dates = ["2026-10-15", "2026-10-16", "2026-10-17"];

  it("uses real sessions where the snapshot has them and labels everything else as sample", () => {
    const shown = sessionsFor(firstRun, dates);
    const hoyts = shown.filter(s => s.cinemaId === HOYTS);
    expect(hoyts.length).toBeGreaterThan(0);
    expect(hoyts.every(s => !s.sample)).toBe(true);
    const others = shown.filter(s => s.cinemaId !== HOYTS);
    expect(others.length).toBeGreaterThan(0);
    expect(others.every(s => s.sample)).toBe(true);
  });

  // Data past its horizon must not leave a blank day; it falls back to labelled samples.
  it("falls back to samples for dates beyond what the snapshot covers", () => {
    const shown = sessionsFor(firstRun, ["2026-10-30"]).filter(s => s.cinemaId === HOYTS);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every(s => s.sample)).toBe(true);
  });

  // Samples should show films that are actually on, not 2024 prototype films.
  it("builds samples from titles that are really showing", () => {
    const real = new Set(firstRun.cinemas[HOYTS].sessions.map(s => s.title));
    const samples = sessionsFor(firstRun, dates).filter(s => s.sample);
    expect(samples.every(s => real.has(s.title))).toBe(true);
  });

  it("still shows something on a fresh deploy with no data at all", () => {
    const shown = sessionsFor(EMPTY_SNAPSHOT as Snapshot, dates);
    expect(new Set(shown.map(s => s.cinemaId)).size).toBe(CINEMAS.length);
  });
});

describe("mockSessions", () => {
  // Samples that reshuffle on every request would look broken.
  it("is stable for the same cinema and date", () => {
    expect(mockSessions("lido", 4, "2026-10-15", ["A", "B", "C", "D"])).toEqual(mockSessions("lido", 4, "2026-10-15", ["D", "C", "B", "A"]));
  });
});
