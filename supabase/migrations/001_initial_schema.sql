-- ============================================================================
-- BoostAI Study — Initial Database Schema
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor → New Query → paste & run.
-- Or use the Supabase CLI: supabase db push
--
-- This creates the core tables needed for auth + subscriptions.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profiles — extends Supabase auth.users with app-specific data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  persona TEXT CHECK (persona IN ('school', 'university')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (but not subscription_tier — that's set by webhooks)
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do anything (needed for webhook updates)
CREATE POLICY "Service role full access"
  ON public.profiles
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2. Auto-create a profile row when a new user signs up
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Subscription events log — for debugging webhook deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write subscription events
CREATE POLICY "Service role only"
  ON public.subscription_events
  USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_events_user
  ON public.subscription_events(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe_id
  ON public.subscription_events(stripe_event_id);
