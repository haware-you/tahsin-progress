# Feature: Gamification & Milestones

> **Phase 3 only.** Do not implement before Phase 1–2 are complete.

---

## Badge System

Badges awarded automatically on:
- Completing each Iqro level (6 badges total)
- Completing Juz 30 track (reaching halaman 604)
- Completing Juz 29 track (reaching halaman 582)

Badge display: 64×64 px icon with label below, shown on student dashboard.
No badge regression — a "ulang" murajaah outcome does not remove earned badges.

## Weekly Streak
- Increments if at least one session logged in the past 7 days
- Resets after 14 days without a log
- Displayed prominently in student view

## Class Milestone Leaderboard
Class-level highlights only — no individual public rankings.

- Monthly milestones auto-generated from logged data
- Example: *"Kelas A: 8 siswa menyelesaikan Juz 30 bulan ini"*
- Admin view: compare milestone progress across all classes within active year

## MoSCoW
| Priority | Feature |
|----------|---------|
| Should | Badge system |
| Should | Weekly streak |
| Should | Monthly class milestone highlights |
| Could | Admin class comparison panel |
| Won't | Individual public student ranking |
