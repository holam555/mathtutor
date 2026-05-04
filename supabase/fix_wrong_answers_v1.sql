-- fix_wrong_answers_v1.sql
-- Fixes 4 questions where the stored correct_answer is wrong or the
-- question is in a half-converted state.
-- Run in Supabase SQL Editor.

BEGIN;

-- 1. 4487 + 1539 + 257 → 6283 (was 6383)
UPDATE assessment_questions
SET correct_answer = '6283'
WHERE id = '5580b172-ce1f-4445-9b04-cbb156316a64'
  AND correct_answer = '6383';

-- 2. 85 × (300 - 37 × 7) → 3485 (was 6035; 37*7=259, 300-259=41, 85*41=3485)
UPDATE assessment_questions
SET correct_answer = '3485'
WHERE id = 'd76ba7b7-45d6-4b74-b457-4d3d7e783dca'
  AND correct_answer = '6035';

-- 3. 「下列哪一算式不等於 28 × 7？」 had TWO wrong options:
--      C. 2 × 2 × 4 × 7 = 112  (wrong)
--      D. 4 × 4 × 7    = 112  (wrong)
-- Rewrite C so it equals 196, leaving D as the only wrong option.
UPDATE assessment_questions
SET options = '["A. 7 × 14 × 2","B. 2 × 2 × 49","C. 2 × 2 × 7 × 7","D. 4 × 4 × 7"]'::jsonb
WHERE id = '6fe4df1a-2bed-4c2c-bc5e-3252424ae015';

-- 4. 5005 毫升 — finalise half-applied v5 conversion to MC.
UPDATE assessment_questions
SET question_type  = 'multiple_choice',
    question_text  = '5005 毫升 = ？',
    options        = '["A. 5 升 5 毫升","B. 50 升 5 毫升","C. 5 升 50 毫升","D. 500 升 5 毫升"]'::jsonb,
    correct_answer = 'A. 5 升 5 毫升'
WHERE id = 'effcd52d-0142-46e5-8d05-36322954b1c5';

COMMIT;
