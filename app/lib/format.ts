// Text formatting ported from prototypes/v10.html. Times are minutes, either
// since midnight or since today's midnight, so no time zones are involved here.

export const NB = " "; // keep "14 min", "1h 42m" from breaking across lines

export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

// 1145 → "7:05 pm"; past 1440 wraps to the next day ("12:30 am").
export function clock(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")}${NB}${h < 12 ? "am" : "pm"}`;
}

// 14 → "14 min", 102 → "1h 42m", 120 → "2h"
export const dur = (m: number) => (m < 60 ? `${m}${NB}min` : `${Math.floor(m / 60)}h${m % 60 ? NB + (m % 60) + "m" : ""}`);

// 97 → "1h 37m"
export const runtime = (m: number) => `${Math.floor(m / 60)}h${NB}${String(m % 60).padStart(2, "0")}m`;

// Minutes since midnight → "5 pm", "5:30 pm", "midnight", "12:30 am" (past 1440 = after midnight)
export function hm(min: number, suffix = true): string {
  if (min === 1440) return "midnight";
  const h = Math.floor(min / 60) % 24, m = min % 60;
  return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${suffix ? NB + (h < 12 ? "am" : "pm") : ""}`;
}

// "5–9 pm", "6 am – 12 pm", "9 pm – 1 am"
export function rangeText(a: number, b: number): string {
  if (b < 1440 && a < 720 === b < 720) return `${hm(a, false)}–${hm(b)}`;
  return `${hm(a)} – ${hm(b)}`;
}

export type Day = { idx: number; date: string; rel: string | null; short: string; long: string };

// The 3 pickable days from a Sydney ISO date. Formatted in UTC because the
// ISO date already is the Sydney date.
export function makeDays(dates: string[]): Day[] {
  return dates.map((date, idx) => {
    const d = new Date(`${date}T00:00:00Z`);
    const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-AU", { timeZone: "UTC", ...o });
    return {
      idx,
      date,
      rel: idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : null,
      short: `${f({ weekday: "short" })} ${d.getUTCDate()} ${f({ month: "short" })}`, // Sat 11 Oct
      long: f({ weekday: "long", day: "numeric", month: "long" }),
    };
  });
}
export const dayLabel = (d: Day) => (d.rel ? `${d.rel}, ${d.short}` : d.short); // Today, Mon 6 Oct
export const dayShort = (d: Day) => d.rel || d.short; // Today | Sat 11 Oct
