-- ==========================================================================
-- P4A LQ batch — extraction from _lq_input:/p4/p4a question/ (10 screenshots)
-- + _lq_input:/p4/p4a images/ (6 images, all matched HIGH confidence).
--
-- 16 LQs extracted (several screenshots packed 2 LQs each).
--
-- Topic mapping (P4 4A units):
--   P4 U3 乘法           10  (LQ162-168, LQ173-174, LQ177)
--   P4 U4 除法           5   (LQ170-172, LQ175-176)
--   P4 U8 四邊形         1   (LQ169 — parallelogram property judgment)
--
-- Apply once. Idempotent via source_paper='p4a_lq_batch'.
-- ==========================================================================

BEGIN;

DELETE FROM long_questions WHERE source_paper = 'p4a_lq_batch';

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, image_url, is_active)
VALUES

-- ─── 乘法 (P4 U3) ──────────────────────────────────────────────────────────

-- LQ162
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '每瓶橙汁有 375 mL。果汁店今天售出橙汁 66 瓶，即共售出橙汁多少 mL？',
 '即共售出橙汁：
375 × 66
= 24750（mL）',
 'enhancement', 'p4a_lq_batch', 'LQ162', NULL, NULL, true),

-- LQ163
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '家文每天儲蓄 22 元，她在三月共儲蓄了多少元？',
 '她在三月共儲蓄了：
22 × 31
= 682（元）',
 'enhancement', 'p4a_lq_batch', 'LQ163',
 '三月共 31 天',
 NULL, true),

-- LQ164
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '每盒葡萄售 28 元，每盒草莓的售價是葡萄的 3 倍。水果店上午共售出草莓 124 盒，共收得多少元？',
 '共收得：
28 × 3 × 124
= 84 × 124
= 10416（元）',
 'enhancement', 'p4a_lq_batch', 'LQ164', NULL, NULL, true),

-- LQ165
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '網球學會有會員 37 個。如果學會用 8000 元，這些款項足夠為每個會員購買一塊售 215 元的球拍嗎？',
 '購買球拍共需付：
215 × 37
= 7955（元）
7955 < 8000，所以這些款項足夠。',
 'enhancement', 'p4a_lq_batch', 'LQ165',
 '判斷題',
 NULL, true),

-- LQ166
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '包裝一份禮物需用絲帶 48 厘米。精品店有一卷長 4 米的絲帶，這卷絲帶足夠包裝 12 份禮物嗎？為甚麼？',
 '答案：（不足夠）
因為包裝 12 份禮物需用絲帶：
48 × 12 = 576（厘米）
4 米 = 400 厘米，400 < 576
所以這卷絲帶不足夠包裝 12 份禮物。（或其他合理答案。）',
 'enhancement', 'p4a_lq_batch', 'LQ166',
 '判斷題；米→厘米換算',
 NULL, true),

-- LQ167
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '零食店有糖果 2 箱，每箱有 25 包，每包有 36 粒。零食店共有糖果多少粒？',
 '零食店共有糖果：
36 × 25 × 2
= 900 × 2
= 1800（粒）',
 'enhancement', 'p4a_lq_batch', 'LQ167', NULL, NULL, true),

-- LQ168 (image: 主題樂園 入場券 $318 買十送一; Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '四甲班有學生 31 個，他們參觀主題樂園，購買入場券共需付多少元？（主題樂園入場券每張 $318，買十張入場券多送一張）',
 '購買入場券共需付：
318 × 29
= 9222（元）',
 'advanced', 'p4a_lq_batch', 'LQ168',
 '買十送一：31 學生需 31 張票，3 組買 30 多送 3 張，仍少 1 → 共付 29 張錢',
 'local:_lq_input/p4/p4a images/Screenshot 2026-05-24 at 22.32.04.png',
 true),

-- LQ173 (image: 相機 免息分期 每月 $385; Exam)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '如果以免息分期的方法買一部相機，需供款一年，即共需付多少元？（免息分期 每月供款 $385）',
 '即共需付：
385 × 12
= 4620（元）',
 'enhancement', 'p4a_lq_batch', 'LQ173',
 '一年 = 12 個月',
 'local:_lq_input/p4/p4a images/Screenshot 2026-05-24 at 22.32.32.png',
 true),

-- LQ174 (image: 西瓜 $36)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '每箱西瓜有 4 個。水果店售出西瓜 15 箱，共收得多少元？（每個 $36）',
 '共收得：
36 × 4 × 15
= 144 × 15
= 2160（元）',
 'enhancement', 'p4a_lq_batch', 'LQ174', NULL,
 'local:_lq_input/p4/p4a images/Screenshot 2026-05-24 at 22.32.33.png',
 true),

-- LQ177
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=3 ORDER BY t.lesson_number LIMIT 1),
 '右表顯示兩個停車場的泊車收費。何先生要泊車 12 小時，他選擇哪個停車場會較便宜？為甚麼？（甲：每小時 26 元；乙：每 12 小時 288 元）',
 '答案：停車場（乙）
因為在停車場甲泊車 12 小時，共需付泊車費：
26 × 12 = 312（元）
在停車場乙泊車 12 小時，需付 288 元
312 > 288，比乙便宜 24 元。（或其他合理答案。）',
 'advanced', 'p4a_lq_batch', 'LQ177',
 '判斷題；比較兩種收費',
 NULL, true),

-- ─── 除法 (P4 U4) ──────────────────────────────────────────────────────────

-- LQ170
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '爸爸在去年共捐款 960 元，每月捐的款項相同。他每月捐款多少元？',
 '他每月捐款：
960 ÷ 12
= 80（元）',
 'basic', 'p4a_lq_batch', 'LQ170', NULL, NULL, true),

-- LQ171
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '做一個蝴蝶結需用絲帶 13 cm。家欣有紅絲帶 73 cm 和綠絲帶 48 cm，她用紅絲帶最多可做蝴蝶結多少個？',
 '可做蝴蝶結：
73 ÷ 13
= 5（個）……8（cm）
她用紅絲帶最多可做蝴蝶結 5 個。',
 'enhancement', 'p4a_lq_batch', 'LQ171', NULL, NULL, true),

-- LQ172 (multi-part a/b)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '老師有竹簽 340 枝，他把所有竹簽分給 26 個學生，每個學生分得的數量相同。
(a) 每個學生分得竹簽多少枝？還餘多少枝？
(b) 如果把餘下的竹簽分給其中一個學生，該學生分得竹簽多少枝？',
 '(a) 每個學生分得竹簽：
340 ÷ 26
= 13（枝）……2（枝）
每個學生分得竹簽 13 枝，還餘 2 枝。

(b) 該學生分得竹簽：
13 + 2
= 15（枝）',
 'enhancement', 'p4a_lq_batch', 'LQ172', NULL, NULL, true),

-- LQ175 (image: 日日雜貨店 全店貨品每件均售 ? 元 買 6 件多送 1)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '爸爸到日日雜貨店購物，他付了 168 元買得 14 件貨品。該店每件貨品售多少元？（日日雜貨店 全店貨品每件均售 ? 元，買 6 件多送 1 件）',
 '該店每件貨品售：
168 ÷ 12
= 14（元）',
 'enhancement', 'p4a_lq_batch', 'LQ175',
 '買 6 送 1：14 件實際只付 12 件錢',
 'local:_lq_input/p4/p4a images/Screenshot 2026-05-24 at 22.32.35.png',
 true),

-- LQ176 (image: cat hint about seat count)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=4 ORDER BY t.lesson_number LIMIT 1),
 '歌唱比賽在學校禮堂舉行，有 852 人出席。禮堂每行座位有 24 個，出席歌唱比賽的人最多可坐滿多少行？',
 '可坐滿：
852 ÷ 24
= 35（行）……12（個）
最多可坐滿 35 行。（或其他合理答案。）',
 'enhancement', 'p4a_lq_batch', 'LQ176',
 '自擬每行座位數量；本題用 24 為例',
 'local:_lq_input/p4/p4a images/Screenshot 2026-05-24 at 22.32.47.png',
 true),

-- ─── 四邊形 (P4 U8) ───────────────────────────────────────────────────────

-- LQ169 (image: parallelogram pushed into rectangle)
((SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id
   WHERE u.grade=4 AND u.unit_number=8 ORDER BY t.lesson_number LIMIT 1),
 '心怡用幾何條製作出一個平行四邊形。她把該四邊形輕輕一推（如下圖所示），變成四邊形 Q。如果四邊形 Q 的四個角都是直角，四邊形 Q 仍是平行四邊形的一種嗎？為甚麼？',
 '答案：（是）
因為四邊形 Q 是長方形，而長方形是平行四邊形的一種。（或其他合理答案。）',
 'enhancement', 'p4a_lq_batch', 'LQ169',
 '判斷題；四邊形分類概念',
 'local:_lq_input/p4/p4a images/Screenshot 2026-05-24 at 22.32.22.png',
 true);

COMMIT;
