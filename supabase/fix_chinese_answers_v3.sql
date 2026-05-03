-- fix_chinese_answers_v3.sql
-- Converts 28 remaining problematic questions to multiple_choice.
-- Matched by exact UUID from assessment_questions_rows.csv export.
-- Run in Supabase SQL Editor.

BEGIN;

-- ════════════════════════════════════════════════════════════
-- CAT J: Ordering questions (answers contain > or < between values)
-- ════════════════════════════════════════════════════════════

-- 34078/34087/34708 由多至少
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 34708 > 34087 > 34078","B. 34087 > 34708 > 34078","C. 34708 > 34078 > 34087","D. 34078 > 34087 > 34708"]'::jsonb,
  correct_answer = 'A. 34708 > 34087 > 34078'
WHERE id = '24d33f54-2642-41ef-9950-2623b4c19e81';

-- 8/13, 8/15, 11/13 由大至小
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 11/13 > 8/13 > 8/15","B. 8/13 > 11/13 > 8/15","C. 11/13 > 8/15 > 8/13","D. 8/15 > 8/13 > 11/13"]'::jsonb,
  correct_answer = 'A. 11/13 > 8/13 > 8/15',
  question_text  = replace(question_text, '（請用 > 連接）', '')
WHERE id = '58185a23-0c03-42fa-9d46-b34333994fdb';

-- 3/9, 3/7, 2/9 由大至小
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 3/7 > 3/9 > 2/9","B. 3/9 > 3/7 > 2/9","C. 3/7 > 2/9 > 3/9","D. 2/9 > 3/9 > 3/7"]'::jsonb,
  correct_answer = 'A. 3/7 > 3/9 > 2/9',
  question_text  = replace(question_text, '（請用 > 連接）', '')
WHERE id = '7c9f01da-8376-4924-ba78-2de675983579';

-- 11/12, 5/12, 7/12 由大至小
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 11/12 > 7/12 > 5/12","B. 7/12 > 11/12 > 5/12","C. 11/12 > 5/12 > 7/12","D. 5/12 > 7/12 > 11/12"]'::jsonb,
  correct_answer = 'A. 11/12 > 7/12 > 5/12',
  question_text  = replace(question_text, '（請用 > 連接）', '')
WHERE id = '827774d8-0055-4ab1-a1aa-b781c54ac446';

-- 36598, 3659, 35968, 35986 由小至大
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 3659 < 35968 < 35986 < 36598","B. 3659 < 35986 < 35968 < 36598","C. 35968 < 35986 < 36598 < 3659","D. 3659 < 36598 < 35968 < 35986"]'::jsonb,
  correct_answer = 'A. 3659 < 35968 < 35986 < 36598'
WHERE id = '9d028b22-5d38-4011-a915-f28919bf158a';

-- 5/6, 3/7, 5/7 由大至小
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 5/6 > 5/7 > 3/7","B. 5/7 > 5/6 > 3/7","C. 5/6 > 3/7 > 5/7","D. 3/7 > 5/7 > 5/6"]'::jsonb,
  correct_answer = 'A. 5/6 > 5/7 > 3/7',
  question_text  = replace(question_text, '（請用 > 連接）', '')
WHERE id = 'c0402b9a-73b7-4281-81c3-5788c1dda8ab';

-- 50619, 56109, 51069, 50196 由小至大
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 50196 < 50619 < 51069 < 56109","B. 50196 < 51069 < 50619 < 56109","C. 50619 < 50196 < 51069 < 56109","D. 50196 < 50619 < 56109 < 51069"]'::jsonb,
  correct_answer = 'A. 50196 < 50619 < 51069 < 56109'
WHERE id = 'ddd66671-c5e4-4a2a-8e1d-3a14ebdb1628';

-- 17/25, 9/25, 23/25 由大至小
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 23/25 > 17/25 > 9/25","B. 17/25 > 23/25 > 9/25","C. 23/25 > 9/25 > 17/25","D. 9/25 > 17/25 > 23/25"]'::jsonb,
  correct_answer = 'A. 23/25 > 17/25 > 9/25',
  question_text  = replace(question_text, '（請用 > 連接）', '')
WHERE id = 'ed8e57b4-85a9-48f1-975b-000c42376316';

-- ════════════════════════════════════════════════════════════
-- CAT K: Open fraction (數值是 1 的分數)
-- ════════════════════════════════════════════════════════════

-- "寫出一個數值是 1 的分數" → 2/2
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 2/2","B. 3/2","C. 1/2","D. 4/3"]'::jsonb,
  correct_answer = 'A. 2/2',
  question_text  = '下列哪個分數的數值等於 1？'
WHERE id = 'd669dc54-489c-46f4-9776-6e957239e44a';

-- ════════════════════════════════════════════════════════════
-- CAT L: Unit abbreviation — volume (L / mL)
-- ════════════════════════════════════════════════════════════

-- 水杯 500 ___ → mL
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'A. mL',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = '01ce6310-2443-4981-b72f-9c17cf064dc2';

-- 碗 900 ___ → mL
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'A. mL',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = '1f67fbe6-a245-4860-b7ad-8c55a8aee859';

-- 電飯煲 2 ___ → L
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'B. L',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = '52a24e98-e75a-4bf6-95d4-b7b851e80216';

-- 家庭裝鮮奶 1 ___ → L
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'B. L',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = 'a519f6fb-9794-4313-bc7c-0e691b5f6538';

-- 食用油 7 ___ → L
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'B. L',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = 'bf0da4aa-206b-4b09-8839-2f18ba531f39';

-- 牛奶 220 ___ → mL
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'A. mL',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = 'c48d99ce-29ce-4346-a773-75f925c6fc2c';

-- 茶水 100 ___ → mL
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'A. mL',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = 'd5024e27-c16f-4793-ba18-acf5c1925d6f';

-- 熱水瓶 3 ___ → L
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'B. L',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = 'd9dc07e8-52ae-4255-a39f-073ed67f0e08';

-- 膠水 50 ___ → mL
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mL","B. L","C. kg","D. g"]'::jsonb,
  correct_answer = 'A. mL',
  question_text  = replace(question_text, '（請填 L 或 mL）', '')
WHERE id = 'e693993e-0956-4824-8286-08b63b8b4a6c';

-- ════════════════════════════════════════════════════════════
-- CAT M: Unit abbreviation — length (mm / cm / m / km)
-- ════════════════════════════════════════════════════════════

-- 昂坪 360 纜車全長 5.7 ___ → km
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'D. km',
  question_text  = replace(question_text, '(?)', '___')
WHERE id = '41003c9d-94db-4d15-8f69-b2144224026a';

-- 行人斑馬線約長 15 ___ → m
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'C. m',
  question_text  = replace(question_text, '(?)', '___')
WHERE id = '57846c82-2201-483d-994e-3ef47a5d9091';

-- 港鐵車票長約 10 ___ → cm
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'B. cm',
  question_text  = replace(question_text, '(?)', '___')
WHERE id = '666a8da2-1bb8-41f4-8d1e-c4ae7b861f0d';

-- 橡皮擦長 5 ___ → cm
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'B. cm'
WHERE id = '68b9392f-ed72-42d3-a4e9-de9669407eb8';

-- 香港至台北的距離 → km
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'D. km'
WHERE id = '8d34d032-9bcd-4c66-87e0-4e8435a15dce';

-- 火柴長約 40 ___ → mm
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'A. mm'
WHERE id = '95a40182-bcb8-433a-a592-0e5341a85ece';

-- 牙籤的厚度 → mm
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'A. mm'
WHERE id = 'a0324f0b-47c5-44c9-a59a-70b874ffeb0c';

-- 10 ___ 校際長跑比賽 → km
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'D. km',
  question_text  = replace(question_text, '(?)', '___')
WHERE id = 'a123b556-dac8-463a-bd54-4de3eb69abc6';

-- 100 元紙幣長約 150 ___ → mm
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'A. mm',
  question_text  = replace(question_text, '(?)', '___')
WHERE id = 'd8a40e70-020a-46c9-993e-d7efac0c8eb4';

-- 郵票長約 25 ___ → mm
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. mm","B. cm","C. m","D. km"]'::jsonb,
  correct_answer = 'A. mm',
  question_text  = replace(question_text, '(?)', '___')
WHERE id = 'fa88e2b8-7580-497c-870b-e28d611ef453';

COMMIT;
