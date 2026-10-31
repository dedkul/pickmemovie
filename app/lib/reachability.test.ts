import { describe, expect, it } from "vitest";
import { CINEMAS } from "./cinemas";
import { clock, hm, makeDays, rangeText } from "./format";
import { sydneyMinutes } from "./sydney-time";
import { compute, cue, initialFilters, suggestions, type Context, type Filters } from "./reachability";
import type { ShownSession } from "./snapshot";

const NEAR = "palace-central"; // Chippendale, ~1.3 km from Surry Hills
const FAR = "hayden-orpheum"; // Cremorne, ~6.5 km from Surry Hills
const DATES = ["2026-10-15", "2026-10-16", "2026-10-17"];
const DAYS = makeDays(DATES);
const SURRY_HILLS = { name: "Surry Hills", sub: "NSW 2010", lat: -33.8886, lng: 151.2094 };

const s = (cinemaId: string, startMin: number, title = "Wicked", date = DATES[0]): ShownSession =>
  ({ cinemaId, title, date, startMin, format: "Standard", sample: false });
// Drive times pinned so the tests read as arithmetic: 10 min to the near cinema (+4 parking = 14).
const ctx = (now: number, drive: Record<string, number> = { [NEAR]: 10, [FAR]: 30 }): Context =>
  ({ dates: DATES, now, origin: SURRY_HILLS, cinemas: CINEMAS, driveMinutes: drive });
const NOW: Filters = { mode: "now", date: 0, from: 1020, to: 1260, km: 30 };
const PLAN: Filters = { ...NOW, mode: "plan" };
const only = (sessions: ShownSession[], f: Filters, c: Context) => compute(sessions, f, c).flatMap(g => g.sessions);

describe("reachability (PRD §5.4: can I still make it?)", () => {
  // The whole point of the app: a session counts if you'd walk in during the
  // trailers, but not once the film itself has started.
  it("keeps a session you'd reach up to 10 minutes late, and drops one you'd miss", () => {
    const now = 1200; // 8 pm; the near cinema is 14 min away with parking
    const [trailers] = only([s(NEAR, now + 14 - 10)], NOW, ctx(now)); // arrive 10 min after start
    expect(trailers.status).toBe("trailers");
    expect(cue(trailers).text).toBe("Leave now");
    expect(only([s(NEAR, now + 14 - 11)], NOW, ctx(now))).toEqual([]);
  });

  it("adds a parking allowance on top of the routed drive time", () => {
    const [e] = only([s(NEAR, 1300)], NOW, ctx(1200));
    expect(e.travel).toBe(14);
  });

  it("falls back to a distance estimate before routing has loaded", () => {
    const [e] = only([s(NEAR, 1300)], NOW, { ...ctx(1200), driveMinutes: null });
    expect(e.travel).toBeGreaterThan(4);
  });

  it("flags a session as tight under 20 minutes of slack, with a countdown", () => {
    const [e] = only([s(NEAR, 1200 + 14 + 12)], NOW, ctx(1200));
    expect(e.status).toBe("tight");
    expect(cue(e)).toMatchObject({ cls: "tight", text: "Leave in 12 min" });
  });

  // "Leave now" is about the next 2 hours, not the rest of the day.
  it("in Leave now mode, only shows today's sessions starting within 2 hours", () => {
    const got = only([s(NEAR, 1200 + 120), s(NEAR, 1200 + 125), s(NEAR, 1300, "Wicked", DATES[1])], NOW, ctx(1200));
    expect(got.map(e => e.startMin)).toEqual([1320]);
  });

  // After-midnight sessions belong to the night you go out, so "Late" on
  // Friday includes Friday's 12:30 am session.
  it("counts an after-midnight session under the night before", () => {
    const late = { ...PLAN, date: 1, from: 1260, to: 1500 };
    const got = only([s(NEAR, 1470, "Wicked", DATES[1])], late, ctx(600));
    expect(got).toHaveLength(1);
    expect(clock(got[0].at)).toBe("12:30 am");
  });

  it("drops cinemas outside the chosen radius", () => {
    const sessions = [s(NEAR, 1300), s(FAR, 1300)];
    expect(only(sessions, { ...NOW, km: 5 }, ctx(1200)).map(e => e.cinemaId)).toEqual([NEAR]);
    expect(only(sessions, { ...NOW, km: 30 }, ctx(1200))).toHaveLength(2);
  });

  // Cards are ordered by "what can I catch soonest", and each card leads with it.
  it("groups by film, soonest catchable film first", () => {
    const films = compute([s(NEAR, 1300, "B"), s(NEAR, 1250, "A"), s(NEAR, 1240, "B")], NOW, ctx(1200));
    expect(films.map(f => f.title)).toEqual(["B", "A"]);
    expect(films[0].sessions.map(e => e.startMin)).toEqual([1240, 1300]);
  });

  it("gives a clock time, not a countdown, for another day", () => {
    const [e] = only([s(NEAR, 1140, "Wicked", DATES[1])], { ...PLAN, date: 1 }, ctx(600));
    expect(cue(e).text).toBe("Leave by 6:46 pm");
  });
});

describe("filters and ways out of an empty result", () => {
  it("starts on tomorrow evening once tonight is basically over", () => {
    expect(initialFilters(1200).mode).toBe("now");
    expect(initialFilters(22 * 60 + 30)).toMatchObject({ mode: "plan", date: 1, from: 1020, to: 1260 });
  });

  it("offers tomorrow when today's planned window is already over", () => {
    const labels = suggestions({ ...PLAN, from: 720, to: 1020 }, 1200, DAYS).map(x => x.label);
    expect(labels).toContain("Same time tomorrow");
    expect(labels).not.toContain("Search until 1 am");
  });

  it("never offers a radius beyond the largest one", () => {
    expect(suggestions({ ...NOW, km: 50 }, 1200, DAYS).some(x => x.label.startsWith("Widen"))).toBe(false);
  });
});

describe("formatting", () => {
  it("states every window's hours unambiguously", () => {
    expect(rangeText(1020, 1260)).toBe("5–9 pm");
    expect(rangeText(360, 720)).toBe("6 am – 12 pm");
    expect(rangeText(1260, 1500)).toBe("9 pm – 1 am");
    expect(hm(1440)).toBe("midnight");
  });

  it("labels the 3 days from Sydney dates", () => {
    expect(DAYS.map(d => d.rel ?? d.short)).toEqual(["Today", "Tomorrow", "Sat 17 Oct"]);
  });

  // Vercel runs in UTC; "now" must be Sydney wall-clock time.
  it("reads the time of day in Sydney, not the server's zone", () => {
    expect(sydneyMinutes(new Date("2026-10-15T09:30:00Z"))).toBe(20 * 60 + 30); // AEDT, UTC+11
  });
});
