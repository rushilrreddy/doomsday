-- ==========================================
-- DAILY CHECK-INS TABLE
-- Run this in Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id     UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)   -- one check-in per user per day
);

-- RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon checkins access" ON public.daily_checkins;
CREATE POLICY "Anon checkins access" ON public.daily_checkins FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_checkins;
