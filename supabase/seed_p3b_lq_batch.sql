-- ==========================================================================
-- P3B LQ batch — extraction from _lq_input:/p3/p3b question/ (24 screenshots)
-- + _lq_input:/p3/p3b images/ (15 images, all matched HIGH confidence).
--
-- 24 LQs extracted. 棒形圖/ subfolder skipped per direction.
--
-- Topic mapping (P3 curriculum):
--   P3 U2  加法            2   (LQ139, LQ145)
--   P3 U3  減法            2   (LQ138, LQ141)
--   P3 U4  加減混合計算    6   (LQ140, LQ142, LQ143, LQ146, LQ147, LQ148)
--   P3 U6  乘法（二）      13  (LQ149-LQ161 — mostly 乘加減 mixed)
--   P3 U17 香港的貨幣      1   (LQ144 — 元角加減)
--
-- Apply once. Idempotent via source_paper='p3b_lq_batch'.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p3b_lq_batch';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 加法 (P3 U2) ──────────────────────────────────────────────────────────

-- LQ139
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '義工隊昨天和今天各送出福袋 1037 個，還餘 268 個。義工隊原有福袋多少個？',
 '1037 + 1037 + 268
= 2342
義工隊原有福袋 2342 個。',
 'enhancement', 'p3b_lq_batch', 'LQ139', NULL, NULL, true),

-- LQ145
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=2 ORDER BY t.lesson_number LIMIT 1),
 '農場有雞 3429 隻，比鴨多 917 隻。農場共有雞和鴨多少隻？',
 '3429 + (3429 − 917)
= 3429 + 2512
= 5941
農場共有雞和鴨 5941 隻。',
 'enhancement', 'p3b_lq_batch', 'LQ145', NULL,
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.55.52.png',
 true),

-- ─── 減法 (P3 U3) ──────────────────────────────────────────────────────────

-- LQ138 (image: 東京旅行團 8320 元)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '東京旅行團的團費比台北旅行團的貴 3670 元，台北旅行團的團費是多少元？（東京旅行團 團費 8320 元）',
 '8320 − 3670
= 4650
台北旅行團的團費是 4650 元。',
 'basic', 'p3b_lq_batch', 'LQ138', NULL,
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.55.34.png',
 true),

-- LQ141
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '郊遊徑甲長 4 公里 60 米，比郊遊徑乙（長 / 短）476 米。郊遊徑乙長多少米？',
 '4 公里 60 米 = 4060 米

圈出「短」：
4060 − 476
= 3584
郊遊徑乙長 3584 米。

或圈出「長」：
4060 + 476
= 4536
郊遊徑乙長 4536 米。',
 'enhancement', 'p3b_lq_batch', 'LQ141',
 '長/短 兩個答案皆可',
 NULL, true),

-- ─── 加減混合計算 (P3 U4) ──────────────────────────────────────────────────

-- LQ140
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '家中有紅豆 1996 克和綠豆 1108 克，用去紅豆 574 克後，家中有紅豆和綠豆多少克？',
 '1996 − 574 + 1108
= 1422 + 1108
= 2530
家中有紅豆和綠豆 2530 克。',
 'enhancement', 'p3b_lq_batch', 'LQ140', NULL, NULL, true),

-- LQ142
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '在超級市場，一罐曲奇的原價是 240 元，現減價 12 元。在便利店，一罐曲奇售 259 元。在便利店，曲奇的售價比超級市場的貴多少元？',
 '259 − (240 − 12)
= 259 − 228
= 31
曲奇的售價比超級市場的貴 31 元。',
 'enhancement', 'p3b_lq_batch', 'LQ142', NULL, NULL, true),

-- LQ143
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '工人鋪設一段長 5400 米的道路，上星期和本星期各鋪設了 785 米，還餘多少米未完成？',
 '5400 − (785 + 785)
= 5400 − 1570
= 3830
還餘 3830 米未完成。',
 'enhancement', 'p3b_lq_batch', 'LQ143', NULL, NULL, true),

-- LQ146 (image: 焗爐 998元 會員價)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '陳小姐以會員價購買一個焗爐。她付一張 1000 元紙幣，店員找回 302 元。焗爐便宜了多少元？（焗爐原價：998 元）',
 '998 − (1000 − 302)
= 998 − 698
= 300
焗爐便宜了 300 元。',
 'enhancement', 'p3b_lq_batch', 'LQ146', NULL,
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.55.54.png',
 true),

-- LQ147 (image: 音樂會 ticket table; multi-part a/b)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '右表顯示音樂會的門票銷售情況：星期一 4095 張，星期二 3179 張，星期三 2428 張。
(a) 星期四比星期三多售出門票 56 張，即比星期二少售出門票多少張？
(b) 星期二售出的門票中，194 張是貴賓門票，餘下的是普通門票。星期二售出的貴賓和普通門票相差多少張？',
 '(a) 3179 − (2428 + 56)
= 3179 − 2484
= 695
即比星期二少售出門票 695 張。

(b) (3179 − 194) − 194
= 2985 − 194
= 2791
星期二售出的貴賓和普通門票相差 2791 張。',
 'advanced', 'p3b_lq_batch', 'LQ147',
 '兩部分；都是加減混合',
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.55.56.png',
 true),

-- LQ148
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '花店有百合花 394 枝和玫瑰 1075 枝，其中紅玫瑰有 812 枝，其餘的玫瑰是黃玫瑰。百合花比黃玫瑰多幾枝？',
 '394 − (1075 − 812)
= 394 − 263
= 131
百合花比黃玫瑰多 131 枝。',
 'enhancement', 'p3b_lq_batch', 'LQ148', NULL, NULL, true),

-- ─── 香港的貨幣 (P3 U17) ───────────────────────────────────────────────────

-- LQ144 (image: brother/sister speech bubbles)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=17 ORDER BY t.lesson_number LIMIT 1),
 '哥哥：「我用了 55 元 7 角後，還餘 12 元 2 角。」 妹妹：「我原有 78 元，用了 43 元 8 角。」 兩兄妹共餘下幾元幾角？',
 '12 元 2 角 + (78 元 − 43 元 8 角)
= 12 元 2 角 + 34 元 2 角
= 46 元 4 角
兩兄妹共餘下 46 元 4 角。',
 'advanced', 'p3b_lq_batch', 'LQ144',
 '元角分計算',
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.55.47.png',
 true),

-- ─── 乘法（二） (P3 U6, mostly 乘加減 mixed) ───────────────────────────────

-- LQ149 (image: 子浩 9封 20元利是)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '表姊收到的利是錢比子浩收到的多 250 元，表姊收到利是錢多少元？（子浩收到 9 封各有 20 元的利是。）',
 '20 × 9 + 250
= 180 + 250
= 430
表姊收到利是錢 430 元。',
 'enhancement', 'p3b_lq_batch', 'LQ149', NULL,
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.04.png',
 true),

-- LQ150
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '每箱熊布偶有 27 個，每箱狗布偶有 13 個。玩具店有 2 箱熊布偶和 7 箱狗布偶，即共有布偶多少個？',
 '27 × 2 + 13 × 7
= 54 + 91
= 145
即共有布偶 145 個。',
 'enhancement', 'p3b_lq_batch', 'LQ150', NULL, NULL, true),

-- LQ151 (image: 籃球 $146 買5送1 + 足球 $139)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '林老師買了籃球 6 個和足球 1 個，共需付多少元？（籃球 $146 買五送一，足球 $139）',
 '146 × 5 + 139
= 730 + 139
= 869
共需付 869 元。',
 'enhancement', 'p3b_lq_batch', 'LQ151',
 '買五送一：6 個只付 5 個錢',
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.07.png',
 true),

-- LQ152 (image: 泳池每天開放時間)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '泳池在六月共開放多少小時？（泳池每天開放時間：上午 7:00-11:00，下午 3:00-5:00，晚上 7:00-10:00）',
 '上午 4 小時 + 下午 2 小時 + 晚上 3 小時 = 9 小時／天
(4 + 2 + 3) × 30
= 9 × 30
= 270
泳池在六月共開放 270 小時。',
 'enhancement', 'p3b_lq_batch', 'LQ152',
 '時段時數 + 六月共 30 天',
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.08.png',
 true),

-- LQ153 (image: 星星玩具店 陀螺 216/189)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '俊希買了陀螺 6 盒，共便宜了多少元？（陀螺原價 216 元，特價 189 元）',
 '(216 − 189) × 6
= 27 × 6
= 162
共便宜了 162 元。',
 'enhancement', 'p3b_lq_batch', 'LQ153', NULL,
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.12.png',
 true),

-- LQ154 (image: 鉛筆 每枝 $3)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '妹妹有 50 元，她想買鉛筆兩打，尚欠多少元？（鉛筆每枝 $3）',
 '3 × 12 × 2 − 50
= 72 − 50
= 22
尚欠 22 元。',
 'enhancement', 'p3b_lq_batch', 'LQ154',
 '一打 = 12 枝',
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.13.png',
 true),

-- LQ155
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '做每朵絲帶花需用絲帶 55 厘米。嘉霖原有絲帶 5 米，做了絲帶花 8 朵後，還餘絲帶多少厘米？',
 '5 米 = 500 厘米
500 − 55 × 8
= 500 − 440
= 60
還餘絲帶 60 厘米。',
 'enhancement', 'p3b_lq_batch', 'LQ155',
 '米→厘米換算',
 NULL, true),

-- LQ156 (image: 速遞收費表; Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '陳小姐速遞一個重 6 kg 200 g 的包裹，她使用一張 20 元現金券後，還需付現金多少元？（速遞收費：5 kg 以下每 kg 14 元，5 kg 或以上每 kg 12 元，不足 1 kg 亦以 1 kg 計算。）',
 '6 kg 200 g 以 7 kg 計算（不足 1 kg 進位），≥5 kg 按每 kg 12 元收費。
12 × 7 − 20
= 84 − 20
= 64
還需付現金 64 元。',
 'advanced', 'p3b_lq_batch', 'LQ156',
 '兩檔收費表 + 進位',
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.16.png',
 true),

-- LQ157 (image: 外婆 我比外公小4歲)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '紫琪今年 9 歲，外公的歲數是她的 8 倍。外婆今年多少歲？（外婆：我比外公小 4 歲。）',
 '9 × 8 − 4
= 72 − 4
= 68
外婆今年 68 歲。',
 'enhancement', 'p3b_lq_batch', 'LQ157', NULL,
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.22.png',
 true),

-- LQ158 (image: 校長 本校 680 學生)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '每個學生需用格子簿 6 本。學校現有格子簿 9 打，最少要為學生多購買格子簿多少本？（本校有學生 680 個。）',
 '6 × 680 − 12 × 9
= 4080 − 108
= 3972
最少要為學生多購買格子簿 3972 本。',
 'advanced', 'p3b_lq_batch', 'LQ158',
 '一打 = 12 本',
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.24.png',
 true),

-- LQ159 (image: 健康壽司店 menu)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '媽媽和文軒吃了三文魚壽司 7 碟和蝦壽司 4 碟，共需付多少元？（三文魚壽司每碟 24 元，蝦壽司每碟 18 元）',
 '24 × 7 + 18 × 4
= 168 + 72
= 240
共需付 240 元。',
 'enhancement', 'p3b_lq_batch', 'LQ159', NULL,
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.26.png',
 true),

-- LQ160 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '侍應每小時的薪金是 64 元。廚師每小時的薪金比侍應兩小時的薪金少 50 元。廚師從下午 2 時工作至下午 7 時，共得薪金多少元？',
 '(64 × 2 − 50) × 5
= (128 − 50) × 5
= 78 × 5
= 390
共得薪金 390 元。',
 'advanced', 'p3b_lq_batch', 'LQ160',
 '三步：先求廚師時薪，再乘 5 小時',
 NULL, true),

-- LQ161 (image: 羽毛球拍 原價 $149; Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=3 AND u.unit_number=6 ORDER BY t.lesson_number LIMIT 1),
 '希彤買羽毛球拍 3 塊，獲優惠後只需付 400 元，她節省了多少元？（原價 $149）',
 '149 × 3 − 400
= 447 − 400
= 47
她節省了 47 元。',
 'enhancement', 'p3b_lq_batch', 'LQ161', NULL,
 'local:_lq_input/p3/p3b images/Screenshot 2026-05-24 at 22.56.31.png',
 true);

COMMIT;
