-- Award badges server-side, atomically, on every progress_logs insert.
--
-- Before this, the Next.js server action upserted into student_badges as the
-- signed-in teacher. RLS (student_badges_write_admin) only allows admin writes,
-- so every upsert was silently rejected and no badge was ever awarded.
--
-- SECURITY DEFINER runs the insert as the function owner, bypassing RLS, and an
-- AFTER INSERT trigger means awarding can't be skipped or forged from a client.

-- ---------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------

-- Grant one badge to a student for a year. No-op if the badge row doesn't
-- exist (e.g. a seed hasn't run) or it's already awarded.
CREATE OR REPLACE FUNCTION public.award_badge(
  p_student_id     UUID,
  p_year_id        UUID,
  p_trigger_type   TEXT,
  p_trigger_value  TEXT
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.student_badges (student_id, badge_id, academic_year_id)
  SELECT p_student_id, b.id, p_year_id
  FROM public.badges b
  WHERE b.trigger_type = p_trigger_type AND b.trigger_value = p_trigger_value
  ON CONFLICT (student_id, badge_id, academic_year_id) DO NOTHING;
$$;

-- Re-evaluate every badge rule for one student/year. Idempotent: safe to call
-- after each log and safe to re-run as a backfill.
CREATE OR REPLACE FUNCTION public.award_badges_for_student(
  p_student_id  UUID,
  p_year_id     UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak INT;
BEGIN
  -- Langkah Pertama — at least one log this year
  IF EXISTS (
    SELECT 1 FROM public.progress_logs
    WHERE student_id = p_student_id AND academic_year_id = p_year_id
  ) THEN
    PERFORM public.award_badge(p_student_id, p_year_id, 'first_log', '1');
  END IF;

  -- Khatam Iqro — reached jilid 6
  IF EXISTS (
    SELECT 1 FROM public.progress_logs
    WHERE student_id = p_student_id AND academic_year_id = p_year_id
      AND type::text = 'iqro' AND iqro_level = 6
  ) THEN
    PERFORM public.award_badge(p_student_id, p_year_id, 'iqro_level', '6');
  END IF;

  -- Khatam Tadarus / Juz 30 / Juz 29 — reached the last page of that track.
  -- Juz 29 ends on page 581; 582 is An-Naba', the first page of Juz 30.
  PERFORM public.award_badge(p_student_id, p_year_id, 'juz_complete', t)
  FROM (
    SELECT DISTINCT l.type::text AS t
    FROM public.progress_logs l
    WHERE l.student_id = p_student_id
      AND l.academic_year_id = p_year_id
      AND l.type::text <> 'iqro'
      AND l.juz_page >= CASE l.type::text WHEN 'juz29' THEN 581 ELSE 604 END
  ) s;

  -- 4 Minggu Konsisten — longest run of consecutive ISO weeks with a log.
  -- Gaps-and-islands: subtracting the row number from each week collapses a
  -- consecutive run to a single grouping key.
  WITH weeks AS (
    SELECT DISTINCT date_trunc('week', log_date)::date AS wk
    FROM public.progress_logs
    WHERE student_id = p_student_id AND academic_year_id = p_year_id
  ),
  grp AS (
    SELECT wk, wk - (row_number() OVER (ORDER BY wk) * 7)::int AS g FROM weeks
  )
  SELECT coalesce(max(c), 0) INTO v_streak
  FROM (SELECT count(*) AS c FROM grp GROUP BY g) x;

  IF v_streak >= 4 THEN
    PERFORM public.award_badge(p_student_id, p_year_id, 'weekly_streak', '4');
  END IF;
END;
$$;

-- ---------------------------------------------------------------
-- Trigger
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.on_progress_log_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.award_badges_for_student(NEW.student_id, NEW.academic_year_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS award_badges_after_progress_log ON public.progress_logs;
CREATE TRIGGER award_badges_after_progress_log
  AFTER INSERT ON public.progress_logs
  FOR EACH ROW EXECUTE FUNCTION public.on_progress_log_award_badges();

-- Clients must never call these directly — the trigger is the only entry point.
-- (Trigger execution is authorised at CREATE TRIGGER time, not per-row, so
-- revoking EXECUTE here does not disable the trigger.)
REVOKE ALL ON FUNCTION public.award_badge(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_badges_for_student(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.on_progress_log_award_badges() FROM PUBLIC;

-- ---------------------------------------------------------------
-- Backfill badges earned from logs that already exist
-- ---------------------------------------------------------------

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT student_id, academic_year_id FROM public.progress_logs
  LOOP
    PERFORM public.award_badges_for_student(r.student_id, r.academic_year_id);
  END LOOP;
END $$;
