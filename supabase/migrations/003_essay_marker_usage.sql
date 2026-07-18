-- ============================================================================
-- BoostAI Study — Essay Marker usage tracking
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor → New Query → paste & run,
-- after 002_generated_questions.sql.
--
-- We don't store essay text (it's often personal/identifiable student work)
-- — just a count, so the free tier limit has something to check against.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS essay_marks_used INT NOT NULL DEFAULT 0;

-- Atomic increment so concurrent requests can't race past the limit.
CREATE OR REPLACE FUNCTION public.increment_essay_marks(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  new_count INT;
BEGIN
  UPDATE public.profiles
  SET essay_marks_used = essay_marks_used + 1,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING essay_marks_used INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
