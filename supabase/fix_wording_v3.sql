-- fix_wording_v3.sql
-- Tighten wording on 2 questions caught by the 2nd LLM verification pass.
-- The stored correct_answer is right in both cases — only question_text changes.
-- Run in Supabase SQL Editor.

BEGIN;

-- 1. 「合共相差」 is internally contradictory (合共 = total, 相差 = difference).
--    Stored answer 220 corresponds to 相差 reading. Drop 「合共」 to disambiguate.
UPDATE assessment_questions
SET question_text = '小芸有梨子 110 粒，大強有的是她的 3 倍，他們的梨子相差多少粒？'
WHERE id = '88b9d7b3-90d1-4ff6-a27b-13187f7194d8';

-- 2. 4:10 a.m. dance class is unrealistic for a P3 student (likely typo for p.m.).
--    Question text asks 「多少小時多少分鐘多少秒」 but options don't include 秒,
--    so simplify the unit-ask too. Stored answer 「0小時55分鐘」 stays correct.
UPDATE assessment_questions
SET question_text = '小恩上舞蹈班開始時間 4:10 p.m.，結束時間 5:05 p.m.，小恩上舞蹈班共用了多少時間？'
WHERE id = '22b4185b-ad2b-48ec-b168-1c5f352a0f45';

COMMIT;
