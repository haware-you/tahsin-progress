# UX Flow Gaps

Status as of 2026-09-19. Ordered by impact on the core loop: **teacher logs → parent sees it the same day**.

Each gap: what's wrong, where in the code, and a suggested fix. Tick the box when done.

---

## P0 — Broken

### ☐ 0. Push the tadarus migration

`supabase/migrations/20260919000001_tadarus_track.sql` adds the `tadarus` progress type and the *Khatam Tadarus* badge. Until it's pushed (`npx supabase db push`), saving a Tadarus log fails with an enum error. The demo seed has no tadarus students yet — add some if you need demo data.


### ☑ 1. Badges are never awarded when a teacher logs progress

**Fixed 2026-09-20** — option B. `supabase/migrations/20260920000001_badge_award_trigger.sql` adds `award_badge()` / `award_badges_for_student()` (both `SECURITY DEFINER`) and an `AFTER INSERT` trigger on `progress_logs`, plus a backfill over existing logs. The client-side `awardBadge()` / `tryAwardBadges()` are gone from `src/app/actions/progress.ts`. **Still needs `npx supabase db push`.**

<details><summary>Original report</summary>

**Flow:** Teacher saves a log → `tryAwardBadges()` upserts into `student_badges` → parent should see the badge in *Laporan Perjalanan* on `/siswa`.

**Problem:** RLS on `student_badges` only allows writes by admin (`student_badges_write_admin` in `supabase/migrations/20260515000002_rls.sql`). The server action runs as the teacher, so the upsert is silently rejected — the result isn't checked in `awardBadge()` (`src/app/actions/progress.ts`). Every badge except those an admin triggers stays locked forever.

**Fix options:**
- A. New migration: add an `INSERT` policy for teachers on students enrolled in their class (same subquery as `student_badges_select`). Simple; teachers could technically insert arbitrary badges for their own students.
- B. (Recommended) Move awarding into a Postgres `SECURITY DEFINER` function or an `AFTER INSERT` trigger on `progress_logs`. Awarding becomes atomic and can't be skipped or forged from the client.
- Either way: check and log the `error` returned by the upsert.
- Backfill: one-off SQL to award badges already earned from existing `progress_logs`.

**Verify:** log in as guru, log the 1st entry for a student → `/siswa` shows *Langkah Pertama* as earned.

</details>

### ☑ 2. Juz 29 page range is inconsistent

**Fixed 2026-09-20** — `JUZ_RANGE` in `src/lib/quran.ts` (juz29 = 562–581) is now the only definition; the local copies in `progress.ts`, `StudentRoster.tsx` and `import.ts` were deleted and all three import it. The trigger uses 581 for the *Khatam Juz 29* cutoff. The badge description no longer mentions page 582 (fixed in the tadarus migration).

<details><summary>Original report</summary>

`JUZ_PAGE_RANGE.juz29.max` is **582** in `src/app/actions/progress.ts` and `StudentRoster.tsx`, but page 582 is the first page of Juz 30 (An-Naba'). `src/lib/quran.ts` uses 562–581. Result: a teacher can log "Juz 29 page 582", and the *Khatam Juz 29* badge triggers on the wrong page.

**Fix:** one shared `JUZ_RANGE` in `src/lib/quran.ts`, imported by the action, the roster form, and the report. Juz 29 = 562–581. Update the badge description seed ("halaman 582") accordingly.

</details>

---

## P1 — Blocks onboarding / everyday use

### ☐ 3. CSV import can't create login accounts

**Flow:** Admin uploads student CSV → rows committed → families log in.

**Problem:** `src/app/actions/import.ts` only links rows to *existing* `auth.users`. Creating users needs the Supabase service-role key, which the app doesn't use. For ~350 families that means creating every account by hand in the Supabase dashboard.

**Fix:**
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` / Vercel env (server-only, never `NEXT_PUBLIC_`).
- Create `src/lib/supabase/admin.ts` with a service-role client, used only inside admin-checked server actions.
- On commit: `auth.admin.createUser({ email, password: generated, email_confirm: true })`, then insert `users` + `students` rows.
- Output: downloadable CSV of generated credentials, or send invite emails (`auth.admin.inviteUserByEmail`) instead of passwords.

### ☐ 4. No password reset

`/login` now just says "Lupa kata sandi? Hubungi admin sekolah." Every forgotten password becomes an admin task.

**Fix:**
- `/login/lupa` page → `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<site>/login/reset' })`.
- `/login/reset` page → `supabase.auth.updateUser({ password })`.
- Allow `/login/*` through the auth redirect in `src/proxy.ts` (currently only exactly `/login` is public).
- Admin side: "Reset kata sandi" button in `/admin/users` (needs the service-role client from gap 3).

### ☐ 5. Admin can't log progress

`logProgress()` requires a `teachers` row for the current user; admin gets "Akun guru tidak ditemukan." and `StudentRoster` routes admin taps to `/siswa` instead of the bottom sheet. When a teacher is absent, nobody can record that class's sessions.

**Fix:** let `logProgress` accept admin (record `teacher_id` = the class's teacher, or add a `logged_by` column), and give admin the bottom sheet with a secondary "Lihat laporan" link.

---

## P2 — Engagement loop is incomplete

### ☐ 6. Parents are never notified

The parent only sees a new entry if they open the app. The "same afternoon" promise in PRODUCT.md depends on them remembering to check.

**Fix (pick one to start):**
- Weekly email digest per student (Vercel Cron + Resend via Vercel Marketplace).
- WhatsApp share link on the saved-log confirmation for the teacher (`https://wa.me/?text=…`) — zero infrastructure, matches how Indonesian schools already communicate.
- PWA + web push (bigger).

### ☐ 7. Student vs parent view is only a UI toggle

`/siswa` has a *Siswa / Orang Tua* switch but both use one `student_parent` account. Anyone holding the login sees teacher notes. Acceptable for now; revisit if notes become sensitive (then: separate parent role or PIN on the Orang Tua tab).

### ☐ 8. Badge set is small and one-off

Only 5 badges exist (`20260604000001_phase3_badges.sql`), and most take months. Ideas that keep the calm tone of PRODUCT.md (no XP, no confetti):
- *Khatam* per surah group (e.g. "An-Naba' – 'Abasa")
- *Murajaah Lanjut ×5*
- *Konsisten 8 / 12 minggu*
- Per-iqro-book completion (Iqro 1…5), not just Iqro 6

Badges are displayed by `src/app/(protected)/siswa/Laporan.tsx`; add an icon for any new `trigger_type` in its `ICONS` map.

### ☐ 9. Class milestones table is unused

`class_milestones` exists in the schema (Phase 3 "auto-generated weekly class summary") but nothing writes or reads it. Candidate for the `/guru` side panel.

---

## P3 — Polish / housekeeping

- ☐ **School days:** progress is recorded Mon–Thu only. The week strip and "x/4 hari sekolah" follow that, but `logProgress` still accepts any date and the 4-week streak / 28-day inactive rules count calendar weeks/days. Decide whether to block Fri–Sun logging.
- ☐ **404 for logged-out users:** `src/proxy.ts` sends every unknown URL to `/login` when not signed in, so only signed-in users see `src/app/not-found.tsx`.

- ☐ **Sub-pages not redesigned:** `/admin/import`, `/admin/users`, `/admin/years` still use the old stone/green styles. Wrap them in `AppShell` and apply DESIGN.md tokens.
- ☐ **Sitemap:** add `src/app/sitemap.ts` (landing page only) + `sitemap:` line in `robots.ts` once the app has its real domain; submit in Google Search Console.
- ☐ **Lint:** `react-hooks/purity` flags `Date.now()` in server pages (`admin/page.tsx`, `guru/page.tsx`, `siswa/page.tsx`, `preview/*`). Harmless in server components; either move to a `getNow()` helper or disable the rule for `page.tsx`.
- ☐ **Lint:** `StudentRoster.tsx` calls `setState` in an effect when `selected` changes — refactor to set track/murajaah state in the click handler.
- ☐ **Surah table:** `src/lib/quran.ts` page numbers were entered from memory — verify against the school's mushaf.
- ☐ **PRODUCT.md** lists "edtech gamification" as an anti-reference; the new *Laporan* section adds badges and progress bars deliberately but calmly. Update PRODUCT.md so the intent is written down.
- ☐ **Dev previews:** `/preview/siswa|guru|admin` (dev only, mock data in `src/app/preview/mock.ts`). Keep mock data in sync when view props change.
