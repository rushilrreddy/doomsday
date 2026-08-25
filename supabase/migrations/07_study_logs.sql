-- ==========================================
-- STUDY LOGS (DSA + College + General)
-- Run this in Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.study_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category         TEXT NOT NULL CHECK (category IN ('dsa', 'college', 'general')),
  subject          TEXT NOT NULL,
  topic            TEXT,
  problems_solved  INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 0,
  difficulty       TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  platform         TEXT,
  notes            TEXT,
  is_private       BOOLEAN NOT NULL DEFAULT false,
  log_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon study_logs access" ON public.study_logs;
CREATE POLICY "Anon study_logs access"
  ON public.study_logs FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_logs;
