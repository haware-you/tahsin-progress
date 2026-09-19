-- =============================================================
-- DEMO SEED — realistic data: 15 teachers, 350 students
-- Run ONCE against local or remote Supabase.
-- All accounts use password: Demo123!
-- Teachers  : guru01@albayyinah.test … guru15@albayyinah.test
-- Students  : siswa001@albayyinah.test … siswa350@albayyinah.test
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

DO $$
DECLARE
  -- Shared password hash (computed once — slow bcrypt run only once)
  v_pw          TEXT;

  -- Academic year (reuse existing active year, or create one)
  v_year_id     UUID;

  -- Teacher loop vars
  v_tu_id       UUID;   -- auth.users id for teacher
  v_tr_id       UUID;   -- teachers.id (record)
  v_cl_id       UUID;   -- classes.id

  -- Arrays to track created records
  v_tr_ids      UUID[] := '{}';   -- teacher record IDs [1..15]
  v_cl_ids      UUID[] := '{}';   -- class IDs [1..15]

  -- Student loop vars
  v_su_id       UUID;
  v_sr_id       UUID;
  v_name        TEXT;
  v_cls_idx     INT;
  v_track       TEXT;
  v_ilevel      SMALLINT;
  v_ipage       SMALLINT;
  v_ipage_open  SMALLINT;
  v_jpage       SMALLINT;
  v_jpage_open  SMALLINT;
  v_jtype       TEXT;
  v_log_date    DATE;
  v_note        TEXT;

  i INT;
  j INT;
  v_num_logs    INT;
  v_inactive    BOOLEAN;
  v_base_date   DATE;

  -- Name pools
  first_m  TEXT[] := ARRAY[
    'Ahmad','Muhammad','Rizky','Farhan','Abdullah','Hasan','Ali','Umar',
    'Ibrahim','Yusuf','Luqman','Harun','Musa','Zakariya','Yahya',
    'Sulaiman','Dawud','Idris','Ismail','Isa'
  ];
  first_f  TEXT[] := ARRAY[
    'Fatimah','Aisyah','Khadijah','Maryam','Zahra',
    'Nisa','Salsabila','Khansa','Asma','Halimah',
    'Aminah','Ruqayyah','Zainab','Hafshah','Nurul'
  ];
  last_n   TEXT[] := ARRAY[
    'Pratama','Putra','Santoso','Wijaya','Susanto',
    'Rahmad','Hidayat','Nugraha','Saputra','Kusuma',
    'Febrian','Ramadhan','Maulana','Fauzi','Setiawan',
    'Permana','Wibowo','Purnomo','Hartono','Gunawan'
  ];
  teacher_names TEXT[] := ARRAY[
    'Ustadz Amir Hamzah',
    'Ustadzah Budi Rahayu',
    'Ustadz Chairul Anwar',
    'Ustadzah Dewi Lestari',
    'Ustadz Eko Prasetyo',
    'Ustadzah Fitri Handayani',
    'Ustadz Gunawan Santoso',
    'Ustadzah Hani Permata',
    'Ustadz Irfan Maulana',
    'Ustadzah Juliani Putri',
    'Ustadz Khairul Azmi',
    'Ustadzah Laila Sari',
    'Ustadz Mahmud Fauzi',
    'Ustadzah Nadia Kusuma',
    'Ustadz Omar Abdillah'
  ];

  -- Per-Iqro-level approximate max pages
  iqro_max INT[] := ARRAY[44, 32, 40, 44, 45, 64];

BEGIN
  -- Skip if demo data already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'guru01@albayyinah.test') THEN
    RAISE NOTICE 'Demo seed already applied — skipping.';
    RETURN;
  END IF;

  -- Compute password hash once
  v_pw := extensions.crypt('Demo123!', extensions.gen_salt('bf'));

  -- ── Academic year ────────────────────────────────────────────
  SELECT id INTO v_year_id FROM public.academic_years WHERE is_active = true LIMIT 1;
  IF v_year_id IS NULL THEN
    v_year_id := gen_random_uuid();
    INSERT INTO public.academic_years (id, label, is_active)
    VALUES (v_year_id, '2025/2026', true);
  END IF;

  -- ── 15 teachers + their classes ──────────────────────────────
  FOR i IN 1..15 LOOP
    v_tu_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_tu_id,
      'authenticated', 'authenticated',
      'guru' || LPAD(i::TEXT, 2, '0') || '@albayyinah.test',
      v_pw, now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', ''
    );
    -- trigger creates public.users row; update its role
    UPDATE public.users SET role = 'teacher' WHERE id = v_tu_id;

    INSERT INTO public.teachers (user_id, name)
    VALUES (v_tu_id, teacher_names[i]);

    SELECT id INTO v_tr_id FROM public.teachers WHERE user_id = v_tu_id;
    v_tr_ids := array_append(v_tr_ids, v_tr_id);

    v_cl_id := gen_random_uuid();
    INSERT INTO public.classes (id, name, teacher_id, academic_year_id)
    VALUES (v_cl_id, 'Kelas ' || LPAD(i::TEXT, 2, '0'), v_tr_id, v_year_id);
    v_cl_ids := array_append(v_cl_ids, v_cl_id);
  END LOOP;

  -- ── 350 students ─────────────────────────────────────────────
  FOR i IN 1..350 LOOP
    v_su_id   := gen_random_uuid();
    v_cls_idx := ((i - 1) % 15) + 1;          -- round-robin across 15 classes
    v_inactive := (i % 9 = 0);                 -- ~11% inactive (no log in 28+ days)
    v_num_logs := 4 + (i % 7);                 -- 4–10 sessions per student

    -- Name (alternate male/female)
    IF i % 2 = 1 THEN
      v_name := first_m[((i - 1) % array_length(first_m, 1)) + 1]
             || ' ' || last_n[((i - 1) % array_length(last_n, 1)) + 1];
    ELSE
      v_name := first_f[((i - 1) % array_length(first_f, 1)) + 1]
             || ' ' || last_n[(i % array_length(last_n, 1)) + 1];
    END IF;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_su_id,
      'authenticated', 'authenticated',
      'siswa' || LPAD(i::TEXT, 3, '0') || '@albayyinah.test',
      v_pw, now(),
      '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', '', ''
    );

    INSERT INTO public.students (user_id, name) VALUES (v_su_id, v_name);
    SELECT id INTO v_sr_id FROM public.students WHERE user_id = v_su_id;

    INSERT INTO public.enrollments (student_id, class_id, academic_year_id)
    VALUES (v_sr_id, v_cl_ids[v_cls_idx], v_year_id);

    -- ── Track assignment ──────────────────────────────────────
    -- 60% iqro, 30% juz30, 10% juz29
    IF i % 10 < 6 THEN
      v_track  := 'iqro';
      v_ilevel := (((i - 1) % 6) + 1)::SMALLINT;
      -- current page: spread across each level's range
      v_ipage  := (8 + ((i * 3) % (iqro_max[v_ilevel] - 8)))::SMALLINT;
      v_ipage_open := GREATEST(1, v_ipage - 12)::SMALLINT;

      -- Opening position (start of year)
      INSERT INTO public.progress_logs
        (student_id, teacher_id, academic_year_id, log_date, type, iqro_level, iqro_page, is_opening_position)
      VALUES
        (v_sr_id, v_tr_ids[v_cls_idx], v_year_id, '2025-07-15', 'iqro', v_ilevel, v_ipage_open, true);

      -- Session logs spread across the year
      FOR j IN 1..v_num_logs LOOP
        -- Spread logs from Aug 2025 to recent; inactive students stop 30+ days ago
        IF v_inactive THEN
          v_base_date := CURRENT_DATE - 35 - ((v_num_logs - j) * 18);
        ELSE
          v_base_date := CURRENT_DATE - ((v_num_logs - j + 1) * 15) + (i % 7);
        END IF;
        v_log_date := GREATEST('2025-08-01'::DATE, v_base_date);

        v_note := CASE (i + j) % 6
          WHEN 0 THEN 'Bacaan sudah lancar, pertahankan'
          WHEN 1 THEN 'Makhraj huruf hijaiyah perlu diperbaiki'
          WHEN 2 THEN NULL
          WHEN 3 THEN NULL
          WHEN 4 THEN 'Tajwid idgham perlu diulang'
          ELSE   NULL
        END;

        INSERT INTO public.progress_logs
          (student_id, teacher_id, academic_year_id, log_date, type, iqro_level, iqro_page, notes)
        VALUES (
          v_sr_id, v_tr_ids[v_cls_idx], v_year_id, v_log_date, 'iqro',
          v_ilevel,
          LEAST(iqro_max[v_ilevel], (v_ipage_open + j * 2))::SMALLINT,
          v_note
        );
      END LOOP;

    ELSIF i % 10 < 9 THEN
      v_track      := 'juz30';
      v_jpage      := (582 + ((i * 7) % 22))::SMALLINT;   -- 582–603
      v_jpage_open := GREATEST(582, v_jpage - 10)::SMALLINT;

      INSERT INTO public.progress_logs
        (student_id, teacher_id, academic_year_id, log_date, type, juz_page, is_opening_position)
      VALUES (v_sr_id, v_tr_ids[v_cls_idx], v_year_id, '2025-07-15', 'juz30', v_jpage_open, true);

      FOR j IN 1..v_num_logs LOOP
        IF v_inactive THEN
          v_base_date := CURRENT_DATE - 35 - ((v_num_logs - j) * 20);
        ELSE
          v_base_date := CURRENT_DATE - ((v_num_logs - j + 1) * 16) + (i % 5);
        END IF;
        v_log_date := GREATEST('2025-08-01'::DATE, v_base_date);

        v_note := CASE (i + j) % 5
          WHEN 0 THEN 'Kelancaran meningkat, tajwid baik'
          WHEN 1 THEN NULL
          WHEN 2 THEN 'Waqaf dan ibtida perlu diperhatikan'
          ELSE   NULL
        END;

        INSERT INTO public.progress_logs
          (student_id, teacher_id, academic_year_id, log_date, type, juz_page, notes)
        VALUES (
          v_sr_id, v_tr_ids[v_cls_idx], v_year_id, v_log_date, 'juz30',
          LEAST(604, (v_jpage_open + j))::SMALLINT,
          v_note
        );
      END LOOP;

      -- Assessments for ~1/3 of Juz 30 students
      IF i % 3 = 0 THEN
        INSERT INTO public.assessments
          (student_id, teacher_id, academic_year_id, juz_type, juz_page, assessed_at, outcome, reason)
        VALUES (
          v_sr_id, v_tr_ids[v_cls_idx], v_year_id,
          'juz30', v_jpage,
          (CURRENT_DATE - 20 - (i % 15))::TIMESTAMPTZ,
          (CASE WHEN i % 5 = 0 THEN 'ulang' ELSE 'lanjut' END)::public.assessment_outcome,
          CASE WHEN i % 5 = 0
            THEN 'Masih terdapat kesalahan pada hukum nun sukun dan tanwin'
            ELSE 'Bacaan sudah memenuhi standar kelancaran dan tajwid'
          END
        );
      END IF;

    ELSE
      v_track      := 'juz29';
      v_jpage      := (562 + ((i * 5) % 19))::SMALLINT;   -- 562–580
      v_jpage_open := GREATEST(562, v_jpage - 10)::SMALLINT;

      INSERT INTO public.progress_logs
        (student_id, teacher_id, academic_year_id, log_date, type, juz_page, is_opening_position)
      VALUES (v_sr_id, v_tr_ids[v_cls_idx], v_year_id, '2025-07-15', 'juz29', v_jpage_open, true);

      FOR j IN 1..v_num_logs LOOP
        IF v_inactive THEN
          v_base_date := CURRENT_DATE - 40 - ((v_num_logs - j) * 22);
        ELSE
          v_base_date := CURRENT_DATE - ((v_num_logs - j + 1) * 18) + (i % 6);
        END IF;
        v_log_date := GREATEST('2025-08-01'::DATE, v_base_date);

        INSERT INTO public.progress_logs
          (student_id, teacher_id, academic_year_id, log_date, type, juz_page, notes)
        VALUES (
          v_sr_id, v_tr_ids[v_cls_idx], v_year_id, v_log_date, 'juz29',
          LEAST(582, (v_jpage_open + j))::SMALLINT,
          NULL
        );
      END LOOP;

      -- Assessment for some Juz 29 students
      IF i % 4 = 0 THEN
        INSERT INTO public.assessments
          (student_id, teacher_id, academic_year_id, juz_type, juz_page, assessed_at, outcome, reason)
        VALUES (
          v_sr_id, v_tr_ids[v_cls_idx], v_year_id,
          'juz29', v_jpage,
          (CURRENT_DATE - 25 - (i % 10))::TIMESTAMPTZ,
          (CASE WHEN i % 6 = 0 THEN 'ulang' ELSE 'lanjut' END)::public.assessment_outcome,
          CASE WHEN i % 6 = 0
            THEN 'Gharib dan musykilat pada halaman ini perlu diulang'
            ELSE 'Sudah memenuhi target hafalan dan kelancaran'
          END
        );
      END IF;

    END IF;

  END LOOP;

  RAISE NOTICE 'Demo seed complete: 15 teachers, 350 students, academic year %.', v_year_id;
END $$;
