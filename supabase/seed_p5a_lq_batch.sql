-- ==========================================================================
-- P5A LQ batch — extraction from _lq_input:/p5/p5a question/ (29 screenshots)
-- + _lq_input:/p5/p5a images/ (14 valid images, 2 desktop screenshots ignored).
--
-- 31 LQs extracted; 複合棒形圖/ subfolder skipped per direction.
--
-- Topic mapping (all P5 5A units, content-mapped):
--   P5 U2 異分母分數加法和減法   11 (LQ57-LQ67)
--   P5 U7 多邊形的面積          13 (LQ68-LQ80)
--   P5 U3 分數乘法               7 (LQ81-LQ87)
--
-- Apply once. Idempotent via source_paper='p5a_lq_batch'.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p5a_lq_batch';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 異分母分數加法和減法 (P5 U2) ──────────────────────────────────────────

-- LQ57
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '爸爸到理髮店理髮，洗髮用了 1/6 小時，剪髮用了 1/4 小時。爸爸理髮共用了幾小時？',
 '爸爸理髮共用了：
1/6 + 1/4
= 2/12 + 3/12
= 5/12（小時）',
 'basic', 'p5a_lq_batch', 'LQ57', NULL, NULL, true),

-- LQ58 (image: elephant $28½ + car $45⅘)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '爸爸買了小象布偶 2 個和遙控車 1 輛，共需付多少元？（小象布偶 $28 1/2，遙控車 $45 4/5）',
 '共需付：
28 1/2 + 28 1/2 + 45 4/5
= 57 + 45 4/5
= 102 4/5（元）',
 'enhancement', 'p5a_lq_batch', 'LQ58', NULL,
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.18.57.png',
 true),

-- LQ59
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '廚師用去紅豆 2 1/10 kg，用去的紅豆比綠豆少 2/5 kg。廚師共用去紅豆和綠豆多少 kg？',
 '廚師共用去紅豆和綠豆：
2 1/10 + 2 1/10 + 2/5
= 4 2/10 + 2/5
= 4 2/10 + 4/10
= 4 6/10
= 4 3/5（kg）',
 'enhancement', 'p5a_lq_batch', 'LQ59', NULL, NULL, true),

-- LQ60 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '一盒曲奇有 14 塊，其中朱古力曲奇有 5 塊，核桃曲奇佔全盒曲奇的 2/7。朱古力曲奇和核桃曲奇共佔全盒曲奇的幾分之幾？',
 '朱古力曲奇和核桃曲奇共佔全盒曲奇的：
5/14 + 2/7
= 5/14 + 4/14
= 9/14',
 'enhancement', 'p5a_lq_batch', 'LQ60', NULL, NULL, true),

-- LQ61
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '郊遊徑長 4 2/5 km，美婷和家人走了 2 1/2 km。他們還要多走幾 km 才走完郊遊徑？',
 '他們還要多走：
4 2/5 − 2 1/2
= 4 4/10 − 2 5/10
= 3 14/10 − 2 5/10
= 1 9/10（km）',
 'enhancement', 'p5a_lq_batch', 'LQ61', NULL, NULL, true),

-- LQ62 (image: 1L beaker half full)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '家中原有梳打水 1 1/2 升。媽媽做雜果賓治後，還餘下圖中的梳打水（量杯顯示約 5/8 升）。媽媽做雜果賓治用去梳打水多少升？',
 '媽媽做雜果賓治用去梳打水：
1 1/2 − 5/8
= 1 4/8 − 5/8
= 12/8 − 5/8
= 7/8（升）',
 'enhancement', 'p5a_lq_batch', 'LQ62', NULL,
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.02.png',
 true),

-- LQ63
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '零食店有腰果 8 2/5 kg，比瓜子多 1 3/8 kg，而花生的重量與瓜子相差 2 3/4 kg。零食店最少有花生多少 kg？',
 '零食店最少有花生：
8 2/5 − 1 3/8 − 2 3/4
= 8 16/40 − 1 15/40 − 2 30/40
= 7 1/40 − 2 30/40
= 6 41/40 − 2 30/40
= 4 11/40（kg）',
 'advanced', 'p5a_lq_batch', 'LQ63', NULL, NULL, true),

-- LQ64 (image: 2 strips overlap)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '妹妹有 2 條長度相同的紙條（每條長 2/5 m），她用漿糊把紙條以部分重疊的方法貼合成一條新紙條（重疊部分 1/10 m）。新紙條的長度是多少 m？',
 '新紙條的長度是：
2/5 + 2/5 − 1/10
= 4/10 + 4/10 − 1/10
= 7/10（m）',
 'enhancement', 'p5a_lq_batch', 'LQ64', NULL,
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.08.png',
 true),

-- LQ65
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '跳高比賽中，冠軍的成績是 1 3/5 米，季軍的成績是 1 1/10 米，亞軍和季軍的成績相差 1/4 米。冠軍和亞軍的成績相差多少米？',
 '冠軍和亞軍的成績相差：
1 3/5 − (1 1/10 + 1/4)
= 1 12/20 − (1 2/20 + 5/20)
= 1 12/20 − 1 7/20
= 5/20
= 1/4（米）',
 'advanced', 'p5a_lq_batch', 'LQ65', NULL, NULL, true),

-- LQ66
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '水果店有紅葡萄 5 1/4 公斤，紅葡萄比青葡萄少 1 7/10 公斤。水果店共有紅葡萄和青葡萄多少公斤？',
 '水果店共有紅葡萄和青葡萄：
5 1/4 + 5 1/4 + 1 7/10
= 5 5/20 + 5 5/20 + 1 14/20
= 11 24/20
= 12 4/20
= 12 1/5（公斤）',
 'enhancement', 'p5a_lq_batch', 'LQ66', NULL, NULL, true),

-- LQ67
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '家中原有草餅 4 盒，每盒有 9 件。昨天吃了草餅 7 件，今天再吃了 1 2/3 盒，還有草餅多少盒？',
 '還有草餅：
4 − 7/9 − 1 2/3
= 3 9/9 − 7/9 − 1 2/3
= 3 2/9 − 1 2/3
= 3 2/9 − 1 6/9
= 2 11/9 − 1 6/9
= 1 5/9（盒）',
 'advanced', 'p5a_lq_batch', 'LQ67', NULL, NULL, true),

-- ─── 多邊形的面積 (P5 U7) ───────────────────────────────────────────────────

-- LQ68
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '一塊平行四邊形膠片的底是 18 cm，高是底的 5 倍。這塊膠片的面積是多少 cm²？',
 '這塊膠片的面積是：
18 × (18 × 5)
= 18 × 90
= 1620（cm²）',
 'basic', 'p5a_lq_batch', 'LQ68', NULL, NULL, true),

-- LQ69 (image: 4 wood pieces 16×20 cm parallelogram)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '爸爸有四塊大小相同的平行四邊形木板，他把這四塊木板拼砌成一個大平行四邊形（如右圖所示）。大平行四邊形的面積是多少 cm²？（每塊小平行四邊形底 20 cm，高 16 cm）',
 '大平行四邊形的面積是：
20 × 16 × 4
= 1280（cm²）',
 'enhancement', 'p5a_lq_batch', 'LQ69', NULL,
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.15.png',
 true),

-- LQ70 (image: parallelogram 22m / 20m height)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '右圖是一塊平行四邊形草地，它的面積是 660 m²。小狗沿這塊草地的外圍跑了 2 圈，共跑了多少 m？（鄰邊 22 m，對應高 20 m）',
 '以 20 m 為高，對應的底是：
660 ÷ 20
= 33（m）
共跑了：
(33 + 22) × 2 × 2
= 55 × 2 × 2
= 220（m）',
 'advanced', 'p5a_lq_batch', 'LQ70', NULL,
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.18.png',
 true),

-- LQ71
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '一個平行四邊形噴水池的底是 9 米，高比底（長／短）2 米。噴水池擴建後，底加長了 1 米，高不變。噴水池擴建後的面積是多少平方米？',
 '噴水池擴建後的面積是：
(圈出「短」)
(9 + 1) × (9 − 2)
= 10 × 7
= 70（平方米）

或：
(圈出「長」)
(9 + 1) × (9 + 2)
= 10 × 11
= 110（平方米）',
 'advanced', 'p5a_lq_batch', 'LQ71', '長/短 兩個答案皆可', NULL, true),

-- LQ72
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '一塊三角形木板的底是 100 cm，高比底短 15 cm。這塊木板的面積是多少 cm²？',
 '這塊木板的面積是：
100 × (100 − 15) ÷ 2
= 100 × 85 ÷ 2
= 4250（cm²）',
 'enhancement', 'p5a_lq_batch', 'LQ72', NULL, NULL, true),

-- LQ73 (image: parallelogram 30/14/15, Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '偉然從右圖的平行四邊形紙中，剪出一個最大的三角形。這個三角形的面積是多少 cm²？（平行四邊形：底 15 cm，斜邊 30 cm，高 14 cm）',
 '這個三角形的面積是：
30 × 14 ÷ 2
= 210（cm²）',
 'enhancement', 'p5a_lq_batch', 'LQ73',
 '最大三角形 = 平行四邊形面積 ÷ 2',
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.24.png',
 true),

-- LQ74 (image: 2 right triangles → big triangle 6cm, Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '雅文把兩塊相同的等腰直角三角形紙拼砌成一個大三角形，如右圖所示。這個大三角形的面積是多少 cm²？（每個小三角形底 6 cm，高 6 cm）',
 '這個大三角形的面積是：
(6 + 6) × 6 ÷ 2
= 12 × 6 ÷ 2
= 36（cm²）',
 'enhancement', 'p5a_lq_batch', 'LQ74', NULL,
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.26.png',
 true),

-- LQ75 (image: isoceles triangle 10/6 cm)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '右圖的等腰三角形的周界是 36 cm，它的面積是多少 cm²？（兩腰各 10 cm，高 6 cm）',
 '以 6 cm 為高，對應的底是：
36 − 10 × 2
= 36 − 20
= 16（cm）
它的面積是：
16 × 6 ÷ 2
= 48（cm²）',
 'advanced', 'p5a_lq_batch', 'LQ75',
 '周界 − 兩腰 = 底；再計面積',
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.28.png',
 true),

-- LQ76
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '梯形水池的上底是 7 m，下底是 10 m，高比下底短 4 m。水池的面積是多少 m²？',
 '水池的高是：
10 − 4
= 6（m）
水池的面積是：
(7 + 10) × 6 ÷ 2
= 17 × 6 ÷ 2
= 51（m²）',
 'enhancement', 'p5a_lq_batch', 'LQ76', NULL, NULL, true),

-- LQ77
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '一道梯形牆壁的上底是 12 米，下底是 15 米，高是 2 米。
(a) 牆壁的面積是多少平方米？',
 '牆壁的面積是：
(12 + 15) × 2 ÷ 2
= 27 × 2 ÷ 2
= 27（平方米）',
 'basic', 'p5a_lq_batch', 'LQ77', NULL, NULL, true),

-- LQ78 (image: rhombus 30/24/18)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '右圖是一張菱形卡紙，它的邊長是 30 cm。子君從卡紙沿虛線剪出一個梯形（上底 30 − 18 = 12 cm，下底 30 cm，高 24 cm）。梯形的面積是多少 cm²？',
 '梯形的面積是：
(30 + 30 − 18) × 24 ÷ 2
= 42 × 24 ÷ 2
= 504（cm²）',
 'advanced', 'p5a_lq_batch', 'LQ78',
 '菱形邊長 − 切去段 = 梯形上底',
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.33.png',
 true),

-- LQ79 (image: square 40 cm with A/B/C divisions)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '明心從一張長方形紙剪去一個梯形，她把剩餘的紙分為正方形 A、梯形 B 和正方形 C，其中左方形 A 的周界是 32 cm。
(a) 正方形 A 的邊長是 ___ 厘米。
(b) 梯形 B 的面積是 ___ 平方厘米。
(c) 剩餘的紙的面積是多少平方厘米？（長方形外尺寸 40 cm × 16 cm）',
 '(a) 32 ÷ 4 = 8（厘米）

(b) (8 + 16) × (40 − 8 − 16) ÷ 2 = 192（平方厘米）

(c) 剩餘的紙的面積是：
8 × 8 + 192 + 16 × 16
= 64 + 192 + 256
= 512（平方厘米）',
 'advanced', 'p5a_lq_batch', 'LQ79',
 '三部分組合面積；多部分子題',
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.38.png',
 true),

-- LQ80 (image: parallelogram folded into trapezoid)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '卓文把圖一的平行四邊形紙沿虛線摺起，得出圖二。圖二由兩個平行四邊形重疊而成。圖二的面積是多少 cm²？（圖一：底 12 cm，高 32 cm；圖二重疊三角形底 14 cm）',
 '圖一的面積是：
12 × 32
= 384（cm²）

重疊部分的面積是：
12 × 14 ÷ 2
= 84（cm²）

圖二的面積是：
384 − 84
= 300（cm²）',
 'advanced', 'p5a_lq_batch', 'LQ80',
 '原面積 − 重疊三角形 = 圖二面積',
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.42.png',
 true),

-- ─── 分數乘法 (P5 U3) ──────────────────────────────────────────────────────

-- LQ81 (image: 蘿蔔 $14 / 白菜 $15)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '黃小姐買蘿蔔 1 1/4 公斤，應付多少元？（蘿蔔每公斤 $14）',
 '應付：
14 × 1 1/4
= 14 × 5/4
= 35/2
= 17 1/2（元）',
 'enhancement', 'p5a_lq_batch', 'LQ81', NULL,
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.49.png',
 true),

-- LQ82 (image: ribbon 9/10 m)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '思穎有右面的絲帶（9/10 米），她用了一半的絲帶包禮物，即用了絲帶多少米？',
 '即用了絲帶：
9/10 × 1/2
= 9/20（米）',
 'basic', 'p5a_lq_batch', 'LQ82', NULL,
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.51.png',
 true),

-- LQ83
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '零食店有餅乾 280 包，夾心餅佔全部餅乾的 3/8，其中朱古力夾心餅佔全部夾心餅的 2/7。零食店有朱古力夾心餅多少包？',
 '零食店有朱古力夾心餅：
280 × 3/8 × 2/7
= 30（包）',
 'enhancement', 'p5a_lq_batch', 'LQ83', NULL, NULL, true),

-- LQ84 (image: cat with hint)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '表哥是兼職傳，他每小時的薪金是 50 4/5 元，每天由下午 1 時工作至下午 6 時。上星期表哥工作了 3 天，共得薪金多少元？',
 '上星期表哥工作了 3 天，共得薪金：
50 4/5 × 5 × 3
= 254/5 × 5 × 3
= 762（元）',
 'advanced', 'p5a_lq_batch', 'LQ84',
 '先求每天 5 小時工資再乘日數',
 'local:_lq_input/p5/p5a images/Screenshot 2026-05-24 at 22.19.56.png',
 true),

-- LQ85 (Exam, multi-part)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '演唱會有門票 840 張，貴賓門票佔全部門票的 1/4，特惠門票佔全部門票的 1/3，餘下的是普通門票。
(a) 普通門票佔全部門票的幾分之幾？
(b) 貴賓門票中 4/5 已售出，即售出了貴賓門票多少張？',
 '(a) 1 − 1/4 − 1/3
= 12/12 − 3/12 − 4/12
= 5/12

(b) 即售出了貴賓門票：
840 × 1/4 × 4/5
= 168（張）',
 'enhancement', 'p5a_lq_batch', 'LQ85', NULL, NULL, true),

-- LQ86
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '某巴士路線的車費是 5 3/10 元，陳太太在四月每天乘搭該巴士來回家和街市一次，共需付車費多少元？',
 '共需付車費：
5 3/10 × 2 × 30
= 53/10 × 2 × 30
= 318（元）',
 'enhancement', 'p5a_lq_batch', 'LQ86',
 '四月共 30 天 × 2 程',
 NULL, true),

-- LQ87
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '長跑比賽全程長 24 公里，張先生完成了全程的 5/16，林先生完成了 6 7/10 公里。誰完成的路程較多？為甚麼？',
 '答案：（張先生）
因為張先生完成了：
24 × 5/16 = 7 1/2（公里）
7 1/2 > 6 7/10
所以張先生完成了的路程較多。（或其他合理解釋。）',
 'advanced', 'p5a_lq_batch', 'LQ87',
 '比較分數乘法結果 vs 帶分數',
 NULL, true);

COMMIT;
