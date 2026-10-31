import { describe, expect, it } from "vitest";
import hoyts from "./__fixtures__/serpapi-hoyts-melbourne-central.json";
import nova from "./__fixtures__/serpapi-cinema-nova.json";
import { parseShowtimes, parseTime, type SerpResponse } from "./serpapi";

describe("parseTime", () => {
  it("reads Google's 12-hour times", () => {
    expect(parseTime("10:00am")).toBe(600);
    expect(parseTime("12:00pm")).toBe(720);
    expect(parseTime("1:40pm")).toBe(820);
  });

  // The app groups a night out under one date: a 12:15 am session after a
  // Friday evening belongs to Friday, not to Saturday morning.
  it("keeps after-midnight sessions with the night before", () => {
    expect(parseTime("12:15am")).toBe(1455);
    expect(parseTime("1:30am")).toBe(1530);
  });

  it("rejects text it can't read rather than guessing", () => {
    expect(parseTime("TBA")).toBeNull();
  });
});

describe("parseShowtimes on real SerpAPI responses", () => {
  // Search ran at 00:27 UTC on 14 Oct = 11:27 am in Sydney.
  for (const [name, res] of [["Hoyts Melbourne Central", hoyts], ["Cinema Nova", nova]] as const) {
    it(`${name}: every session lands on a real Sydney date, nothing unreadable`, () => {
      const { sessions, problems } = parseShowtimes(res as SerpResponse, "x");
      expect(problems).toEqual([]);
      expect(sessions.length).toBeGreaterThan(100);
      const dates = [...new Set(sessions.map(s => s.date))].sort();
      expect(dates[0]).toBe("2026-10-14");
      expect(dates).toContain("2026-10-16"); // the "Fri 16 Oct" tab
    });
  }

  it("keeps every format as its own session", () => {
    const { sessions } = parseShowtimes(hoyts as SerpResponse, "hoyts");
    const verity = sessions.filter(s => s.title === "Verity" && s.date === "2026-10-14");
    expect(verity.map(s => `${s.format} ${s.startMin}`)).toContain("LUX 780"); // 1:00pm LUX
  });
});

describe("parseShowtimes dates", () => {
  const res = (created_at: string, showtimes: SerpResponse["showtimes"]): SerpResponse => ({ search_metadata: { created_at }, showtimes });
  const movie = [{ name: "Film", showing: [{ time: ["7:00pm"], type: "Standard" }] }];

  // Vercel runs in UTC. A refresh at 12:30 am Sydney is still the previous
  // day in UTC; "Today" must mean the Sydney day or every session is off by one.
  it("resolves Today in Sydney time, not UTC", () => {
    const { sessions } = parseShowtimes(res("2026-10-13 13:30:00 UTC", [{ day: "Today", movies: movie }]), "x");
    expect(sessions[0].date).toBe("2026-10-14");
  });

  it("crosses the year boundary", () => {
    const { sessions } = parseShowtimes(res("2026-12-30 01:00:00 UTC", [{ day: "Sat", date: "2 Jan", movies: movie }]), "x");
    expect(sessions[0].date).toBe("2027-01-02");
  });

  // Silently dropping a day would show "no sessions" when there are some.
  it("reports a day it can't place instead of dropping it silently", () => {
    const { sessions, problems } = parseShowtimes(res("2026-10-14 01:00:00 UTC", [{ day: "Someday", movies: movie }]), "x");
    expect(sessions).toEqual([]);
    expect(problems).toEqual(["unreadable day: Someday"]);
  });

  it("flags a response with no showtimes card", () => {
    expect(parseShowtimes({ search_metadata: { created_at: "2026-10-14 01:00:00 UTC" } }, "x").problems).toEqual(["no showtimes in response"]);
  });
});
