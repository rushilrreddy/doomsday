-- ==========================================
-- MIGRATION 01: TABLES & RLS POLICIES
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
-- ENABLE RLS & CREATE ACCESS POLICIES
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Anon users access" ON public.users;
DROP POLICY IF EXISTS "Anon goals access" ON public.goals;
DROP POLICY IF EXISTS "Anon tasks access" ON public.tasks;
DROP POLICY IF EXISTS "Anon notes access" ON public.notes;
DROP POLICY IF EXISTS "Anon streaks access" ON public.streaks;
DROP POLICY IF EXISTS "Anon activity access" ON public.activity_feed;

-- Create Permissive RLS Policies for App Custom Auth
CREATE POLICY "Anon users access" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon goals access" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon tasks access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon notes access" ON public.notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon streaks access" ON public.streaks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon activity access" ON public.activity_feed FOR ALL USING (true) WITH CHECK (true);
