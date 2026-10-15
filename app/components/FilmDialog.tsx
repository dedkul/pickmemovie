"use client";

import { useEffect, useRef, useState } from "react";
import { clock, dur, NB, plural, runtime } from "@/app/lib/format";
import { cue, PRE_ROLL, urgent, type Evaluated, type Origin } from "@/app/lib/reachability";
import type { Film } from "@/app/lib/tmdb";
import type { OpenFilm } from "./App";
import s from "./FilmDialog.module.css";
import { Car, Close, External, Play } from "./icons";
import { isSpecialFormat, SampleTag, tmdbImage } from "./session-bits";
import { useModal } from "./use-modal";

type Props = { open: OpenFilm; film: Film | null; origin: Origin; when: string; onClose: () => void };

// Trailer, synopsis, and every session grouped by cinema (soonest cinema first),
// each with an end time and a Book link.
export default function FilmDialog({ open: { group }, film, origin, when, onClose }: Props) {
  const [playing, setPlaying] = useState(false);
  const [synOpen, setSynOpen] = useState(false);
  const [clipped, setClipped] = useState(false);
  const syn = useRef<HTMLParagraphElement>(null);

  // The detail gets a history entry, so the phone's back button closes it
  // instead of leaving the page. Closing any other way goes back over that entry.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    // Already there when React re-runs effects in development.
    if (!history.state?.film) history.pushState({ ...history.state, film: true }, "", "#" + group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    const onPop = () => closeRef.current();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [group.title]);
  const close = () => (history.state?.film ? history.back() : onClose());
  const ref = useModal(close);

  // Show "More" only if the synopsis is actually clipped. Runs after useModal's
  // effect, because the dialog has no layout until showModal().
  useEffect(() => {
    const el = syn.current;
    if (el) setClipped(el.scrollHeight > el.clientHeight + 2);
  }, []);

  const byCinema = new Map<string, Evaluated[]>();
  for (const e of group.sessions) byCinema.set(e.cinemaId, [...(byCinema.get(e.cinemaId) ?? []), e]);
  const backdrop = tmdbImage(film?.backdrop ?? null, "w780");

  return (
    <dialog ref={ref} className={`popup ${s.drawer}`} aria-labelledby="fd-title">
      <div className={`${s.hero} ${playing ? s.playing : ""} ${!backdrop && !film?.trailer ? s.bare : ""}`} style={{ backgroundImage: backdrop }}>
        <button className={`icon-btn ${s.close}`} type="button" aria-label="Close" onClick={close}><Close /></button>
        {film?.trailer && !playing && (
          <button className={s.play} type="button" onClick={() => setPlaying(true)}><Play />Play trailer</button>
        )}
        {film?.trailer && playing && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${film.trailer}?autoplay=1&rel=0&modestbranding=1`}
            title={`${film.title} trailer`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
          />
        )}
      </div>

      <div className={s.body}>
        <h2 className={s.title} id="fd-title">{group.title}</h2>
        {film && (
          <>
            <p className={s.meta}>
              {film.cert && <span className={s.cert} title="Australian classification">{film.cert}</span>}
              {film.runtime && <span className="tnum">{runtime(film.runtime)}</span>}
              {film.runtime && film.year && <span aria-hidden="true">·</span>}
              {film.year && <span>{film.year}</span>}
            </p>
            {film.genres.length > 0 && <div className={s.genres}>{film.genres.map(g => <span key={g}>{g}</span>)}</div>}
            {film.overview && <p ref={syn} className={`${s.syn} ${synOpen ? s.synOpen : ""}`}>{film.overview}</p>}
            {clipped && <button className={s.more} type="button" onClick={() => setSynOpen(o => !o)}>{synOpen ? "Less" : "More"}</button>}
          </>
        )}

        <h3 className={s.sec}>{plural(group.sessions.length, "session")} · {when}</h3>
        {[...byCinema.values()].map(list => {
          const k = list[0].cinema, e0 = list[0];
          const dir = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${encodeURIComponent(`${k.name}, ${k.suburb} VIC`)}&travelmode=driving`;
          return (
            <section key={k.id} className={s.cin} aria-label={k.name}>
              <div className={s.cinHd}>
                <div>
                  <p className={s.name}>{k.name}</p>
                  <p className={`${s.trip} tnum`}><Car />{dur(e0.travel)} drive · {e0.km.toFixed(1)}{NB}km</p>
                </div>
                <a className={s.dir} href={dir} target="_blank" rel="noopener">Directions<External /></a>
              </div>
              {list.map((e, i) => {
                const c = cue(e);
                return (
                  <div key={i} className={s.row}>
                    <span className={`${s.t} tnum`}>{clock(e.at)}{isSpecialFormat(e) && <span className="fmt">{e.format}</span>}</span>
                    <span className={`${s.rowSub} tnum`}>
                      <span className={`s-cue ${c.cls}`}>{c.text}</span>
                      {film?.runtime
                        ? <span>Ends ~{clock(e.at + PRE_ROLL + film.runtime)}{e.startMin >= 1440 ? " · after midnight" : ""}</span>
                        : e.startMin >= 1440 && <span>After midnight</span>}
                      {c.note && <span>{c.note}</span>}
                      <SampleTag e={e} />
                    </span>
                    <a className={`${s.book} ${urgent(e) ? s.hot : ""}`} href={k.url} target="_blank" rel="noopener" aria-label={`Book ${clock(e.at)} on the ${k.chain} website`}>
                      Book<External />
                    </a>
                  </div>
                );
              })}
            </section>
          );
        })}
        <p className={s.credit}>Film info and images from TMDb. This product uses the TMDb API but is not endorsed or certified by TMDb.</p>
      </div>
    </dialog>
  );
}
