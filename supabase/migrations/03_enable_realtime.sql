-- ==========================================
-- MIGRATION 03: ENABLE REALTIME & INDEXES
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'goals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'streaks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.streaks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_feed') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
  END IF;
END $$;

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);

