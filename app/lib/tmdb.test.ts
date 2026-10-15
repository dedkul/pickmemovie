import { describe, expect, it } from "vitest";
import { cleanTitle, pickMatch, toFilm } from "./tmdb";

// Search results recorded from TMDb on 2026-10-14.
const TODAY = "2026-10-14";
const HOPE = [
  { id: 1058424, title: "Hope", popularity: 42.3, release_date: "2026-09-10" },
  { id: 255709, title: "Hope", popularity: 18.7, release_date: "2013-10-02" },
  { id: 82696, title: "Hope Springs", popularity: 7.7, release_date: "2012-08-23" },
];
const SILENCED = [
  { id: 81481, title: "Silenced", popularity: 5.5, release_date: "2011-09-22" },
  { id: 1596286, title: "Silenced", popularity: 1.8, release_date: "2026-09-03" },
];
const AKIRA = [
  { id: 149, title: "Akira", popularity: 17, release_date: "1988-07-16" },
  { id: 1484849, title: "Akira", popularity: 1.5, release_date: "2025-05-23" },
];
const BLUE_VELVET = [
  { id: 793, title: "Blue Velvet", popularity: 10.6, release_date: "1987-02-26" },
  { id: 691340, title: "Blue Velvet", popularity: 1.7, release_date: "1970-04-13" },
];
const DONT_LOOK_NOW = [
  { id: 931, title: "Don't Look Now", popularity: 8.5, release_date: "1973-12-15" },
  { id: 435508, title: "Don't Look Now: Looking Back", popularity: 1.3, release_date: "2002-07-29" },
];

describe("matching cinema titles to TMDb", () => {
  it("strips listing decorations", () => {
    expect(cleanTitle("Akira 4K")).toBe("Akira");
    expect(cleanTitle("Don`t Look Now")).toBe("Don't Look Now");
  });

  // Cinemas mostly show new films, so a recent namesake beats a more famous old one.
  it("prefers the recent release when titles repeat", () => {
    expect(pickMatch("Silenced", SILENCED, TODAY)).toBe(1596286);
    expect(pickMatch("Hope", HOPE, TODAY)).toBe(1058424);
  });

  // Repertory screenings: with no recent namesake, the famous film is the one showing.
  it("falls back to the most popular exact match for re-releases", () => {
    expect(pickMatch("Blue Velvet", BLUE_VELVET, TODAY)).toBe(793);
    expect(pickMatch("Don`t Look Now", DONT_LOOK_NOW, TODAY)).toBe(931);
  });

  // "Akira 4K" is the 1988 restoration, even though an obscure 2025 "Akira" exists.
  it("treats a 4K listing as a restoration of the classic", () => {
    expect(pickMatch("Akira 4K", AKIRA, TODAY)).toBe(149);
  });

  it("ignores accents and treats & as and", () => {
    expect(pickMatch("Les Heros du Louvre", [{ id: 7, title: "Les Héros du Louvre", popularity: 1, release_date: "2026-08-01" }], TODAY)).toBe(7);
    expect(pickMatch("Sense & Sensibility", [{ id: 8, title: "Sense and Sensibility", popularity: 1, release_date: "2026-09-01" }], TODAY)).toBe(8);
  });

  // A wrong poster and synopsis is worse than none.
  it("leaves a title unmatched rather than accept a near miss", () => {
    expect(pickMatch("Hope Floats Again", HOPE, TODAY)).toBeNull();
    expect(pickMatch("Anything", [], TODAY)).toBeNull();
  });
});

describe("toFilm", () => {
  const base = { id: 1, title: "X", release_date: "2026-09-10", runtime: 101, genres: [{ name: "Drama" }], overview: "o", poster_path: "/p.jpg", backdrop_path: null };

  it("uses the Australian classification, not another country's", () => {
    const f = toFilm({ ...base, release_dates: { results: [
      { iso_3166_1: "US", release_dates: [{ certification: "R" }] },
      { iso_3166_1: "AU", release_dates: [{ certification: "" }, { certification: "MA 15+" }] },
    ] } });
    expect(f.cert).toBe("MA 15+");
  });

  it("prefers the official YouTube trailer over fan uploads and teasers", () => {
    const f = toFilm({ ...base, videos: { results: [
      { site: "YouTube", type: "Teaser", official: true, key: "teaser" },
      { site: "YouTube", type: "Trailer", official: false, key: "fan" },
      { site: "YouTube", type: "Trailer", official: true, key: "official" },
    ] } });
    expect(f.trailer).toBe("official");
  });

  // Runtime drives the "ends around" time; 0 from TMDb means unknown, not 0 minutes.
  it("treats a zero runtime as unknown", () => {
    expect(toFilm({ ...base, runtime: 0 }).runtime).toBeNull();
    expect(toFilm(base).cert).toBeNull();
  });
});
