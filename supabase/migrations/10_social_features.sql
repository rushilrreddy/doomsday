-- ==========================================
-- SOCIAL FEATURES: Reactions + Challenges + Proof
-- Run this in Supabase SQL Editor
-- ==========================================

-- Feed reactions
CREATE TABLE IF NOT EXISTS public.feed_reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id  UUID NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feed_item_id, user_id, emoji)
);
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon reactions" ON public.feed_reactions;
CREATE POLICY "Anon reactions" ON public.feed_reactions FOR ALL USING (true) WITH CHECK (true);

-- Crew challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  metric      TEXT NOT NULL, -- 'dsa_problems' | 'study_minutes' | 'tasks_done'
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  created_by  UUID NOT NULL REFERENCES public.users(id),
  status      TEXT NOT NULL DEFAULT 'active',
  winner_id   UUID REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon challenges" ON public.challenges;
CREATE POLICY "Anon challenges" ON public.challenges FOR ALL USING (true) WITH CHECK (true);

-- Goal proof columns
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS proof_url  TEXT,
  ADD COLUMN IF NOT EXISTS proof_note TEXT;

-- Supabase Storage bucket for proof images
INSERT INTO storage.buckets (id, name, public)
VALUES ('goal-proofs', 'goal-proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public goal proofs" ON storage.objects;
CREATE POLICY "Public goal proofs" ON storage.objects
  FOR ALL USING (bucket_id = 'goal-proofs') WITH CHECK (bucket_id = 'goal-proofs');

-- Enable realtime safely (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'feed_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_reactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'challenges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
  END IF;
END $$;

