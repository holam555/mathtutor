-- ==========================================================================
-- P6 LQ batch 1 — test extraction from _lq_input:/p6/ screenshots
--
-- 7 LQs extracted from the clearly readable single-LQ screenshots.
-- 6 dense multi-LQ pages flagged in docs/p6_lq_batch1_report.md for
-- re-screenshot (text too small to transcribe reliably).
--
-- Topic mapping by content:
--   P6 U1 小數除法    — LQ01, LQ02, LQ03, LQ04
--   P5 U18 平均數     — LQ05, LQ06 (cross-grade — content fits P5)
--   P6 U6 容量和體積  — LQ07
--
-- Image matches use the local: placeholder for image_url. Replace with
-- Supabase Storage path after uploading the file (or use the admin edit
-- form which handles upload automatically).
--
-- Apply once in Supabase SQL Editor. Idempotent via source_paper.
-- ==========================================================================

BEGIN;

-- Clear prior runs of this batch
DELETE FROM long_questions WHERE source_paper = 'p6_lq_batch1';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- LQ01 — 西米 15÷8 (P6 U1 小數除法)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '甜品店店員把 15 公斤西米分成 8 袋，每袋西米的重量相同。每袋西米有多少公斤？',
 '每袋西米有：
15 ÷ 8
= 1.875（公斤）',
 'enhancement', 'p6_lq_batch1', 'LQ01', NULL, NULL, true),

-- LQ02 — 豆奶綠茶倍數 (P6 U1)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '家中有豆奶 0.24 升和綠茶 3.6 升，綠茶是豆奶的多少倍？',
 '綠茶是豆奶的：
3.6 ÷ 0.24
= 15（倍）',
 'enhancement', 'p6_lq_batch1', 'LQ02', NULL, NULL, true),

-- LQ03 — 30 元買膠紙 (P6 U1, with image)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '李先生用 30 元買右面的膠紙（每卷 $4.70）。他最多可以買膠紙多少卷？還餘多少元？',
 '他最多可以買膠紙：
30 ÷ 4.7
= 6（卷）……1.8（元）',
 'enhancement', 'p6_lq_batch1', 'LQ03',
 '附圖：一卷膠紙，標價 $4.70',
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.47.54.png',
 true),

-- LQ04 — 正方形紙鋪告示板 (P6 U1, 餘數進位)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '長方形告示板長 2.1 米，闊 0.65 米。子珊想用邊長是 0.65 米的正方形紙鋪滿這塊告示板，她最少需要正方形紙多少張？',
 '她需要正方形紙：
2.1 ÷ 0.65
= 3（張）……0.15（米）
她最少需要正方形紙 4 張。',
 'enhancement', 'p6_lq_batch1', 'LQ04',
 '注意有餘數需要進位的應用情境',
 NULL, true),

-- LQ05 — 射擊遊戲平均分 (P5 U18 平均數)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '每局射擊遊戲可射 6 槍，射中不同目標可得不同分數。陳先生在某局射擊遊戲中，有 3 槍得到 50 分，1 槍得到 100 分，1 槍得到 20 分，餘下的沒有射中目標。陳先生在該局射擊遊戲中，平均每槍得到多少分？',
 '平均每槍得到：
(50 × 3 + 100 + 20 + 0) ÷ 6
= 270 ÷ 6
= 45（分）',
 'enhancement', 'p6_lq_batch1', 'LQ05', NULL, NULL, true),

-- LQ06 — 茬言英文/數學小測 (P5 U18 平均數, multi-part)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '下表顯示茬言在英文科和數學科的小測成績：
英文科分數：第一次 46 分，第二次 44 分，第三次 ?，第四次 ?，平均分 46.5 分
數學科分數：第一次 ?，第二次 ?，第三次 36 分，第四次 40 分，平均分 ?
(a) 茬言英文科小測三和四的分數相同。他英文科小測四的分數是多少分？
(b) 每次小測的滿分是 50 分。茬言數學科小測的平均分可以達到 45 分嗎？為甚麼？',
 '(a) 他英文科小測四的分數是：
(46.5 × 4 − 46 − 44) ÷ 2
= 96 ÷ 2
= 48（分）

(b) 不可以
因為他在數學科小測的平均分最高可以達到：
(50 × 2 + 36 + 40) ÷ 4 = 44（分），比 45 分低。',
 'advanced', 'p6_lq_batch1', 'LQ06',
 '兩部分；(b) 需要解釋',
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.30.png',
 true),

-- LQ07 — 容器盛水 + 放入正方體 (P6 U6 容量和體積)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '右圖的容器已盛水半滿，把邊長是 3 cm 的正方體放進容器裏，最多可放入正方體多少個，而容器裏的水不會溢出？（容器尺寸：25 cm × 12 cm × 16 cm）',
 '容器最多還可盛水：
25 × 12 × (16 ÷ 2)
= 25 × 12 × 8
= 2400（cm³）

可放入正方體：
2400 ÷ (3 × 3 × 3)
= 2400 ÷ 27
= 88（個）……24（cm³）

最多可放入正方體 88 個。',
 'advanced', 'p6_lq_batch1', 'LQ07',
 '容量 − 已盛水 = 剩餘空間，再除以正方體體積',
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.49.00.png',
 true);

COMMIT;
