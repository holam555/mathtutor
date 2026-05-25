-- ==========================================================================
-- P4B LQ batch 1 — extraction from _lq_input:/p4/p4b question/p4b1/
-- (30 screenshots, 30 LQs).
--
-- Topic mapping (P4 units):
--   P4 U5  四則混合運算     13  (LQ178-190)
--   P4 U9  周界              9  (LQ191-199)
--   P4 U12 同分母分數加減法  8  (LQ200-207)
--
-- All image_url left NULL; figure-dependent LQs flagged in notes.
-- Apply once. Idempotent via source_paper='p4b_lq_batch1'.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p4b_lq_batch1';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 四則混合運算 (P4 U5) ───────────────────────────────────────────────────

-- LQ178
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '廚師做了蝦餃 21 籠和小籠包 125 個，然後把小籠包每 5 個分成一籠。他共做了蝦餃和小籠包多少籠？',
 '他共做了蝦餃和小籠包：
21 + 125 ÷ 5
= 21 + 25
= 46（籠）',
 'enhancement', 'p4b_lq_batch1', 'LQ178', NULL, NULL, true),

-- LQ179
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '陳小姐買了 2 雙售價相同的耳環和 1 條腰帶，共付了 608 元。每條腰帶的售價是 68 元，每雙耳環的售價是多少元？',
 '每雙耳環的售價是：
（608 − 68）÷ 2
= 540 ÷ 2
= 270（元）',
 'enhancement', 'p4b_lq_batch1', 'LQ179', NULL, NULL, true),

-- LQ180
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '每張魔術表演的成人門票比小童門票貴 30 元。小童門票售 45 元。叔叔付 500 元購買成人門票，最多可買到多少張？',
 '可買到：
500 ÷（45 + 30）
= 500 ÷ 75
= 6（張）⋯ 50（元）
最多可買到 6 張。',
 'enhancement', 'p4b_lq_batch1', 'LQ180', '有餘數，需向下取整', NULL, true),

-- LQ181
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '嘉雯付 200 元購買生日卡，找回 80 元，共獲得 5 張。生日卡買 3 張多送 1 張。每張生日卡售多少元？',
 '每張生日卡售：
（200 − 80）÷（5 − 1）
= 120 ÷ 4
= 30（元）',
 'enhancement', 'p4b_lq_batch1', 'LQ181', '買 3 送 1 → 實付 4 張的錢買到 5 張', NULL, true),

-- LQ182
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '45 碗魚丸湯共有魚丸 405 粒，每碗的魚丸數量相同。麵店售出魚丸湯 25 碗，即售出魚丸多少粒？',
 '即售出魚丸：
405 ÷ 45 × 25
= 9 × 25
= 225（粒）',
 'enhancement', 'p4b_lq_batch1', 'LQ182', NULL, NULL, true),

-- LQ183
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '每個紙箱可放濕紙巾 8 包。工人要把 23 打濕紙巾放進紙箱，最少需要紙箱多少個？',
 '需要紙箱：
12 × 23 ÷ 8
= 276 ÷ 8
= 34（個）⋯ 4（包）
最少需要紙箱 35 個。',
 'enhancement', 'p4b_lq_batch1', 'LQ183', '1 打 = 12，餘數要進一', NULL, true),

-- LQ184
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '浩文 3 星期的儲蓄與可怡在六月的儲蓄相同。浩文每天儲蓄的款項相同，可怡每天儲蓄 14 元。浩文每天儲蓄多少元？',
 '浩文每天儲蓄：
14 × 30 ÷（7 × 3）
= 14 × 30 ÷ 21
= 420 ÷ 21
= 20（元）',
 'advanced', 'p4b_lq_batch1', 'LQ184', '六月共 30 天；3 星期 = 21 天', NULL, true),

-- LQ185
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '李太太速遞 6 件包裹，其中 2 件各重 1 公斤，其餘每件重 5 公斤。速遞收費：2 公斤或以下每件 22 元；2 公斤以上每件 28 元。李太太共需付款多少元？',
 '李太太共需付款：
22 × 2 + 28 ×（6 − 2）
= 22 × 2 + 28 × 4
= 44 + 112
= 156（元）',
 'advanced', 'p4b_lq_batch1', 'LQ185', NULL, NULL, true),

-- LQ186
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '一打罐裝貓糧售 144 元，每罐的售價相同。一包袋裝貓糧售 155 元。姊姊買罐裝貓糧半打和袋裝貓糧 2 包，共需付多少元？',
 '共需付：
144 ÷ 2 + 155 × 2
= 72 + 310
= 382（元）',
 'enhancement', 'p4b_lq_batch1', 'LQ186', '半打 = 6 罐；亦可逐罐計：144÷12×6', NULL, true),

-- LQ187
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '卓軒是兒童樂園的會員，他用了 160 元購買代幣。原價：每個 $5；會員：10 個 $40；會員買滿 $200，多送 5 個。如果每局遊戲需要代幣 4 個，卓軒玩了 6 局後，還餘代幣多少個？',
 '還餘代幣：
10 ×（160 ÷ 40）− 4 × 6
= 10 × 4 − 4 × 6
= 40 − 24
= 16（個）',
 'advanced', 'p4b_lq_batch1', 'LQ187', '$160 未達會員贈送門檻 $200', NULL, true),

-- LQ188
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '餐廳午餐售價：A. 鮮茄豬扒飯 $50、B. 日汁海鮮飯 $55、C. 牛柳粒意粉 $55、D. 釀子天使麵 $60。各午餐贈送熱飲，轉凍飲加 2 元。為慶祝家豪生日，家豪和 4 個朋友到餐廳吃飯。他們點選了 4 個午餐 C 和 1 個午餐 A，其中 2 人轉凍飲。他們共需付多少元？',
 '他們共需付：
55 × 4 + 50 + 2 × 2
= 220 + 50 + 4
= 274（元）',
 'enhancement', 'p4b_lq_batch1', 'LQ188', NULL, NULL, true),

-- LQ189
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=5 ORDER BY t.lesson_number LIMIT 1),
 '3 盒同款曲奇共售 75 元，一盒糖果比一盒曲奇便宜 7 元，買一盒糖果需付多少元？',
 '買一盒糖果需付：
75 ÷ 3 − 7
= 25 − 7
= 18（元）',
 'enhancement', 'p4b_lq_batch1', 'LQ189', NULL, NULL, true),

-- ─── 周界 (P4 U9) ───────────────────────────────────────────────────────────

-- LQ190
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '一個正方形魚池的邊長是 21 m。小貓沿着這個魚池的外圍跑了 2 圈，牠共跑了多少 m？',
 '牠共跑了：
21 × 4 × 2
= 168（m）',
 'basic', 'p4b_lq_batch1', 'LQ190', NULL, NULL, true),

-- LQ191
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '正方形 A 的邊長是 36 cm，穎桐沿虛線把它分割成 16 個大小相同的小正方形，然後她把其中 9 個小正方形拼砌成正方形 B。正方形 B 的周界是多少 cm？',
 '正方形 B 的邊長是：
36 ÷ 4 × 3
= 9 × 3
= 27（cm）
正方形 B 的周界是：
27 × 4
= 108（cm）',
 'enhancement', 'p4b_lq_batch1', 'LQ191', '依賴圖形（4×4 分割）', NULL, true),

-- LQ192
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '樂怡有一條長 240 cm 的絲帶，她把 180 cm 絲帶圍成一個大正方形，然後把餘下的絲帶圍成一個小正方形。大正方形與小正方形的邊長相差多少 cm？',
 '大正方形的邊長是：
180 ÷ 4
= 45（cm）
小正方形的邊長是：
（240 − 180）÷ 4
= 60 ÷ 4
= 15（cm）
大正方形與小正方形的邊長相差：
45 − 15
= 30（cm）',
 'advanced', 'p4b_lq_batch1', 'LQ192', NULL, NULL, true),

-- LQ193
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '一張長方形貼紙的周界是 84 mm，它的長是 24 mm，闊是多少 mm？',
 '它的長與闊之和是：
84 ÷ 2
= 42（mm）
闊是：
42 − 24
= 18（mm）',
 'enhancement', 'p4b_lq_batch1', 'LQ193', NULL, NULL, true),

-- LQ194
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '公園內有一個長方形花圃（長 12 米、闊 8 米），花圃外圍有一條闊 2 米的小徑，如下圖所示。花圃的周界是多少米？',
 '花圃的長是：
12 − 2 − 2
= 8（米）
花圃的闊是：
8 − 2 − 2
= 4（米）
花圃的周界是：
（8 + 4）× 2
= 12 × 2
= 24（米）',
 'advanced', 'p4b_lq_batch1', 'LQ194', '依賴圖形：12×8 外框為地，花圃在中央被 2 米小徑包圍', NULL, true),

-- LQ195
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '一個大長方形由四個大小相同的小長方形拼砌而成，小長方形的長是 6 cm，三條小長方形上下堆疊組成大長方形的長邊，大長方形的長 = 6 cm。大長方形的周界是多少 cm？',
 '大長方形的長是：
6 + 6 ÷ 3
= 6 + 2
= 8（cm）
大長方形的周界是：
（8 + 6）× 2
= 14 × 2
= 28（cm）',
 'advanced', 'p4b_lq_batch1', 'LQ195', '依賴圖形（小長方形排列方式）', NULL, true),

-- LQ196
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '右面的牆紙由 2 個正方形組成。其中一邊邊長為 7 m，另一邊為 15 m。這張牆紙的周界是多少 m？',
 '這張牆紙的周界是：
（7 + 15 + 15）× 2
= 37 × 2
= 74（m）',
 'enhancement', 'p4b_lq_batch1', 'LQ196', '依賴圖形（兩正方形拼砌方式）', NULL, true),

-- LQ197
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '頌欣用 5 個大小相同的正方形拼砌出一個新圖形（如下圖，圖形整體寬度為 12 厘米）。這個新圖形的周界是多少厘米？',
 '這個新圖形的周界是：
12 ÷ 3 × 12
= 4 × 12
= 48（厘米）',
 'advanced', 'p4b_lq_batch1', 'LQ197', '依賴圖形（5 個正方形 T 字型拼砌，周界邊數 12 邊）', NULL, true),

-- LQ198
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=9 ORDER BY t.lesson_number LIMIT 1),
 '子軒把兩個大小相同的長方形（長 20 cm、闊 6 cm）以部分重疊的方法組成一個大長方形，重疊部分的闊是 3 cm。大長方形的周界是多少 cm？',
 '大長方形的闊是：
6 + 6 − 3
= 9（cm）
大長方形的周界是：
（20 + 9）× 2
= 29 × 2
= 58（cm）',
 'advanced', 'p4b_lq_batch1', 'LQ198', '依賴圖形（兩個長方形上下部分重疊）', NULL, true),

-- ─── 同分母分數加減法 (P4 U12) ─────────────────────────────────────────────

-- LQ199
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '媽媽編織圍巾用去毛冷 32 3/8 米，佔原有毛冷的一半。媽媽原有毛冷多少米？',
 '媽媽原有毛冷：
32 3/8 + 32 3/8
= 64 6/8
= 64 3/4（米）',
 'enhancement', 'p4b_lq_batch1', 'LQ199', NULL, NULL, true),

-- LQ200
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '飲品店今天售出奶茶 3 13/20 升和烏龍茶 2 9/20 升，售出的茉莉花茶比烏龍茶多 1/20 升。今天共售出奶茶和茉莉花茶多少升？',
 '今天共售出奶茶和茉莉花茶：
3 13/20 + 2 9/20 + 1/20
= 5 23/20
= 6 3/20（升）',
 'advanced', 'p4b_lq_batch1', 'LQ200', NULL, NULL, true),

-- LQ201
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '一盒餅乾有 30 塊，弟弟取去全盒餅乾的 11/30，妹妹取去全盒餅乾的 7/30，爸爸取去餅乾 10 塊。三人取去的餅乾佔全盒餅乾的幾分之幾？',
 '三人取去的餅乾佔全盒餅乾的：
11/30 + 7/30 + 10/30
= 28/30
= 14/15',
 'advanced', 'p4b_lq_batch1', 'LQ201', '爸爸 10 塊 = 10/30；答案化簡', NULL, true),

-- LQ202
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '冬瓜重 3 4/5 kg，南瓜比冬瓜輕 1 3/5 kg。南瓜重多少 kg？',
 '南瓜重：
3 4/5 − 1 3/5
= 2 1/5（kg）',
 'basic', 'p4b_lq_batch1', 'LQ202', NULL, NULL, true),

-- LQ203
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '思聰原有一包糖果，他送給兩個朋友每人 5/16 包糖果後，餘下糖果多少包？',
 '餘下糖果：
1 − 5/16 − 5/16
= 16/16 − 5/16 − 5/16
= 11/16 − 5/16
= 6/16
= 3/8（包）',
 'advanced', 'p4b_lq_batch1', 'LQ203', NULL, NULL, true),

-- LQ204
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '跳遠決賽有三個參賽者，他們的成績分別是 2 22/25 米、3 2/25 米和 2 23/25 米。冠軍和季軍的成績相差多少米？',
 '冠軍和季軍的成績相差：
3 2/25 − 2 22/25
= 2 27/25 − 2 22/25
= 5/25
= 1/5（米）',
 'advanced', 'p4b_lq_batch1', 'LQ204', '冠軍 3 2/25；季軍 2 22/25（最小）', NULL, true),

-- LQ205
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '水果店原有葡萄 30 公斤，今天上午售出葡萄 13 1/2 公斤，比下午多售出 2 公斤。水果店今天共售出葡萄多少公斤？',
 '水果店今天共售出葡萄：
13 1/2 + 13 1/2 − 2
= 26 2/2 − 2
= 27 − 2
= 25（公斤）',
 'advanced', 'p4b_lq_batch1', 'LQ205', NULL, NULL, true),

-- LQ206
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '餐廳有豬肉和牛肉共 30 3/4 kg，其中豬肉有 18 1/4 kg，豬肉比牛肉多幾 kg？',
 '豬肉比牛肉多：
18 1/4 −（30 3/4 − 18 1/4）
= 18 1/4 − 12 2/4
= 17 5/4 − 12 2/4
= 5 3/4（kg）',
 'advanced', 'p4b_lq_batch1', 'LQ206', NULL, NULL, true),

-- LQ207
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=12 ORDER BY t.lesson_number LIMIT 1),
 '家中原有紙巾 2 排，每排有 12 包。上星期用去紙巾 5/12 排，本星期再用去 4 包，家中還餘紙巾多少排？',
 '家中還餘紙巾：
2 −（5/12 + 4/12）
= 2 − 9/12
= 1 12/12 − 9/12
= 1 3/12
= 1 1/4（排）',
 'advanced', 'p4b_lq_batch1', 'LQ207', '4 包 = 4/12 排', NULL, true)
;

COMMIT;
