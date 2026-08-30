-- ==========================================
-- MIGRATION 15: HOURLY ACTIVITY & TIME AUDIT LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.hourly_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  hour_block INTEGER NOT NULL CHECK (hour_block >= 0 AND hour_block <= 23),
  activity_type TEXT NOT NULL DEFAULT 'other', -- 'coding', 'study', 'gym', 'work', 'routine', 'meal_break', 'sleep', 'wasted', 'other'
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, log_date, hour_block)
);

-- Enable RLS
ALTER TABLE public.hourly_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to hourly_logs" ON public.hourly_logs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to hourly_logs" ON public.hourly_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to hourly_logs" ON public.hourly_logs FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete to hourly_logs" ON public.hourly_logs FOR DELETE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hourly_logs;
