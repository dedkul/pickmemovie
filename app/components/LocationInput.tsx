"use client";

import { useEffect, useState } from "react";
import type { Origin } from "@/app/lib/reachability";
import { Locate, Pin } from "./icons";
import s from "./LocationInput.module.css";

type Result = { q: string; places: Origin[]; error: boolean };

export default function LocationInput({ origin, onChoose }: { origin: Origin; onChoose: (o: Origin) => void }) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [active, setActive] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const q = text.trim();
  const listOpen = focused && q.length >= 2 && result?.q === q;
  const matches = listOpen ? result.places : [];

  // Suggestions from Geoapify via our API route, 200 ms after typing stops.
  useEffect(() => {
    if (!focused || q.length < 2) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/location-suggestions?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then(r => r.json())
        .then((d: { places?: Origin[]; error?: string }) => { setResult({ q, places: d.places ?? [], error: Boolean(d.error) }); setActive(0); })
        .catch(e => { if (e.name !== "AbortError") setResult({ q, places: [], error: true }); });
    }, 200);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, focused]);

  function choose(o: Origin) {
    onChoose(o);
    setNote(null);
    setFocused(false);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && matches.length) { e.preventDefault(); setActive(a => (a + 1) % matches.length); }
    else if (e.key === "ArrowUp" && matches.length) { e.preventDefault(); setActive(a => (a - 1 + matches.length) % matches.length); }
    else if (e.key === "Enter" && matches[active]) { e.preventDefault(); choose(matches[active]); }
    else if (e.key === "Escape") { setText(origin.name); setResult(null); }
  }

  function locate() {
    if (!navigator.geolocation) { setNote("Your browser can’t share location. Type a suburb instead."); return; }
    setNote("Finding you…");
    navigator.geolocation.getCurrentPosition(
      p => choose({ name: "Your location", sub: "", lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setNote("Couldn’t get your location. Type a suburb instead."),
      { timeout: 8000 },
    );
  }

  return (
    <>
      <div className={s.field}>
        <Pin className={s.lead} />
        {/* Leaving the field without choosing shows the current location again, not stale text. */}
        <input
          id="loc-input" className={s.input} type="text" autoComplete="off" spellCheck={false} placeholder="Suburb or address"
          role="combobox" aria-autocomplete="list" aria-expanded={listOpen} aria-controls="ac-list"
          aria-activedescendant={matches.length ? `ac-${active}` : undefined}
          value={focused ? text : origin.name}
          onFocus={e => { setText(origin.name); setFocused(true); e.target.select(); }}
          onBlur={() => setFocused(false)}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button className={`icon-btn ${s.locate}`} type="button" aria-label="Use my current location" title="Use my current location" onClick={locate}>
          <Locate />
        </button>
        {listOpen && (
          // mousedown, not click: it fires before the input's blur closes the list
          <div className={s.dropdown} id="ac-list" role="listbox">
            {matches.map((p, i) => (
              <div key={`${p.name}-${p.sub}-${i}`} className={s.item} role="option" id={`ac-${i}`} aria-selected={i === active}
                onMouseDown={e => { e.preventDefault(); choose(p); }}>
                <span className={s.name}>{p.name}</span><span className={s.sub}>{p.sub}</span>
              </div>
            ))}
            {!matches.length && (
              <div className={s.empty}>{result.error ? "Suggestions aren’t available right now. Try your location instead." : `No Melbourne suburb matches “${q}”.`}</div>
            )}
          </div>
        )}
      </div>
      {note && <p className={s.note} role="status">{note}</p>}
    </>
  );
}
