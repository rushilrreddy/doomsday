-- ==========================================
-- COUNTDOWN CREW - DATABASE SCHEMA SETUP
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'leader' or 'member'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'inactive'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. GOALS TABLE (D-Day Challenge)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMPTZ NOT NULL,
  stake TEXT NOT NULL, -- e.g. "Loser buys dinner"
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'achieved', 'failed'
  winner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE
);

-- 7. ACTIVITY FEED TABLE
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'task_done', 'task_created', 'note_shared', 'goal_created', 'goal_completed', 'streak_updated'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- DISABLE RLS & ADD PERMISSIVE POLICIES FOR ANON CLIENT
-- (Custom Auth & Server Actions enforce user permissions)
-- ==========================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon users access" ON public.users;
DROP POLICY IF EXISTS "Anon goals access" ON public.goals;
DROP POLICY IF EXISTS "Anon tasks access" ON public.tasks;
DROP POLICY IF EXISTS "Anon notes access" ON public.notes;
DROP POLICY IF EXISTS "Anon streaks access" ON public.streaks;
DROP POLICY IF EXISTS "Anon activity access" ON public.activity_feed;

CREATE POLICY "Anon users access" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon goals access" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon tasks access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon notes access" ON public.notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon streaks access" ON public.streaks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon activity access" ON public.activity_feed FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- INITIAL SEED DATA (Default password for all 3 users is 'crew123')
-- ==========================================
INSERT INTO public.users (username, password_hash, role, status) VALUES
  ('rushil', '$2a$10$Uu5Y9Wc4EMLeOdl99pFUoO5I8gFQKO6cPOvMePIS4HlZ0sNsbvnU.', 'leader', 'active'),
  ('pruthvi', '$2a$10$Uu5Y9Wc4EMLeOdl99pFUoO5I8gFQKO6cPOvMePIS4HlZ0sNsbvnU.', 'member', 'active'),
  ('kevin', '$2a$10$Uu5Y9Wc4EMLeOdl99pFUoO5I8gFQKO6cPOvMePIS4HlZ0sNsbvnU.', 'member', 'active')
ON CONFLICT (username) DO NOTHING;


-- Initialize Streaks
INSERT INTO public.streaks (user_id, current_streak, longest_streak)
SELECT id, 0, 0 FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Initial Goal
INSERT INTO public.goals (title, description, target_date, stake, status, created_by)
SELECT 
  '30-Day Beast Mode Challenge', 
  'Complete daily fitness & learning tasks without missing a single day!',
  NOW() + INTERVAL '30 days',
  'Loser buys dinner 🍕 + 50 pushups',
  'active',
  id
FROM public.users WHERE username = 'rushil'
LIMIT 1;


-- ==========================================
-- ENABLE REALTIME (SAFE IF ALREADY ADDED) & INDEXES
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

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);

