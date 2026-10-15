// Vercel runs in UTC, so "today" must always be worked out in Melbourne time.
// Dates are ISO strings (YYYY-MM-DD) so they compare and serialise simply.

export const TZ = "Australia/Melbourne";

// The Melbourne calendar date at an instant. en-CA formats as YYYY-MM-DD.
export function melbourneDate(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Minutes since Melbourne midnight at an instant.
export function melbourneMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(at);
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}
