# Design

Visual system for the Al Bayyinah progress app. Read with [PRODUCT.md](PRODUCT.md) — that file says *who* and *why*; this one says *how it looks*.

## Direction

**Editorial reading room.** Warm paper, dark ink, one quiet green. The screen should feel like an open mushaf on a wooden desk, not a SaaS dashboard. Reference: a book-reading app layout — serif greeting hero, thin icon rail, a tinted side panel with a week strip and a timeline.

Rules of thumb:

- One hero per screen. Greeting + one sentence of context + at most one primary action.
- Numbers are set in serif, inline in sentences or as quiet figures — never inside coloured metric cards.
- Colour is scarce. Green means "current / primary". Gold is a hairline highlight. Everything else is ink on paper.
- Arabic is structural: Amiri, large, `dir="rtl"`, never below 20px.

## Colour tokens

Defined in `src/app/globals.css` and exposed to Tailwind as `bg-paper`, `text-ink`, etc. Light only — this is a school record, not a night-reading app.

| Token | Value | Use |
|---|---|---|
| `paper` | `#f5f1e6` | Page background |
| `panel` | `#ebe5d5` | Side panel / secondary region |
| `surface` | `#fbf8f1` | Raised rows, sheets, inputs |
| `line` | `#e0d8c4` | Hairlines, dividers, dashed timeline |
| `ink` | `#1d211b` | Headings, primary text, dark pill buttons |
| `ink-2` | `#565a50` | Body text |
| `ink-3` | `#8b8d80` | Meta, captions, placeholders |
| `accent` | `#1f5b3a` | Forest green — active nav, current day, links, progress fill |
| `accent-soft` | `#dde6d4` | Active nav background, selected chips |
| `gold` | `#b3862c` | Small highlights: progress numerator, streak, badges |
| `warn` | `#b5532f` | Inactive, "ulang", errors (the reference's coral) |
| `warn-soft` | `#f1dfd4` | Background for warn chips |

## Typography

| Role | Font | Size / weight |
|---|---|---|
| Display (hero greeting) | EB Garamond (`font-serif`) | 40–56px, 500, tight leading (1.05) |
| Section title | EB Garamond | 22–24px, 500 |
| Figure (numbers) | EB Garamond | 28–40px, 500 |
| Body | Montserrat (`font-sans`) | 14–15px, 400, leading 1.6 |
| Meta / labels | Montserrat | 12px, 500; uppercase only for tiny eyebrows |
| Quote / note | Montserrat italic | 13–14px |
| Arabic | Amiri (`font-arabic`) | 28–56px, `dir="rtl"` |

## Layout

- **Desktop (≥1024px):** 72px icon rail on the left (logo top, nav middle, logout bottom). Content grid is `main` (fluid) + `aside` (360px) on `panel` background, full height.
- **Tablet/mobile:** rail becomes a fixed bottom tab bar (64px + safe area). The aside stacks under the main column. 16px side gutter, 20px on tablet.
- Section rhythm: 40px between sections on desktop, 32px on mobile. Section header = serif title left, small icon action right.

## Components

- **Rail item:** 44px circle. Active = `accent` fill, white icon. Idle = `ink-2` stroke icon, no background.
- **Pill button (primary):** `ink` background, `paper` text, fully rounded, 40px tall, trailing ↗ arrow.
- **Pill button (secondary):** transparent, 1px `line` border, `ink` text.
- **Row:** `surface` background, 16px radius, no border, 16px padding, 56px min height (thumb target).
- **Week strip:** 7 columns, weekday name over date. Today = `accent-soft` tall pill; days with activity get a 4px `accent` dot; Sunday label in `warn`.
- **Timeline:** dashed 1px `line` vertical rule, 40px avatar (initials on `accent-soft`), name in 15px/600, note in italic `ink-2`, footer line with ✓ tag + relative time.
- **Chips:** 12px text, fully rounded, `accent-soft`/`accent` or `warn-soft`/`warn`.
- **Progress:** 4px track in `line`, fill in `accent`. Label as "**12** / 23 halaman" with numerator in `gold`.
- **Bottom sheet:** `surface`, 28px top radius, grab handle, backdrop `ink/40`.

## Don't

- No gradients, glows or shadows beyond a single soft `0 1px 2px` on sheets.
- No dark mode, no dark sidebar.
- No XP bars, confetti, trophy icons. A streak is a sentence ("4 minggu berturut-turut"), not a flame.
- No grid of KPI cards. Put figures in a sentence or a single calm row separated by hairlines.
