---
name: project-overview
description: PickMeMovie design system tokens, typography, rejected patterns, and prototype conventions
metadata:
  type: project
---

## Design System

**Colors (CSS vars):**
- `--bg: #100F0D` — near-black background
- `--panel: #191816` — slightly lighter panel/card bg
- `--cream: #EDE9E0` — primary text/selected state
- `--c40 / --c20 / --c16 / --c09 / --c06` — cream at opacity steps for hierarchy
- `--sel-bg: #EDE9E0` / `--sel-fg: #100F0D` — inverted selected pill state

**Typography:**
- Headlines: `DM Serif Display`, italic only
- UI: `DM Sans`, weights 400/500/600
- Font loaded from Google Fonts (both files use this pattern)

**Interaction conventions:**
- Pills toggle with `.on` class; at least one must remain selected
- Radius is single-select; day + period are multi-select
- Autocomplete dropdown: positioned absolute below input, hidden attr toggled
- Reachability states: `tight` (urgent, bordered badge), `easy` (subdued text), `missed` (0.22–0.28 opacity, pointer-events none)
- Surprise me: opens modal with shuffled catchable sessions, "Pick another" cycles through

**Rejected patterns (explicit user feedback):**
- Glassmorphism cards
- Emoji in UI labels (emoji in Surprise me button ✦ is acceptable)
- Film grain overlays
- Ambient glow effects
- Amber or neon accent colors

**Stack:** Next.js 16.2.4, React 19, TypeScript, Tailwind CSS v4, App Router

**Why:** PickMeMovie is a Melbourne cinema showtime discovery app. Core value: "I'm free — what can I actually catch near me?" Must be single-screen, no page navigation.
