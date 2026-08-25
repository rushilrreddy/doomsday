-- ==========================================
-- MIGRATION 12: TASK TIMES, GENERAL TASKS & ROUTINE REMINDER TIMES
-- ==========================================

-- 1. Add due_time and make task_date nullable on tasks for general backlog tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_time TEXT;
ALTER TABLE public.tasks ALTER COLUMN task_date DROP NOT NULL;

-- 2. Add reminder_time on routines
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS reminder_time TEXT;
