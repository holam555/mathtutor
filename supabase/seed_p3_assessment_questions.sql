-- Sprint 8 seed: P3 學前評估題庫
-- Source: P3 mock papers (file 1 / file 2 sample / file 3 workbook)
-- All questions tagged by 小單元 (curriculum_topics.lesson_number) + difficulty_tier
--
-- Run AFTER 0014_p3_curriculum_assessment.sql migration AND seed_p3_curriculum.sql
-- Idempotent: use ON CONFLICT or DELETE+INSERT pattern.
--
-- Difficulty tiers:
--   basic       = 1-step or simple direct calculation (3 marks)
--   enhancement = 2-3 step computation or word problem (5 marks)
--   advanced    = 4+ step or complex reverse-reasoning (10 marks)

BEGIN;

-- Clear previous extraction (idempotent re-run)
DELETE FROM assessment_questions
  WHERE source_paper IN (
    'P3 必做100題',
    '2023-P3校內模擬考試',
    '2023-P3期末必考-24小時報時制工作紙',
    '2023-P3期末必考-角和三角形工作紙',
    '三年級計算練習一',
    '三年級計算練習二',
    '三年級計算練習三'
  );

-- ============================================================================
-- BATCH 1: P3 必做100題 (file 3) — 第一單元 加減混合計算 (Q1-Q18)
-- Maps to: 大單元 4 加減混合計算 (lesson 7 加減混合運算與括號的運用,
--           lesson 8 兩步加減逆向文字題專項突破)
-- Q11 column addition is more specific to 大單元 2 加法 lesson 3.
-- ============================================================================

-- Pre-resolve topic IDs to local variables (PostgreSQL doesn't support session vars in plain SQL,
-- so use inline subqueries via a temp lookup CTE pattern).

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
-- Q1-Q2: simple 2-op pure calc (no bracket) → basic
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '53 + 21 - 17 = ?', 'fill_in', NULL, '57', 'basic', 'P3 必做100題', 'Q1', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '97 - 35 + 28 = ?', 'fill_in', NULL, '90', 'basic', 'P3 必做100題', 'Q2', NULL),

-- Q3-Q6: with brackets, 2 ops → enhancement (bracket parsing required)
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '125 + (32 - 11) = ?', 'fill_in', NULL, '146', 'enhancement', 'P3 必做100題', 'Q3', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '372 - (55 + 62) = ?', 'fill_in', NULL, '255', 'enhancement', 'P3 必做100題', 'Q4', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '237 - (83 + 79) = ?', 'fill_in', NULL, '75', 'enhancement', 'P3 必做100題', 'Q5', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '208 - (65 - 47) = ?', 'fill_in', NULL, '190', 'enhancement', 'P3 必做100題', 'Q6', NULL),

-- Q7-Q8: 4-digit calc → enhancement
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '4527 + 2153 - 2976 = ?', 'fill_in', NULL, '3704', 'enhancement', 'P3 必做100題', 'Q7', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '8278 - (6512 - 3547) = ?', 'fill_in', NULL, '5313', 'enhancement', 'P3 必做100題', 'Q8', NULL),

-- Q9-Q10: reverse (find missing) → lesson 8
((SELECT id FROM curriculum_topics WHERE lesson_number = 8),
  '____ + (53 - 26) = 37，求 ____ 的值。', 'fill_in', NULL, '10', 'enhancement', 'P3 必做100題', 'Q9', '逆向：先算括號 27，再 37-27 = 10'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 8),
  '____ - (3824 - 2017) = 2023，求 ____ 的值。', 'fill_in', NULL, '3830', 'advanced', 'P3 必做100題', 'Q10', '逆向：先算括號 1807，再 2023+1807 = 3830'),

-- Q11: column addition (324+956+468) → 大單元 2 加法 lesson 3
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '324 + 956 + 468 = ?', 'fill_in', NULL, '1748', 'basic', 'P3 必做100題', 'Q11', '直式三數連加'),

-- Q14: 3-step chained word problem → advanced (single answer, no split)
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '圖書館的科學書籍有 3214 本，藝術書籍比科學書籍少 985 本，童話書籍比藝術書籍多 237 本，童話書籍有多少本？',
  'calculation', NULL, '2466', 'advanced', 'P3 必做100題', 'Q14',
  '3214-985=2229；2229+237=2466。答案單位：本'),

-- Q15: 3-step word → advanced (single answer)
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '學校舉行跳繩比賽，吉米跳了 132 下，東尼比吉米多跳 27 下，湯姆再跳 9 下就和東尼跳的一樣多。湯姆跳了几下？',
  'calculation', NULL, '150', 'advanced', 'P3 必做100題', 'Q15',
  '132+27=159；159-9=150。答案單位：下'),

-- Q16: 2-step word (single answer)
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '陽光花店原有鮮花 1892 枝，賣掉 967 枝後，又運來 325 枝。現在店裡有鮮花多少枝？',
  'calculation', NULL, '1250', 'enhancement', 'P3 必做100題', 'Q16',
  '1892-967+325=1250。答案單位：枝'),

-- Q17: 2-step word (single answer)
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '學校組織同學們一起摘草莓，三年級共摘 2314 個，比四年級多 1027 個。三年級和四年級共摘草莓多少個？',
  'calculation', NULL, '3601', 'enhancement', 'P3 必做100題', 'Q17',
  '2314-1027=1287；2314+1287=3601。答案單位：個'),

-- Q18: 3-step word → advanced (single answer)
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '一件滑雪衣售 899 元，一塊滑雪板比一件滑雪衣便宜 215 元。東尼付款 2000 元購買一件滑雪衣和一塊滑雪板，應找回多少錢？',
  'calculation', NULL, '417', 'advanced', 'P3 必做100題', 'Q18',
  '899-215=684；2000-899-684=417。答案單位：元');

-- Q12 a/b: 兩問月季+牡丹 — 拆成兩條 sub-question, 共享 group_id, 佔一個出題名額
DO $q12$
DECLARE
  g_q12 uuid := gen_random_uuid();
  topic7 uuid := (SELECT id FROM curriculum_topics WHERE lesson_number = 7);
BEGIN
  INSERT INTO assessment_questions
    (topic_id, question_text, question_type, options, correct_answer, difficulty_tier,
     group_id, sub_order, source_paper, source_question, notes)
  VALUES
    (topic7,
     '月季花原來有 345 盆，又搬來月季花 115 盆，一共有多少盆月季花？',
     'fill_in', NULL, '460', 'enhancement',
     g_q12, 1, 'P3 必做100題', 'Q12a', '答案單位：盆'),
    (topic7,
     '承上題，月季花有 460 盆，再搬來 264 盆牡丹花。月季花和牡丹花一共有多少盆？',
     'fill_in', NULL, '724', 'enhancement',
     g_q12, 2, 'P3 必做100題', 'Q12b', '答案單位：盆');
END $q12$;

-- Q13 a/b: 故事書與畫冊 — 拆成兩條 sub-question
DO $q13$
DECLARE
  g_q13 uuid := gen_random_uuid();
  topic7 uuid := (SELECT id FROM curriculum_topics WHERE lesson_number = 7);
BEGIN
  INSERT INTO assessment_questions
    (topic_id, question_text, question_type, options, correct_answer, difficulty_tier,
     group_id, sub_order, source_paper, source_question, notes)
  VALUES
    (topic7,
     '一本畫冊 21 元，一本故事書比一本畫冊貴 9 元。一本故事書多少元？',
     'fill_in', NULL, '30', 'enhancement',
     g_q13, 1, 'P3 必做100題', 'Q13a', '答案單位：元'),
    (topic7,
     '承上題，一本故事書 30 元，一本畫冊 21 元。買一本故事書和一本畫冊一共需要多少元？',
     'fill_in', NULL, '51', 'enhancement',
     g_q13, 2, 'P3 必做100題', 'Q13b', '答案單位：元');
END $q13$;

-- ============================================================================
-- BATCH 2: P3 必做100題 第二單元 乘加和乘減混合計算 (Q19-Q34)
-- Maps to: 大單元 6 乘法（二）lesson 12 倍數關係與乘法綜合應用題
-- (Lesson 12 explicitly covers 乘加、乘減混合應用題)
-- ============================================================================

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
-- Q19-22: 乘+/- 兩步計算 → enhancement
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '18 + 4 × 27 = ?', 'fill_in', NULL, '126', 'enhancement', 'P3 必做100題', 'Q19', '先乘後加'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '297 - 5 × 38 = ?', 'fill_in', NULL, '107', 'enhancement', 'P3 必做100題', 'Q20', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '11 + 32 × 6 = ?', 'fill_in', NULL, '203', 'enhancement', 'P3 必做100題', 'Q21', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '240 - 19 × 8 = ?', 'fill_in', NULL, '88', 'enhancement', 'P3 必做100題', 'Q22', NULL),

-- Q23-Q24: 括號 + 乘法 → enhancement
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '(25 + 47) × 7 = ?', 'fill_in', NULL, '504', 'enhancement', 'P3 必做100題', 'Q23', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '9 × (272 - 19) = ?', 'fill_in', NULL, '2277', 'enhancement', 'P3 必做100題', 'Q24', NULL),

-- Q25-Q26: 乘+乘 (4 ops) → advanced
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '8 × 42 - 35 × 5 = ?', 'fill_in', NULL, '161', 'advanced', 'P3 必做100題', 'Q25', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '78 × 6 + 4 × 26 = ?', 'fill_in', NULL, '572', 'advanced', 'P3 必做100題', 'Q26', NULL),

-- Q27 MC: 乘加混合
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '25 × 7 + 34 + 18 × 6 = ?', 'multiple_choice',
  '["A. 227", "B. 317", "C. 174", "D. 376"]'::jsonb, 'B. 317', 'advanced', 'P3 必做100題', 'Q27', NULL),

-- Q28 MC: 哪個算式結果最大
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '下列哪一題算式的計算結果是最大的？', 'multiple_choice',
  '["A. 23 + 18 × 5", "B. 23 + (18 × 5)", "C. (23 + 18) × 5", "D. 23 × 5 + 18"]'::jsonb,
  'C. (23 + 18) × 5', 'advanced', 'P3 必做100題', 'Q28',
  'A=113, B=113, C=205, D=133'),

-- Q30: 文具店買筆 (Q29 涉及方框圖示，跳過待圖片處理)
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '海倫到文具店買文具，每隻鋼筆 18 元，每盒鉛筆 16 元。海倫想買 3 隻鋼筆和 5 盒鉛筆，一共需要付多少錢？',
  'calculation', NULL, '134', 'advanced', 'P3 必做100題', 'Q30',
  '18×3+16×5=54+80=134。答案單位：元'),

-- Q31: 簽字筆+熒光筆
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '一盒簽字筆有 25 支，一盒熒光筆有 16 支。文具店有簽字筆及熒光筆各 5 盒，即共有簽字筆和熒光筆多少支？',
  'calculation', NULL, '205', 'enhancement', 'P3 必做100題', 'Q31',
  '25×5+16×5=125+80=205。答案單位：支'),

-- Q32: 水果店菠蘿
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '水果店有 6 箱菠蘿，每箱重 37 公斤。上午賣去 4 箱，下午賣去 18 公斤。水果店今天共賣出菠蘿多少公斤？',
  'calculation', NULL, '166', 'enhancement', 'P3 必做100題', 'Q32',
  '37×4+18=148+18=166。答案單位：公斤'),

-- Q33: 巴士座位
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '一輛巴士上層有 56 個座位，下層有 45 個座位。學校春遊租了 7 輛巴士，共有座位多少個？',
  'calculation', NULL, '707', 'enhancement', 'P3 必做100題', 'Q33',
  '(56+45)×7=101×7=707。答案單位：個'),

-- Q34: 平板電腦
((SELECT id FROM curriculum_topics WHERE lesson_number = 12),
  '學校原有平板電腦 285 部，現再為每個課室添置 7 部。學校有 36 個課室，現在學校共有多少部平板電腦？',
  'calculation', NULL, '537', 'advanced', 'P3 必做100題', 'Q34',
  '285+7×36=285+252=537。答案單位：部');

-- ============================================================================
-- BATCH 3: P3 必做100題 第三單元 三角形 (Q37-Q41 T/F, Q44-Q47 MC; 跳過圖片題)
-- Maps to: 大單元 14 三角形 lesson 29 三角形的分類與特徵
-- 跳過 (defer to Round 2): Q35 (識別圖形), Q36 (數銳角三角形), Q42-Q43 (圖形分類), Q48 (繪圖)
-- ============================================================================

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
-- Q37-41: T/F 概念題 → basic (single concept check)
((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '判斷對錯：有一個角是銳角的三角形可能是等腰三角形。', 'multiple_choice',
  '["✓ 對", "✗ 錯"]'::jsonb, '✓ 對', 'basic', 'P3 必做100題', 'Q37',
  '等腰三角形可以是銳角三角形'),

((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '判斷對錯：有兩條邊長相等的三角形稱為等邊三角形。', 'multiple_choice',
  '["✓ 對", "✗ 錯"]'::jsonb, '✗ 錯', 'basic', 'P3 必做100題', 'Q38',
  '兩條邊相等是等腰三角形，不是等邊三角形'),

((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '判斷對錯：三角形的兩邊之和可以等於第三邊。', 'multiple_choice',
  '["✓ 對", "✗ 錯"]'::jsonb, '✗ 錯', 'basic', 'P3 必做100題', 'Q39',
  '兩邊之和必須大於第三邊'),

((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '判斷對錯：三角形任意兩邊長度之和一定比第三邊長。', 'multiple_choice',
  '["✓ 對", "✗ 錯"]'::jsonb, '✓ 對', 'basic', 'P3 必做100題', 'Q40',
  '三角形不等式定理'),

((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '判斷對錯：三根長度相等的小棒能圍成一個等腰三角形。', 'multiple_choice',
  '["✓ 對", "✗ 錯"]'::jsonb, '✓ 對', 'basic', 'P3 必做100題', 'Q41',
  '等邊三角形也是等腰三角形（特殊情況）'),

-- Q44: MC 三角形邊長判斷
((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '三角形三條邊長分別為 6cm、6cm、6cm，這個三角形是？', 'multiple_choice',
  '["A. 等腰直角三角形", "B. 等邊三角形", "C. 鈍角三角形", "D. 直角三角形"]'::jsonb,
  'B. 等邊三角形', 'basic', 'P3 必做100題', 'Q44', '三邊相等 = 等邊'),

-- Q45-Q46: MC 哪組能組成三角形
((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '下列各組線段能組成三角形的是？', 'multiple_choice',
  '["A. 3cm, 3cm, 6cm", "B. 2cm, 3cm, 6cm", "C. 5cm, 5cm, 12cm", "D. 4cm, 98cm, 101cm"]'::jsonb,
  'D. 4cm, 98cm, 101cm', 'enhancement', 'P3 必做100題', 'Q45',
  '應用三角形不等式：兩短邊之和 > 第三邊'),

((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '下列各組線段能組成三角形的是？', 'multiple_choice',
  '["A. 2cm, 2cm, 4cm", "B. 7cm, 10cm, 19cm", "C. 4cm, 5cm, 6cm", "D. 15cm, 16cm, 32cm"]'::jsonb,
  'C. 4cm, 5cm, 6cm', 'enhancement', 'P3 必做100題', 'Q46', NULL),

-- Q47: MC 木條長度
((SELECT id FROM curriculum_topics WHERE lesson_number = 29),
  '有兩根木條，它們的長分別為 70cm 和 80cm，如果要釘一個三角形木架，那麼下列四根木條中應選取？',
  'multiple_choice',
  '["A. 85cm 長的木條", "B. 150cm 長的木條", "C. 200cm 長的木條", "D. 10cm 長的木條"]'::jsonb,
  'A. 85cm 長的木條', 'enhancement', 'P3 必做100題', 'Q47',
  '第三邊範圍：(80-70, 80+70)=(10, 150)，唯一在此範圍內的是 85cm');

-- ============================================================================
-- BATCH 4: P3 必做100題 第五單元 分數的認識 (純文字題；圖形題 Q49/Q50/Q54 跳過)
-- Maps to: 大單元 11 分數的初步認識（一）lesson 24 分數的意義與等分概念
--          大單元 12 分數的初步認識（二）lesson 26 同分母/同分子分數大小比較
-- ============================================================================

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
-- Q51 a/b 用 group: 分數含義 (5/12 是 5 個 1/12, 3/7 是 3 個 1/7)
-- 改寫成兩條獨立 fill-in，因為兩個 blanks 答案不同
-- 為咗一致同 Q12/Q13 處理方式，用 group_id
-- (skipping: 因為 Q51 嘅兩個 blanks 都係考分數含義，分開比較清晰)
-- => 為簡化，直接 inline 兩個關連 sub-questions

-- Q52: 西瓜分8份 (兩個 blanks: 每份 1/8, 3 份 3/8)
-- 同樣用 group

-- (group inserts moved below in DO blocks)

-- Q53: MC 分數判斷
((SELECT id FROM curriculum_topics WHERE lesson_number = 24),
  '下列哪一項是正確的？', 'multiple_choice',
  '["A. 1/6 = 6", "B. 1/6 = 1", "C. 6/6 = 1", "D. 6/6 = 6"]'::jsonb,
  'C. 6/6 = 1', 'basic', 'P3 必做100題', 'Q53', '分子=分母即等於 1'),

-- Q55: 媽媽買水果 (分數應用題單問)
((SELECT id FROM curriculum_topics WHERE lesson_number = 25),
  '媽媽買了 10 個水果，其中 3/5 是蘋果，其餘的是梨。媽媽買的蘋果幾多個？',
  'fill_in', NULL, '6', 'enhancement', 'P3 必做100題', 'Q55',
  '10 ÷ 5 × 3 = 6。答案單位：個'),

-- Q56-Q63: 分數大小比較 → lesson 26
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '比較分數大小，喺橫線上填上 >、< 或 = ：5/14 ___ 5/27', 'fill_in', NULL, '>', 'basic', 'P3 必做100題', 'Q56',
  '同分子，分母大反而細'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '比較分數大小，喺橫線上填上 >、< 或 = ：1/4 ___ 3/4', 'fill_in', NULL, '<', 'basic', 'P3 必做100題', 'Q57',
  '同分母，分子大就大'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '比較分數大小，喺橫線上填上 >、< 或 = ：4/18 ___ 7/18', 'fill_in', NULL, '<', 'basic', 'P3 必做100題', 'Q58', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '比較分數大小，喺橫線上填上 >、< 或 = ：8/15 ___ 8/21', 'fill_in', NULL, '>', 'basic', 'P3 必做100題', 'Q59', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '比較分數大小，喺橫線上填上 >、< 或 = ：1 ___ 13/13', 'fill_in', NULL, '=', 'basic', 'P3 必做100題', 'Q60',
  '13/13 = 1'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '比較分數大小，喺橫線上填上 >、< 或 = ：4/4 ___ 10/11', 'fill_in', NULL, '>', 'basic', 'P3 必做100題', 'Q61',
  '4/4 = 1, 10/11 < 1'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '比較分數大小，喺橫線上填上 >、< 或 = ：8/8 ___ 18/18', 'fill_in', NULL, '=', 'basic', 'P3 必做100題', 'Q62',
  '兩者都等於 1'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '比較分數大小，喺橫線上填上 >、< 或 = ：6/15 ___ 8/15', 'fill_in', NULL, '<', 'basic', 'P3 必做100題', 'Q63', NULL);

-- Q51 a/b: 分數含義填空 (5/12 是 5 個 1/12; 3/7 是 3 個 1/7)
DO $q51$
DECLARE
  g_q51 uuid := gen_random_uuid();
  topic24 uuid := (SELECT id FROM curriculum_topics WHERE lesson_number = 24);
BEGIN
  INSERT INTO assessment_questions
    (topic_id, question_text, question_type, options, correct_answer, difficulty_tier,
     group_id, sub_order, source_paper, source_question, notes)
  VALUES
    (topic24, '5/12 是 ___ 個 1/12', 'fill_in', NULL, '5', 'basic',
     g_q51, 1, 'P3 必做100題', 'Q51a', '考分數的構成'),
    (topic24, '3/7 是 3 個 ___ （請填分數，例如 1/n）', 'fill_in', NULL, '1/7', 'basic',
     g_q51, 2, 'P3 必做100題', 'Q51b', '考分數的構成');
END $q51$;

-- Q52 a/b: 西瓜分 8 份
DO $q52$
DECLARE
  g_q52 uuid := gen_random_uuid();
  topic25 uuid := (SELECT id FROM curriculum_topics WHERE lesson_number = 25);
BEGIN
  INSERT INTO assessment_questions
    (topic_id, question_text, question_type, options, correct_answer, difficulty_tier,
     group_id, sub_order, source_paper, source_question, notes)
  VALUES
    (topic25, '把一個西瓜平均分成 8 份，每份是整個西瓜的 ___ （請填分數）', 'fill_in', NULL, '1/8', 'basic',
     g_q52, 1, 'P3 必做100題', 'Q52a', NULL),
    (topic25, '承上題，3 份是整個西瓜的 ___ （請填分數）', 'fill_in', NULL, '3/8', 'basic',
     g_q52, 2, 'P3 必做100題', 'Q52b', NULL);
END $q52$;

-- ============================================================================
-- BATCH 5: P3 必做100題 第五單元分數 排列題 (Q64-Q66)
-- Maps to: 大單元 12 分數的初步認識（二）lesson 26 同分母/同分子分數大小比較
-- ============================================================================

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '把下列分數由大至小排列：11/12, 5/12, 7/12（請用 > 連接，例如 a/b > c/d > e/f）',
  'fill_in', NULL, '11/12 > 7/12 > 5/12', 'enhancement', 'P3 必做100題', 'Q64',
  '同分母比較分子'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '把下列分數由大至小排列：17/25, 9/25, 23/25（請用 > 連接）',
  'fill_in', NULL, '23/25 > 17/25 > 9/25', 'enhancement', 'P3 必做100題', 'Q65', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 26),
  '把下列分數由大至小排列：8/13, 8/15, 11/13（請用 > 連接）',
  'fill_in', NULL, '11/13 > 8/13 > 8/15', 'advanced', 'P3 必做100題', 'Q66',
  '混合：11/13 vs 8/13 同分母 → 11>8；8/13 vs 8/15 同分子 → 分母細反而大');

-- ============================================================================
-- BATCH 6: P3 必做100題 第六單元 同分母分數加減 (Q67-Q79)
-- Maps to: 大單元 12 分數的初步認識（二）lesson 27 分數綜合應用題專項突破
-- (Note: HK P3 curriculum 大綱 將同分母分數加減歸入分數綜合應用)
-- ============================================================================

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
-- Q67-Q73: 純計算 → basic (single op)
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '2/12 + 5/12 = ?（請填分數）', 'fill_in', NULL, '7/12', 'basic', 'P3 必做100題', 'Q67', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '12/24 - 7/24 = ?（請填分數）', 'fill_in', NULL, '5/24', 'basic', 'P3 必做100題', 'Q68', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '7/11 + 2/11 = ?（請填分數）', 'fill_in', NULL, '9/11', 'basic', 'P3 必做100題', 'Q69', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '1/8 + 4/8 = ?（請填分數）', 'fill_in', NULL, '5/8', 'basic', 'P3 必做100題', 'Q70', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '13/18 - 6/18 = ?（請填分數）', 'fill_in', NULL, '7/18', 'basic', 'P3 必做100題', 'Q71', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '1 - 5/16 = ?（請填分數）', 'fill_in', NULL, '11/16', 'enhancement', 'P3 必做100題', 'Q72',
  '1 = 16/16，16/16 - 5/16 = 11/16'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '12/25 + 7/25 + 2/25 = ?（請填分數）', 'fill_in', NULL, '21/25', 'enhancement', 'P3 必做100題', 'Q73',
  '3 個分數連加'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '1 - 4/15 - 3/15 = ?（請填分數）', 'fill_in', NULL, '8/15', 'enhancement', 'P3 必做100題', 'Q74',
  '15/15 - 4/15 - 3/15 = 8/15'),

-- Q75-Q79: word problems 應用題
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '莫莉喝了 5/17 升果汁，諾拉喝了 3/17 升。他們共喝了果汁多少升？（請填分數，例如 a/b）',
  'fill_in', NULL, '8/17', 'basic', 'P3 必做100題', 'Q75', '答案單位：升'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '有一堆沙子，第一天運走沙子 2/7 噸，第二天運走沙子 3/7 噸。兩天一共運走沙子多少噸？（請填分數）',
  'fill_in', NULL, '5/7', 'basic', 'P3 必做100題', 'Q76', '答案單位：噸'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '湯姆原有朱古力 11/13 盒，吃了 3/13 盒。朱古力還剩多少盒？（請填分數）',
  'fill_in', NULL, '8/13', 'basic', 'P3 必做100題', 'Q77', '答案單位：盒'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '有一根長度為 1 米的繩子，第一次剪去 3/12 米，第二次剪去 4/12 米，還剩多少米？（請填分數）',
  'fill_in', NULL, '5/12', 'enhancement', 'P3 必做100題', 'Q78',
  '1 - 3/12 - 4/12 = 12/12 - 7/12 = 5/12。答案單位：米'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 27),
  '一個蛋糕剩 6/7 塊，媽媽吃了 1/7 塊，艾拉吃了 3/7 塊，還剩多少塊？（請填分數）',
  'fill_in', NULL, '2/7', 'enhancement', 'P3 必做100題', 'Q79',
  '6/7 - 1/7 - 3/7 = 2/7。答案單位：塊');

-- ============================================================================
-- BATCH 7: P3 必做100題 第七單元 容量 (Q80-Q96)
-- Maps to: 大單元 15 容量
--   lesson 31 升、毫升認識與量杯刻度解碼 (recognition, unit fill, conversion)
--   lesson 32 容量綜合應用題（倒入倒出）(comparison, application)
-- ============================================================================

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
-- Q80: A/B 水壺哪個容量大 (倒入碗) → lesson 32
((SELECT id FROM curriculum_topics WHERE lesson_number = 32),
  'A、B 兩個水壺，裝滿水後倒入同樣的碗中。A 壺能倒滿 9 碗，B 壺能倒滿 10 碗。哪個水壺的容量大？（請填 A 或 B）',
  'fill_in', NULL, 'B', 'basic', 'P3 必做100題', 'Q80', NULL),

-- Q81: 兩瓶橙汁哪個大 MC (concept: cup size unknown) → lesson 32
((SELECT id FROM curriculum_topics WHERE lesson_number = 32),
  '第一瓶橙汁可以倒滿 6 杯，第二瓶橙汁也可以倒滿 6 杯，這兩瓶橙汁的容量哪個大？',
  'multiple_choice',
  '["A. 第一瓶容量大", "B. 兩瓶橙汁容量一樣大", "C. 無法比較"]'::jsonb,
  'C. 無法比較', 'enhancement', 'P3 必做100題', 'Q81',
  '陷阱：未說杯子大小是否相同'),

-- Q82-Q89: 填合適容量單位 (升 L 或 毫升 mL) → lesson 31
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '一個熱水瓶的容量大約是 3 ___（請填 L 或 mL）',
  'fill_in', NULL, 'L', 'basic', 'P3 必做100題', 'Q82', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '一個碗的容量大約是 900 ___（請填 L 或 mL）',
  'fill_in', NULL, 'mL', 'basic', 'P3 必做100題', 'Q83', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '一個水杯的容量大約是 500 ___（請填 L 或 mL）',
  'fill_in', NULL, 'mL', 'basic', 'P3 必做100題', 'Q84', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '一個電飯煲的容量大約是 2 ___（請填 L 或 mL）',
  'fill_in', NULL, 'L', 'basic', 'P3 必做100題', 'Q85', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '一杯茶水 100 ___（請填 L 或 mL）',
  'fill_in', NULL, 'mL', 'basic', 'P3 必做100題', 'Q86', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '一瓶牛奶 220 ___（請填 L 或 mL）',
  'fill_in', NULL, 'mL', 'basic', 'P3 必做100題', 'Q87', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '一桶食用油 7 ___（請填 L 或 mL）',
  'fill_in', NULL, 'L', 'basic', 'P3 必做100題', 'Q88', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '一瓶膠水 50 ___（請填 L 或 mL）',
  'fill_in', NULL, 'mL', 'basic', 'P3 必做100題', 'Q89', NULL),

-- Q90-Q96: 容量單位換算 → lesson 31
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '53 升 = ___ 毫升', 'fill_in', NULL, '53000', 'basic', 'P3 必做100題', 'Q90',
  '1 升 = 1000 毫升'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '65000 毫升 = ___ 升', 'fill_in', NULL, '65', 'basic', 'P3 必做100題', 'Q91', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '5 升 68 毫升 = ___ 毫升', 'fill_in', NULL, '5068', 'enhancement', 'P3 必做100題', 'Q92',
  '5×1000 + 68 = 5068'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '5 L 320 mL = ___ mL', 'fill_in', NULL, '5320', 'enhancement', 'P3 必做100題', 'Q93', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '2 L 75 mL = ___ mL', 'fill_in', NULL, '2075', 'enhancement', 'P3 必做100題', 'Q94', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '6 L 7 mL = ___ mL', 'fill_in', NULL, '6007', 'enhancement', 'P3 必做100題', 'Q95',
  '注意「7」要補 0 變成 007'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 31),
  '5 L 30 mL = ___ mL', 'fill_in', NULL, '5030', 'enhancement', 'P3 必做100題', 'Q96', NULL);

COMMIT;

-- Sanity check after running:
-- SELECT count(*) FROM assessment_questions WHERE source_paper = 'P3 必做100題';  -- 18 so far
-- SELECT difficulty_tier, count(*) FROM assessment_questions
--   WHERE source_paper = 'P3 必做100題' GROUP BY difficulty_tier;
