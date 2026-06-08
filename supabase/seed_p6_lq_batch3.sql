-- ==========================================================================
-- P6 LQ batch 3 — extraction from _lq_input:/p6/p6b/ (18 screenshots).
-- 27 LQs extracted; 3 行程圖 chart-essential LQs skipped (LQ54/55/57).
--
-- Topic mapping (P6 6A + 6B):
--   P6 U9  百分數應用      — LQ28-36 (9)
--   P6 U7  圓周的計算      — LQ37-46 (10)
--   P6 U12 速率與行程圖    — LQ47-53, LQ56 (8)
--
-- Apply once in Supabase SQL Editor. Idempotent via source_paper='p6_lq_batch3'.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p6_lq_batch3';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 百分數應用 (P6 U9) ─────────────────────────────────────────────────────

-- LQ28
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '合唱團有男生 15 個和女生 12 個。女生人數是男生人數的百分之幾？',
 '12/15 × 100%
= 80%
女生人數是男生人數的 80%。',
 'basic', 'p6_lq_batch3', 'LQ28', NULL, NULL, true),

-- LQ29
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '媽媽調製了一杯奶茶，其中牛奶佔 24%，茶佔 72%，餘下的是糖漿。糖漿佔全杯奶茶的百分之幾？',
 '100% − 24% − 72%
= 4%
糖漿佔全杯奶茶的 4%。',
 'basic', 'p6_lq_batch3', 'LQ29', NULL, NULL, true),

-- LQ30
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '酒樓上午售出叉燒包 120 個，比下午多售出 45 個。上午叉燒包的銷量是下午的百分之幾？',
 '120 ÷ (120 − 45) × 100%
= 120/75 × 100%
= 160%
上午叉燒包的銷量是下午的 160%。',
 'enhancement', 'p6_lq_batch3', 'LQ30', NULL, NULL, true),

-- LQ31
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '工廠上月生產了皮鞋 2500 雙。本月的生產量比上月減少了 21%。工廠本月生產了皮鞋多少雙？',
 '2500 × (100% − 21%)
= 2500 × 79%
= 2500 × 79/100
= 1975
工廠本月生產了皮鞋 1975 雙。',
 'enhancement', 'p6_lq_batch3', 'LQ31', NULL, NULL, true),

-- LQ32
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '餐廳上午售出叉飯 80 份，其中點柳餐和通心粉餐各佔 37.5%。餐廳共售出點柳餐和通心粉餐多少份？',
 '80 × (37.5% + 37.5%)
= 80 × 75%
= 80 × 75/100
= 60
餐廳共售出點柳餐和通心粉餐 60 份。',
 'enhancement', 'p6_lq_batch3', 'LQ32', NULL, NULL, true),

-- LQ33 (with image: 芒果 每個 9 元)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '超級市場原有芒果 500 個，其中有 0.6% 變壞。超級市場售出全部沒有變壞的芒果後，共收得多少元？（每個 9 元）',
 '9 × 500 × (100% − 0.6%)
= 9 × 500 × 99.4%
= 9 × 500 × 99.4/100
= 9 × 500 × 994/1000
= 4473
共收得 4473 元。',
 'enhancement', 'p6_lq_batch3', 'LQ33', NULL,
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.17.53.png',
 true),

-- LQ34 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '6A 班有學生 30 個，女生佔 40%。在男生中，步行上學的佔 50%。6A 班步行上學的男生有多少個？',
 '30 × (100% − 40%) × 50%
= 30 × 60% × 50%
= 30 × 60/100 × 50/100
= 9
6A 班步行上學的男生有 9 個。',
 'enhancement', 'p6_lq_batch3', 'LQ34', '兩重百分數連乘', NULL, true),

-- LQ35 (with image: 訂閱報紙月費計劃 原價 $65 優惠價 $52)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '訂閱報紙的優惠價是原價的百分之幾？（訂閱報紙月費計劃：原價 $65，優惠價 $52）',
 '52/65 × 100%
= 80%
訂閱報紙的優惠價是原價的 80%。',
 'basic', 'p6_lq_batch3', 'LQ35', NULL, NULL, true),

-- LQ36
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '40 個學生參加繪畫比賽，其中 35% 是四年級學生，30% 是五年級學生，餘下的是六年級學生。參加繪畫比賽的六年級學生有多少個？',
 '40 × (100% − 35% − 30%)
= 40 × 35%
= 40 × 35/100
= 14
參加繪畫比賽的六年級學生有 14 個。',
 'enhancement', 'p6_lq_batch3', 'LQ36', NULL, NULL, true),

-- ─── 圓周的計算 (P6 U7) ────────────────────────────────────────────────────

-- LQ37
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '哥哥把一條長 110 cm 的繩條圍成一個圓，圓的半徑是多少 cm？（取 π = 22/7）',
 '110 ÷ 22/7 ÷ 2
= 110 × 7/22 ÷ 2
= 17 1/2 或 17.5
圓的半徑是 17 1/2 cm。',
 'enhancement', 'p6_lq_batch3', 'LQ37', NULL, NULL, true),

-- LQ38 (with image: 梯形 18cm 上 / 20cm 下 / 12cm 高)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '從右面的梯形紙剪出一個最大的圓周。這個圓的圓周是多少 cm？（梯形上底 18 cm，下底 20 cm，高 12 cm，取 π = 3.14）',
 '12 × 3.14
= 37.68
這個圓的圓周是 37.68 cm。',
 'enhancement', 'p6_lq_batch3', 'LQ38',
 '最大圓的直徑 = 梯形高',
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.18.12.png',
 true),

-- LQ39
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '單輪車車輪向前滾動 5 圈，單輪車便前進了 785 厘米。單輪車車輪的直徑是多少厘米？（取 π = 3.14）',
 '785 ÷ 5 ÷ 3.14
= 157 ÷ 3.14
= 50
單輪車車輪的直徑是 50 厘米。',
 'enhancement', 'p6_lq_batch3', 'LQ39', NULL, NULL, true),

-- LQ40 (with image: circle inscribed in square) — Exam
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '希桐把一張圓形紙放在一張正方形紙上，如右圖所示（圓內切於正方形）。如果正方形紙的周界是 0.84 m，圓形紙的圓周是多少 cm？（取 π = 22/7）',
 '0.84 m = 84 cm
84 ÷ 4 × 22/7
= 84 × 1/4 × 22/7
= 66
圓形紙的圓周是 66 cm。',
 'enhancement', 'p6_lq_batch3', 'LQ40',
 '單位換算 m→cm；正方形邊長 = 圓直徑',
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.18.16.png',
 true),

-- LQ41
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '單車車輪的半徑是 30 厘米。它向前轉動 10 周，單車共前進了多少厘米？（取 π = 3.14）',
 '30 × 2 × 3.14 × 10
= 1884
單車共前進了 1884 厘米。',
 'enhancement', 'p6_lq_batch3', 'LQ41', NULL, NULL, true),

-- LQ42 (with image: half circle with surrounding 圍欄 6 米 + 1 米)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '半圓形花圃的半徑是 6 米。花圃外有一道圍欄，花圃的曲線部分與圍欄的曲線部分相距 1 米。如右圖所示，圍欄長多少米？（黑點是圓心，取 π = 22/7）',
 '(6 + 1) × 2 × 22/7 × 1/2 + (6 + 1) × 2
= 22 + 14
= 36
圍欄長 36 米。',
 'advanced', 'p6_lq_batch3', 'LQ42',
 '半圓周 + 直徑（兩條直邊）',
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.18.23.png',
 true),

-- LQ43 (with image: cylinder 8cm diameter, 10cm height, 2 ribbons)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '右圖是一個圓柱盒子。盒子高 10 cm，圓形底部的直徑是 8 cm。妙妙在盒子側面貼上兩圈絲帶來裝飾盒子，如右圖所示。她最少共用了絲帶多少 cm？（取 π = 3.14）',
 '8 × 3.14 × 2
= 50.24
她最少共用了絲帶 50.24 cm。',
 'enhancement', 'p6_lq_batch3', 'LQ43',
 '兩圈絲帶 = 2 個底部圓周',
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.18.26.png',
 true),

-- LQ44 (with image: dog with decoration string — illustrative)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '每米繩售價 30 元。毛先生想用繩做出 5 個圓來佈置家居。如果每個圓的半徑是 1 米，毛先生最少需付多少元？（取 π = 3.14，答案取至小數點後一個位）',
 '30 × (1 × 2 × 3.14 × 5)
= 30 × 31.4
= 942
毛先生最少需付 942 元。',
 'enhancement', 'p6_lq_batch3', 'LQ44', NULL,
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.18.31.png',
 true),

-- LQ45 (with image: circle rolling on line)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '半徑是 3 cm 的圓形紙盤向前滾動了 132 cm，它向前滾動了多少周？（取 π = 22/7）',
 '132 ÷ (3 × 2 × 22/7)
= 132 × 7/132
= 7
它向前滾動了 7 周。',
 'enhancement', 'p6_lq_batch3', 'LQ45', NULL,
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.18.35.png',
 true),

-- LQ46 (with image: analog clock)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=7 ORDER BY t.lesson_number LIMIT 1),
 '右面鐘面的分針的針尖每小時走 62.8 cm。求分針的長度。（取 π = 3.14）',
 '62.8 ÷ 3.14 ÷ 2
= 10
分針的長度是 10 cm。',
 'enhancement', 'p6_lq_batch3', 'LQ46',
 '分針一小時走一周 = 圓周',
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.18.38.png',
 true),

-- ─── 速率與行程圖 (P6 U12) ──────────────────────────────────────────────────

-- LQ47
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '泳池長 50 米。爸爸用 80 秒從池一端游回去（即游了一個來回），他游泳的平均速率是多少米每秒？',
 '(50 × 2) ÷ 80
= 100 ÷ 80
= 1.25
他游泳的平均速率是 1.25 米每秒。',
 'enhancement', 'p6_lq_batch3', 'LQ47', NULL, NULL, true),

-- LQ48
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '林先生乘的士從機場回家需時 40 分鐘，車程是 36 公里。的士行駛的平均速率是多少公里每小時？',
 '40 分鐘即 2/3 小時。
36 ÷ 2/3
= 36 × 3/2
= 54
的士行駛的平均速率是 54 公里每小時。',
 'enhancement', 'p6_lq_batch3', 'LQ48',
 '分鐘換算成小時',
 NULL, true),

-- LQ49
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '表姐和朋友一起去送货，全程長 6.3 km，他們在 8:20 a.m. 出發，在 10:26 a.m. 到達送點。她們步行的平均速率是多少 km/h？',
 '她們用了 2 小時 6 分鐘，即 2.1 小時。
6.3 ÷ 2.1
= 3
她們步行的平均速率是 3 km/h。',
 'advanced', 'p6_lq_batch3', 'LQ49',
 '時間差 + 換算',
 NULL, true),

-- LQ50 (Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '機械人比賽中，機械人要行走 40 m。比賽進行了 1.2 分鐘時，某個機械人突然發生故障不能繼續行走，當時它距離終點還有 4 m。它發生故障前的平均速率是多少 m/s？',
 '1.2 分鐘即 72 秒。
(40 − 4) ÷ 72
= 36 ÷ 72
= 0.5
它發生故障前的平均速率是 0.5 m/s。',
 'enhancement', 'p6_lq_batch3', 'LQ50',
 '分鐘換成秒；計算已行走距離',
 NULL, true),

-- LQ51
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '表姐以 1.6 m/s 的平均速率走了 2 分鐘 20 秒，她共走了多少米？',
 '2 分鐘 20 秒即 140 秒。
1.6 × 140
= 224
她共走了 224 米。',
 'enhancement', 'p6_lq_batch3', 'LQ51', NULL, NULL, true),

-- LQ52 (with image: 5m radius round grass field)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '下圖是一塊圓形草地，黑點是圓心。一輛除草車以 0.8 米每秒的平均速率沿草地的外圍行駛一周，需時多少秒？（半徑 5 米，取 π = 3.14）',
 '5 × 2 × 3.14 ÷ 0.8
= 31.4 ÷ 0.8
= 39.25
需時 39.25 秒。',
 'advanced', 'p6_lq_batch3', 'LQ52',
 '結合圓周計算 + 速率',
 'local:_lq_input/p6/p6b image/Screenshot 2026-05-24 at 21.19.00.png',
 true),

-- LQ53
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '妹妹和哥哥同時從起點出發，沿着同一單車徑騎單車。妹妹用了 24 分鐘到達終點，平均速率是 15 公里每小時。哥哥用了 0.5 小時到達終點。哥哥的平均速率是多少公里每小時？',
 '24 分鐘即 2/5 小時。
從起點到終點的路程長：
15 × 2/5
= 6（公里）
哥哥的平均速率是：
6 ÷ 0.5
= 12
哥哥的平均速率是 12 公里每小時。',
 'advanced', 'p6_lq_batch3', 'LQ53',
 '兩步：先求路程再求速率',
 NULL, true),

-- LQ56 (Exam, two-part with circle answer)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=6 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '碼頭和貨倉相距 98 km，貨車以 56 km/h 的平均速率由碼頭駛往貨倉。
(a) 貨車全程需時多少分鐘？
(b) 貨車在下午 1 時到達貨倉，即在（上午／下午）___ 時 ___ 分從碼頭出發。',
 '(a) 98 ÷ 56
= 1.75（小時）
即 105 分鐘
貨車全程需時 105 分鐘。

(b) 上午 11 時 15 分
（105 分鐘即 1 小時 45 分）',
 'advanced', 'p6_lq_batch3', 'LQ56',
 '(a) 時間計算; (b) 倒推出發時間 + 圈出上午/下午',
 NULL, true);

COMMIT;
