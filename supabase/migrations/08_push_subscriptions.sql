-- ==========================================
-- PUSH NOTIFICATION SUBSCRIPTIONS
-- Run this in Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon push access" ON public.push_subscriptions;
CREATE POLICY "Anon push access" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
