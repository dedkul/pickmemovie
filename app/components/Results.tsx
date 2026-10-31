"use client";

import { clock, dayLabel, dur, plural, rangeText, runtime, type Day } from "@/app/lib/format";
import { cue, suggestions, urgent, windowOver, type FilmGroup, type Filters, type Origin } from "@/app/lib/reachability";
import type { Film } from "@/app/lib/tmdb";
import type { Labels } from "./App";
import { Car } from "./icons";
import s from "./Results.module.css";
import { AfterMidnight, isSpecialFormat, Poster, SampleTag } from "./session-bits";

type Props = {
  groups: FilmGroup[];
  films: Record<string, Film | null>;
  filters: Filters;
  now: number;
  days: Day[];
  origin: Origin;
  outOfRange: boolean;
  labels: Labels;
  onOpen: (g: FilmGroup) => void;
  onSuggest: (p: Partial<Filters>) => void;
};

export default function Results({ groups, films, filters: f, now, days, origin, outOfRange, labels, onOpen, onSuggest }: Props) {
  const n = groups.length;
  let title: string, sub: React.ReactNode;
  const where = `from ${origin.name}, within ${f.km} km`;

  // The subtitle always spells out the exact date and hours being searched.
  if (outOfRange) {
    title = "We only cover Sydney for now";
    sub = `${origin.name} is outside our area. Try a Sydney suburb.`;
  } else if (f.mode === "now") {
    title = n ? `${plural(n, "film")} you can still make` : "Nothing you can make right now";
    sub = <>Leaving now · starting in the next 2 hours, before <strong className="tnum">{labels.nowUntil}</strong> · {where}</>;
  } else {
    title = n ? `${plural(n, "film")} you can make` : windowOver(f, now) ? "That window’s already over today" : "Nothing in this window";
    sub = <><strong>{dayLabel(days[f.date])}</strong> · starting <strong className="tnum">{rangeText(f.from, f.to)}</strong> · {where}</>;
  }

  return (
    <main className="wrap">
      <div className={s.hd} aria-live="polite">
        <h1 className={s.title}>{title}</h1>
        <p className={s.sub}>{sub}</p>
      </div>

      {!outOfRange && !n && (
        <div className={s.empty}>
          <p>Nothing fits these filters. Try one of these:</p>
          <div className="pills">
            {suggestions(f, now, days).map(x => <button key={x.label} className="pill" type="button" onClick={() => onSuggest(x.patch)}>{x.label}</button>)}
          </div>
        </div>
      )}

      {!outOfRange && n > 0 && (
        <div className={s.grid}>
          {groups.map(g => <FilmCard key={g.title} group={g} film={films[g.title]} onOpen={() => onOpen(g)} />)}
        </div>
      )}

      <p className={s.note}>
        Showtimes from Google, refreshed daily; times marked “sample” are made up because that cinema’s real times weren’t available.
        Travel is by car only (public transport isn’t supported yet): drive times assume no traffic, plus a few minutes to park.
        You can still make a session if you arrive within 10 minutes of the start — that’s the trailers. End times assume about 15 minutes of ads and trailers.
        Film info and posters from TMDb.
      </p>
    </main>
  );
}

// A1 "Quiet": title, runtime, soonest session, one count line. The leave cue
// only appears when it's urgent. The whole card opens the film detail.
function FilmCard({ group, film, onOpen }: { group: FilmGroup; film: Film | null; onOpen: () => void }) {
  const e = group.sessions[0], c = cue(e), more = group.sessions.length - 1;
  const label = `${group.title}. Next session ${clock(e.at)} at ${e.cinema.name}, ${dur(e.travel)} drive${urgent(e) ? ", " + c.text.toLowerCase() : ""}${e.sample ? ", sample time" : ""}. ${plural(group.sessions.length, "session")}. Open for details and trailer.`;
  return (
    <article className={s.film}>
      <Poster film={film} />
      <div className={s.body}>
        <h2 className={s.filmTitle} title={group.title}>
          <button className={s.open} type="button" aria-label={label} onClick={onOpen}>{group.title}</button>
        </h2>
        <p className={s.meta}>{film?.runtime ? runtime(film.runtime) : " "}</p>
        <div className={s.foot} aria-hidden="true">
          <p className={s.featTop}>
            <span className={`${s.featTime} tnum`}>{clock(e.at)}</span>
            <AfterMidnight e={e} />
            {urgent(e) && <span className={`s-cue ${c.cls}`}>{c.text}</span>}
            <SampleTag e={e} />
          </p>
          <p className={s.featWhere}>
            {e.cinema.short}{isSpecialFormat(e) && <> · <span className="fmt">{e.format}</span></>} · <Car />{dur(e.travel)}
          </p>
          <p className={`${s.more} ${more ? "" : s.none}`}>
            {more ? `+${more} more ${more === 1 ? "session" : "sessions"}` : "Only session in this window"}
          </p>
        </div>
      </div>
    </article>
  );
}
