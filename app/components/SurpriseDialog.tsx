"use client";

import { useState } from "react";
import { clock, dur, runtime } from "@/app/lib/format";
import { cue, type FilmGroup, type Mode } from "@/app/lib/reachability";
import type { Film } from "@/app/lib/tmdb";
import { Close } from "./icons";
import { isSpecialFormat, Poster, SampleTag } from "./session-bits";
import s from "./SurpriseDialog.module.css";
import { useModal } from "./use-modal";

type Props = {
  groups: Record<Mode, FilmGroup[]>;
  films: Record<string, Film | null>;
  startMode: Mode;
  eyebrowPlan: string;
  planText: string;
  onDetails: (g: FilmGroup, mode: Mode) => void;
  onClose: () => void;
};

const shuffled = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);

// Pick from "Leave now" or the planned search; switching re-rolls.
// Sources with nothing in them are shown but disabled.
export default function SurpriseDialog({ groups, films, startMode, eyebrowPlan, planText, onDetails, onClose }: Props) {
  const [mode, setMode] = useState(startMode);
  const [picks, setPicks] = useState(() => shuffled(groups[startMode]));
  const [idx, setIdx] = useState(0);
  const ref = useModal(onClose);

  const g = picks[idx % picks.length], e = g.sessions[0], c = cue(e), film = films[g.title];
  const meta = [film?.genres.slice(0, 2).join(", "), film?.runtime && runtime(film.runtime), isSpecialFormat(e) && e.format].filter(Boolean).join(" · ");

  function switchTo(m: Mode) {
    if (m === mode) return;
    setMode(m); setPicks(shuffled(groups[m])); setIdx(0);
  }

  return (
    <dialog ref={ref} className={`popup ${s.modal}`} aria-labelledby="m-title">
      <button className={`icon-btn ${s.close}`} type="button" aria-label="Close" onClick={onClose}><Close /></button>
      <div className={`seg ${s.seg}`} role="group" aria-label="Pick from">
        {([["now", "Leave now"], ["plan", planText]] as const).map(([m, label]) => (
          <button key={m} type="button" aria-pressed={mode === m} disabled={!groups[m].length}
            title={groups[m].length ? undefined : "Nothing in this window"} onClick={() => switchTo(m)}>{label}</button>
        ))}
      </div>
      <div className={s.head}>
        <Poster film={film} />
        <div>
          <p className={s.eyebrow}>{mode === "now" ? "You could leave now for" : eyebrowPlan}</p>
          <h2 className={s.title} id="m-title">{g.title}</h2>
          {meta && <p className={s.line}>{meta}</p>}
          <p className={s.line}>{e.cinema.name} · {dur(e.travel)} drive</p>
          <div className={s.when}>
            <span className={`${s.clock} tnum`}>{clock(e.at)}</span>
            <span className={`s-cue ${c.cls}`}>{c.text}</span>
            <SampleTag e={e} />
          </div>
        </div>
      </div>
      <button className={s.details} type="button" onClick={() => onDetails(g, mode)}>Trailer and all sessions</button>
      <div className={s.actions}>
        {picks.length > 1 && <button className="btn-quiet" type="button" onClick={() => setIdx(i => i + 1)}>Try another</button>}
        <a className="btn-primary" href={e.cinema.url} target="_blank" rel="noopener" autoFocus>Book on {e.cinema.chain}</a>
      </div>
    </dialog>
  );
}
