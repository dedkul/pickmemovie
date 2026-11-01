"use client";

import { useRef } from "react";
import s from "./BrandTitle.module.css";

// The logo plays once on mouse hover or keyboard focus: the diamond cutout
// opens into a lens, the mark tilts back and settles, the name flashes the
// accent. Plain SVG <animate>, so it needs no library; reduced motion skips it.
const DUR = `${89 / 60}s`;
const SPLINES = ".22 1 .36 1; .22 1 .36 1; .22 1 .36 1; .22 1 .36 1";
const PULSE_TIMES = "0; .1685; .3933; .7303; 1";
const RING = "M28 3a25 25 0 1 1 0 50a25 25 0 1 1 0-50Z";
const DIAMOND = `${RING} M28 12 C31 21 35 25 44 28 C35 31 31 35 28 44 C25 35 21 31 12 28 C21 25 25 21 28 12Z`;
const LENS = `${RING} M28 12 C36.84 12 44 19.16 44 28 C44 36.84 36.84 44 28 44 C19.16 44 12 36.84 12 28 C12 19.16 19.16 12 28 12Z`;

export default function BrandTitle() {
  const svg = useRef<SVGSVGElement>(null);
  const busy = useRef(false);

  function play() {
    if (busy.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    busy.current = true;
    svg.current?.querySelectorAll<SVGAnimationElement>("animate, animateTransform").forEach(a => a.beginElement());
    setTimeout(() => { busy.current = false; }, (89 / 60) * 1000);
  }

  return (
    <a href="#" aria-label="PickMeMovie home" className={s.title}
      onPointerEnter={e => { if (e.pointerType === "mouse") play(); }} onFocus={play}>
      <svg ref={svg} className={s.art} viewBox="0 0 340 64" aria-hidden="true">
        <g fill="currentColor">
          <animateTransform attributeName="transform" type="rotate" begin="indefinite" dur={DUR} fill="freeze"
            values="0 28 28; -12 28 28; 5 28 28; 0 28 28; 0 28 28" keyTimes="0; .2247; .5056; .8427; 1"
            calcMode="spline" keySplines={SPLINES} />
          <path fillRule="evenodd" d={DIAMOND}>
            <animate attributeName="d" begin="indefinite" dur={DUR} fill="freeze" keyTimes={PULSE_TIMES}
              calcMode="spline" keySplines={SPLINES} values={[DIAMOND, LENS, LENS, DIAMOND, DIAMOND].join(";")} />
          </path>
          <path d="M43 42a6 6 0 0 1 8 0l11 11a6 6 0 0 1-8 8L43 50a6 6 0 0 1 0-8Z" />
        </g>
        <text className={s.name} x="78" y="43" fill="currentColor">PickMeMovie</text>
        <text className={s.name} x="78" y="43" fill="var(--accent)" opacity="0">
          PickMeMovie
          <animate attributeName="opacity" begin="indefinite" dur={DUR} fill="freeze" values="0; 1; 1; 0; 0"
            keyTimes={PULSE_TIMES} calcMode="spline" keySplines={SPLINES} />
        </text>
      </svg>
    </a>
  );
}
