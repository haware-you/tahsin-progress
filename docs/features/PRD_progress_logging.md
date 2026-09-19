# Feature: Progress Logging & Dashboard

## User Stories

### Teacher
- Log a student's Iqro level/page or Juz halaman after class — no re-entry from paper
- Input form pre-fills the student's last position — adjust number, not type from scratch
- See all students at a glance with current levels — identify who hasn't progressed in a while
- Export a PDF report per student
- Flag a Juz-track student for murajaah assessment, record lanjut/ulang

### Student
- See current stage (Iqro level or Juz halaman) and how far along I am
- Earn a badge when I complete a level or finish a Juz track
- See weekly streak

### Parent
- Check child's progress any time on phone
- See if child is flagged for retention assessment and what the outcome was
- See badges child has earned

---

## Feature 1 — Student Progress Dashboard

### Student View
- Current stage: Iqro level (1–6) + page, or Juz 30 halaman X (hal. 582–604) / Juz 29 halaman X (hal. 562–582) — Uthmani mushaf
- Visual progress bar within current stage
- Badges earned as icons
- Weekly streak counter
- If flagged for assessment: *"Sedang dalam evaluasi murajaah"* (amber, not red)

### Parent View
- All student view data
- Teacher notes from latest session
- Last 10 logged sessions with dates
- Retention assessment history: date flagged, outcome (lanjut/ulang), teacher note

### Acceptance Criteria
- Dashboard reflects latest teacher input immediately after save
- Badge awarded automatically when student completes an Iqro level or finishes a Juz track (Juz 30 → page 604; Juz 29 → page 582)
- Streak increments if at least one session logged in past 7 days; resets after 14 days without a log
- Assessment indicator visible to parent in neutral, non-alarming language

### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| Teacher enters lower page than previous log | Warning: "Input lebih rendah dari progres sebelumnya. Lanjutkan?" — saves if confirmed |
| Student transitions from Iqro 6 to Juz 30 | Teacher selects Juz 30 track; Iqro history preserved, Juz track begins at halaman 582 |
| Student transitions from Juz 30 to Juz 29 | Teacher selects Juz 29 track; Juz 30 history preserved, Juz 29 begins at halaman 562 |
| Murajaah outcome is "ulang" | Position stays at current halaman; note recorded; no badge regression |
| No progress logged 4+ weeks | Student card shows "Tidak aktif" on teacher's class list |
| Parent logs in — no data yet | "Belum ada catatan progres. Hubungi ustadz/ustadzah." |

### MoSCoW
| Priority | Feature |
|----------|---------|
| Must | Progress logging (Iqro level + page, or Juz halaman) |
| Must | Student view: current stage, progress bar |
| Must | Parent view: current stage + teacher note |
| Must | Retention assessment flag + outcome |
| Should | Badge system |
| Should | Weekly streak counter |
| Could | Progress history timeline (last 10 sessions) |

---

## Feature 2 — Teacher Input & Class Management

### Pre-Filled Input Form
Teacher opens a student entry → form pre-loads last logged position → adjust number → save. Max 3 taps for a standard update.

**Input flow:**
1. Open app → class roster loads (active academic year)
2. Tap student → bottom sheet slides up:
   - Pre-filled: stage + last position (e.g., *Iqro 3 — Halaman 24* atau *Juz 30 — Halaman 589*)
   - Editable: increment to new halaman
   - Optional: short note
   - Optional (Juz track only): *"Tandai untuk Murajaah"* toggle
3. Tap Simpan → auto-advances to next student

### Retention Assessment Input (Juz Track Only)
When teacher toggles "Tandai untuk Murajaah":
- Outcome selector: **Lanjut** or **Ulang**
- Reason/note field — required if outcome = Ulang
- Creates `assessments` record linked to student and current halaman

### Class Overview Panel
- Full student list: name, current stage, last logged date, streak, assessment flag
- Filter: inactive (4+ weeks), flagged for assessment, all
- Academic year selector — teacher can view previous year's class read-only

### PDF Export
- Per student, on demand
- Includes: school name and logo, student name and class, academic year, progress log summary, retention assessment history, teacher notes, teacher name

### MoSCoW
| Priority | Feature |
|----------|---------|
| Must | Pre-filled increment input |
| Must | Class overview panel |
| Must | PDF export per student |
| Must | Retention assessment input |
| Should | Auto-generated weekly class summary |
| Could | Monthly summary with month-over-month comparison |
| Won't | Automatic WhatsApp/email PDF delivery |
