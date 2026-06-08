-- ==========================================================================
-- P4B LQ batch 2 — extraction from _lq_input:/p4/p4b question/p4b2/
-- (20 screenshots; 19 LQs extracted, 1 sub-question skipped).
--
-- Topic mapping (P4 4B units):
--   P4 U16 正方形和長方形面積  10  (LQ250-LQ259, area/perimeter problems)
--   P4 U13 小數的認識            9  (LQ260-LQ268, decimal +/- application)
--
-- LQ range: LQ250–LQ268
-- SKIPPED: LQ-? (兩張卡紙重疊組成正方形, 14cm×9cm — dimensions only in figure)
--          LQ266a (叔叔款項合計 — counting money from photo image)
--
-- Image matches (HIGH confidence unless noted):
--   p4b images/Screenshot 2026-05-24 at 22.45.15.png → LQ251 (8cm bamboo sticks)
--   p4b images/Screenshot 2026-05-24 at 22.45.16.png → LQ252 (16cm × 4cm bookmarks)
--   p4b images/Screenshot 2026-05-24 at 22.45.27.png → LQ253 (extended table)  [MEDIUM]
--   p4b images/Screenshot 2026-05-24 at 22.45.31.png → LQ254 (28m × 28m grass 700m²)
--   p4b images/Screenshot 2026-05-24 at 22.46.30.png → LQ258 (decorator 650元/m²)
--   p4b images/Screenshot 2026-05-24 at 22.47.11.png → LQ267 (three soap bottles)
--   p4b images/Screenshot 2026-05-24 at 22.47.16.png → LQ268a-context (banknotes+coins for 叔叔款項)
--   p4b images/Screenshot 2026-05-24 at 22.47.19.png → LQ269 (candy/biscuit/peanut prices)
--
-- Apply once. Idempotent via source_paper='p4b_lq_batch2'.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p4b_lq_batch2';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 正方形和長方形面積 (P4 U16) ────────────────────────────────────────────

-- LQ250
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '長方形遊樂場長 36 m，闊比長少 16 m。遊樂場的面積是多少 m²？',
 '36 − 16
= 20
遊樂場闊 20 m。
36 × 20
= 720
遊樂場的面積是 720 m²。',
 'enhancement', 'p4b_lq_batch2', 'LQ250', NULL, NULL, true),

-- LQ251
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '嘉佩用右面的竹簽圍成一個正方形（每支竹簽長 8 cm），這個正方形的面積是多少 cm²？',
 '8 × 8
= 64
這個正方形的面積是 64 cm²。',
 'basic', 'p4b_lq_batch2', 'LQ251',
 '配圖：4 支 8 cm 竹簽',
 'local:_lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.45.15.png', true),

-- LQ252
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '右圖的正方形由四張大小相同的長方形書簽拼成（每張書簽長 16 cm、闊 4 cm）。這個正方形的面積是多少 cm²？',
 '16 × 16
= 256
這個正方形的面積是 256 cm²。
或
16 × 4 × 4
= 256
這個正方形的面積是 256 cm²。',
 'enhancement', 'p4b_lq_batch2', 'LQ252',
 '配圖：4 張 16 cm × 4 cm 書簽拼成正方形',
 'local:_lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.45.16.png', true),

-- LQ253
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '一張長方形桌子長 90 cm、闊 65 cm。桌子的一邊可以延伸成為正方形桌子。延伸後，桌子的面積比原來的增加了多少 cm²？',
 '90 − 65
= 25
桌子延伸了 25 cm。
90 × 25
= 2250
桌子的面積比原來的增加了 2250 cm²。
或 列一道算式來計算：
90 × (90 − 65)
= 90 × 25
= 2250
桌子的面積比原來的增加了 2250 cm²。',
 'enhancement', 'p4b_lq_batch2', 'LQ253',
 '配圖：延伸前長方形 + 延伸後正方形',
 'local:_lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.45.27.png', true),

-- LQ254
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '右圖的長方形草地長 28 m，面積是 700 m²。草地的周界是多少 m？',
 '700 ÷ 28
= 25
草地闊 25 m。
(28 + 25) × 2
= 53 × 2
= 106
草地的周界是 106 m。
或 列一道算式來計算：
(28 + 700 ÷ 28) × 2
= (28 + 25) × 2
= 53 × 2
= 106
草地的周界是 106 m。',
 'enhancement', 'p4b_lq_batch2', 'LQ254',
 '配圖：長 28 m、面積 700 m² 的長方形草地',
 'local:_lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.45.31.png', true),

-- LQ255
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '長方形玻璃長 84 cm、闊 20 cm。工人把這塊玻璃分割成若干塊邊長是 4 cm 的正方形玻璃。他可得正方形玻璃多少塊？',
 '84 ÷ 4
= 21
每橫行可分割出正方形玻璃 21 塊。
20 ÷ 4
= 5
共有橫行 5 行。
21 × 5
= 105
他可得正方形玻璃 105 塊。
或 列一道算式來計算：
(84 ÷ 4) × (20 ÷ 4)
= 21 × 5
= 105
他可得正方形玻璃 105 塊。',
 'enhancement', 'p4b_lq_batch2', 'LQ255', NULL, NULL, true),

-- LQ256
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '商場裏有一個長 12 米的長方形水池，水池的長是闊的 3 倍。這個水池的面積是多少平方米？',
 '12 ÷ 3
= 4
這個水池的闊是 4 米。
12 × 4
= 48
這個水池的面積是 48 平方米。
或 列一道算式來計算：
12 × (12 ÷ 3)
= 12 × 4
= 48
這個水池的面積是 48 平方米。',
 'enhancement', 'p4b_lq_batch2', 'LQ256', NULL, NULL, true),

-- LQ257
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '舞台的地面是邊長 8 米的正方形，鋪設地板每平方米的費用是 650 元。在整個舞台鋪設地板的費用是多少元？',
 '650 × (8 × 8)
= 650 × 64
= 41600
在整個舞台鋪設地板的費用是 41600 元。',
 'enhancement', 'p4b_lq_batch2', 'LQ257',
 '配圖：裝修工人 650 元/m²',
 'local:_lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.46.30.png', true),

-- LQ258
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '思琪把兩個長 8 cm，闊 4 cm 的長方形重疊，然後剪去一個正方形，如右圖所示。右圖的面積是多少 cm²？',
 '(8 − 4) × (4 − 2) = 8
重疊部分的面積是 8 cm²。
2 × 2 = 4
剪去部分的面積是 4 cm²。
8 × 4 × 2 − 8 − 4 = 52
右圖的面積是 52 cm²。',
 'advanced', 'p4b_lq_batch2', 'LQ258',
 '兩個 8×4 長方形重疊並剪去 2×2 正方形',
 NULL, true),

-- LQ259  (the 36m playground was LQ250 — placeholder enhancement filler skipped;
--         re-use slot for a basic-tier area question from screenshot 22.42.37 actually
--         already covered as LQ251. Cannot fit another from this batch — skip.)
-- (slot intentionally unused; LQ-counter continues at LQ260)

-- ─── 小數的認識 (P4 U13) — 小數加減應用題 ──────────────────────────────────

-- LQ260
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '一條木條原來長 2.2 米，木匠鋸去 0.5 米後，還餘木條多少米？',
 '2.2 − 0.5
= 1.7
還餘木條 1.7 米。',
 'basic', 'p4b_lq_batch2', 'LQ260', NULL, NULL, true),

-- LQ261
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '嘉儀有 20.5 元。她想買一盒售 26 元的朱古力，還欠多少元？',
 '26 − 20.5
= 5.5
還欠 5.5 元。',
 'basic', 'p4b_lq_batch2', 'LQ261', NULL, NULL, true),

-- LQ262
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '郊遊徑全長 12 公里，姊姊先走了 3.25 公里，再走了 4.9 公里，她共走了多少公里？',
 '3.25 + 4.9
= 8.15
她共走了 8.15 公里。',
 'basic', 'p4b_lq_batch2', 'LQ262', NULL, NULL, true),

-- LQ263
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '媽媽用梳打水 1.24 升、汽水 1050 毫升和一些果汁調製成一瓶果汁特飲，這瓶果汁特飲共有 3.6 升。她用了果汁多少升？',
 '1050 毫升 = 1.05 升
3.6 − 1.24 − 1.05
= 2.36 − 1.05
= 1.31
她用了果汁 1.31 升。',
 'enhancement', 'p4b_lq_batch2', 'LQ263',
 '需先把 1050 mL 換算成 1.05 L',
 NULL, true),

-- LQ264
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '糕點師傅做蛋糕用了麵粉 4.8 公斤，比做餅乾少用麵粉 0.35 公斤。糕點師傅共用了麵粉多少公斤？（提示：請設定題目的問題，自擬一道加法應用題。）',
 '做餅乾用了：
4.8 + 0.35
= 5.15（公斤）
糕點師傅共用了麵粉：
4.8 + 0.35 + 4.8
= 9.95
糕點師傅共用了麵粉 9.95 公斤。（或其他合理答案。）',
 'enhancement', 'p4b_lq_batch2', 'LQ264',
 '自擬問題；模範答案計算總用量 9.95 公斤',
 NULL, true),

-- LQ265
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '家中有牛奶 3.18 升，果汁比牛奶少 1.6 升。家中共有牛奶和果汁多少升？',
 '3.18 + (3.18 − 1.6)
= 3.18 + 1.58
= 4.76
家中共有牛奶和果汁 4.76 升。
或
3.18 + 3.18 − 1.6
= 6.36 − 1.6
= 4.76
家中共有牛奶和果汁 4.76 升。',
 'enhancement', 'p4b_lq_batch2', 'LQ265', NULL, NULL, true),

-- LQ266
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '智軒的體重是 37.2 公斤，比嘉希輕 6.6 公斤，嘉希比靜宜重 8.4 公斤。靜宜的體重是多少公斤？',
 '37.2 + 6.6 − 8.4
= 43.8 − 8.4
= 35.4
靜宜的體重是 35.4 公斤。',
 'enhancement', 'p4b_lq_batch2', 'LQ266', NULL, NULL, true),

-- LQ267
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '店舖有三款洗手液出售，價錢分別是 34.80 元、29.90 元和 30.50 元。媽媽付一張 100 元紙幣，買最便宜的洗手液兩瓶，應找回多少元？',
 '100 − (29.9 + 29.9)
= 100 − 59.8
= 40.2
應找回 40.2 元。
或
100 − 29.9 − 29.9
= 70.1 − 29.9
= 40.2
應找回 40.2 元。',
 'enhancement', 'p4b_lq_batch2', 'LQ267',
 '配圖：三款洗手液 $34.80 / $29.90 / $30.50',
 'local:_lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.47.11.png', true),

-- LQ268  (only sub-part (b); (a) requires counting cash from photo, skipped)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '叔叔有 359.6 元。叔叔買了兩個各售 112.4 元的蜜瓜後，還餘多少元？',
 '359.6 − (112.4 + 112.4)
= 359.6 − 224.8
= 134.8
還餘 134.8 元。
或
359.6 − 112.4 − 112.4
= 247.2 − 112.4
= 134.8
還餘 134.8 元。',
 'enhancement', 'p4b_lq_batch2', 'LQ268',
 '原題 (a) 數鈔票合計 359.6 元已略去；只取 (b)',
 NULL, true),

-- LQ269
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '糖果售 12.8 元，餅乾售 8.5 元。詩琪和姊姊想合資購買一包糖果和一盒餅乾，她們每人有 10 元，她們有的款項夠付款嗎？為甚麼？',
 '答案：（不夠）
因為 12.8 + 8.5 = 21.3，她們共需付 21.3 元；
10 + 10 = 20，她們有的款項共 20 元，
20 < 21.3，所以她們有的款項不足夠付款。（或其他合理答案。）',
 'enhancement', 'p4b_lq_batch2', 'LQ269',
 '判斷題；糖果 $12.80、餅乾 $8.50',
 'local:_lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.47.19.png', true)

;

COMMIT;

-- SKIPPED Q/A pairs:
--   Screenshot 22.43.00 (兩張長方形卡紙重疊組成正方形, 14cm × 9cm)
--     — dimensions (14, 9, 重疊部分) only readable from figure; figure cannot be
--       reconstructed in text form. Image available at:
--       _lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.45.56.png
--   叔叔款項 (a) 數鈔票合計 359.6 元 — requires counting cash photo
--     (image at _lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.47.16.png)
--
-- Orphan images (none matched):
--   Screenshot 2026-05-24 at 22.45.56.png (overlap figure for skipped Q)
--   Screenshot 2026-05-24 at 22.46.51.png (speech bubble fragment for LQ264 — not standalone)
--   Screenshot 2026-05-24 at 22.47.16.png (banknotes for skipped (a))
