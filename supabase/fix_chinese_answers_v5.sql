-- fix_chinese_answers_v5.sql
-- Converts 2 remaining questions to multiple_choice.
-- These were incorrectly skipped in v4 (SQL files not yet run in Supabase).
-- Run in Supabase SQL Editor.

BEGIN;

-- 5005 毫升 = ___ 升 ___ 毫升 → 5 升 5 毫升
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 5 升 5 毫升","B. 50 升 5 毫升","C. 5 升 50 毫升","D. 500 升 5 毫升"]'::jsonb,
  correct_answer = 'A. 5 升 5 毫升',
  question_text  = '5005 毫升 = ？'
WHERE id = 'effcd52d-0142-46e5-8d05-36322954b1c5';

-- 學校A 75314元、學校B 73541元、學校C 75413元 由多至少
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 75413元 > 75314元 > 73541元","B. 75314元 > 75413元 > 73541元","C. 73541元 > 75413元 > 75314元","D. 75413元 > 73541元 > 75314元"]'::jsonb,
  correct_answer = 'A. 75413元 > 75314元 > 73541元'
WHERE id = '6f11c223-87be-42a5-9291-ef8beb44bdd9';

COMMIT;
