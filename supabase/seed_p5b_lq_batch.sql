-- ==========================================================================
-- P5B LQ batch — extraction from _lq_input:/p5/p5b question/ (31 screenshots)
-- + _lq_input:/p5/p5b images/ (15 images, all matched).
--
-- 33 LQs extracted (a few screenshots packed 2 LQs each).
--
-- Topic mapping (P5 5B + cross-grade to 5A):
--   P5 U16 圓的初步認識      3   (LQ88-LQ90)
--   P5 U14 分數除法           6   (LQ91-LQ96)
--   P5 U3 分數乘法 (5A)       2   (LQ97-LQ98, cross-grade)
--   P5 U11 小數乘法           5   (LQ99-LQ103)
--   P5 U17 長方體和正方體     8   (LQ104-LQ111)
--   P5 U5 簡易方程一 (5A)     8   (LQ112-LQ119, cross-grade)
--   P5 U13 小數和分數的互化   1   (LQ120)
--
-- Apply once. Idempotent via source_paper='p5b_lq_batch'.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p5b_lq_batch';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 圓的初步認識 (P5 U16) ─────────────────────────────────────────────────

-- LQ88 (image: 3 overlapping circles)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '右圖中，M 點、N 點和 O 點分別是三個大小相同的圓的圓心，每個圓的直徑都是 12 cm，陰影部分的周界是多少 cm？',
 '陰影部分的周界是：
12 ÷ 2 × 5
= 6 × 5
= 30（cm）',
 'advanced', 'p5b_lq_batch', 'LQ88',
 '5 段半徑（每個圓貢獻部分）',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.24.25.png',
 true),

-- LQ89 (image: triangle inscribed in square with circle, Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '右圖由一個三角形和一個圓組成，圓的半徑是 8 cm。三角形的面積是多少 cm²？',
 '三角形的面積是：
(8 × 2) × (8 × 2) ÷ 2
= 16 × 16 ÷ 2
= 256 ÷ 2
= 128（cm²）',
 'advanced', 'p5b_lq_batch', 'LQ89',
 '正方形邊長 = 圓直徑 = 三角形底 + 高',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.24.27.png',
 true),

-- LQ90 (image: 2 overlapping circles PV, Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=16 ORDER BY t.lesson_number LIMIT 1),
 '右圖由兩個大小相同的圓組成。Q 點和 S 點分別是兩個圓的圓心，Q、R 和 S 三點都在線段 PV 上，RS 的長度是 2 cm。如果每個圓的直徑是 8 cm，PV 的長度是多少 cm？',
 'PV 的長度是：
8 + 2 + 8 ÷ 2
= 8 + 2 + 4
= 14（cm）',
 'enhancement', 'p5b_lq_batch', 'LQ90', NULL,
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.24.38.png',
 true),

-- ─── 分數除法 (P5 U14) ─────────────────────────────────────────────────────

-- LQ91
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=14 ORDER BY t.lesson_number LIMIT 1),
 '李太太用 180 元購買開心果 1 1/8 公斤，每公斤開心果售多少元？',
 '每公斤開心果售：
180 ÷ 1 1/8
= 180 ÷ 9/8
= 180 × 8/9
= 160（元）',
 'enhancement', 'p5b_lq_batch', 'LQ91', NULL, NULL, true),

-- LQ92
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=14 ORDER BY t.lesson_number LIMIT 1),
 '學軒和紫盈沿着運動場各跑了 2 圈。學軒用了 4 2/3 分鐘，紫盈用了 3 1/2 分鐘。學軒所用的時間是紫盈的多少倍？',
 '學軒所用的時間是紫盈的：
4 2/3 ÷ 3 1/2
= 14/3 ÷ 7/2
= 14/3 × 2/7
= 4/3
= 1 1/3（倍）',
 'enhancement', 'p5b_lq_batch', 'LQ92', NULL, NULL, true),

-- LQ93 (multi-part a/b)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=14 ORDER BY t.lesson_number LIMIT 1),
 '店員把 5 3/5 升果汁倒進 7 個瓶子，每瓶子內果汁的份量相同。
(a) 店員把其中一瓶果汁，要盛載這瓶果汁，要用容量是 3/20 升的杯子，最少要用杯子多少個？
(b) 店員最少要多加果汁多少升，才可使 (a) 部所用的杯子都盛滿果汁 3/20 升。',
 '(a) 一瓶果汁有：5 3/5 ÷ 7 = 28/5 × 1/7 = 4/5（升）
要用杯子：4/5 ÷ 3/20 = 4/5 × 20/3 = 16/3 = 5 1/3（個）
最少要用杯子 6 個。

(b) 要多加：
6 × 3/20 − 4/5
= 9/10 − 8/10
= 1/10（升）',
 'advanced', 'p5b_lq_batch', 'LQ93',
 '兩部分；(b) 需先確定 (a) 杯子數量',
 NULL, true),

-- LQ94
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=14 ORDER BY t.lesson_number LIMIT 1),
 '每盒餅乾售 8 1/2 元。妹妹有 30 元，比哥哥少 1/2 元。哥哥最多可購買餅乾多少盒？還餘多少元？',
 '哥哥可購買餅乾：
(30 + 1/2) ÷ 8 1/2
= 30 1/2 ÷ 17/2
= 61/2 × 2/17
= 61/17
= 3 10/17（盒）
哥哥最多可購買餅乾 3 盒。

還餘：
30 1/2 − 8 1/2 × 3
= 61/2 − 51/2
= 5（元）',
 'advanced', 'p5b_lq_batch', 'LQ94',
 '反向求餘 = 總額 − 整盒花費',
 NULL, true),

-- LQ95 (image: cat hint)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=14 ORDER BY t.lesson_number LIMIT 1),
 '浩賢和思晴在同一條緩跑徑跑步。浩賢跑了 4 圈，他共跑了 1 3/5 公里。思晴跑了 2 圈，她共跑了多少公里？',
 '她共跑了：
1 3/5 ÷ 4 × 2
= 8/5 ÷ 4 × 2
= 8/5 × 1/4 × 2
= 4/5（公里）（或其他合理答案。）',
 'enhancement', 'p5b_lq_batch', 'LQ95', NULL,
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.24.51.png',
 true),

-- LQ96
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=14 ORDER BY t.lesson_number LIMIT 1),
 '三兄妹想合資購買右面的餅乾（原價 72 3/5 元，半價），每人所付的款項相同。妹妹有 12 元，她有的款項足夠嗎？為甚麼？',
 '答案：（不足夠）
因為每人需付：
72 3/5 ÷ 2 ÷ 3
= 363/5 ÷ 2 ÷ 3
= 363/30
= 12 1/10（元）
12 < 12 1/10
所以她有的款項不足夠。',
 'advanced', 'p5b_lq_batch', 'LQ96',
 '比較判斷題',
 NULL, true),

-- ─── 分數乘法 (P5 U3 cross-grade to 5A) ───────────────────────────────────

-- LQ97
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '餐廳上月用去飲管 117 包。實施環保政策後，本月用去的飲管比上月少 2/9。餐廳本月用去飲管多少包？',
 '餐廳本月用去飲管：
117 × (1 − 2/9)
= 117 × 7/9
= 91（包）',
 'enhancement', 'p5b_lq_batch', 'LQ97', NULL, NULL, true),

-- LQ98 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '一瓶礦泉水原有 1 1/2 升，樂怡先喝去 1/8 升，她再喝去一些後，便餘下三分之二瓶礦泉水。樂怡共喝去礦泉水多少升？',
 '樂怡共喝去礦泉水：
1 1/2 × (1 − 2/3)
= 3/2 × 1/3
= 1/2（升）',
 'advanced', 'p5b_lq_batch', 'LQ98',
 '注意：1/8 部分為 distractor，題目實際要求餘下 2/3 瓶後的差額',
 NULL, true),

-- ─── 小數乘法 (P5 U11) ─────────────────────────────────────────────────────

-- LQ99 (paired LQ on screenshot 22.25.30 part 1)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=11 ORDER BY t.lesson_number LIMIT 1),
 '一盒牛奶有 0.25 升，潔兒做蛋糕用去牛奶 2.5 盒，即共用去牛奶多少升？',
 '即共用去牛奶：
0.25 × 2.5
= 0.625
即共用去牛奶 0.625 升。',
 'basic', 'p5b_lq_batch', 'LQ99', NULL, NULL, true),

-- LQ100 (paired LQ part 2)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=11 ORDER BY t.lesson_number LIMIT 1),
 '一塊大地磚的面積是 1.44 平方米，一塊小地磚的面積是 0.81 平方米。8 塊大地磚剛好可鋪滿廚房的地板。廚房的地板的面積是多少平方米？',
 '廚房的地板的面積是：
1.44 × 8
= 11.52
廚房的地板的面積是 11.52 平方米。',
 'enhancement', 'p5b_lq_batch', 'LQ100', NULL, NULL, true),

-- LQ101 (paired 22.25.34 part 1, image: 菠蘿包 $4.80)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=11 ORDER BY t.lesson_number LIMIT 1),
 '哥哥買到 6 個菠蘿包，他共需付多少元？（每個 $4.80，買 5 個額外多送 1 個）',
 '4.8 × 5
= 24
他共需付 24 元。',
 'enhancement', 'p5b_lq_batch', 'LQ101',
 '注意買 5 送 1 優惠 — 只需付 5 個的錢',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.27.17.png',
 true),

-- LQ102 (paired 22.25.34 part 2)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=11 ORDER BY t.lesson_number LIMIT 1),
 '製作每升熱情果用熱情果 1.42 公斤。麥太太製作了特飲 2300 毫升，共用去熱情果多少公斤？（答案取至十分位）',
 '2300 毫升 = 2.3 升
1.42 × 2.3
= 3.266
≈ 3.3（公斤）
共用去熱情果 3.3 公斤。',
 'enhancement', 'p5b_lq_batch', 'LQ102',
 '需單位換算 mL→L + 四捨五入',
 NULL, true),

-- LQ103 (Exam, image: 西瓜 4kg scale)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=11 ORDER BY t.lesson_number LIMIT 1),
 '每公斤西瓜售 15 元 6 角。右圖的西瓜（3 公斤）售多少元？',
 '15.6 × 3
= 46.8
右圖的西瓜售 46.8 元。',
 'basic', 'p5b_lq_batch', 'LQ103',
 '元角換算：15 元 6 角 = 15.6 元',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.27.24.png',
 true),

-- ─── 長方體和正方體 (P5 U17) ──────────────────────────────────────────────

-- LQ104
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '小正方體積木的邊長是 8 厘米，比大正方體積木的邊長短 3 厘米。大正方體積木的體積是多少立方厘米？',
 '8 + 3
= 11
大正方體積木的邊長是 11 厘米。

11 × 11 × 11
= 1331
大正方體積木的體積是 1331 立方厘米。',
 'enhancement', 'p5b_lq_batch', 'LQ104', NULL, NULL, true),

-- LQ105 (image: 17×9×9 box, Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '從右圖的長方體木塊切去一個最大的正方體後，餘下部分的體積是多少 cm³？（長方體 17 × 9 × 9 cm）',
 '17 × 9 × 9
= 1377
長方體木塊原來的體積是 1377 cm³。

9 × 9 × 9
= 729
最大的正方體的體積是 729 cm³。

1377 − 729
= 648
餘下部分的體積是 648 cm³。',
 'enhancement', 'p5b_lq_batch', 'LQ105', NULL,
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.28.07.png',
 true),

-- LQ106 (image: 7cm cube assembly, Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '右圖由一個正方體和一個長方體拼砌而成，正方體所有棱的總長度是 60 cm。右圖的體積是多少 cm³？（長方體高 7 cm）',
 '60 ÷ 12
= 5
正方體的邊長是 5 cm。

5 × 5 × 7
= 175
右圖的體積是 175 cm³。',
 'enhancement', 'p5b_lq_batch', 'LQ106',
 '正方體 12 棱',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.28.09.png',
 true),

-- LQ107 (image: 10×10×6 stepped block)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '媽媽把一塊正方體豆腐切去一個長方體後，餘下部分如右圖所示。餘下部分的體積是多少 cm³？（正方體邊長 10 cm，切去長方體 5 × 10 × 6 cm）',
 '長方體 M 的體積：
5 × 10 × 10 = 500（cm³）

長方體 N 的體積：
(10 − 5) × 10 × 6 = 5 × 10 × 6 = 300（cm³）

餘下部分的體積是：
500 + 300
= 800（cm³）',
 'advanced', 'p5b_lq_batch', 'LQ107',
 '分割成兩個長方體相加',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.28.14.png',
 true),

-- LQ108 (image: cube net, Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '右圖摺紙圖樣的周界是 98 cm，它可摺出一個正方體，正方體的體積是多少 cm³？',
 '98 ÷ 14
= 7
正方體的邊長是 7 cm。

7 × 7 × 7
= 343
正方體的體積是 343 cm³。',
 'enhancement', 'p5b_lq_batch', 'LQ108',
 '展開圖周界 ÷ 14 = 邊長',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.28.16.png',
 true),

-- LQ109 (image: 24×20 box with cut corners, Exam — circle answer)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '從右圖的長方形卡紙剪去四個邊長 4 厘米的正方形，然後沿虛線摺起，製成一個無蓋的長方體盒子。這個盒子最多可放多少塊邊長是（2 厘米／4 厘米）的正方體積木？（長方形 24 × 20 厘米，圈出「2 厘米」或「4 厘米」）',
 '長方體盒：長 24 − 4 × 2 = 16，闊 20 − 4 × 2 = 12，高 4 厘米

圈出「4 厘米」：
(16 ÷ 4) × (12 ÷ 4) × (4 ÷ 4)
= 4 × 3 × 1
= 12（塊）
這盒子最多可放 12 塊。

或圈出「2 厘米」：
(16 ÷ 2) × (12 ÷ 2) × (4 ÷ 2)
= 8 × 6 × 2
= 96（塊）',
 'advanced', 'p5b_lq_batch', 'LQ109',
 '圈出 2/4 厘米兩個答案皆可',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.28.21.png',
 true),

-- LQ110 (multi-part a/b)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '一個長方體長 16 cm，闊 6 cm，高是長的 2 倍。
(a) 長方體的體積是多少 cm³？
(b) 從 (a) 部的長方體切去一個最大的正方體後，餘下部分的體積是 ___ cm³。',
 '(a) 長方體的高 = 16 × 2 = 32（cm）
長方體的體積是：
16 × 6 × 32
= 3072（cm³）

(b) 最大的正方體的邊長 = 6 cm
3072 − 6 × 6 × 6 = 2856（cm³）',
 'enhancement', 'p5b_lq_batch', 'LQ110', NULL, NULL, true),

-- LQ111 (Exam, 不可以 explanation)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '宇軒有一個長 24 cm，闊 18 cm，高 12 cm 的長方體儲物盒和 25 塊邊長是 6 cm 的正方體積木。這些積木可以全部放進長方體儲物盒內嗎？為甚麼？',
 '答案：（不可以）
因為長方體儲物盒最多可放積木：
(24 ÷ 6) × (18 ÷ 6) × (12 ÷ 6)
= 4 × 3 × 2
= 24（塊）
25 > 24
所以這些積木不可以全部放進長方體儲物盒內。',
 'enhancement', 'p5b_lq_batch', 'LQ111',
 '比較判斷題',
 NULL, true),

-- ─── 簡易方程一 (P5 U5 cross-grade to 5A) ─────────────────────────────────

-- LQ112 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '一盒模型售若干元，李先生買了模型 6 盒，共付了 480 元。一盒模型售多少元？',
 '設一盒模型售 y 元。
6y = 480
6y ÷ 6 = 480 ÷ 6
y = 80
一盒模型售 80 元。',
 'basic', 'p5b_lq_batch', 'LQ112', NULL, NULL, true),

-- LQ113
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '家中有麵粉若干克，媽媽把全部麵粉平均分成 5 包，每包有 42 克。家中有麵粉多少克？',
 '設家中有麵粉 y 克。
y/5 = 42
y/5 × 5 = 42 × 5
y = 210
家中有麵粉 210 克。',
 'basic', 'p5b_lq_batch', 'LQ113', NULL, NULL, true),

-- LQ114 (image: egg tart $4.00)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '俊天付若干元買蛋撻半打（每個 $4.00），找回 26 元。俊天付了多少元？',
 '設俊天付了 y 元。
y − 4 × 6 = 26
y − 24 = 26
y − 24 + 24 = 26 + 24
y = 50
俊天付了 50 元。',
 'enhancement', 'p5b_lq_batch', 'LQ114',
 '半打 = 6 個',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.28.36.png',
 true),

-- LQ115 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '一卷絲帶長若干厘米，姊姊把這卷絲帶平均分成 4 段，並把其中一段送給妹妹。妹妹用去 45 厘米絲帶後，還餘 18 厘米。一卷絲帶長多少厘米？',
 '設一卷絲帶長 y 厘米。
y/4 − 45 = 18
y/4 − 45 + 45 = 18 + 45
y/4 = 63
y/4 × 4 = 63 × 4
y = 252
一卷絲帶長 252 厘米。',
 'enhancement', 'p5b_lq_batch', 'LQ115', NULL, NULL, true),

-- LQ116 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '家中有一包手工紙，哥哥用去三分之一包，弟弟用去 10 張，二人共用去手工紙 32 張。這包手工紙原有多少張？',
 '設這包手工紙原有 y 張。
y/3 + 10 = 32
y/3 + 10 − 10 = 32 − 10
y/3 = 22
y/3 × 3 = 22 × 3
y = 66
這包手工紙原有 66 張。',
 'enhancement', 'p5b_lq_batch', 'LQ116', NULL, NULL, true),

-- LQ117 (Exam, image: 盈記士多 汽水 + 橙汁 $12)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '媽媽在盈記士多買到 3 瓶汽水和 1 瓶橙汁，共付了 48 元。每瓶汽水原來售多少元？（橙汁每瓶 $12.00；汽水買 2 瓶多送 1 瓶）',
 '設每瓶汽水原來售 y 元。
2y + 12 = 48
2y + 12 − 12 = 48 − 12
2y = 36
2y ÷ 2 = 36 ÷ 2
y = 18
每瓶汽水原來售 18 元。',
 'advanced', 'p5b_lq_batch', 'LQ117',
 '買 2 送 1：3 瓶汽水只付 2 瓶錢',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.28.42.png',
 true),

-- LQ118
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '下表顯示某速運公司的運費。陳小姐運送一件重 1.8 kg 的貨品，需付運費 54 元。用解方程的方法，求續重之後每 1 公斤的收費是多少元？（重量：首 1 公斤 30 元；續重：之後每 1 公斤 ?；不足 1 公斤，亦作 1 公斤計算。）',
 '設續重之後每 1 公斤的運費是 y 元。
30 + y = 54
30 + y − 30 = 54 − 30
y = 24
續重之後每 1 公斤的運費是 24 元。',
 'enhancement', 'p5b_lq_batch', 'LQ118',
 '不足 1 公斤亦作 1 公斤 → 1.8 kg 算 2 公斤',
 NULL, true),

-- LQ119 (Exam, image: cube with cut-out 27cm³)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '何先生從一塊長方體木塊中切去一個體積是 27 cm³ 的正方體，如下圖所示，餘下部分的體積是 773 cm³。用解方程的方法，求長方體木塊的高是多少 cm。（底面 10 × 10 cm）',
 '設長方體木塊的高是 y cm。
10 × 10 × y − 27 = 773
100y − 27 = 773
100y − 27 + 27 = 773 + 27
100y = 800
100y ÷ 100 = 800 ÷ 100
y = 8
長方體木塊的高是 8 cm。',
 'advanced', 'p5b_lq_batch', 'LQ119',
 '體積方程',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.28.46.png',
 true),

-- ─── 小數和分數的互化 (P5 U13) ─────────────────────────────────────────────

-- LQ120 (image: 夢幻快車 ride sign)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=5 AND u.unit_number=13 ORDER BY t.lesson_number LIMIT 1),
 '弟弟身高 98 厘米，哥哥的身高是弟弟的 1.3 倍。弟弟說他和哥哥都不可以玩「夢幻快車」（身高限制：1.2 米或以上）。你同意弟弟的說法嗎？為甚麼？',
 '答案：（不同意）
因為弟弟身高 98 厘米 = 98/100 = 0.98 米，不足 1.2 米；
0.98 × 1.3 = 1.274 米，哥哥的身高是 1.274 米，比 1.2 米高，
所以只有弟弟不可以玩「夢幻快車」。（或其他合理解釋。）',
 'advanced', 'p5b_lq_batch', 'LQ120',
 '厘米→米換算 + 比較',
 'local:_lq_input/p5/p5b images/Screenshot 2026-05-24 at 22.27.30.png',
 true);

COMMIT;
