-- Sample 長答題 seed for P5 — 3 questions extracted from
-- 五年級 試卷(二) P.5 (Q41–43)
--
-- Apply once in Supabase SQL Editor after migration 0020_mock_exam.sql.
-- Idempotent via source_paper/source_question check.

BEGIN;

-- Clear any prior runs of this exact seed
DELETE FROM long_questions
WHERE source_paper = 'p5_sample_2026_paper2'
  AND source_question IN ('Q41', 'Q42', 'Q43');

INSERT INTO long_questions
  (topic_id, question_text, model_answer, total_marks, difficulty_tier,
   source_paper, source_question, notes, is_active)
VALUES
  -- Q41 — P5 U7 多邊形的面積 (正方形面積應用)
  ((SELECT t.id FROM curriculum_topics t
     JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = 5 AND u.unit_number = 7
     ORDER BY t.lesson_number LIMIT 1),
   '公園裡有一片正方形草地，草地的周界是 40 米。園丁想在草地上鋪蓋一層膠布保護草地，而每 1 平方米的膠布售 10 元，園丁需付多少元？',
   '正方形邊長 = 40 ÷ 4 = 10（米）
正方形面積 = 10 × 10 = 100（平方米）
膠布費用 = 100 × 10 = 1000（元）
答：園丁需付 1000 元。',
   4, 'enhancement',
   'p5_sample_2026_paper2', 'Q41', '正方形周界 → 邊長 → 面積 → 總費用，三步應用題', true),

  -- Q42 — P5 U1 多位數 (兩步混合運算，沒有更貼切的 P5 單元就放這裡)
  ((SELECT t.id FROM curriculum_topics t
     JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = 5 AND u.unit_number = 1
     ORDER BY t.lesson_number LIMIT 1),
   '小美在網上訂購主題樂園門票 8 張，連手續費共付了 840 元。若每張門票售 100 元，平均每張門票的手續費是多少元？',
   '門票費用總和 = 100 × 8 = 800（元）
總手續費 = 840 − 800 = 40（元）
平均每張手續費 = 40 ÷ 8 = 5（元）
答：平均每張門票的手續費是 5 元。',
   4, 'enhancement',
   'p5_sample_2026_paper2', 'Q42', '混合運算應用題：先算總門票費，再算總手續費，再平均', true),

  -- Q43 — P5 U3 分數乘法 (分數乘整數 + 同分母分數加法)
  ((SELECT t.id FROM curriculum_topics t
     JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = 5 AND u.unit_number = 3
     ORDER BY t.lesson_number LIMIT 1),
   '小強每天會喝 7/100 升牛奶，小明喝的牛奶是他的 4 倍。二人每天共喝牛奶多少升？',
   '小明每天喝 = 4 × 7/100 = 28/100（升）
二人共喝 = 28/100 + 7/100 = 35/100 = 7/20（升）
答：二人每天共喝 7/20 升牛奶。',
   4, 'enhancement',
   'p5_sample_2026_paper2', 'Q43', '分數乘整數 + 同分母分數加法，答案需化至最簡', true);

COMMIT;
