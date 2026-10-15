"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Cinema } from "@/app/lib/cinemas";
import { clock, dayShort, makeDays, rangeText } from "@/app/lib/format";
import { CBD, COVERAGE_KM, haversineKm } from "@/app/lib/geo";
import { melbourneMinutes } from "@/app/lib/melbourne-time";
import { compute, initialFilters, NOW_WINDOW, type Context, type FilmGroup, type Filters, type Mode, type Origin } from "@/app/lib/reachability";
import type { ShownSession } from "@/app/lib/snapshot";
import type { Film } from "@/app/lib/tmdb";
import FilmDialog from "./FilmDialog";
import Results from "./Results";
import SurpriseDialog from "./SurpriseDialog";
import TopBar from "./TopBar";

type Props = {
  dates: string[];
  serverNow: number;
  sessions: ShownSession[];
  films: Record<string, Film | null>;
  cinemas: Cinema[];
};

const DEFAULT_ORIGIN: Origin = { name: "Fitzroy", sub: "VIC 3065", lat: -37.7984, lng: 144.9785 };

function savedOrigin(): Origin | null {
  try {
    const o = JSON.parse(localStorage.getItem("pmm-origin") ?? "null");
    return o && typeof o.name === "string" && Number.isFinite(o.lat) && Number.isFinite(o.lng) ? o : null;
  } catch {
    return null;
  }
}

// ?now=18:40 pins the demo clock (it still ticks from there).
function clockOffset(): number {
  const p = new URLSearchParams(location.search).get("now");
  if (!p || !/^\d{1,2}:\d{2}$/.test(p)) return 0;
  const [h, m] = p.split(":").map(Number);
  return h * 60 + m - melbourneMinutes(new Date());
}

export type Labels = { nowUntil: string; planText: string; when: (mode: Mode) => string };
export type OpenFilm = { group: FilmGroup; mode: Mode };

export default function App({ dates, serverNow, sessions, films, cinemas }: Props) {
  const days = useMemo(() => makeDays(dates), [dates]);
  const [now, setNow] = useState(serverNow);
  const [filters, setFilters] = useState<Filters>(() => initialFilters(serverNow));
  const [origin, setOrigin] = useState<Origin>(DEFAULT_ORIGIN);
  const [drive, setDrive] = useState<{ key: string; minutes: Record<string, number> } | null>(null);
  const [openFilm, setOpenFilm] = useState<OpenFilm | null>(null);
  const [surprise, setSurprise] = useState(false);

  // Countdowns refresh every 30 s, but not under an open dialog: its contents
  // were worked out when it opened and shouldn't shift while being read.
  const paused = useRef(false);
  useEffect(() => { paused.current = Boolean(openFilm || surprise); }, [openFilm, surprise]);
  useEffect(() => {
    const offset = clockOffset();
    const tick = () => { if (!paused.current) setNow(melbourneMinutes(new Date()) + offset); };
    /* eslint-disable react-hooks/set-state-in-effect -- browser-only state, read after hydration */
    tick();
    if (offset) setFilters(initialFilters(melbourneMinutes(new Date()) + offset));
    const saved = savedOrigin();
    if (saved) setOrigin(saved);
    /* eslint-enable react-hooks/set-state-in-effect */
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const outOfRange = haversineKm(origin, CBD) > COVERAGE_KM;
  const originKey = `${origin.lat},${origin.lng}`;
  useEffect(() => {
    if (outOfRange) return;
    let live = true;
    fetch(`/api/drive-times?lat=${origin.lat}&lng=${origin.lng}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { driveTimes?: { cinemaId: string; minutes: number }[] } | null) => {
        if (live && d?.driveTimes) setDrive({ key: originKey, minutes: Object.fromEntries(d.driveTimes.map(t => [t.cinemaId, t.minutes])) });
      })
      .catch(() => {}); // the distance estimate stays in use
    return () => { live = false; };
  }, [origin.lat, origin.lng, originKey, outOfRange]);

  const ctx: Context = { dates, now, origin, cinemas, driveMinutes: drive?.key === originKey ? drive.minutes : null };
  const groups = { now: compute(sessions, filters, ctx, "now"), plan: compute(sessions, filters, ctx, "plan") };
  const shown = groups[filters.mode];

  const planText = `${dayShort(days[filters.date])}, ${rangeText(filters.from, filters.to)}`;
  const labels: Labels = {
    nowUntil: clock(now + NOW_WINDOW),
    planText,
    when: mode => (mode === "now" ? "Leaving now" : planText),
  };

  function chooseOrigin(o: Origin) {
    setOrigin(o);
    try { localStorage.setItem("pmm-origin", JSON.stringify(o)); } catch {}
  }
  const patch = (p: Partial<Filters>) => setFilters(f => ({ ...f, ...p }));

  return (
    <>
      <TopBar
        filters={filters} onFilters={patch} origin={origin} onOrigin={chooseOrigin} now={now} days={days} labels={labels}
        filmCount={outOfRange ? 0 : shown.length}
        canSurprise={!outOfRange && Boolean(groups.now.length || groups.plan.length)}
        onSurprise={() => setSurprise(true)}
      />
      <Results
        groups={shown} films={films} filters={filters} now={now} days={days} origin={origin} outOfRange={outOfRange} labels={labels}
        onOpen={group => setOpenFilm({ group, mode: filters.mode })}
        onSuggest={patch}
      />
      {openFilm && (
        <FilmDialog open={openFilm} film={films[openFilm.group.title]} origin={origin} when={openFilm.mode === "now" ? `leaving now, before ${labels.nowUntil}` : planText} onClose={() => setOpenFilm(null)} />
      )}
      {surprise && (
        <SurpriseDialog
          groups={groups} films={films} startMode={groups[filters.mode].length ? filters.mode : filters.mode === "now" ? "plan" : "now"}
          eyebrowPlan={days[filters.date].rel === "Today" ? "For today" : `For ${dayShort(days[filters.date])}`} planText={planText}
          onDetails={(group, mode) => { setSurprise(false); setOpenFilm({ group, mode }); }}
          onClose={() => setSurprise(false)}
        />
      )}
    </>
  );
}
