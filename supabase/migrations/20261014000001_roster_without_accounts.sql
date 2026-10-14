-- =============================================================
-- Migration: load the school roster before logins exist
--
-- Students and teachers can now be stored without an auth account;
-- user_id is filled in when their login is created. A NULL user_id never
-- matches auth.uid(), so the existing RLS policies stay closed for them.
-- =============================================================

ALTER TABLE public.teachers ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS team TEXT;

ALTER TABLE public.students ALTER COLUMN user_id DROP NOT NULL;
-- NIS is not unique yet: the 2026/2027 roster has one duplicate to resolve.
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nis TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender CHAR(1)
  CHECK (gender IN ('L', 'P'));
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students (nis);

-- Homeroom (kelas wali) per year, from the school's roster. Separate from
-- classes/enrollments, which are the Quran groups a teacher logs for.
CREATE TABLE IF NOT EXISTS public.student_homerooms (
  student_id        UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id  UUID NOT NULL REFERENCES public.academic_years(id),
  homeroom          TEXT NOT NULL,
  homeroom_teacher  TEXT,
  PRIMARY KEY (student_id, academic_year_id)
);

ALTER TABLE public.student_homerooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_homerooms_select ON public.student_homerooms;
CREATE POLICY student_homerooms_select ON public.student_homerooms
  FOR SELECT USING (
    public.current_user_role() IN ('admin', 'teacher')
    OR student_id = public.current_student_id()
  );

DROP POLICY IF EXISTS student_homerooms_write_admin ON public.student_homerooms;
CREATE POLICY student_homerooms_write_admin ON public.student_homerooms
  FOR ALL USING (public.current_user_role() = 'admin');
