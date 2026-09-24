-- Record each session the way the paper Mutaba'ah sheet does:
-- surah + ayat for Quran tracks, and Lanjut/Ulang (L/U) on every row.
--
-- juz_page stays: new Quran rows store the surah's starting page there so
-- check_juz_fields and older readers keep working. The exact position is
-- surah_number + ayat.

ALTER TABLE public.progress_logs
  ADD COLUMN IF NOT EXISTS surah_number SMALLINT,
  ADD COLUMN IF NOT EXISTS ayat SMALLINT CHECK (ayat > 0),
  -- Existing rows were all forward progress, so they count as Lanjut.
  ADD COLUMN IF NOT EXISTS outcome public.assessment_outcome NOT NULL DEFAULT 'lanjut';

-- Surah must belong to the track's juz; Iqro rows have no surah.
ALTER TABLE public.progress_logs ADD CONSTRAINT check_surah_track CHECK (
  CASE type::text
    WHEN 'iqro'  THEN surah_number IS NULL
    WHEN 'juz29' THEN surah_number IS NULL OR surah_number BETWEEN 67 AND 77
    ELSE              surah_number IS NULL OR surah_number BETWEEN 78 AND 114
  END
);
ALTER TABLE public.progress_logs ADD CONSTRAINT check_ayat_needs_surah CHECK (
  ayat IS NULL OR surah_number IS NOT NULL
);

-- ---------------------------------------------------------------
-- Backfill surah for existing Quran rows from their page: the first surah
-- starting on that page, else the last one starting before it (same rule as
-- surahForPage in src/lib/quran.ts). Ayat is unknown for these rows.
-- ---------------------------------------------------------------
WITH surah_pages(number, page) AS (
  VALUES
    (67, 562),
    (68, 564),
    (69, 566),
    (70, 568),
    (71, 570),
    (72, 572),
    (73, 574),
    (74, 575),
    (75, 577),
    (76, 578),
    (77, 580),
    (78, 582),
    (79, 583),
    (80, 585),
    (81, 586),
    (82, 587),
    (83, 587),
    (84, 589),
    (85, 590),
    (86, 591),
    (87, 591),
    (88, 592),
    (89, 593),
    (90, 594),
    (91, 595),
    (92, 595),
    (93, 596),
    (94, 596),
    (95, 597),
    (96, 597),
    (97, 598),
    (98, 598),
    (99, 599),
    (100, 599),
    (101, 600),
    (102, 600),
    (103, 601),
    (104, 601),
    (105, 601),
    (106, 602),
    (107, 602),
    (108, 602),
    (109, 603),
    (110, 603),
    (111, 603),
    (112, 604),
    (113, 604),
    (114, 604)
)
UPDATE public.progress_logs l
SET surah_number = (
  SELECT sp.number FROM surah_pages sp
  WHERE sp.page <= l.juz_page
    AND CASE WHEN l.type::text = 'juz29' THEN sp.number <= 77 ELSE sp.number >= 78 END
  ORDER BY sp.page DESC, sp.number ASC
  LIMIT 1
)
WHERE l.type::text <> 'iqro' AND l.juz_page IS NOT NULL AND l.surah_number IS NULL;

-- ---------------------------------------------------------------
-- Khatam Juz now means a Lanjut on the juz's last ayat (An-Nas 6, or
-- Al-Mursalat 50 for Juz 29). Rows without ayat keep the old page rule.
-- Rest of the function is unchanged from 20260920000001.
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
  ) THEN
    PERFORM public.award_badge(p_student_id, p_year_id, 'first_log', '1');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.progress_logs
    WHERE student_id = p_student_id AND academic_year_id = p_year_id
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

-- Badge copy followed the old page rule.
UPDATE public.badges SET description = 'Selesai membaca Juz 30 dengan lancar (sampai An-Nas)'
  WHERE trigger_type = 'juz_complete' AND trigger_value = 'tadarus';
UPDATE public.badges SET description = 'Menyelesaikan hafalan Juz 30 (sampai An-Nas)'
  WHERE trigger_type = 'juz_complete' AND trigger_value = 'juz30';
UPDATE public.badges SET description = 'Menyelesaikan hafalan Juz 29 (sampai Al-Mursalat)'
  WHERE trigger_type = 'juz_complete' AND trigger_value = 'juz29';
