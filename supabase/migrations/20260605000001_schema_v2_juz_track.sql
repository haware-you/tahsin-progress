-- =============================================================
-- Migration: schema v2 — replace surah/quran track with juz29/juz30 page tracking
-- Juz 30: halaman 582–604 (Uthmani mushaf)
-- Juz 29: halaman 562–582 (Uthmani mushaf)
-- =============================================================

-- Only runs on databases still on the v1 schema (progress_type has 'quran').
-- 20260515000001_schema.sql was later rewritten to create the v2 shape
-- directly, so on a fresh database this migration has nothing to do and
-- running it would fail (missing public.surahs, progress_type in use).
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.progress_type'::regtype AND enumlabel = 'quran'
  ) THEN
    RETURN;
  END IF;

  -- ---------------------------------------------------------------
  -- 1. Remove surahs RLS policies
  -- ---------------------------------------------------------------
  DROP POLICY IF EXISTS surahs_select_all ON public.surahs;
  DROP POLICY IF EXISTS surahs_write_admin ON public.surahs;

  -- ---------------------------------------------------------------
  -- 2. Drop ALL check constraints on progress_logs that reference
  --    the 'type' column BEFORE we change the enum type — PostgreSQL
  --    cannot compare progress_type vs progress_type_new in constraint
  --    expressions during the ALTER COLUMN TYPE step.
  -- ---------------------------------------------------------------
  ALTER TABLE public.progress_logs DROP CONSTRAINT IF EXISTS check_iqro_fields;
  ALTER TABLE public.progress_logs DROP CONSTRAINT IF EXISTS check_quran_fields;
  ALTER TABLE public.progress_logs DROP CONSTRAINT IF EXISTS check_juz_fields;

  -- ---------------------------------------------------------------
  -- 3. Drop surah FK columns from progress_logs and assessments
  -- ---------------------------------------------------------------
  ALTER TABLE public.progress_logs DROP COLUMN IF EXISTS surah_id;
  ALTER TABLE public.progress_logs DROP COLUMN IF EXISTS ayah_reached;
  ALTER TABLE public.assessments   DROP COLUMN IF EXISTS surah_id;

  -- ---------------------------------------------------------------
  -- 4. Drop surahs table
  -- ---------------------------------------------------------------
  DROP TABLE IF EXISTS public.surahs;

  -- ---------------------------------------------------------------
  -- 5. Replace progress_type enum ('iqro','quran') → ('iqro','juz30','juz29')
  --    All constraints referencing 'type' were dropped in step 2.
  -- ---------------------------------------------------------------
  CREATE TYPE public.progress_type_new AS ENUM ('iqro', 'juz30', 'juz29');

  ALTER TABLE public.progress_logs
    ALTER COLUMN type TYPE public.progress_type_new
    USING (CASE type::text
      WHEN 'iqro' THEN 'iqro'::public.progress_type_new
      ELSE 'juz30'::public.progress_type_new
    END);

  DROP TYPE public.progress_type;
  ALTER TYPE public.progress_type_new RENAME TO progress_type;

  -- ---------------------------------------------------------------
  -- 6. Add juz_page to progress_logs; restore constraints with new type
  -- ---------------------------------------------------------------
  ALTER TABLE public.progress_logs
    ADD COLUMN IF NOT EXISTS juz_page SMALLINT CHECK (juz_page > 0);

  ALTER TABLE public.progress_logs ADD CONSTRAINT check_iqro_fields CHECK (
    type != 'iqro' OR (iqro_level IS NOT NULL AND iqro_page IS NOT NULL)
  );
  ALTER TABLE public.progress_logs ADD CONSTRAINT check_juz_fields CHECK (
    type = 'iqro' OR juz_page IS NOT NULL
  );

  -- ---------------------------------------------------------------
  -- 7. Add juz_type + juz_page to assessments
  --    Table is empty at this point so NOT NULL is safe.
  -- ---------------------------------------------------------------
  ALTER TABLE public.assessments
    ADD COLUMN IF NOT EXISTS juz_type public.progress_type,
    ADD COLUMN IF NOT EXISTS juz_page SMALLINT;

  ALTER TABLE public.assessments ALTER COLUMN juz_type SET NOT NULL;
  ALTER TABLE public.assessments ALTER COLUMN juz_page SET NOT NULL;

  ALTER TABLE public.assessments ADD CONSTRAINT check_assessment_juz_type
    CHECK (juz_type IN ('juz30', 'juz29'));
  ALTER TABLE public.assessments ADD CONSTRAINT check_assessment_juz_page
    CHECK (juz_page > 0);
END
$migration$;
