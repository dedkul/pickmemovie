import { connection } from "next/server";
import { Suspense } from "react";
import App from "@/app/components/App";
import { CINEMAS } from "@/app/lib/cinemas";
import { addDays, melbourneDate, melbourneMinutes } from "@/app/lib/melbourne-time";
import { sessionsFor, type Snapshot } from "@/app/lib/snapshot";
import { getCachedSnapshot } from "@/app/lib/snapshot-store";
import { getFilm, matchFilm, type Film } from "@/app/lib/tmdb";

// The real app, at /preview until the phase 4 cutover (/ still serves the
// v10 prototype via the rewrite in next.config.ts).

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Showtimes />
    </Suspense>
  );
}

async function Showtimes() {
  await connection(); // "today" is per request, never baked in at build time
  const at = new Date();
  const today = melbourneDate(at);
  const dates = [today, addDays(today, 1), addDays(today, 2)];
  const snapshot = await getCachedSnapshot();
  const sessions = sessionsFor(snapshot, dates);
  const films = await loadFilms([...new Set(sessions.map(s => s.title))], snapshot, today);
  return <App dates={dates} serverNow={melbourneMinutes(at)} sessions={sessions} films={films} cinemas={CINEMAS} />;
}

// Title → TMDb details, or null when there's no exact match or TMDb is down:
// the card then shows the listing title alone rather than a guess.
async function loadFilms(titles: string[], snapshot: Snapshot, today: string): Promise<Record<string, Film | null>> {
  const entries = await Promise.all(
    titles.map(async title => {
      try {
        // The daily refresh already matched real titles; sample titles may not be in it.
        const id = title in snapshot.films ? snapshot.films[title] : await matchFilm(title, today);
        return [title, id === null ? null : await getFilm(id)] as const;
      } catch (err) {
        console.error(err);
        return [title, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
