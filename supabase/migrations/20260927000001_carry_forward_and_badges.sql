-- 1. Year rollover: carry each student's last position into the new year.
-- 2. Badges ignore opening positions (carried over or CSV-imported), which
--    are not sessions: before this, a CSV import awarded "Langkah Pertama"
--    and a rollover would re-award last year's khatam badges.

-- ---------------------------------------------------------------
-- carry_forward_positions(from_year, to_year)
-- For every student enrolled in to_year with no entry there yet, copy their
-- last from_year entry as an opening position (is_opening_position = true),
-- credited to the teacher of the class they are enrolled in now.
-- Idempotent: a second run finds the entries and adds nothing.
-- Runs as the caller (SECURITY INVOKER), so RLS applies; it also refuses
-- anyone but an admin. Previous-year rows are only read.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.carry_forward_positions(p_from_year UUID, p_to_year UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Hanya admin yang dapat membawa posisi awal.';
  END IF;
  IF p_from_year = p_to_year THEN
    RAISE EXCEPTION 'Tahun sumber dan tujuan tidak boleh sama.';
  END IF;

  INSERT INTO public.progress_logs (
    student_id, teacher_id, academic_year_id, type,
    iqro_level, iqro_page, juz_page, surah_number, ayat, outcome,
    is_opening_position
  )
  SELECT DISTINCT ON (l.student_id)
    l.student_id, c.teacher_id, p_to_year, l.type,
    l.iqro_level, l.iqro_page, l.juz_page, l.surah_number, l.ayat, l.outcome,
    true
  FROM public.progress_logs l
  JOIN public.enrollments e ON e.student_id = l.student_id AND e.academic_year_id = p_to_year
  JOIN public.classes c ON c.id = e.class_id
  WHERE l.academic_year_id = p_from_year
    AND NOT EXISTS (
      SELECT 1 FROM public.progress_logs x
      WHERE x.student_id = l.student_id AND x.academic_year_id = p_to_year
    )
  ORDER BY l.student_id, l.log_date DESC, l.created_at DESC;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.carry_forward_positions(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.carry_forward_positions(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------
-- Badges: same rules as 20260925000001, counting only real sessions.
-- ---------------------------------------------------------------
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
  IF EXISTS (
    SELECT 1 FROM public.progress_logs
    WHERE student_id = p_student_id AND academic_year_id = p_year_id
      AND NOT is_opening_position
  ) THEN
    PERFORM public.award_badge(p_student_id, p_year_id, 'first_log', '1');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.progress_logs
    WHERE student_id = p_student_id AND academic_year_id = p_year_id
      AND NOT is_opening_position
      AND type::text = 'iqro' AND iqro_level = 6
  ) THEN
    PERFORM public.award_badge(p_student_id, p_year_id, 'iqro_level', '6');
  END IF;

  PERFORM public.award_badge(p_student_id, p_year_id, 'juz_complete', t)
  FROM (
    SELECT DISTINCT l.type::text AS t
    FROM public.progress_logs l
    WHERE l.student_id = p_student_id
      AND l.academic_year_id = p_year_id
      AND NOT l.is_opening_position
      AND l.type::text <> 'iqro'
      AND CASE
        WHEN l.ayat IS NOT NULL THEN
          l.outcome = 'lanjut'
          AND l.surah_number = CASE l.type::text WHEN 'juz29' THEN 77 ELSE 114 END
          AND l.ayat >= CASE l.type::text WHEN 'juz29' THEN 50 ELSE 6 END
        ELSE
          l.juz_page >= CASE l.type::text WHEN 'juz29' THEN 581 ELSE 604 END
      END
  ) s;

  WITH weeks AS (
    SELECT DISTINCT date_trunc('week', log_date)::date AS wk
    FROM public.progress_logs
    WHERE student_id = p_student_id AND academic_year_id = p_year_id
      AND NOT is_opening_position
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

REVOKE ALL ON FUNCTION public.award_badges_for_student(UUID, UUID) FROM PUBLIC;
