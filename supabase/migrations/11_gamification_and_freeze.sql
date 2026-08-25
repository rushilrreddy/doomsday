-- ==========================================
-- GAMIFICATION & STREAK FREEZE
-- Run this in Supabase SQL Editor
-- ==========================================

-- Add streak freezes to streaks table
ALTER TABLE public.streaks
  ADD COLUMN IF NOT EXISTS freeze_tokens INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS frozen_dates  TEXT[] NOT NULL DEFAULT '{}';

-- Track custom streak freeze transactions/logs
CREATE TABLE IF NOT EXISTS public.streak_freeze_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  frozen_date DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.streak_freeze_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon freeze logs" ON public.streak_freeze_logs;
CREATE POLICY "Anon freeze logs" ON public.streak_freeze_logs FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime safely (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'streak_freeze_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.streak_freeze_logs;
  END IF;
END $$;

