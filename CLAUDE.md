# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # run ESLint
```

No test suite is configured yet.

For local Supabase (requires Supabase CLI and Docker):
```bash
npx supabase start   # start local Supabase stack
npx supabase stop    # stop local stack
npx supabase db push # push migrations to remote
```

## Project

Al Bayyinah School Progress System — Quran learning tracker for ~350 students across 15 teachers. Replaces paper → Excel → PDF macro workflow.

Full requirements: `docs/PRD.md` · Features: `docs/features/`

## Rules

- **Mobile-first.** Design for 375 px viewport first.
- **All UI text in Bahasa Indonesia.**
- **Arabic text uses Amiri Arabic font** (Google Fonts) with RTL spans embedded in LTR layout.
- **Never go beyond the current development phase without asking.**

## Architecture

### Stack
- **Next.js 16** (App Router, `src/app/`) + React 19 + TypeScript
- **Tailwind CSS v4** (PostCSS plugin — `@tailwindcss/postcss`, not the classic config)
- **Supabase** — PostgreSQL database, Auth (email/password), Row-Level Security
- Path alias: `@/*` → `./src/*`

### Auth & Roles
Three roles enforced via Supabase RLS and stored in `users.role`:

| Role | Scope |
|------|-------|
| `admin` | Full access all years, all classes, user management |
| `teacher` | Active year — own class(es) only; previous years read-only |
| `student_parent` | Own student record, all years read-only |

The student/parent share one account with a client-side view toggle ("Tampilan Siswa" / "Tampilan Orang Tua").

### Database Schema (key tables)
```
academic_years   — label, is_active (only one active at a time, DB-enforced)
teachers         — user_id FK
classes          — name, teacher_id FK, academic_year_id FK
students         — user_id FK, name
enrollments      — student_id + class_id + academic_year_id
progress_logs    — type (iqro|juz30|juz29), iqro_level, iqro_page,
                   juz_page (582–604 for juz30; 562–582 for juz29, Uthmani mushaf),
                   is_opening_position (carry-forward flag), teacher notes
assessments      — retention assessments (Juz track only),
                   outcome (lanjut|ulang), reason required when ulang,
                   juz_type + juz_page
badges / student_badges — gamification
```

Year rollover: admin creates new `academic_years` record, assigns teachers to new classes, then the last `progress_logs` entry per student is copied with `is_opening_position = true` as the opening position for the new year. Previous year records are never altered.

### UI Constraints
- **Mobile-first** — 375–430 px viewport; 44 px minimum touch targets
- **Arabic font:** Amiri Arabic (Google Fonts), RTL spans in LTR layout
- **Color palette:** green + warm gold as primary; red only for errors; amber for retention assessment indicators (neutral tone, not alarming)
- Teacher input form: bottom sheet, pre-fills last logged position, max 3 taps for a standard update
- PDF export: per student, on demand — includes school logo, progress history, assessment records, teacher name
