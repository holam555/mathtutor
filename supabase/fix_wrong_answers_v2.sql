-- fix_wrong_answers_v2.sql
-- Fixes 6 questions caught by the LLM deep-verify pass.
-- Run in Supabase SQL Editor (after fix_wrong_answers_v1.sql).

BEGIN;

-- 1. 在 65232 中，兩個「2」位值差 = 200 - 2 = 198 (was 180)
UPDATE assessment_questions
SET correct_answer = '198'
WHERE id = '735a0ba5-1a93-4ecd-b536-dc048a0f17ba'
  AND correct_answer = '180';

-- 2. 紀念扣 213÷30 = 7餘3，要再裝一盒需 30-3 = 27 個 (was 17)
UPDATE assessment_questions
SET correct_answer = '27'
WHERE id = '41a71016-fd29-4ee3-80c1-8a90caddd703'
  AND correct_answer = '17';

-- 3. 自助餐：3 成人 + 1 小童 = 3×188 + 108 - 4×28 = 560 元 (was 565)
UPDATE assessment_questions
SET correct_answer = '560'
WHERE id = '7afa6237-15b6-483b-8dd9-aa96ea6a8881'
  AND correct_answer = '565';

-- 4. MC「下列哪段所需時間最長？」原本 B (5月→6月) 同 C (7月→8月) 同樣 31 日。
--    將 B 改為 4月1日至5月1日 (= 30 日)，使 C 成為唯一最長 (31 日)。
UPDATE assessment_questions
SET options = '["A. 2月1日至3月1日","B. 4月1日至5月1日","C. 7月1日至8月1日","D. 11月1日至12月1日"]'::jsonb
WHERE id = 'ed652078-8473-4efe-a24b-4d92885e28d7';

-- 5. 題目說「今天比昨天多」但今天 (247+295=542) 少於昨天 (758)。
--    修正措辭為「昨天比今天多」，答案 216 維持不變 (758-542=216)。
UPDATE assessment_questions
SET question_text = '昨天有人入場 758 人，今天上午及下午分別有 247 人及 295 人入場，昨天比今天多多少人？'
WHERE id = '7a473816-4666-4bc4-b0a5-3546ee498efa';

-- 6. 題目自相矛盾：電腦售 $3568 但又話要存到 $8000，stored 答案 3060 亦無
--    法由任何自然算法得出。停用以避免家長見到錯題；待人手重寫原始題目。
UPDATE assessment_questions
SET is_active = false
WHERE id = '2156e63d-0372-474b-8daa-04fb59f3082d';

COMMIT;
