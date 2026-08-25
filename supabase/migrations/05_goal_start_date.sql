-- ==========================================
-- ADD start_date TO goals TABLE
-- Run this in Supabase SQL Editor
-- ==========================================

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;

-- Back-fill existing rows with created_at as the start date
UPDATE public.goals
  SET start_date = created_at
  WHERE start_date IS NULL;
