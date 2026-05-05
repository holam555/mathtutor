-- fix_post_cleanup_v4.sql
-- Two soft flags caught by the post-cleanup LLM verification pass.
-- Both are wording / convention issues, not math bugs.
-- Run in Supabase SQL Editor.

BEGIN;

-- 1. 麵包 567 ÷ 6 = 94 r 3, "把餘下的全放進最後一盒" → last box = 6 + 3 = 9.
--    Sibling questions (橙 187÷5=37r2 → 39, 鋁罐 807÷4=201r3 → 204) use the
--    same convention. Update stored answer 3 → 9 for consistency.
UPDATE assessment_questions
SET correct_answer = '9'
WHERE id = 'b484f15e-6055-43c7-bce6-c19e8d72e75c'
  AND correct_answer = '3';

-- 2. 一「件」襪 is non-standard classifier — could be misread as 一「雙」.
--    Tighten to 一「隻」 so 8 元/隻 × (2 雙 × 2 隻) = 32 is unambiguous.
UPDATE assessment_questions
SET question_text = '一隻襪賣 8 元，買 2 雙同價的襪共須付多少元？'
WHERE id = 'ff1b8fd7-90b0-4dca-bb45-1d2f2dd3bd2b';

COMMIT;
