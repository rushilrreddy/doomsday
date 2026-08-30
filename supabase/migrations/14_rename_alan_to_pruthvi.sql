-- ==========================================
-- MIGRATION 14: RENAME ALAN TO PRUTHVI
-- ==========================================

UPDATE public.users 
SET username = 'pruthvi' 
WHERE username = 'alan';
