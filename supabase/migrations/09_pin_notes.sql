-- ==========================================
-- PIN NOTES
-- Run this in Supabase SQL Editor
-- ==========================================

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS notes_pinned_idx ON public.notes(is_pinned DESC, created_at DESC);
