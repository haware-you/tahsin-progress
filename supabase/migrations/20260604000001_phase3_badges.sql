-- Phase 3: Badge unique constraint + default badge seed

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_badge_trigger'
      AND table_schema = 'public'
      AND table_name = 'badges'
  ) THEN
    ALTER TABLE public.badges ADD CONSTRAINT unique_badge_trigger UNIQUE (trigger_type, trigger_value);
  END IF;
END $$;

INSERT INTO public.badges (name, description, trigger_type, trigger_value) VALUES
  ('Langkah Pertama',  'Catatan pertama di tahun ajaran ini',          'first_log',     '1'),
  ('Khatam Iqro',      'Menyelesaikan Iqro Jilid 6',                   'iqro_level',    '6'),
  ('Khatam Juz 30',    'Menyelesaikan bacaan Juz 30 (halaman 604)',     'juz_complete',  'juz30'),
  ('Khatam Juz 29',    'Menyelesaikan bacaan Juz 29 (halaman 582)',     'juz_complete',  'juz29'),
  ('4 Minggu Konsisten','Mencatat kemajuan selama 4 minggu berturut',   'weekly_streak', '4')
ON CONFLICT (trigger_type, trigger_value) DO NOTHING;
