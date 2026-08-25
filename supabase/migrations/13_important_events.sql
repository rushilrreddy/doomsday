-- ==========================================
-- MIGRATION 13: IMPORTANT DATES & EXAMS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.important_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'exam', -- 'exam', 'contest', 'project', 'deadline', 'milestone'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.important_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to important_events" ON public.important_events FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to important_events" ON public.important_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to important_events" ON public.important_events FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete to important_events" ON public.important_events FOR DELETE USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.important_events;
