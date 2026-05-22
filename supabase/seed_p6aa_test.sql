-- ==========================================================================
-- Seed: P6 6AA 預設試卷 — 上學期 單元一至四 (test extraction)
--
-- Source: past paper in word/六年級上學期/單元一至四/p6aa_presets.doc (+ presett)
-- 25 of 30 questions extracted; 5 skipped (see notes at bottom).
--
-- source_paper = 'p6aa'
-- Topic mapping by content (papers may claim units that don't match our DB).
--
-- Apply once in Supabase SQL Editor. Idempotent via source_paper.
-- ==========================================================================

BEGIN;

-- Clear any prior run of this seed
DELETE FROM assessment_questions WHERE source_paper = 'p6aa';
DELETE FROM long_questions      WHERE source_paper = 'p6aa';


-- ──────────────────────────────────────────────────────────────────────────
-- MC + SQ → assessment_questions
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer,
   difficulty_tier, source_paper, source_question, is_active)
VALUES

-- ── Section 計算以下各題 (Q1-Q4, 小數除法) → P6 U1 ─────────────────────────
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '6.4 ÷ 4 = ___', 'fill_in_number', NULL, '1.6',
 'enhancement', 'p6aa', 'Q01', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '3 ÷ 0.6 = ___', 'fill_in_number', NULL, '5',
 'enhancement', 'p6aa', 'Q02', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '0.17 ÷ 3 ≈ ___（答案取至小數點後兩個位）', 'fill_in_number', NULL, '0.06',
 'enhancement', 'p6aa', 'Q03', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '50.6 ÷ 3.1 ≈ ___（答案取至百分位）', 'fill_in_number', NULL, '16.32',
 'enhancement', 'p6aa', 'Q04', true),

-- ── Section 先估算，再計算 (Q5-Q6) — simplified: only final answer is graded
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '先估算，再計算：42.3 ÷ 6 = ___', 'fill_in_number', NULL, '7.05',
 'enhancement', 'p6aa', 'Q05', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '先估算，再計算：9.9 ÷ 2.2 = ___', 'fill_in_number', NULL, '4.5',
 'enhancement', 'p6aa', 'Q06', true),

-- ── Section 選出答案 (Q7-Q12, MC) ───────────────────────────────────────────
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '0.33 ÷ 0.001 ÷ 100 = ?', 'multiple_choice',
 '["A. 0.33", "B. 3.3", "C. 33", "D. 330"]'::jsonb, 'B. 3.3',
 'enhancement', 'p6aa', 'Q07', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '以下哪道算式的結果與其他的不同？', 'multiple_choice',
 '["A. 0.18 ÷ 0.1", "B. 0.018 ÷ 0.001", "C. 180 ÷ 100", "D. 1800 ÷ 1000"]'::jsonb,
 'B. 0.018 ÷ 0.001',
 'enhancement', 'p6aa', 'Q08', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '以下哪組數的平均數最小？', 'multiple_choice',
 '["A. 13, 14, 15, 16, 17", "B. 12.5, 13.5, 14.5, 15.5, 16.5", "C. 14, 15, 16, 17", "D. 13.5, 14.5, 15.5, 16.5"]'::jsonb,
 'B. 12.5, 13.5, 14.5, 15.5, 16.5',
 'enhancement', 'p6aa', 'Q09', true),

-- Q10, Q11 SKIPPED (chart-essential, see notes)

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '如果 ☆ 代表一個三位小數，以下哪道算式的結果最小？', 'multiple_choice',
 '["A. ☆ ÷ 100", "B. ☆ ÷ 10", "C. ☆ ÷ 0.01", "D. ☆ ÷ 0.1"]'::jsonb,
 'A. ☆ ÷ 100',
 'enhancement', 'p6aa', 'Q12', true),

-- ── Section 把答案圈起來 (Q13-Q15, inline MC) — converted to standard A/B/C
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '5 7/18 的數值在 ___ 之間。', 'multiple_choice',
 '["A. 4 和 4.5", "B. 4.5 和 5", "C. 5 和 5.5"]'::jsonb,
 'C. 5 和 5.5',
 'enhancement', 'p6aa', 'Q13', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '5/8 ___ 4/9。（在橫線上填入「小於」、「等於」或「大於」）', 'multiple_choice',
 '["A. 小於", "B. 等於", "C. 大於"]'::jsonb,
 'C. 大於',
 'enhancement', 'p6aa', 'Q14', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '下列哪個分數的數值最接近 1？', 'multiple_choice',
 '["A. 1 1/10", "B. 8/9", "C. 1/10"]'::jsonb,
 'A. 1 1/10',
 'enhancement', 'p6aa', 'Q15', true),

-- ── Section 把答案填在橫線上 (Q16-Q24, SQ) ─────────────────────────────────
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '糖果店今天售出復活蛋 20 隻，共收得 330 元。每隻復活蛋的售價是 ___ 元。',
 'fill_in_number', NULL, '16.5',
 'enhancement', 'p6aa', 'Q16', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '俊希付 100 元，購買 3 個魚柳包和 1 隻雞翼，應找回 ___ 元。
（食品的售價：魚柳包 $16.40，雞翼 $7.50，薯蓉 $13.10，多士 $9.90）',
 'fill_in_number', NULL, '43.3',
 'enhancement', 'p6aa', 'Q17', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '正方形的邊長是 9.5 米，長方形的長是 15.3 米，闊和正方形的邊長相同。正方形和長方形的面積相差 ___ 平方米。',
 'fill_in_number', NULL, '55.1',
 'enhancement', 'p6aa', 'Q18', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '爸爸和媽媽一星期上班 5 天，每天都要乘車上班，每天的車費相同。他們每星期的車費共 201 元。媽媽每天的車費是 19.2 元，爸爸每天的車費是 ___ 元。',
 'fill_in_number', NULL, '21',
 'enhancement', 'p6aa', 'Q19', true),

-- Q20 SKIPPED (ordering question, doesn't fit fill_in_number cleanly)

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '4 個不同的數的平均數是 8.5，這 4 個數的總和是 ___。',
 'fill_in_number', NULL, '34',
 'enhancement', 'p6aa', 'Q21', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '四張數卡上的數分別是 22、33、44 和 ?。四張數卡上的數的平均數是 37，最後一張數卡上的數是 ___。',
 'fill_in_number', NULL, '49',
 'enhancement', 'p6aa', 'Q22', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '小芬在本年度參加了 4 次舞蹈比賽，所得分數如下：5、6、8、9。以最高分的三次比賽計算成績，她的平均分數是 ___（答案取至小數點後一個位）。',
 'fill_in_number', NULL, '7.7',
 'enhancement', 'p6aa', 'Q23', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '盧老師要批改 4 班學生的功課，每班平均有功課 28 份。她第一天批改了 43 份，第二天批改了 38 份，第三天批改了餘下的功課。盧老師第三天批改了功課 ___ 份。',
 'fill_in_number', NULL, '31',
 'enhancement', 'p6aa', 'Q24', true),

-- ── Section 回答以下各題 (Q25-Q27, SQ — 小數和分數的互化) ──────────────────
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '化 0.4 為分數，並約至最簡。', 'fill_in_number', NULL, '2/5',
 'enhancement', 'p6aa', 'Q25', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '化 11/500 為小數。', 'fill_in_number', NULL, '0.022',
 'enhancement', 'p6aa', 'Q26', true),

((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '化 1 7/9 為小數，答案取至小數點後兩個位。', 'fill_in_number', NULL, '1.78',
 'enhancement', 'p6aa', 'Q27', true);


-- ──────────────────────────────────────────────────────────────────────────
-- LQ → long_questions
-- ──────────────────────────────────────────────────────────────────────────

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, is_active)
VALUES

-- Q28 升降機平均重量 (P5 U18 平均數)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '升降機裏有 9 個乘客，共重 531 kg。
(a) 每個乘客的平均重量是多少 kg？
(b) 在某一樓層，一個重 67 kg 的乘客離開了升降機，而一個重 40 kg 的乘客則進入了升降機。升降機裏每個乘客的平均重量是比原來的增加了，還是減少了？為甚麼？',
 '(a) 531 ÷ 9 = 59 (kg)
答：每個乘客的平均重量是 59 kg。

(b) 減少了
因為升降機裏每個乘客的平均重量是：
(531 − 67 + 40) ÷ 9 = 56 (kg)。
因為 56 < 59，所以升降機裏每個乘客的平均重量是比原來的減少了。',
 'enhancement', 'p6aa', 'Q28', '兩部分：(a) 直接求平均, (b) 變動後平均 + 解釋', true);


COMMIT;


-- ==========================================================================
-- SKIPPED QUESTIONS (image / format-incompatible):
--
-- Q10 — 折線圖讀圖 (某城市上星期雨量). Chart-essential. Defer until image
--       extraction pass.
-- Q11 — 折線圖平均數 (進昇大廈膠瓶回收). Chart-essential. Defer.
-- Q20 — 排列由大至小 (3 3/5、3.62、3 7/10). Multi-blank ordering;
--       doesn't fit fill_in_number cleanly. Consider as LQ later, or split
--       into 3 SQ rows.
-- Q29 — 折線圖讀圖 (現代/古典藝術館入場人數). Chart-essential, 4 sub-blanks.
-- Q30 — (a) 湊整表 (b) 完成折線圖. Drawing-required; the table-rounding
--       portion could be salvaged but pairs with the drawing task.
--
-- IMAGES NEEDED if you want the above included later:
--   Q10 line chart, Q11 line chart, Q17 price box, Q18 square+rect diagram,
--   Q22 number cards, Q29 dual-line chart, Q30 table + blank chart.
-- Q17/18/22 already have their data inlined in question_text so no image
-- is strictly required; the chart questions (Q10/Q11/Q29/Q30) cannot be
-- rendered as text and need image_url filled.
-- ==========================================================================
