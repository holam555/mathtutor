-- fix_chinese_answers_v4.sql
-- Converts 8 questions to multiple_choice:
--   brackets, airport flights, number ordering, volume format, operator fill-in.
-- Note: 5005毫升 (effcd52d) and school fundraising (6f11c223) already fixed in v2.
-- Run in Supabase SQL Editor.

BEGIN;

-- ════════════════════════════════════════════════════════════
-- CAT N: Bracket placement (加括號)
-- ════════════════════════════════════════════════════════════

-- 501 - 22 + 28 = 451 → 501 - (22 + 28) = 451
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 501 − (22 + 28) = 451","B. (501 − 22) + 28 = 451","C. 501 − (22 − 28) = 451","D. (501 − 22 + 28) = 451"]'::jsonb,
  correct_answer = 'A. 501 − (22 + 28) = 451'
WHERE id = '39eab73f-0912-4aa2-9181-cfcf346d32c5';

-- ════════════════════════════════════════════════════════════
-- CAT O: Flight / timetable selection
-- ════════════════════════════════════════════════════════════

-- 下午兩時正後前往韓國 → BS623 (17:35) 和 VL323 (18:15)
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. BS623 和 VL323","B. CC267 和 BS623","C. BS623 和 RT388","D. CC267 和 VL323"]'::jsonb,
  correct_answer = 'A. BS623 和 VL323',
  question_text  = replace(question_text, '（寫出航班編號，多個用 , 分隔）', '')
WHERE id = 'd84a0ede-138a-4a18-8992-5a46cd41ad2e';

-- ════════════════════════════════════════════════════════════
-- CAT P: Number ordering
-- ════════════════════════════════════════════════════════════

-- 16371, 31525, 9526, 31097 由大至小
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 31525 > 31097 > 16371 > 9526","B. 31525 > 16371 > 31097 > 9526","C. 31097 > 31525 > 16371 > 9526","D. 9526 > 16371 > 31097 > 31525"]'::jsonb,
  correct_answer = 'A. 31525 > 31097 > 16371 > 9526'
WHERE id = '660ebfea-22dc-49dc-bbf3-95f477e1a259';

-- 40120, 58820, 58628 由大至小
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 58820 > 58628 > 40120","B. 58628 > 58820 > 40120","C. 58820 > 40120 > 58628","D. 40120 > 58628 > 58820"]'::jsonb,
  correct_answer = 'A. 58820 > 58628 > 40120'
WHERE id = 'a57a417e-7c4c-4673-8d7f-75b86664b41a';

-- ════════════════════════════════════════════════════════════
-- CAT Q: Volume conversion (mL → L mL)
-- ════════════════════════════════════════════════════════════

-- 30081 mL = ___ L ___ mL → 30 L 81 mL
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 30 L 81 mL","B. 3 L 81 mL","C. 30 L 810 mL","D. 3 L 801 mL"]'::jsonb,
  correct_answer = 'A. 30 L 81 mL'
WHERE id = '71438962-720e-45e0-8f04-43c5b1e4c98d';

-- ════════════════════════════════════════════════════════════
-- CAT R: Operator fill-in (□ 填運算符號)
-- ════════════════════════════════════════════════════════════

-- 92 □ (46 □ 10) = 36  →  92 − (46 + 10) = 36
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 92 − (46 + 10) = 36","B. 92 + (46 − 10) = 36","C. 92 − (46 − 10) = 36","D. 92 + (46 + 10) = 36"]'::jsonb,
  correct_answer = 'A. 92 − (46 + 10) = 36'
WHERE id = '26efe93b-52e3-4bb1-97b9-98cbc72e0e49';

-- 40 □ 10 □ 2 = 20  →  40 − 10 × 2 = 20
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 40 − 10 × 2 = 20","B. 40 + 10 − 2 = 20","C. 40 × 10 + 2 = 20","D. 40 + 10 × 2 = 20"]'::jsonb,
  correct_answer = 'A. 40 − 10 × 2 = 20'
WHERE id = '1886bc7d-e1c4-450b-850e-dbd05b12528a';

-- 7899 ○ (1997 ○ 456) = 6358  →  7899 − (1997 − 456) = 6358
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 7899 − (1997 − 456) = 6358","B. 7899 − (1997 + 456) = 6358","C. 7899 + (1997 − 456) = 6358","D. 7899 + (1997 + 456) = 6358"]'::jsonb,
  correct_answer = 'A. 7899 − (1997 − 456) = 6358'
WHERE id = 'b019d1e5-8699-477d-a8b8-6ef51d0ca13a';

COMMIT;
