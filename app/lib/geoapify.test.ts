import { describe, expect, it } from "vitest";
import fitzr from "./__fixtures__/geoapify-autocomplete-fitzr.json";
import { CINEMAS } from "./cinemas";
import { estimateDriveMinutes, haversineKm, toDriveTimes, toPlace } from "./geoapify";

const SURRY_HILLS = { lat: -33.8886, lng: 151.2094 };

describe("toPlace", () => {
  it("shapes Geoapify suburbs like the prototype's location pill", () => {
    expect(fitzr.results.map(toPlace)[0]).toEqual({ name: "Fitzroy", sub: "VIC 3065", lat: -37.8010382, lng: 144.9792611 });
  });
});

describe("toDriveTimes", () => {
  // Rounding down would make a session look catchable when it isn't.
  it("rounds seconds up to whole minutes", () => {
    const row = CINEMAS.map(() => ({ time: 126, distance: 1121 }));
    expect(toDriveTimes(SURRY_HILLS, row)[0]).toEqual({ cinemaId: CINEMAS[0].id, minutes: 3, estimated: false });
  });

  // One unroutable cinema shouldn't hide the rest, and estimates must be labelled.
  it("estimates only the cinemas the router couldn't reach", () => {
    const row = CINEMAS.map((_, i) => (i === 1 ? null : { time: 600, distance: 5000 }));
    const times = toDriveTimes(SURRY_HILLS, row);
    expect(times.filter(t => t.estimated).map(t => t.cinemaId)).toEqual([CINEMAS[1].id]);
    expect(times[1].minutes).toBe(estimateDriveMinutes(haversineKm(SURRY_HILLS, CINEMAS[1])));
  });

  it("estimates everything when routing is down", () => {
    expect(toDriveTimes(SURRY_HILLS, undefined).every(t => t.estimated)).toBe(true);
  });
});

describe("estimateDriveMinutes", () => {
  it("is slower per km in the inner city than further out", () => {
    expect(estimateDriveMinutes(4) / 4).toBeGreaterThan(estimateDriveMinutes(20) / 20);
  });
});
