"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

type Props = { className?: string; children: ReactNode } & ({ "aria-label": string } | { "aria-labelledby": string });

// Segmented control (.seg in globals.css). The highlight is one layer under the
// buttons, clipped to the pressed one, so a change slides the clip instead of jumping.
export default function Seg({ className, children, ...aria }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const placed = useRef(false);

  // animate=false snaps: first paint, resize, or a group that was hidden.
  function place(animate: boolean) {
    const seg = ref.current;
    const on = seg?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    const pill = seg?.querySelector<HTMLElement>(".seg-ind > span");
    if (!seg || !on || !pill || !seg.clientWidth) return; // no layout yet: the observer places it once shown
    const r = seg.clientWidth - on.offsetLeft - on.offsetWidth, b = seg.clientHeight - on.offsetTop - on.offsetHeight;
    const clip = `inset(${on.offsetTop}px ${r}px ${b}px ${on.offsetLeft}px round 100px)`;
    if (pill.style.clipPath === clip) return;
    const snap = !animate || !placed.current;
    if (snap) pill.style.transition = "none";
    pill.style.clipPath = clip;
    if (snap) { void pill.offsetWidth; pill.style.transition = ""; }
    placed.current = true;
  }

  // After every render, so a new pressed button (or new labels) moves the highlight.
  useLayoutEffect(() => place(true));
  useEffect(() => {
    const ro = new ResizeObserver(() => place(false));
    ro.observe(ref.current!);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={className ? `seg ${className}` : "seg"} role="group" {...aria}>
      <span className="seg-ind" aria-hidden="true"><span /></span>
      {children}
    </div>
  );
}
