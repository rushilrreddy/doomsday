-- ==========================================
-- MIGRATION 02: SEED ACCOUNTS & GOAL
-- Default password for all seeded accounts: crew123
-- ==========================================

-- 1. Insert Initial Crew Users
INSERT INTO public.users (username, password_hash, role, status) VALUES
  ('rushil', '$2a$10$Uu5Y9Wc4EMLeOdl99pFUoO5I8gFQKO6cPOvMePIS4HlZ0sNsbvnU.', 'leader', 'active'),
  ('pruthvi', '$2a$10$Uu5Y9Wc4EMLeOdl99pFUoO5I8gFQKO6cPOvMePIS4HlZ0sNsbvnU.', 'member', 'active'),
  ('kevin', '$2a$10$Uu5Y9Wc4EMLeOdl99pFUoO5I8gFQKO6cPOvMePIS4HlZ0sNsbvnU.', 'member', 'active')
ON CONFLICT (username) DO NOTHING;


-- 2. Initialize User Streaks
INSERT INTO public.streaks (user_id, current_streak, longest_streak)
SELECT id, 0, 0 FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- 3. Initialize First Challenge Goal
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
