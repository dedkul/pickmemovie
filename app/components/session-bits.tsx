import type { Evaluated } from "@/app/lib/reachability";
import type { Film } from "@/app/lib/tmdb";

// Small pieces shared by the card and both dialogs.

// TMDb's public image CDN; the path comes from the film details.
export const tmdbImage = (path: string | null, size: "w342" | "w780") => (path ? `url(https://image.tmdb.org/t/p/${size}${path})` : undefined);

export const Poster = ({ film }: { film: Film | null }) => (
  <div className="poster" style={{ backgroundImage: tmdbImage(film?.poster ?? null, "w342") }} aria-hidden="true" />
);

// "Standard" is most sessions, so only other formats (LUX, 4K…) are tagged.
export const isSpecialFormat = (e: Evaluated) => e.format !== "Standard";

export const AfterMidnight = ({ e }: { e: Evaluated }) => (e.startMin >= 1440 ? <span className="late-tag">after midnight</span> : null);

// Seeded times stand in when a cinema has no real data for that day; never pass them off as real.
export const SampleTag = ({ e }: { e: Evaluated }) => (e.sample ? <span className="sample-tag" title="This cinema’s real times weren’t available, so this one is made up">Sample time</span> : null);
