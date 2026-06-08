-- ==========================================================================
-- P3A LQ batch — extraction from _lq_input:/p3/p3a question/ (16 screenshots)
-- + _lq_input:/p3/p3a images/ (4 images, all matched).
--
-- 17 LQs extracted (1 screenshot packed 2 LQs).
--
-- Topic mapping (P3 curriculum — content-mapped, lesson_number LIMIT 1 picks
-- first lesson within unit):
--   P3 U5  乘法（一）        4   (LQ121-122, LQ123, LQ127 — simple ×)
--   P3 U6  乘法（二）        4   (LQ124-126, LQ128 — multi-step ×)
--   P3 U10 除法（二）        9   (LQ129-137 — all division questions)
--
-- Apply once. Idempotent via source_paper='p3a_lq_batch'.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p3a_lq_batch';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 乘法（一） (P3 U5) ─────────────────────────────────────────────────────

-- LQ121
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '水果店有芒果 3 箱，每箱有芒果 36 個。水果店共有芒果多少個？',
 '36 × 3
= 108
水果店共有芒果 108 個。',
 'basic', 'p3a_lq_batch', 'LQ121', NULL, NULL, true),

-- LQ122
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '每對手套售 38 元，每件風衣的售價是每對手套的 9 倍。每件風衣售多少元？',
 '38 × 9
= 342
每件風衣售 342 元。',
 'basic', 'p3a_lq_batch', 'LQ122', NULL, NULL, true),

-- LQ123
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '每盒紙巾有 250 張。媽媽購買 5 盒紙巾，共有紙巾多少張？',
 '250 × 5
= 1250
共有紙巾 1250 張。',
 'basic', 'p3a_lq_batch', 'LQ123', NULL, NULL, true),

-- LQ127
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '一篇文章有 142 個字。思琪抄寫了這篇文章 3 次，她共抄寫了字多少個？',
 '142 × 3
= 426
她共抄寫了字 426 個。',
 'basic', 'p3a_lq_batch', 'LQ127', NULL, NULL, true),

-- ─── 乘法（二） (P3 U6) ─────────────────────────────────────────────────────

-- LQ124
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '每頂泳帽售 24 元。泳會開辦游泳班 4 班，每班有學生 8 個。泳會替每個學生購買泳帽一頂，共需付多少元？',
 '24 × 8 × 4
= 192 × 4
= 768
共需付 768 元。',
 'enhancement', 'p3a_lq_batch', 'LQ124', NULL, NULL, true),

-- LQ125
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '餅店每天做蘋果批 85 個，6 星期共做蘋果批多少個？',
 '85 × 7 × 6
= 595 × 6
= 3570
6 星期共做蘋果批 3570 個。',
 'enhancement', 'p3a_lq_batch', 'LQ125', NULL, NULL, true),

-- LQ126 (image: speech bubble hint about 自擬 number)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '一個吊飾需用珠子 16 粒，美玲和 2 個朋友每人串了吊飾 2 個，他們共用了珠子多少粒？',
 '16 × 2 × 3
= 32 × 3
= 96
他們共用了珠子 96 粒。（或其他合理答案。）',
 'enhancement', 'p3a_lq_batch', 'LQ126',
 '提示：自擬串一個吊飾需用珠子數量',
 'local:_lq_input/p3/p3a images/Screenshot 2026-05-24 at 22.52.16.png',
 true),

-- LQ128 (image: November calendar)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '右面是本月的月曆（十一月）。紫田園餐廳逢星期五上午和下午各送出 80 個飯盒給長者，該餐廳本月共送出飯盒多少個？',
 '80 × 2 × 5
= 160 × 5
= 800
該餐廳本月共送出飯盒 800 個。',
 'advanced', 'p3a_lq_batch', 'LQ128',
 '十一月有 5 個星期五；每個星期五早晚各送一次',
 'local:_lq_input/p3/p3a images/Screenshot 2026-05-24 at 22.52.22.png',
 true),

-- ─── 除法（二） (P3 U10) ───────────────────────────────────────────────────

-- LQ129 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '浩文和子樂每人點了一份售價相同的晚餐，共需付 398 元。每份晚餐售多少元？',
 '398 ÷ 2
= 199
每份晚餐售 199 元。',
 'basic', 'p3a_lq_batch', 'LQ129', NULL, NULL, true),

-- LQ130
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '水果店有奇異果 470 個。店員把奇異果平均分成 9 箱，每箱有奇異果多少個？還餘奇異果多少個？',
 '470 ÷ 9
= 52……2
每箱有奇異果 52 個，還餘奇異果 2 個。',
 'enhancement', 'p3a_lq_batch', 'LQ130', NULL, NULL, true),

-- LQ131
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '心妍想買一個售 96 元的布偶，她每天儲蓄 5 元。最少要儲蓄多少天才有足夠的款項？',
 '96 ÷ 5
= 19……1
最少要儲蓄 20 天。',
 'enhancement', 'p3a_lq_batch', 'LQ131',
 '餘數需進位',
 NULL, true),

-- LQ132
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '花店有玫瑰 84 枝，店員把其中一半的玫瑰每半打裝成一束，每束需用絲帶一條。店員需用絲帶多少條？',
 '84 ÷ 2 ÷ 6
= 42 ÷ 6
= 7
店員需用絲帶 7 條。',
 'enhancement', 'p3a_lq_batch', 'LQ132',
 '一半 ÷ 半打 (6) → 兩步除法',
 NULL, true),

-- LQ133 (multi-part a/b)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '書店店員把 150 本圖書平均放在 4 層書架上。
(a) 每層書架有圖書多少本？還餘多少本？
(b) 店員把餘下的圖書全部放在其中一層書架上，這層共有圖書 ___ 本。',
 '(a) 150 ÷ 4
= 37……2
每層書架有圖書 37 本，還餘 2 本。

(b) 37 + 2 = 39
這層共有圖書 39 本。',
 'enhancement', 'p3a_lq_batch', 'LQ133',
 '(b) 用 (a) 答案 + 餘數',
 NULL, true),

-- LQ134 (multi-part)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '製作一杯雜莓特飲需用草莓 6 粒和藍莓 8 粒。飲品店現有草莓 230 粒和藍莓 332 粒，最多可製作雜莓特飲多少杯？',
 '草莓最多可製作雜莓特飲：
230 ÷ 6
= 38……2
草莓最多可製作雜莓特飲 38 杯。

藍莓最多可製作雜莓特飲：
332 ÷ 8
= 41……4
藍莓最多可製作雜莓特飲 41 杯。

最多可製作雜莓特飲 38 杯。',
 'advanced', 'p3a_lq_batch', 'LQ134',
 '兩個獨立計算取最小值',
 NULL, true),

-- LQ135 (image: speech bubble hint)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '一本小說有 252 頁。爸爸（每天 / 每星期）看 9 頁，他看完全本小說需用多少星期？',
 '圈出「每天」：
252 ÷ 9 ÷ 7
= 28 ÷ 7
= 4
他看完全本小說需用 4 星期。

或圈出「每星期」：
252 ÷ 9
= 28
他看完全本小說需用 28 星期。',
 'advanced', 'p3a_lq_batch', 'LQ135',
 '圈出兩個答案皆可',
 'local:_lq_input/p3/p3a images/Screenshot 2026-05-24 at 22.52.46.png',
 true),

-- LQ136
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '食品廠有餅乾 864 包。工人把餅乾每 8 包裝成一盒，每 6 盒裝成一箱，這些餅乾共可裝成多少箱？',
 '864 ÷ 8 ÷ 6
= 108 ÷ 6
= 18
這些餅乾共可裝成 18 箱。',
 'enhancement', 'p3a_lq_batch', 'LQ136', NULL, NULL, true),

-- LQ137 (image: 佳佳超級市場 印花)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=10 ORDER BY t.lesson_number LIMIT 1),
 '在佳佳超級市場購物每滿 5 元，可印花 1 個。媽媽用 220 元買了一個湯鍋，她所得的印花足夠換到一對隔熱手套嗎？為甚麼？（換贈品：45 個印花換隔熱手套一對，30 個印花換隔熱墊一塊）',
 '答案：（不足夠）
因為 220 ÷ 5 = 44
她得到印花 44 個。
44 < 45，所以她所得的印花不足夠換到一對隔熱手套。（或其他合理解釋。）',
 'enhancement', 'p3a_lq_batch', 'LQ137',
 '判斷題；比較印花數量 vs 兌換要求',
 'local:_lq_input/p3/p3a images/Screenshot 2026-05-24 at 22.52.52.png',
 true);

COMMIT;
