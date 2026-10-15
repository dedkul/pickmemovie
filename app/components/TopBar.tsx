"use client";

import { useEffect, useRef, useState } from "react";
import { clock, hm, plural, rangeText, type Day } from "@/app/lib/format";
import { PRESETS, RADII, T_MAX, T_MIN, T_STEP, windowOver, windowPartlyOver, type Filters, type Origin } from "@/app/lib/reachability";
import type { Labels } from "./App";
import { Chevron, ClockIcon, Close, Moon, Pin, Sun } from "./icons";
import LocationInput from "./LocationInput";
import { lockScroll } from "./lock-scroll";
import s from "./TopBar.module.css";

type Props = {
  filters: Filters;
  onFilters: (p: Partial<Filters>) => void;
  origin: Origin;
  onOrigin: (o: Origin) => void;
  now: number;
  days: Day[];
  labels: Labels;
  filmCount: number;
  canSurprise: boolean;
  onSurprise: () => void;
};

const times = (lo: number, hi: number) => Array.from({ length: (hi - lo) / T_STEP + 1 }, (_, i) => lo + i * T_STEP);

export default function TopBar({ filters: f, onFilters, origin, onOrigin, now, days, labels, filmCount, canSurprise, onSurprise }: Props) {
  const [sheet, setSheet] = useState(false); // mobile filter sheet
  const [timeOpen, setTimeOpen] = useState(false); // desktop time popover
  const summaryRef = useRef<HTMLButtonElement>(null);
  const timeCtl = useRef<HTMLDivElement>(null);
  const plan = f.mode === "plan";

  function setSheetOpen(open: boolean) {
    setSheet(open);
    lockScroll(open);
    if (!open) summaryRef.current?.focus();
  }

  // Outside click closes the popover; Escape closes the popover, then the sheet.
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (!timeCtl.current?.contains(e.target as Node)) setTimeOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("dialog[open]")) return;
      if (timeOpen) setTimeOpen(false);
      else if (sheet && !(document.activeElement instanceof HTMLInputElement)) { setSheet(false); lockScroll(false); summaryRef.current?.focus(); }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, [timeOpen, sheet]);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("pmm-theme", next); } catch {}
  }

  // Keep from < to: moving one past the other drags the other along by an hour.
  const setFrom = (from: number) => onFilters({ from, to: f.to <= from ? Math.min(T_MAX, from + 60) : f.to });
  const setTo = (to: number) => onFilters({ to, from: f.from >= to ? Math.max(T_MIN, to - 60) : f.from });

  const over = windowOver(f, now), partly = windowPartlyOver(f, now);

  return (
    <header className={s.top}>
      <div className={`wrap ${s.topRow}`}>
        <a className={s.wordmark} href="#">PickMeMovie</a>
        <div className={s.topActions}>
          <button className="btn-quiet" type="button" onClick={onSurprise} disabled={!canSurprise}
            title={canSurprise ? "Pick something for me" : "Nothing to pick from with these filters"}>Surprise me</button>
          <button className="icon-btn" type="button" aria-label="Switch theme" onClick={toggleTheme}>
            <Moon className={s.moon} /><Sun className={s.sun} />
          </button>
        </div>
      </div>

      <button ref={summaryRef} className={s.summaryBar} type="button" aria-expanded={sheet} aria-controls="controls" onClick={() => setSheetOpen(true)}>
        <span className={s.summaryPill}>
          <Pin />
          <span><strong>{origin.name}</strong> · {labels.when(f.mode)} · {f.km} km</span>
        </span>
      </button>

      <div className="wrap">
        <div className={`${s.controls} ${sheet ? s.open : ""}`} id="controls" role="group" aria-label="Filters">
          <div className={s.panelHd}>
            Filters
            <button className="icon-btn" type="button" aria-label="Close filters" onClick={() => setSheetOpen(false)}><Close /></button>
          </div>

          <div className={`${s.ctl} ${s.loc}`}>
            <label className={s.ctlLabel} htmlFor="loc-input">Leaving from</label>
            <LocationInput origin={origin} onChoose={onOrigin} />
          </div>

          <div className={s.ctl}>
            <span className={s.ctlLabel} id="mode-label">When</span>
            <div className="seg" role="group" aria-labelledby="mode-label">
              <button type="button" aria-pressed={f.mode === "now"} onClick={() => onFilters({ mode: "now" })}>Leave now</button>
              <button type="button" aria-pressed={plan} onClick={() => onFilters({ mode: "plan" })}>Plan ahead</button>
            </div>
          </div>

          {/* Leave now: no date/time to pick, so say exactly what window is used */}
          {!plan && (
            <div className={s.ctl}>
              <p className={s.nowInfo}>Starting in the next 2 hours · before <strong className="tnum">{labels.nowUntil}</strong></p>
            </div>
          )}

          {plan && (
            <div className={s.ctl}>
              <span className={s.ctlLabel} id="date-label">Day</span>
              <div className="seg" role="group" aria-labelledby="date-label">
                {days.map(d => (
                  <button key={d.idx} type="button" aria-pressed={f.date === d.idx} aria-label={d.long}
                    onClick={() => { onFilters({ date: d.idx }); setTimeOpen(false); }}>{d.rel || d.short}</button>
                ))}
              </div>
            </div>
          )}

          {plan && (
            <div className={`${s.ctl} ${s.hasPop}`} ref={timeCtl}>
              <span className={s.ctlLabel} id="time-label">Starting between</span>
              <button className={s.popBtn} type="button" aria-expanded={timeOpen} aria-controls="time-pop" onClick={() => setTimeOpen(o => !o)}>
                <ClockIcon /><span className="tnum">{rangeText(f.from, f.to)}</span>
              </button>
              <div className={`${s.pop} ${timeOpen ? s.popOpen : ""}`} id="time-pop">
                <div className="pills" role="group" aria-labelledby="time-label">
                  {PRESETS.map(p => {
                    const past = f.date === 0 && p.to <= now;
                    return (
                      <button key={p.id} className={`pill ${s.preset}`} type="button" aria-pressed={f.from === p.from && f.to === p.to}
                        disabled={past} title={past ? "Already over today" : undefined} onClick={() => onFilters({ from: p.from, to: p.to })}>
                        {p.name}<span className={`${s.hrs} tnum`}>{rangeText(p.from, p.to)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className={s.rangeRow}>
                  <span className={s.rrLead}>Starts between</span>
                  <span className="select-wrap">
                    <select aria-label="Earliest start time" value={f.from} onChange={e => setFrom(Number(e.target.value))}>
                      {times(T_MIN, T_MAX - T_STEP).map(m => <option key={m} value={m}>{hm(m)}</option>)}
                    </select>
                    <Chevron />
                  </span>
                  <span>and</span>
                  <span className="select-wrap">
                    <select aria-label="Latest start time" value={f.to} onChange={e => setTo(Number(e.target.value))}>
                      {times(T_MIN + T_STEP, T_MAX).map(m => <option key={m} value={m}>{hm(m)}</option>)}
                    </select>
                    <Chevron />
                  </span>
                </div>
                {/* Edge cases on today's date, said plainly next to the control. */}
                {(over || partly) && (
                  <p className={s.timeNote}>
                    {over
                      ? `It’s ${clock(now)} — this window has passed. Pick a later time or another day.`
                      : `It’s ${clock(now)}, so only sessions you can still reach are shown.`}
                  </p>
                )}
              </div>
            </div>
          )}

          <span className={s.divider} aria-hidden="true" />

          <div className={s.ctl}>
            <label className={s.ctlLabel} htmlFor="radius">How far</label>
            <span className="select-wrap round">
              <select id="radius" value={f.km} onChange={e => onFilters({ km: Number(e.target.value) })}>
                {RADII.map(km => <option key={km} value={km}>Within {km} km</option>)}
              </select>
              <Chevron size={14} />
            </span>
          </div>

          <div className={s.panelFt}>
            <button className="btn-primary" type="button" onClick={() => { setSheetOpen(false); window.scrollTo(0, 0); }}>
              {filmCount ? `Show ${plural(filmCount, "film")}` : "Show results"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
