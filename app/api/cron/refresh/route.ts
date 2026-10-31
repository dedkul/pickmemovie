import { revalidateTag } from "next/cache";
import { CINEMAS } from "@/app/lib/cinemas";
import { sydneyDate } from "@/app/lib/sydney-time";
import { fetchShowtimes, searchesLeft } from "@/app/lib/serpapi";
import { mergeRefresh, needsFetch, type FetchOutcome } from "@/app/lib/snapshot";
import { readSnapshot, writeSnapshot } from "@/app/lib/snapshot-store";
import { matchFilm } from "@/app/lib/tmdb";

export const maxDuration = 120;

// GET /api/cron/refresh — run daily by Vercel Cron (vercel.json), which sends
// `Authorization: Bearer $CRON_SECRET`. Each cinema fetched costs one SerpAPI
// search, so this is the only place that calls SerpAPI.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const prev = await readSnapshot(); // throws on a storage error: never refetch everything blind
  const due = CINEMAS.filter(c => needsFetch(prev, c.id, now));
  const left = due.length ? await searchesLeft() : 0;
  const fetching = due.slice(0, left);
  const quotaSkipped = due.slice(left).map(c => c.id);
  if (quotaSkipped.length) console.error(`SerpAPI quota: skipped ${quotaSkipped.join(", ")}`);

  const settled = await Promise.allSettled(fetching.map(fetchShowtimes));
  const outcomes: Record<string, FetchOutcome> = {};
  fetching.forEach((c, i) => {
    const r = settled[i];
    outcomes[c.id] = r.status === "fulfilled" ? { ok: true, res: r.value } : { ok: false, error: String(r.reason) };
  });
  const next = mergeRefresh(prev, outcomes, now);

  // Match titles to TMDb; drop titles no longer showing. Unmatched titles are
  // retried each run (TMDb adds films), and a failed lookup is simply left out.
  const titles = new Set(Object.values(next.cinemas).flatMap(c => c.sessions.map(s => s.title)));
  const today = sydneyDate(now);
  const films: Record<string, number | null> = {};
  for (const title of titles) {
    if (next.films[title] != null) { films[title] = next.films[title]; continue; }
    try { films[title] = await matchFilm(title, today); } catch (err) { console.error(err); }
  }
  next.films = films;

  await writeSnapshot(next);
  revalidateTag("showtimes", "max");

  const at = now.toISOString();
  const summary = {
    fetched: fetching.filter(c => next.cinemas[c.id].fetchedAt === at).map(c => c.id),
    failed: fetching.filter(c => next.cinemas[c.id].fetchedAt !== at).map(c => ({ id: c.id, error: next.cinemas[c.id].lastError })),
    skippedFresh: CINEMAS.filter(c => !due.includes(c)).map(c => c.id),
    quotaSkipped,
    problems: Object.fromEntries(Object.entries(next.cinemas).filter(([, c]) => c.problems.length).map(([id, c]) => [id, c.problems])),
    films: { total: titles.size, unmatched: [...titles].filter(t => films[t] === null) },
  };
  if (summary.failed.length) console.error("refresh failures", summary.failed);
  return Response.json(summary);
}
