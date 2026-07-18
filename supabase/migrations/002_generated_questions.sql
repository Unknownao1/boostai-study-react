-- ============================================================================
-- BoostAI Study — Generated Questions (Question Bank)
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor → New Query → paste & run,
-- after 001_initial_schema.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.generated_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  level TEXT,
  topic TEXT,
  original_prompt TEXT NOT NULL,
  original_answer TEXT NOT NULL,
  generated_prompt TEXT NOT NULL,
  reasoning JSONB NOT NULL,
  generated_answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.generated_questions ENABLE ROW LEVEL SECURITY;

-- Users can read their own generated questions
CREATE POLICY "Users read own generated questions"
  ON public.generated_questions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own generated questions
CREATE POLICY "Users insert own generated questions"
  ON public.generated_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own generated questions
CREATE POLICY "Users delete own generated questions"
  ON public.generated_questions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_generated_questions_user
  ON public.generated_questions(user_id, created_at DESC);
