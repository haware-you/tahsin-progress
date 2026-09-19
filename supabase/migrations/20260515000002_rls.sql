-- =============================================================
-- Migration: row level security
-- Al Bayyinah School Progress System
-- =============================================================

-- ---------------------------------------------------------------
-- Helper functions (SECURITY DEFINER bypasses RLS to avoid
-- infinite recursion when policies call these)
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid()
$$;

-- ---------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_milestones  ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- users
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS users_update_admin ON public.users;
CREATE POLICY users_update_admin ON public.users
  FOR UPDATE USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS users_delete_admin ON public.users;
CREATE POLICY users_delete_admin ON public.users
  FOR DELETE USING (public.current_user_role() = 'admin');

-- INSERT handled by the handle_new_user() trigger (SECURITY DEFINER),
-- so no INSERT policy is needed for regular users.

-- ---------------------------------------------------------------
-- academic_years
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS academic_years_select_all ON public.academic_years;
CREATE POLICY academic_years_select_all ON public.academic_years
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS academic_years_write_admin ON public.academic_years;
CREATE POLICY academic_years_write_admin ON public.academic_years
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- teachers
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS teachers_select_all ON public.teachers;
CREATE POLICY teachers_select_all ON public.teachers
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS teachers_write_admin ON public.teachers;
CREATE POLICY teachers_write_admin ON public.teachers
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- classes
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS classes_select_all ON public.classes;
CREATE POLICY classes_select_all ON public.classes
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS classes_write_admin ON public.classes;
CREATE POLICY classes_write_admin ON public.classes
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- students
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS students_select ON public.students;
CREATE POLICY students_select ON public.students
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'student_parent' AND id = public.current_student_id())
    OR (
      public.current_user_role() = 'teacher'
      AND id IN (
        SELECT e.student_id
        FROM public.enrollments e
        JOIN public.classes c ON e.class_id = c.id
        WHERE c.teacher_id = public.current_teacher_id()
      )
    )
  );

DROP POLICY IF EXISTS students_write_admin ON public.students;
CREATE POLICY students_write_admin ON public.students
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- enrollments
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS enrollments_select ON public.enrollments;
CREATE POLICY enrollments_select ON public.enrollments
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'student_parent' AND student_id = public.current_student_id())
    OR (
      public.current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM public.classes WHERE teacher_id = public.current_teacher_id()
      )
    )
  );

DROP POLICY IF EXISTS enrollments_write_admin ON public.enrollments;
CREATE POLICY enrollments_write_admin ON public.enrollments
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- progress_logs
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS progress_logs_select ON public.progress_logs;
CREATE POLICY progress_logs_select ON public.progress_logs
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'student_parent' AND student_id = public.current_student_id())
    OR (
      public.current_user_role() = 'teacher'
      AND student_id IN (
        SELECT e.student_id
        FROM public.enrollments e
        JOIN public.classes c ON e.class_id = c.id
        WHERE c.teacher_id = public.current_teacher_id()
      )
    )
  );

DROP POLICY IF EXISTS progress_logs_insert ON public.progress_logs;
CREATE POLICY progress_logs_insert ON public.progress_logs
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'teacher'
    AND teacher_id = public.current_teacher_id()
    AND academic_year_id IN (SELECT id FROM public.academic_years WHERE is_active = true)
    AND student_id IN (
      SELECT e.student_id
      FROM public.enrollments e
      JOIN public.classes c ON e.class_id = c.id
      WHERE c.teacher_id = public.current_teacher_id()
        AND c.academic_year_id IN (SELECT id FROM public.academic_years WHERE is_active = true)
    )
  );

DROP POLICY IF EXISTS progress_logs_update ON public.progress_logs;
CREATE POLICY progress_logs_update ON public.progress_logs
  FOR UPDATE USING (
    public.current_user_role() = 'teacher'
    AND teacher_id = public.current_teacher_id()
    AND academic_year_id IN (SELECT id FROM public.academic_years WHERE is_active = true)
  )
  WITH CHECK (
    academic_year_id IN (SELECT id FROM public.academic_years WHERE is_active = true)
    AND student_id IN (
      SELECT e.student_id
      FROM public.enrollments e
      JOIN public.classes c ON e.class_id = c.id
      WHERE c.teacher_id = public.current_teacher_id()
        AND c.academic_year_id IN (SELECT id FROM public.academic_years WHERE is_active = true)
    )
  );

DROP POLICY IF EXISTS progress_logs_delete_admin ON public.progress_logs;
CREATE POLICY progress_logs_delete_admin ON public.progress_logs
  FOR DELETE USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS progress_logs_admin_all ON public.progress_logs;
CREATE POLICY progress_logs_admin_all ON public.progress_logs
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- assessments
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS assessments_select ON public.assessments;
CREATE POLICY assessments_select ON public.assessments
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'student_parent' AND student_id = public.current_student_id())
    OR (
      public.current_user_role() = 'teacher'
      AND student_id IN (
        SELECT e.student_id
        FROM public.enrollments e
        JOIN public.classes c ON e.class_id = c.id
        WHERE c.teacher_id = public.current_teacher_id()
      )
    )
  );

DROP POLICY IF EXISTS assessments_insert ON public.assessments;
CREATE POLICY assessments_insert ON public.assessments
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'teacher'
    AND teacher_id = public.current_teacher_id()
    AND academic_year_id IN (SELECT id FROM public.academic_years WHERE is_active = true)
    AND student_id IN (
      SELECT e.student_id
      FROM public.enrollments e
      JOIN public.classes c ON e.class_id = c.id
      WHERE c.teacher_id = public.current_teacher_id()
        AND c.academic_year_id IN (SELECT id FROM public.academic_years WHERE is_active = true)
    )
  );

DROP POLICY IF EXISTS assessments_delete_admin ON public.assessments;
CREATE POLICY assessments_delete_admin ON public.assessments
  FOR DELETE USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS assessments_admin_all ON public.assessments;
CREATE POLICY assessments_admin_all ON public.assessments
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS badges_select_all ON public.badges;
CREATE POLICY badges_select_all ON public.badges
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS badges_write_admin ON public.badges;
CREATE POLICY badges_write_admin ON public.badges
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- student_badges
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS student_badges_select ON public.student_badges;
CREATE POLICY student_badges_select ON public.student_badges
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'student_parent' AND student_id = public.current_student_id())
    OR (
      public.current_user_role() = 'teacher'
      AND student_id IN (
        SELECT e.student_id
        FROM public.enrollments e
        JOIN public.classes c ON e.class_id = c.id
        WHERE c.teacher_id = public.current_teacher_id()
      )
    )
  );

DROP POLICY IF EXISTS student_badges_write_admin ON public.student_badges;
CREATE POLICY student_badges_write_admin ON public.student_badges
  FOR ALL USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------
-- class_milestones
-- ---------------------------------------------------------------

DROP POLICY IF EXISTS class_milestones_select ON public.class_milestones;
CREATE POLICY class_milestones_select ON public.class_milestones
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'teacher'
      AND class_id IN (
        SELECT id FROM public.classes WHERE teacher_id = public.current_teacher_id()
      )
    )
    OR (
      public.current_user_role() = 'student_parent'
      AND class_id IN (
        SELECT e.class_id
        FROM public.enrollments e
        WHERE e.student_id = public.current_student_id()
      )
    )
  );

DROP POLICY IF EXISTS class_milestones_write_admin ON public.class_milestones;
CREATE POLICY class_milestones_write_admin ON public.class_milestones
  FOR ALL USING (public.current_user_role() = 'admin');
