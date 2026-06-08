-- ==========================================================================
-- P6 LQ batch 2 — extraction from _lq_input:/p6/p6a rescreenshot/
-- 20 single-LQ re-screenshots, all cleanly readable.
--
-- All 12 orphan images from batch1 now match. 折線圖/ folder still ignored.
--
-- Topic mapping by content (cross-grade where appropriate):
--   P6 U1 小數除法    — LQ08-LQ13 (6)
--   P5 U7 多邊形的面積 — LQ10 (1, cross-grade)
--   P5 U18 平均數     — LQ14-LQ17 (4, cross-grade)
--   P6 U6 容量和體積  — LQ18-LQ27 (10)
--
-- Apply once in Supabase SQL Editor. Idempotent via source_paper.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p6_lq_batch2';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 小數除法 (P6 U1) ──────────────────────────────────────────────────────

-- LQ08 — 王太太/劉先生橙
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '每個橙的售價相同，王太太買 4 個橙共需付 12.8 元。劉先生買 7 個橙，共需付多少元？',
 '共需付：
12.8 ÷ 4 × 7
= 3.2 × 7
= 22.4（元）',
 'enhancement', 'p6_lq_batch2', 'LQ08', NULL, NULL, true),

-- LQ09 — 蛋糕 vs 西餅
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '一個蛋糕重 0.94 公斤，一打西餅共重 0.84 公斤，每件西餅的重量相同。一件西餅比一個蛋糕輕多少公斤？',
 '一件西餅比一個蛋糕輕：
0.94 − 0.84 ÷ 12
= 0.94 − 0.07
= 0.87（公斤）',
 'enhancement', 'p6_lq_batch2', 'LQ09', NULL, NULL, true),

-- LQ10 — 梯形面積 (P5 U7 cross-grade)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '右面梯形的面積是多少平方米？（上底 1.2 米、下底 2.4 米、高 1.35 米）',
 '右面梯形的面積是：
(1.2 + 2.4) × 1.35 ÷ 2
= 3.6 × 1.35 ÷ 2
= 4.86 ÷ 2
= 2.43（平方米）',
 'enhancement', 'p6_lq_batch2', 'LQ10', NULL,
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.47.59.png',
 true),

-- LQ11 — 的士車費 (P6 U1, with taxi fare table)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '甲池和乙池之間的路程是 2 km，乙池和丙池之間的路程是 6.4 km。媽媽乘的士由甲池到乙池，經乙池到丙池。如果媽媽沒有行李，她需付車費多少元？（的士收費：首 2 km 24 元，其後每 0.2 km 1.7 元，每件行李 6 元）',
 '她應付車費是：
24 + 1.7 × (6.4 ÷ 0.2)
= 24 + 1.7 × 32
= 24 + 54.4
= 78.4（元）',
 'advanced', 'p6_lq_batch2', 'LQ11',
 '的士收費表 inlined in question; image also attached for visual reference',
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.02.png',
 true),

-- LQ12 — 涼茶店瓶子 (P6 U1, 餘數進位)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '涼茶店原有杏仁茶 2.7 升，再煲了 5.3 升後，店員把所有杏仁茶用容量是 0.75 升的瓶子盛好，他最少需要瓶子多少個？',
 '他需要瓶子：
(2.7 + 5.3) ÷ 0.75
= 8 ÷ 0.75
= 10（個）……0.5（升）
他最少需要瓶子 11 個。',
 'enhancement', 'p6_lq_batch2', 'LQ12',
 '與 LQ04 一樣，需要進位處理餘數',
 NULL, true),

-- LQ13 — 硬幣付款 (P6 U1, sub-parts a/b — open-ended b)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=1 ORDER BY t.lesson_number LIMIT 1),
 '子軒買了一份售 16 元的三文治。
(a) 如果子軒全用（1 角／2 角／5 角）硬幣付款，他共需付硬幣多少個？
(b) 寫出一個全用 (a) 的硬幣付款的缺點。',
 '(a) 他共需付硬幣：
16 ÷ 0.5
= 32（個）

(b) （或其他合理答案）
浪費點算硬幣的時間／或數量計算容易錯誤／或店員可能拒收大量硬幣／或不方便攜帶大量硬幣。',
 'enhancement', 'p6_lq_batch2', 'LQ13',
 '(b) 為開放式答案，學生答案合理皆可',
 NULL, true),

-- ─── 平均數 (P5 U18 cross-grade) ──────────────────────────────────────────

-- LQ14 — 蛋糕款式平均銷量
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '餅店有 5 款蛋糕，右表顯示每款蛋糕的銷量。平均每款蛋糕售出多少個？（朱古力 27, 芝士 40, 抹茶 33, 草莓 28, 芒果 32）',
 '平均每款蛋糕售出：
(27 + 40 + 33 + 28 + 32) ÷ 5
= 160 ÷ 5
= 32（個）',
 'enhancement', 'p6_lq_batch2', 'LQ14', NULL,
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.18.png',
 true),

-- LQ15 — 六人平均身高
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '雪欣、可琪、柏宇和柏言四人的平均身高是 139 cm，佩兒和永賢的身高分別是 150 cm 和 148 cm。這六人的平均身高是多少 cm？（答案取至小數點後一個位）',
 '這六人的平均身高是：
(139 × 4 + 150 + 148) ÷ 6
= 854 ÷ 6
= 142.33…
≈ 142.3（cm）',
 'enhancement', 'p6_lq_batch2', 'LQ15', NULL, NULL, true),

-- LQ16 — 投籃平均得分 (反向求)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '在投籃遊戲中，弟弟投籃了 5 次。他在首 4 次的得分分別是 32 分、40 分、28 分和 16 分。他 5 次投籃的平均得分是 30 分。他最後一次投籃的得分是多少分？',
 '他最後一次投籃的得分是：
30 × 5 − 32 − 40 − 28 − 16
= 150 − 32 − 40 − 28 − 16
= 34（分）',
 'enhancement', 'p6_lq_batch2', 'LQ16',
 '反向題：由平均反求一個數', NULL, true),

-- LQ17 — 表姐跑步平均 (反向求一天)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=18 ORDER BY t.lesson_number LIMIT 1),
 '表姐每天都會到運動場練習跑步。她上星期平均每天跑 2.7 km，其中星期一至三每天跑了 3.2 km，星期四因生病沒有練習，星期五、六和日跑的路程相同。她上星期六跑了多少 km？',
 '她上星期六跑了：
(2.7 × 7 − 3.2 × 3 − 0) ÷ 3
= 9.3 ÷ 3
= 3.1（km）',
 'advanced', 'p6_lq_batch2', 'LQ17', NULL, NULL, true),

-- ─── 容量和體積 (P6 U6) ────────────────────────────────────────────────────

-- LQ18 — 長方體容量 (cm³ → L)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '右面是一個長方體容器（18 cm × 14 cm × 12 cm），容器內的水深 5 cm。長方體容器裏有水多少 L？',
 '長方體容器裏有水：
18 × 14 × 5
= 1260（cm³）
= 1.26（L）',
 'enhancement', 'p6_lq_batch2', 'LQ18', NULL,
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.34.png',
 true),

-- LQ19 — 360 mL 注入長方體 → 水深
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '把 360 mL 水全部注入右面的長方體膠盒後（盒底 20 cm × 4 cm，高 8 cm），水深多少 cm？',
 '水深：
360 ÷ 20 ÷ 4
= 18 ÷ 4
= 4.5（cm）',
 'enhancement', 'p6_lq_batch2', 'LQ19', NULL,
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.36.png',
 true),

-- LQ20 — 正方體盒 + 長方體積木
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '右面是一個正方體盒子（邊長 20 cm），這個盒子內最多可放多少塊長 4 cm、闊 2 cm、高 5 cm 的長方體積木？',
 '這個盒子內最多可放：
(20 ÷ 4) × (20 ÷ 2) × (20 ÷ 5)
= 5 × 10 × 4
= 200（塊）',
 'enhancement', 'p6_lq_batch2', 'LQ20', NULL,
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.38.png',
 true),

-- LQ21 — 木箱厚壁容量
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '右面是一個無蓋的長方體木箱（外尺寸 42 cm × 27 cm × 27 cm）。它的四邊都是厚 1 cm 的木板，底是厚 2 cm 的木板。爸爸把水注入木箱裏，直至水的高度是木箱內最高度的一半，木箱裏現有水多少 L？',
 '木箱的內尺寸：
長 = 42 − 2 = 40（cm）
闊 = 27 − 2 = 25（cm）
高 = 27 − 2 = 25（cm）

水深 = 25 ÷ 2 = 12.5（cm）

木箱裏現有水：
40 × 25 × 12.5
= 12500（cm³）
= 12.5（L）',
 'advanced', 'p6_lq_batch2', 'LQ21',
 '需先計算內部尺寸（扣除壁厚 + 底厚）',
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.42.png',
 true),

-- LQ22 — 量杯 + 3 塊積木 (排水量)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '右面的量杯裏盛有一些水（1400 cm³）。把 3 塊體積各是 17 cm³ 的積木放進量杯裏，量杯裏水和積木的總體積是多少 cm³？',
 '量杯裏水和積木的總體積是：
17 × 3 + 1400
= 51 + 1400
= 1451（cm³）',
 'basic', 'p6_lq_batch2', 'LQ22', NULL,
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.44.png',
 true),

-- LQ23 — 兩輛玩具車排水量
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '把兩輛大小相同的玩具車放進量杯裏，每輛玩具車的體積是多少 cm³？（量杯由 700 mL 升至 1000 mL）',
 '每輛玩具車的體積是：
(1000 − 700) ÷ 2
= 300 ÷ 2
= 150（cm³）',
 'enhancement', 'p6_lq_batch2', 'LQ23',
 '一道算式：(1000−700)÷2',
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.46.png',
 true),

-- LQ24 — 量杯 + 8 玻子排水
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '量杯裏原來盛着一些水，把 8 粒大小相同的波子放進去後水位升至 180 mL；取走 6 粒波子後，量杯裏的水位下降至如左圖所示。量杯裏有水多少 mL？',
 '每粒波子的體積是：
(180 − 120) ÷ 6
= 60 ÷ 6
= 10（cm³）= 10（mL）

量杯裏有水：
180 − 8 × 10
= 180 − 80
= 100（cm³）= 100（mL）',
 'advanced', 'p6_lq_batch2', 'LQ24',
 '先求單粒波子體積再反推水量',
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.49.png',
 true),

-- LQ25 — 摩天輪模型排水量
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '把一個摩天輪模型放進排水桶裏（排水桶 18 cm × 10 cm，水溢至外槽 2.5 cm 高），摩天輪模型的體積是多少 cm³？',
 '摩天輪模型的體積是：
18 × 10 × 2.5
= 450（cm³）',
 'enhancement', 'p6_lq_batch2', 'LQ25', NULL,
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.54.png',
 true),

-- LQ26 — 水缸 + 56 粒波子 → 水位上升
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '把長 20 厘米，闊 14 厘米，高 15 厘米的長方體水缸注水至水深 10 厘米，然後把 56 粒體積各是 5 立方厘米的波子放進水缸裏，水把這些波子完全浸沒，而水沒有溢出。水位上升了多少厘米？',
 '水位上升了：
(5 × 56) ÷ 20 ÷ 14
= 280 ÷ 20 ÷ 14
= 14 ÷ 14
= 1（厘米）',
 'enhancement', 'p6_lq_batch2', 'LQ26',
 '排水量 ÷ 底面積 = 水位上升幅度',
 NULL, true),

-- LQ27 — 木箱 + 玻璃珠最多放幾粒
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '右面的木箱沒 5 塊各厚 2 cm 的木板製成，木箱裏盛有水 1400 mL。把體積是 64 cm³ 的玻璃珠放進木箱裏，最少要放入玻璃珠多少粒，木箱裏的水才會溢出？（外尺寸 30 cm × 14 cm × 7 cm）',
 '木箱的容量是：
(30 − 2 − 2) × (14 − 2 − 2) × 7
= 26 × 10 × 7
= 1820（cm³）

木箱裏要再盛水：
1820 − 1400
= 420（cm³）

要放入玻璃珠：
420 ÷ 64
= 6（粒）……36（cm³）

最少要放入玻璃珠 7 粒。',
 'advanced', 'p6_lq_batch2', 'LQ27',
 '需先計算內尺寸 + 餘數進位',
 'local:_lq_input/p6/images/Screenshot 2026-05-23 at 16.48.57.png',
 true);

COMMIT;
