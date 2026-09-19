# Al Bayyinah School Progress System — PRD

Quran learning tracker for ~350 students across 15 teachers. Replaces paper → Excel → PDF macro workflow.

Feature details: [Progress Logging](features/PRD_progress_logging.md) · [Academic Year](features/PRD_academic_year.md) · [Gamification](features/PRD_gamification.md)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) + Auth + RLS |
| PDF | react-pdf or Puppeteer (TBD) |
| Hosting | Vercel |
| Arabic Font | Amiri Arabic (Google Fonts) |

---

## Roles & Access

| Role | Scope |
|------|-------|
| `admin` | Full access — all years, all classes, user management |
| `teacher` | Active year — own class(es) only; previous years read-only |
| `student_parent` | Own student record, all years read-only |

Student and parent share one account with a client-side view toggle ("Tampilan Siswa" / "Tampilan Orang Tua"). Teacher notes and assessment details visible in parent view only.

### RLS Rules
- Teachers: SELECT/INSERT/UPDATE on `progress_logs` and `assessments` — own class only, active year only
- Teachers: SELECT on previous year records — own class only
- Student/Parent: SELECT only — own student record, all years
- Admin: Full access to all tables, all years

### Access Constraints
- Teachers cannot access students outside their assigned class(es)
- Previous year data is read-only for all non-admin roles
- Student/parent account cannot edit any progress data
- Failed login after 5 attempts locks account for 15 minutes

---

## Database Schema

```sql
-- Users
users (id, email, role: enum[admin, teacher, student_parent], created_at)

-- Academic years
academic_years (id, label, is_active BOOL, created_at)
-- Only one active year at a time; enforced via DB constraint

-- Teachers
teachers (id, user_id FK, name, created_at)

-- Classes (one record per class per year)
classes (id, name, teacher_id FK, academic_year_id FK)

-- Students (year-agnostic)
students (id, user_id FK, name, created_at)

-- Enrollment (links student to class and year)
enrollments (id, student_id FK, class_id FK, academic_year_id FK)

-- Progress logs
-- type determines which fields are populated:
--   iqro  → iqro_level + iqro_page
--   juz30 → juz_page (582–604, Uthmani mushaf)
--   juz29 → juz_page (562–582, Uthmani mushaf)
progress_logs (
  id, student_id FK, teacher_id FK, academic_year_id FK,
  log_date,
  type: enum[iqro, juz30, juz29],
  iqro_level INT,      -- 1–6; null when type = juz30/juz29
  iqro_page INT,       -- null when type = juz30/juz29
  juz_page INT,        -- null when type = iqro
  notes TEXT,
  is_opening_position BOOL DEFAULT false,
  created_at, updated_at
)

-- Retention assessments (Juz track only)
assessments (
  id, student_id FK, teacher_id FK, academic_year_id FK,
  assessed_at,
  outcome: enum[lanjut, ulang],
  reason TEXT NOT NULL,
  juz_type: enum[juz30, juz29],
  juz_page INT,
  created_at
)

-- Gamification
badges (id, name, description, trigger_type, trigger_value, icon_url)
student_badges (id, student_id FK, badge_id FK, academic_year_id FK, awarded_at)

-- Class milestones
class_milestones (id, class_id FK, academic_year_id FK, month, description, generated_at)
```

---

## Design Constraints

- **Mobile-first** — 375–430 px viewport; 44 px minimum touch targets
- **All UI text in Bahasa Indonesia**
- **Arabic font:** Amiri Arabic (Google Fonts), RTL spans in LTR layout
- **Color palette:** green + warm gold primary; red only for errors; amber for assessment indicators
- Teacher input: bottom sheet, pre-fills last position, max 3 taps for standard update
- Progress bar: left-to-right fill with percentage label
- Badge icons: 64×64 px with label below
- Academic year selector: persistent header dropdown — active year always visible
- Minimum body font size: 16 px; WCAG AA contrast minimum

---

## Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Page load | < 3 seconds on 4G mobile |
| PDF generation | < 10 seconds |
| Concurrent users | Up to 400 |
| Uptime | 99% |
| Data retention | All academic years — permanent, never deleted |
| CSV import | All errors surfaced before any record is committed |
| Session expiry | 7 days |

---

## Out of Scope — MVP

- WhatsApp/email notifications
- Native mobile app (PWA only)
- Tajweed grading
- Individual public leaderboard
- Multi-branch/multi-school support
- Offline mode
- Parent-teacher messaging
- Student self-reporting
- Automated year rollover
