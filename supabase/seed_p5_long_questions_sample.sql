-- Sample 長答題 seed for P5 — 3 questions extracted from
-- 五年級 試卷(二) P.5 (Q41–43)
--
-- Apply once in Supabase SQL Editor AFTER migrations 0020 + 0021.
-- model_answer matches the handwritten working on the original paper verbatim.
-- Idempotent via source_paper + source_question.

BEGIN;

-- Clear any prior runs of this exact seed
DELETE FROM long_questions
WHERE source_paper = 'p5_sample_2026_paper2'
  AND source_question IN ('Q41', 'Q42', 'Q43');

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, is_active)
VALUES
  -- Q41 — P5 U7 多邊形的面積 (正方形面積應用)
  ((SELECT t.id FROM curriculum_topics t
     JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = 5 AND u.unit_number = 7
     ORDER BY t.lesson_number LIMIT 1),
   '公園裡有一片正方形草地，草地的周界是 40 米。園丁想在草地上鋪蓋一層膠布保護草地，而每 1 平方米的膠布售 10 元，園丁需付多少元？',
   '園丁需付：
40÷4×10×10
=1000 元',
   'enhancement',
   'p5_sample_2026_paper2', 'Q41', '正方形周界 → 邊長 → 面積 → 總費用', true),

  -- Q42 — P5 U1 多位數 (兩步混合運算應用)
  ((SELECT t.id FROM curriculum_topics t
     JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = 5 AND u.unit_number = 1
     ORDER BY t.lesson_number LIMIT 1),
   '小美在網上訂購主題樂園門票 8 張，連手續費共付了 840 元。若每張門票售 100 元，平均每張門票的手續費是多少元？',
   '平均每張門票的手續費是：
(840−100×8)÷8
=5 元',
   'enhancement',
   'p5_sample_2026_paper2', 'Q42', '混合運算：先算門票總費再算手續費總額再平均', true),

  -- Q43 — P5 U3 分數乘法 (分數乘整數 + 同分母分數加法)
  ((SELECT t.id FROM curriculum_topics t
     JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = 5 AND u.unit_number = 3
     ORDER BY t.lesson_number LIMIT 1),
   '小強每天會喝 7/100 升牛奶，小明喝的牛奶是他的 4 倍。二人每天共喝牛奶多少升？',
   '二人每天共喝牛奶：
4×7/100+7/100
=7/20 升',
   'enhancement',
   'p5_sample_2026_paper2', 'Q43', '分數乘整數 + 同分母分數加法，答案需化至最簡', true);

COMMIT;
