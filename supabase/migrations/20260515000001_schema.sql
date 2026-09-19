-- =============================================================
-- Migration: schema
-- Al Bayyinah School Progress System
-- =============================================================

-- ---------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student_parent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tracks: iqro (level+page), juz30 (hal. 582–604), juz29 (hal. 562–582)
DO $$ BEGIN
  CREATE TYPE public.progress_type AS ENUM ('iqro', 'juz30', 'juz29');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.assessment_outcome AS ENUM ('lanjut', 'ulang');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------
-- Tables (dependency order)
-- ---------------------------------------------------------------

-- Users: profile table mirrored from auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        public.user_role NOT NULL DEFAULT 'student_parent',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Academic years
CREATE TABLE IF NOT EXISTS public.academic_years (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce: only one active year at a time
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_academic_year
  ON public.academic_years (is_active)
  WHERE is_active = true;

-- Teachers (one row per teacher account)
CREATE TABLE IF NOT EXISTS public.teachers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Classes (one record per class per academic year)
CREATE TABLE IF NOT EXISTS public.classes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  teacher_id          UUID NOT NULL REFERENCES public.teachers(id),
  academic_year_id    UUID NOT NULL REFERENCES public.academic_years(id),
  UNIQUE (name, academic_year_id)
);

-- Students (year-agnostic; enrollment links them to a class+year)
CREATE TABLE IF NOT EXISTS public.students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enrollments: student ↔ class ↔ year
CREATE TABLE IF NOT EXISTS public.enrollments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.students(id),
  class_id            UUID NOT NULL REFERENCES public.classes(id),
  academic_year_id    UUID NOT NULL REFERENCES public.academic_years(id),
  UNIQUE (student_id, academic_year_id)
);

-- Progress logs
-- type = iqro  → iqro_level + iqro_page populated; juz_page null
-- type = juz30 → juz_page populated (582–604, Uthmani mushaf); iqro fields null
-- type = juz29 → juz_page populated (562–582, Uthmani mushaf); iqro fields null
CREATE TABLE IF NOT EXISTS public.progress_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           UUID NOT NULL REFERENCES public.students(id),
  teacher_id           UUID NOT NULL REFERENCES public.teachers(id),
  academic_year_id     UUID NOT NULL REFERENCES public.academic_years(id),
  log_date             DATE NOT NULL DEFAULT CURRENT_DATE,
  type                 public.progress_type NOT NULL,
  iqro_level           SMALLINT CHECK (iqro_level BETWEEN 1 AND 6),
  iqro_page            SMALLINT CHECK (iqro_page > 0),
  juz_page             SMALLINT CHECK (juz_page > 0),
  notes                TEXT,
  is_opening_position  BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_iqro_fields CHECK (
    type != 'iqro' OR (iqro_level IS NOT NULL AND iqro_page IS NOT NULL)
  ),
  CONSTRAINT check_juz_fields CHECK (
    type = 'iqro' OR juz_page IS NOT NULL
  )
);

-- Retention assessments (Juz track only)
CREATE TABLE IF NOT EXISTS public.assessments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id),
  teacher_id        UUID NOT NULL REFERENCES public.teachers(id),
  academic_year_id  UUID NOT NULL REFERENCES public.academic_years(id),
  juz_type          public.progress_type NOT NULL CHECK (juz_type IN ('juz30', 'juz29')),
  juz_page          SMALLINT NOT NULL CHECK (juz_page > 0),
  assessed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome           public.assessment_outcome NOT NULL,
  reason            TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Badges definition table
CREATE TABLE IF NOT EXISTS public.badges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT NOT NULL,
  trigger_type   TEXT NOT NULL,
  trigger_value  TEXT NOT NULL,
  icon_url       TEXT
);

-- Awarded badges per student per year
CREATE TABLE IF NOT EXISTS public.student_badges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.students(id),
  badge_id          UUID NOT NULL REFERENCES public.badges(id),
  academic_year_id  UUID NOT NULL REFERENCES public.academic_years(id),
  awarded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, badge_id, academic_year_id)
);

-- Auto-generated monthly class milestones
CREATE TABLE IF NOT EXISTS public.class_milestones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id          UUID NOT NULL REFERENCES public.classes(id),
  academic_year_id  UUID NOT NULL REFERENCES public.academic_years(id),
  month             DATE NOT NULL,
  description       TEXT NOT NULL,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, month)
);

-- ---------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_progress_logs_student_year  ON public.progress_logs (student_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_teacher_year  ON public.progress_logs (teacher_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_log_date      ON public.progress_logs (log_date);
CREATE INDEX IF NOT EXISTS idx_assessments_student_year    ON public.assessments (student_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class           ON public.enrollments (class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student         ON public.enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_classes_year                ON public.classes (academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student      ON public.student_badges (student_id);

-- ---------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'student_parent');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_progress_logs_updated_at ON public.progress_logs;
CREATE TRIGGER set_progress_logs_updated_at
  BEFORE UPDATE ON public.progress_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
