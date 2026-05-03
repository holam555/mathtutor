-- Add image_alt_text column to questions for AI-driven image variation generation
-- and accessibility (screen readers).

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS image_alt_text text;

ALTER TABLE generated_questions
  ADD COLUMN IF NOT EXISTS image_alt_text text;
