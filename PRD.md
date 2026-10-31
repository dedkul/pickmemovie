# PickMeMovie — Product Requirements Document

**Version:** 1.0
**Owner:** Ashish Jangra
**Status:** Draft for build
**Type:** Portfolio project (Next.js, demo-focused)

---

## 1. Overview

PickMeMovie is a cinema showtime discovery web app for Australian movie-goers. It answers one question fast: *"I'm free during this window — what can I actually go watch near me, and can I make it in time?"*

The user sets their location and a free-time window, and the app returns a ranked list of catchable sessions at nearby cinemas — each showing the movie, genre, runtime, poster, cinema, distance, travel time, and whether the session is reachable (with a 10-minute grace buffer for trailers). Tapping a session deep-links to the cinema's own booking page.

This is a portfolio piece demonstrating product thinking and frontend engineering. It is not a commercial product and will be shown in interview settings rather than deployed for public use.

---

## 2. Goals & Non-Goals

### Goals

- Let a user find a watchable movie near them in under 30 seconds, with minimal input.
- Make the "can I make it in time?" judgment the core, legible value — not raw showtime listings.
- Demonstrate strong responsive UI craft across desktop and mobile.
- Show sound product reasoning around scope, data, and tradeoffs.

### Non-Goals

- **No live per-request showtime scraping.** Real showtimes are fetched once a day for a fixed set of cinemas and cached; seeded mock data is the fallback (see §6.2).
- No ticket purchasing in-app. Booking happens on the cinema's site via deep link.
- No user accounts, saved preferences, watchlists, reviews, or ratings.
- No native mobile app. Responsive web only.
- No social features.

---

## 3. Target User

Australian students and young adults who have a block of free time and want to watch something at a cinema without manually checking five different chain websites. They are impulsive or decision-fatigued, mobile-first, and value speed over exhaustive options.

---

## 4. Core User Flow

1. **Land on app.** User sees a location input and a time-window selector.
2. **Set location.** User types their suburb/address; a Geoapify-powered autocomplete dropdown suggests matches; user selects one.
3. **Set free-time window.** User picks one or more day+period blocks (multi-select — see §5.2).
4. **View results.** App returns a ranked list of catchable sessions near the user, sorted by reachability and start time.
5. **Adjust (optional).** User changes the distance radius or time window; list updates.
6. **Book.** User taps a session → opens the cinema's booking page in a new tab.

---

## 5. Feature Requirements

### 5.1 Location Selection

- Text input with **Geoapify Autocomplete API** (free tier) providing a dropdown of AU address/suburb suggestions as the user types.
- Selecting a suggestion sets the user's origin coordinates (lat/lng).
- Optional: a "Use my current location" button using the browser Geolocation API, reverse-geocoded via Geoapify.
- Selected location persists for the session and is shown as an editable pill.

### 5.2 Time-Window Selector (Approach 1 — multi-select)

- **Day pills:** horizontal row of upcoming days (Today + next ~6 days). Multi-selectable.
- **Period blocks per concept:** Morning (6–12), Afternoon (12–5), Evening (5–9), Night (9–late). Multi-selectable.
- A user can express "free Thursday afternoon and Saturday evening" by selecting multiple day+period combinations.
- Default state on load: Today + the current period (e.g. if it's 2pm, "Today / Afternoon" preselected).
- Selected windows render as removable summary chips so the active filter is always legible.

### 5.3 Showtime Results List

Each result card displays:

- Movie poster (TMDb)
- Movie title
- Genre(s) (TMDb)
- Runtime (TMDb)
- Cinema name + chain
- Session start time and format (Standard / Gold Class / IMAX / 4DX etc.)
- **Distance** from user (km)
- **Travel time** (Geoapify Routing API)
- **Reachability badge** (see §5.4)

Sorting: catchable sessions first, ordered by soonest reachable start time. Sessions within the window but unreachable are de-emphasized or hidden (see §5.4).

### 5.4 Reachability Logic (the core feature)

For each session, compute:

```
leave_by = session_start − travel_time
reachable = (now + travel_time) ≤ (session_start + 10-minute buffer)
```

- **10-minute grace buffer:** a session is still "catchable" if the user arrives up to 10 minutes after start time (assumes trailers/ads).
- Reachability states:
  - **Easy** — comfortable margin before start.
  - **Tight** — reachable but within the buffer / little slack.
  - **Missed** — cannot arrive within buffer → hidden or greyed at list bottom.
- Each card surfaces a human-readable cue, e.g. "Leave in 12 min" / "Leave now" / "Arrive during trailers."

### 5.5 Distance / Radius Filter

- User-adjustable radius (e.g. 5 / 15 / 30 / 50 km) filtering which cinemas are considered.
- Default radius sensible for metro (e.g. 30 km).
- Useful for outer-suburb users with few nearby cinemas.

### 5.6 Booking Deep Link

- Each session card links to the relevant cinema chain's booking/showtime page in a new tab.
- For the mock dataset, links point to the chain's real public site (best-effort to the movie/cinema page).
- Clear affordance that booking completes on the cinema's site.

---

## 6. Data Architecture

### 6.1 Movie Metadata — TMDb (real)

- TMDb API provides poster, title, genres, runtime, synopsis, release info.
- API key already held by the developer.
- Cached client- or server-side to avoid redundant calls.

### 6.2 Showtime Data — SerpAPI, daily (real, with fallback)

*Revised 2026-10-14; this replaces the original seeded-mock-only plan.*

- **Source:** SerpAPI Google search (`"<cinema> showtimes"`, `gl=au`). One search per cinema returns about 7 days of sessions, with film title, times and format (Standard, LUX, 4K…).
- **Scope:** 7 Sydney cinemas (Event George St, Palace Central, Hoyts Entertainment Quarter, Dendy Newtown, Ritz Randwick, Hayden Orpheum, Palace Norton Street). The free plan gives 250 searches a month; 7 × 31 = 217 leaves room for retries.
- **Refresh:** once a day by a scheduled job that writes a snapshot to storage. Page requests never call SerpAPI.
- **Fallback, per cinema:** today's fetch → last good snapshot (still valid, since it covers 7 days) → seeded mock sessions, labelled as sample times in the UI.
- **Film matching:** each listing title is matched to TMDb by exact title. Recent releases win over older namesakes, and "4K" listings match the restored classic. Titles with no exact match show without TMDb details rather than with a wrong one.
- **Booking:** results carry no per-session booking link, so Book opens the chain's site.

### 6.3 Location & Routing — Geoapify (real, free tier)

- **Autocomplete API:** address/suburb typeahead.
- **Routing API:** driving travel time + distance from user origin to each candidate cinema.
- Cache routing results per (origin, cinema) pair within a session to stay within free-tier limits.
- Fallback: if routing quota is hit, estimate via haversine distance × an average-speed factor.

---

## 7. Technical Stack

- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind v4
- **Animation:** Framer Motion
- **APIs:** TMDb (metadata), Geoapify (autocomplete + routing)
- **Data:** Local seeded JSON/TS module for cinemas + sessions
- **Hosting:** Vercel (free tier)
- **Secrets:** API keys in server-side env vars / Next.js API routes — never exposed to client.

---

## 8. Responsive Design Requirements

- **Mobile (primary):** single-column list, thumb-reachable controls, sticky time/location summary.
- **Desktop:** wider layout that uses the canvas intentionally — e.g. filters/controls panel alongside a multi-column or roomier result list. Not a stretched mobile view.
- Breakpoints handled with Tailwind; layout, type scale, and spacing all adapt.
- Visual direction TBD via Claude Design / Variant brainstorming — playful, cinematic, easy on the eyes.

---

## 9. Phasing

### Phase 1 — UI + Mock Data (current focus)

- Build full responsive UI with seeded showtime data.
- Location autocomplete + time-window multi-select working.
- Reachability badges driven by mock travel times.

### Phase 2 — Real Location & Routing

- Wire Geoapify autocomplete and routing for real distance/travel-time.
- Real TMDb metadata for all movies in the dataset.

### Phase 3 — Polish

- Animations, empty states, loading states, error handling, edge cases (no sessions in window, location outside coverage).

### Future (optional, post-portfolio)

- One real scraper for a single chain (e.g. Event Cinemas internal JSON endpoint) to demonstrate live data, while keeping the rest mocked.

---

## 10. Success Criteria

- A first-time viewer understands the value within one screen, no onboarding.
- From landing to a booking link in under 30 seconds.
- Looks and feels intentional on both a phone and a laptop.
- Developer can clearly articulate the data-scoping decision and reachability logic when asked.

---

## 11. Open Questions / Risks

- **Geoapify free-tier limits:** routing calls scale with cinemas-per-search; mitigate with caching + haversine fallback.
- **Mock data realism:** session times must feel plausible against real AU cinema schedules to survive scrutiny.
- **Deep-link accuracy:** chain sites change URL structures; links are best-effort to the booking page, not guaranteed deep to a specific session.