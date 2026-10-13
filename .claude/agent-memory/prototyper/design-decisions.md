---
name: design-decisions
description: Homepage layout variants explored in session 1, what was rejected, and which was recommended
metadata:
  type: project
---

## Homepage Layout Variants (Session 1)

Five homepage layouts were prototyped for the PickMeMovie homepage. All saved to `/prototypes/v1.html` – `v5.html`.

### v1 — Command Bar
Horizontal sticky top bar holds both location input and all filter chips in two rows. Results in a 2–3 col grid below. Like a flight search tool. Dense, desktop-forward. Best for power users who know what they want.

### v2 — Editorial Stack (RECOMMENDED, copied to 01-landing.html)
Full-width hero with italic serif headline + large location input. Filters in a horizontal band below the hero. Results as a tall editorial list (poster + large title + right-aligned time). Most content-forward; strong hierarchy; the "discovery" feeling matches the app's value prop.

### v3 — Timeline
Left rail of period buttons (Morning/Afternoon/Evening/Night) that toggle and jump to sections. Filter strip across the top. Sessions laid out on a vertical timeline axis with time column + dot + content. Good for "what's on right now" scanning. Visual time dimension is a genuine differentiator.

### v4 — Distance Ring / Proximity Panel
Left panel groups sessions into concentric distance bands (e.g. within 2km, 2–5km, 5–10km). Clicking a session opens a detail view in the right panel. Foregrounds the "how far" dimension. Adds a two-panel master-detail UX. More complex, requires two screens of work; suits map-first use cases.

### v5 — Focus Search / Two-state
Entry screen (centered, full-height, large inputs + filters + CTA button) transitions to a results screen with a compact sticky filter bar. Creates a deliberate "commit to search" moment. Strong onboarding UX; may feel slow for repeat users.

## Recommendation rationale

v2 wins because:
- The editorial headline + location entry directly frames the app's value prop in the first viewport
- The filter band separates concerns cleanly (hero = where, band = when, results = what)
- Tall editorial rows give each film appropriate weight without wasting vertical space
- Naturally mobile-first, scales well to desktop without needing a second layout mode

**Why:** v2 balances the discovery feeling (editorial aesthetic, headline) with function (filters immediately accessible without scroll). It avoids the complexity of v4 (master-detail) and the friction of v5 (two-step entry).

---

## v3 Timeline Variations (Session 2 — v3a–v3e)

The user liked v3's concept (left period rail + timeline axis) but requested 5 layout refinements.

### v3a — Icon Rail + Left Border Reachability (RECOMMENDED)
Period nav collapses to 48px on mobile (labels hidden, icon only; 72px on desktop). No axis line — left border on each row communicates reachability state (bright cream = tight, dim = easy). Filter strip split into 2 rows: location + days on row 1, radius on row 2. Badge is solid cream fill on tight sessions, muted text on easy.

### v3b — Horizontal Period Strip + Badge-Led Cards
Period removed from left rail entirely and placed as a full-width 4-column horizontal strip at the bottom of the filter area. Badge is placed ABOVE the film row (largest element on the card). Dotted axis line replaces solid. Filter groups: location + radius on one row, days on a second row, period strip on third.

### v3c — Segment Control Period + Time-Block Sections + Desktop 2-Col Grid
Period becomes a full-width segment control at the TOP of the filter strip (most prominent filter). No per-row timestamp — instead, cards are grouped under time-block headings (e.g. "6:50 pm ————"). Cards flow into a 2-column CSS grid on screens >= 1100px.

### v3d — Desktop Master-Detail + Icon Rail
On desktop (>= 1100px): list (max-width 480px) + right panel that shows selected session details in large format (poster, serif title, big badge). On mobile: list only (detail panel hidden). Period nav is 48px icon-only rail. Single-row filter strip.

### v3e — Urgency-Led Layout + Count Badges on Period Nav
Critical differentiator: "Leave soon" section at the top of the timeline always floats tight sessions above period groupings. Period nav icons show a count badge (how many catchable sessions in that period). Tight sessions use a large left-column badge block rather than a right-side badge. Dotted axis line on regular rows.

### Recommended: v3e
Strongest because the urgency section directly surfaces the app's core value ("can I make it?") without requiring the user to read every row. The count badges on period buttons let users quickly see where sessions exist before scrolling.
