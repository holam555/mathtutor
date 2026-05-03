-- File 1 模擬考試 + 24小時報時制 工作紙 (純文字, 35 條)
-- Source: sub-agent extraction. Mock answers cross-checked against answer-key PDF.

BEGIN;

DELETE FROM assessment_questions
  WHERE source_paper IN ('2023-P3校內模擬考試', '2023-P3-24小時報時制工作紙');

-- ============================================================
-- 2023-P3校內模擬考試 (Q1-Q30, 圖片題 Q14/Q18 在 figures script 處理)
-- ============================================================
INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
((SELECT id FROM curriculum_topics WHERE lesson_number = 4),
 '計算 864 + 264 的值。', 'multiple_choice',
 '["A. 1118", "B. 1028", "C. 1128", "D. 600"]'::jsonb,
 'C. 1128', 'basic', '2023-P3校內模擬考試', 'Q1', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
 '計算 545 - 455 的值。', 'multiple_choice',
 '["A. 1000", "B. 90", "C. 1100", "D. 80"]'::jsonb,
 'B. 90', 'basic', '2023-P3校內模擬考試', 'Q2', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 11),
 '計算 46 × 30 的值。', 'multiple_choice',
 '["A. 92", "B. 920", "C. 138", "D. 1380"]'::jsonb,
 'D. 1380', 'basic', '2023-P3校內模擬考試', 'Q3', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 21),
 '計算 93 ÷ 3 的值。', 'multiple_choice',
 '["A. 93", "B. 31", "C. 62", "D. 3"]'::jsonb,
 'B. 31', 'basic', '2023-P3校內模擬考試', 'Q4', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 11),
 '計算 4320 × 3 的值。', 'multiple_choice',
 '["A. 4323", "B. 1296", "C. 12960", "D. 960"]'::jsonb,
 'C. 12960', 'basic', '2023-P3校內模擬考試', 'Q5', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 13),
 '請填上合適的單位:「一本書約厚 6 ＿＿＿」。', 'multiple_choice',
 '["A. 厘米", "B. 米", "C. 毫升", "D. 公升"]'::jsonb,
 'A. 厘米', 'basic', '2023-P3校內模擬考試', 'Q6', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
 '哪一種四邊形只有一組對邊平行?', 'multiple_choice',
 '["A. 三角形", "B. 正方形", "C. 梯形", "D. 平行四邊形"]'::jsonb,
 'C. 梯形', 'basic', '2023-P3校內模擬考試', 'Q7', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
 '請填上合適的單位:「一瓶罐裝可樂容量大概 330 ＿＿＿」。', 'multiple_choice',
 '["A. 毫升", "B. 公升", "C. 克", "D. 千克"]'::jsonb,
 'A. 毫升', 'basic', '2023-P3校內模擬考試', 'Q8', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 15),
 '秒針走過三圈後再走了半圈,即表示時間經過多少秒?', 'multiple_choice',
 '["A. 60", "B. 180", "C. 30", "D. 210"]'::jsonb,
 'D. 210', 'enhancement', '2023-P3校內模擬考試', 'Q9', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 28),
 '哥哥面向南面,向右轉了一個直角,即現在他面向的是什麼方向?', 'multiple_choice',
 '["A. 東", "B. 南", "C. 西", "D. 北"]'::jsonb,
 'C. 西', 'basic', '2023-P3校內模擬考試', 'Q10', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
 '計算 1860 - (2546 - 940) 的值。', 'multiple_choice',
 '["A. 254", "B. 2540", "C. 3466", "D. 無法計算"]'::jsonb,
 'A. 254', 'enhancement', '2023-P3校內模擬考試', 'Q11', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
 '計算 1420 + 640 × 3 的值。', 'multiple_choice',
 '["A. 3340", "B. 340", "C. 1920", "D. 1612"]'::jsonb,
 'A. 3340', 'enhancement', '2023-P3校內模擬考試', 'Q12', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
 '計算 944 + 61 × 6 的值。', 'multiple_choice',
 '["A. 1310", "B. 944", "C. 1005", "D. 1249"]'::jsonb,
 'A. 1310', 'enhancement', '2023-P3校內模擬考試', 'Q13', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
 '計算 3660 - 360 ÷ 6 的值。', 'multiple_choice',
 '["A. 3666", "B. 3600", "C. 60", "D. 360"]'::jsonb,
 'B. 3600', 'enhancement', '2023-P3校內模擬考試', 'Q15', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 22),
 '已知 X ÷ 12 = 7…9,求 X 的值。', 'multiple_choice',
 '["A. 92", "B. 84", "C. 93", "D. 108"]'::jsonb,
 'C. 93', 'enhancement', '2023-P3校內模擬考試', 'Q16', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 22),
 'Δ ÷ ( ) = 8…8,求 Δ 的最小值。', 'multiple_choice',
 '["A. 88", "B. 80", "C. 72", "D. 16"]'::jsonb,
 'B. 80', 'advanced', '2023-P3校內模擬考試', 'Q17', '除數必大於餘數,故除數最小為9'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
 '下列哪個算式答案與 488 - 1703 + 2584 的計算結果一樣?', 'multiple_choice',
 '["A. 1369 - 966 + 52", "B. 863 + 253 × 2", "C. 965 + 404 + 404", "D. 1000 + 969 ÷ 3"]'::jsonb,
 'B. 863 + 253 × 2', 'advanced', '2023-P3校內模擬考試', 'Q19', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 32),
 '志明有一瓶 2 公升的橙汁,製作一杯特殊飲料需要橙汁 600 毫升。他製作了 3 杯特殊飲料後,還餘橙汁多少毫升?', 'multiple_choice',
 '["A. 1400 毫升", "B. 800 毫升", "C. 2000 毫升", "D. 200 毫升"]'::jsonb,
 'D. 200 毫升', 'enhancement', '2023-P3校內模擬考試', 'Q20', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
 '計算 99/125 - 76/125 + 46/125 = ＿＿＿(請填分數,例如 a/b)。', 'fill_in', NULL,
 '69/125', 'basic', '2023-P3校內模擬考試', 'Q21', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 36),
 '一本故事書售價 64 元,付 500 元去買 7 本故事書,找回多少元?', 'fill_in', NULL,
 '52', 'enhancement', '2023-P3校內模擬考試', 'Q22', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 8),
 '已知 ○ + ○ + ○ + □ + □ = 21 且 ○ + □ = 8,求 □ = ＿＿＿。', 'fill_in', NULL,
 '3', 'advanced', '2023-P3校內模擬考試', 'Q23', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
 '明信片每張 7 元,5 位小朋友一共購買 20 張明信片,那麼共花費了多少元?', 'fill_in', NULL,
 '140', 'enhancement', '2023-P3校內模擬考試', 'Q24', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 11),
 '倫倫報名學而思奧數課程,一堂課 400 元,3 月上了 4 堂課,那麼 3 月份要付多少元?', 'fill_in', NULL,
 '1600', 'basic', '2023-P3校內模擬考試', 'Q25', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 23),
 '每個文件夾售 11 元,美美有 310 元,她最多可以買多少個文件夾?', 'fill_in', NULL,
 '28', 'enhancement', '2023-P3校內模擬考試', 'Q26', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
 '小明有一支 1 公升的水(即 1000 毫升),他喝了這支水的 76/100 之後,還剩多少毫升?', 'fill_in', NULL,
 '240', 'advanced', '2023-P3校內模擬考試', 'Q27', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 23),
 '玩具店促銷,每個盲盒 26 元,買滿 3 個盲盒就會送一個盲盒,歐歐需要買 26 個盲盒,請問她至少要花費多少元?', 'fill_in', NULL,
 '520', 'advanced', '2023-P3校內模擬考試', 'Q28', '買 20 個送 6 個剛好 26 個,故付款 20×26=520'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 8),
 '志明有 1800 元零用錢,買了 1250 元的機械人之後,他還買了 4 本筆記本以及 12 支鉛筆,每本筆記本 35 元,每支鉛筆 7 元,餘下多少元?', 'fill_in', NULL,
 '326', 'advanced', '2023-P3校內模擬考試', 'Q29', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 14),
 '現在有一個大長方形和一個小正方形,大長方形的長為 36 厘米,闊為 18 厘米,小正方形的邊長為 12 厘米,那麼大長方形的周界比小正方形的周界多多少厘米?', 'fill_in', NULL,
 '60', 'advanced', '2023-P3校內模擬考試', 'Q30', NULL);

-- ============================================================
-- 2023-P3-24小時報時制工作紙
-- ============================================================
INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
((SELECT id FROM curriculum_topics WHERE lesson_number = 16),
 '請把 12 小時報時制 9:35 a.m. 化成 24 小時報時制(格式 HH:MM)。', 'fill_in', NULL,
 '09:35', 'basic', '2023-P3-24小時報時制工作紙', 'WS1a', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 16),
 '請把 12 小時報時制 2:10 p.m. 化成 24 小時報時制(格式 HH:MM)。', 'fill_in', NULL,
 '14:10', 'basic', '2023-P3-24小時報時制工作紙', 'WS1b', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 16),
 '請把 24 小時報時制 16:30 化成 12 小時報時制(例如 4:30 p.m.)。', 'fill_in', NULL,
 '4:30 p.m.', 'basic', '2023-P3-24小時報時制工作紙', 'WS1c', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 33),
 '珍妮 22:35 開始睡覺,第二天 07:20 起床,請問她的睡眠總時長是多少?(答案請以「X小時Y分鐘」格式)', 'fill_in', NULL,
 '8小時45分鐘', 'advanced', '2023-P3-24小時報時制工作紙', 'WS3', NULL);

-- WS2 chained 3-step (forward time progression)
DO $ws2$
DECLARE
  g uuid := gen_random_uuid();
  t16 uuid := (SELECT id FROM curriculum_topics WHERE lesson_number = 16);
BEGIN
  INSERT INTO assessment_questions
    (topic_id, question_text, question_type, options, correct_answer, difficulty_tier,
     group_id, sub_order, source_paper, source_question, notes)
  VALUES
    (t16, 'Jenny 10:25 參觀墨爾本大學,2 個小時後去餐廳吃午餐。請以 24 小時報時制填寫去吃午餐的時間(格式 HH:MM)。', 'fill_in', NULL,
     '12:25', 'enhancement', g, 1, '2023-P3-24小時報時制工作紙', 'WS2a', NULL),
    (t16, '承上題,去餐廳吃午餐時間為 12:25。55 分鐘後參觀月光野生動物保育公園,請以 24 小時報時制填寫(格式 HH:MM)。', 'fill_in', NULL,
     '13:20', 'enhancement', g, 2, '2023-P3-24小時報時制工作紙', 'WS2b', NULL),
    (t16, '承上題,參觀月光野生動物保育公園的時間為 13:20。3 小時 48 分鐘後離開公園,請以 24 小時報時制填寫(格式 HH:MM)。', 'fill_in', NULL,
     '17:08', 'advanced', g, 3, '2023-P3-24小時報時制工作紙', 'WS2c', NULL);
END $ws2$;

-- WS4 chained 3-step (reverse time)
DO $ws4$
DECLARE
  g uuid := gen_random_uuid();
  t16 uuid := (SELECT id FROM curriculum_topics WHERE lesson_number = 16);
BEGIN
  INSERT INTO assessment_questions
    (topic_id, question_text, question_type, options, correct_answer, difficulty_tier,
     group_id, sub_order, source_paper, source_question, notes)
  VALUES
    (t16, 'Jenny 18:35 離開遊樂園,5 個小時前到達遊樂園。請以 24 小時報時制寫出到達遊樂園的時間(格式 HH:MM)。', 'fill_in', NULL,
     '13:35', 'enhancement', g, 1, '2023-P3-24小時報時制工作紙', 'WS4a', NULL),
    (t16, '承上題,到達遊樂園時間為 13:35。28 分鐘前出發去遊樂園,請以 24 小時報時制填寫(格式 HH:MM)。', 'fill_in', NULL,
     '13:07', 'enhancement', g, 2, '2023-P3-24小時報時制工作紙', 'WS4b', NULL),
    (t16, '承上題,出發去遊樂園時間為 13:07。1 小時 26 分鐘前去餐廳吃中午飯,請以 24 小時報時制填寫(格式 HH:MM)。', 'fill_in', NULL,
     '11:41', 'advanced', g, 3, '2023-P3-24小時報時制工作紙', 'WS4c', NULL);
END $ws4$;

COMMIT;
