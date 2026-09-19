# Feature: Academic Year Management

## User Stories (Admin)
- Create a new academic year and reassign teachers to classes
- Previous years' data remains intact and viewable
- Bulk-import student rosters via CSV
- Student progress carries forward automatically into new year
- See students flagged for retention assessment across all classes

---

## Feature 3 — Academic Year Management

### Year Rollover Flow (Admin Only)
1. Admin taps **"Buat Tahun Ajaran Baru"**
2. Admin types new year label to confirm (e.g., *2026/2027*) — prevents accidental triggering
3. Admin creates class slots for new year (add/rename/remove)
4. Admin assigns teachers to new classes
5. Admin uploads student CSV or selects carry-forward from previous year
6. System sets each student's opening position = last `progress_logs` entry from previous year, flagged `is_opening_position = true`
7. Admin reviews carry-forward list and confirms
8. New year goes live; previous year locked as read-only

### Progress Carry-Forward Logic
- Opening position = last `progress_logs` entry from previous year
- Displayed on teacher input form: *"Posisi awal (dari tahun lalu): Iqro 3 — Halaman 47"* atau *"Juz 30 — Halaman 591"*
- Teacher can manually override if student's actual level differs (e.g., regression after long holiday)
- Manual override logged as: *"Koreksi posisi awal — [reason]"* — visible in parent history

### Archive Access
- Admin: view any past year — all records, all PDFs, all assessments
- Teacher: view previous year's own class(es) — read-only
- Student/Parent: view previous year's progress history in their dashboard
- Previous year accessible within 2 taps from main dashboard

### CSV Bulk Import
Admin uploads `.csv`:
```
nama_siswa | kelas | email_akun | track | iqro_level | iqro_halaman | juz_halaman
```
- `track`: `iqro`, `juz30`, atau `juz29`
- `iqro_level` + `iqro_halaman`: wajib jika track = iqro
- `juz_halaman`: wajib jika track = juz30 (582–604) atau juz29 (562–582)
- System validates before import — all errors surfaced in one pass before any record is written
- Dry-run mode: preview what will be created before committing
- On success: accounts created or matched to existing, assigned to correct class

### Acceptance Criteria
- Year rollover does not alter or delete any previous year's data
- Carry-forward positions labeled "dari tahun lalu" on teacher input form
- System prevents more than one active academic year at a time
- CSV validation surfaces all errors before any record is written
- Admin dry-run available before committing import

### MoSCoW
| Priority | Feature |
|----------|---------|
| Must | Academic year creation and class restructuring |
| Must | Teacher reassignment per year |
| Must | Progress carry-forward with manual override |
| Must | CSV bulk import with validation |
| Must | Read-only archive of all previous years |
| Should | CSV dry-run preview |
| Could | Year-over-year progress comparison per student |
| Won't | Automated rollover — always requires admin confirmation |
