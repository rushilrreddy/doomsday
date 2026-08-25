-- ==========================================
-- ROUTINES, ROUTINE LOGS & BODY WEIGHT LOGS
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Routines (recurring daily habits)
CREATE TABLE IF NOT EXISTS public.routines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id     UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  emoji       TEXT NOT NULL DEFAULT '⚡',
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Routine completion logs (one per routine per day)
CREATE TABLE IF NOT EXISTS public.routine_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  routine_id  UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, routine_id, log_date)
);

-- 3. Body weight logs (one per user per day)
CREATE TABLE IF NOT EXISTS public.body_weight_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weight      NUMERIC(5,2) NOT NULL,
  unit        TEXT NOT NULL DEFAULT 'kg',
  note        TEXT,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

-- RLS (open for all crew — anon key)
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon routines access" ON public.routines;
DROP POLICY IF EXISTS "Anon routine_logs access" ON public.routine_logs;
DROP POLICY IF EXISTS "Anon weight access" ON public.body_weight_logs;

CREATE POLICY "Anon routines access"     ON public.routines          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon routine_logs access" ON public.routine_logs      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon weight access"       ON public.body_weight_logs  FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.routines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.routine_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.body_weight_logs;
