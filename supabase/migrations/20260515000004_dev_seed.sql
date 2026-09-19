-- =============================================================
-- DEV SEED — test accounts only, do NOT run in production
-- =============================================================
-- Admin  : admin@albayyinah.test  / Admin123!
-- Teacher: guru@albayyinah.test   / Guru123!
-- Student: siswa@albayyinah.test  / Siswa123!
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

DO $$
DECLARE
  v_admin_id       UUID := '11111111-1111-1111-1111-111111111111';
  v_teacher_id     UUID := '22222222-2222-2222-2222-222222222222';
  v_student_id     UUID := '33333333-3333-3333-3333-333333333333';
  v_year_id        UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_class_id       UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_teacher_rec_id UUID;
  v_student_rec_id UUID;
BEGIN

  -- ── Auth users ──────────────────────────────────────────────
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES
    (
      '00000000-0000-0000-0000-000000000000', v_admin_id,
      'authenticated', 'authenticated', 'admin@albayyinah.test',
      extensions.crypt('Admin123!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', v_teacher_id,
      'authenticated', 'authenticated', 'guru@albayyinah.test',
      extensions.crypt('Guru123!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', ''
    ),
    (
      '00000000-0000-0000-0000-000000000000', v_student_id,
      'authenticated', 'authenticated', 'siswa@albayyinah.test',
      extensions.crypt('Siswa123!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', ''
    )
  ON CONFLICT (id) DO NOTHING;
  -- handle_new_user trigger auto-creates public.users rows

  -- ── Set roles ───────────────────────────────────────────────
  UPDATE public.users SET role = 'admin'   WHERE id = v_admin_id;
  UPDATE public.users SET role = 'teacher' WHERE id = v_teacher_id;
  -- student stays as default 'student_parent'

  -- ── Teacher profile ─────────────────────────────────────────
  INSERT INTO public.teachers (user_id, name)
  VALUES (v_teacher_id, 'Ustadz Ahmad')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_teacher_rec_id
  FROM public.teachers WHERE user_id = v_teacher_id;

  -- ── Academic year ────────────────────────────────────────────
  INSERT INTO public.academic_years (id, label, is_active)
  VALUES (v_year_id, '2025/2026', true)
  ON CONFLICT (id) DO NOTHING;

  -- ── Class ────────────────────────────────────────────────────
  INSERT INTO public.classes (id, name, teacher_id, academic_year_id)
  VALUES (v_class_id, 'Kelas A', v_teacher_rec_id, v_year_id)
  ON CONFLICT (id) DO NOTHING;

  -- ── Student profile ──────────────────────────────────────────
  INSERT INTO public.students (user_id, name)
  VALUES (v_student_id, 'Ahmad Fauzi')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_student_rec_id
  FROM public.students WHERE user_id = v_student_id;

  -- ── Enrollment ───────────────────────────────────────────────
  INSERT INTO public.enrollments (student_id, class_id, academic_year_id)
  VALUES (v_student_rec_id, v_class_id, v_year_id)
  ON CONFLICT (student_id, academic_year_id) DO NOTHING;

END $$;
