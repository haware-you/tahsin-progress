-- Tadarus track: reading Juz 30 (hal. 582–604) without memorizing.
-- Path: Iqro 1–6 → Tadarus Juz 30 → Hafalan Juz 30 → Hafalan Juz 29.
-- Uses juz_page like juz30/juz29, so check_juz_fields already applies.
-- Murajaah assessments stay hafalan-only (check_assessment_juz_type unchanged).

ALTER TYPE public.progress_type ADD VALUE IF NOT EXISTS 'tadarus';

INSERT INTO public.badges (name, description, trigger_type, trigger_value) VALUES
  ('Khatam Tadarus', 'Selesai membaca Juz 30 dengan lancar (halaman 604)', 'juz_complete', 'tadarus')
ON CONFLICT (trigger_type, trigger_value) DO NOTHING;

-- Hafalan badges: make it clear they're about memorizing, not reading.
UPDATE public.badges SET description = 'Menyelesaikan hafalan Juz 30 (halaman 604)'
  WHERE trigger_type = 'juz_complete' AND trigger_value = 'juz30';
UPDATE public.badges SET description = 'Menyelesaikan hafalan Juz 29'
  WHERE trigger_type = 'juz_complete' AND trigger_value = 'juz29';
