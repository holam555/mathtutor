-- fix_chinese_answers_v2.sql
-- Fixes all 26 remaining questions with Chinese-text answers.
-- Matched by exact UUID from assessment_questions_rows.csv export.
-- Run in Supabase SQL Editor.

BEGIN;

-- ════════════════════════════════════════════════════════════
-- CAT A: 元/角 still using Chinese format
-- ════════════════════════════════════════════════════════════

-- 326元－38元8角 → 287,2
UPDATE assessment_questions SET
  correct_answer = '287,2',
  question_text  = '326元－38元8角=？（答案格式：元,角，例：287,2）'
WHERE id = '485f5621-d36b-48af-a509-38cc25fc4462';

-- ════════════════════════════════════════════════════════════
-- CAT B: Division remainder still using Chinese format
-- ════════════════════════════════════════════════════════════

-- 44÷5 → 8,4
UPDATE assessment_questions SET
  correct_answer = '8,4',
  question_text  = '44÷5=？（答案格式：商,餘數，例：8,4）'
WHERE id = '4c94225d-d072-4e37-9583-7f9bc3ea4b5d';

-- ════════════════════════════════════════════════════════════
-- CAT C: Time duration (小時,分鐘)
-- ════════════════════════════════════════════════════════════

-- 飛往巴黎與飛往北京 → 4,45
UPDATE assessment_questions SET
  correct_answer = '4,45',
  question_text  = '香港國際機場航機資料：倫敦 07:00、北京 16:15、東京 17:00、巴黎 21:00、大阪 21:20。飛往巴黎與飛往北京的航班起飛時間相差多少？（答案格式：小時,分鐘，例：4,45）'
WHERE id = '24dc8f31-5546-4531-ae93-21d51420560f';

-- 升,毫升 → 5,5
UPDATE assessment_questions SET
  correct_answer = '5,5',
  question_text  = '5005 毫升 = ___ 升 ___ 毫升（答案格式：升,毫升，例：5,5）'
WHERE id = 'effcd52d-0142-46e5-8d05-36322954b1c5';

-- ════════════════════════════════════════════════════════════
-- CAT D: Time with Chinese text → multiple_choice
-- ════════════════════════════════════════════════════════════

-- 1小時6分鐘11秒 (3-part, complex)
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 1小時6分鐘11秒","B. 1小時16分鐘11秒","C. 2小時6分鐘11秒","D. 1小時6分鐘1秒"]'::jsonb,
  correct_answer = 'A. 1小時6分鐘11秒'
WHERE id = '113929bb-bb7b-43b5-8015-6a5921711358';

-- 4月4日 (date answer)
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 4月3日","B. 4月4日","C. 4月5日","D. 3月5日"]'::jsonb,
  correct_answer = 'B. 4月4日'
WHERE id = '1bec063a-bd03-4e3b-9844-e7ecd221ed56';

-- ════════════════════════════════════════════════════════════
-- CAT E: Angle / triangle type identification → multiple_choice
-- ════════════════════════════════════════════════════════════

-- "觀察右圖的角" → 直角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 銳角","B. 直角","C. 鈍角"]'::jsonb,
  correct_answer = 'B. 直角',
  question_text  = replace(question_text, '(銳角/直角/鈍角)', '')
WHERE id = '0d562254-7a81-4db5-8d51-47ef53d57e25';

-- "觀察右圖的角" → 鈍角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 銳角","B. 直角","C. 鈍角"]'::jsonb,
  correct_answer = 'C. 鈍角',
  question_text  = replace(question_text, '(銳角/直角/鈍角)', '')
WHERE id = 'c9c0b382-ee5d-40ba-9979-6427ba58bd3f';

-- "觀察右圖的角" → 銳角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 銳角","B. 直角","C. 鈍角"]'::jsonb,
  correct_answer = 'A. 銳角',
  question_text  = replace(question_text, '(銳角/直角/鈍角)', '')
WHERE id = 'f54f7fa7-21f6-4b04-a09b-5771965cdaa5';

-- "時鐘 E ... 一個_____角" → 鈍 (abbreviated)
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 銳角","B. 直角","C. 鈍角"]'::jsonb,
  correct_answer = 'C. 鈍角',
  question_text  = replace(replace(question_text, '（填：銳/直/鈍）', ''), '_____角', '___角')
WHERE id = '11c17ec3-d431-49ba-82f0-2206795262ff';

-- Triangle by angle type → 銳角三角形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 銳角三角形","B. 直角三角形","C. 鈍角三角形"]'::jsonb,
  correct_answer = 'A. 銳角三角形',
  question_text  = replace(question_text, '(銳角/直角/鈍角三角形)', '')
WHERE id = '1fe9acdc-8d4b-495a-8097-e9e01f6adc61';

-- Triangle by angle type → 鈍角三角形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 銳角三角形","B. 直角三角形","C. 鈍角三角形"]'::jsonb,
  correct_answer = 'C. 鈍角三角形',
  question_text  = replace(question_text, '(銳角/直角/鈍角三角形)', '')
WHERE id = '4c6617f0-1c7c-4919-b562-ea3a48b1ae0d';

-- Triangle by angle type → 銳角三角形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 銳角三角形","B. 直角三角形","C. 鈍角三角形"]'::jsonb,
  correct_answer = 'A. 銳角三角形',
  question_text  = replace(question_text, '(銳角/直角/鈍角三角形)', '')
WHERE id = '96956b10-dd61-43d0-8bce-3f07e67f8b4c';

-- Triangle by angle type → 直角三角形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 銳角三角形","B. 直角三角形","C. 鈍角三角形"]'::jsonb,
  correct_answer = 'B. 直角三角形',
  question_text  = replace(question_text, '(銳角/直角/鈍角三角形)', '')
WHERE id = 'bf5b278f-44a7-4713-90a9-352a5719e0be';

-- Triangle by side type → 不等邊三角形 (first)
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 等腰三角形","B. 等邊三角形","C. 不等邊三角形"]'::jsonb,
  correct_answer = 'C. 不等邊三角形',
  question_text  = replace(question_text, '(等腰/等邊/不等邊三角形)', '')
WHERE id = '0ed7887b-5b79-46a5-bae0-0bc7f21e214e';

-- Triangle by side type → 等邊三角形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 等腰三角形","B. 等邊三角形","C. 不等邊三角形"]'::jsonb,
  correct_answer = 'B. 等邊三角形',
  question_text  = replace(question_text, '(等腰/等邊/不等邊三角形)', '')
WHERE id = '1deb9775-ad2e-4ee8-9c09-7d998f351403';

-- Triangle by side type → 不等邊三角形 (second)
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 等腰三角形","B. 等邊三角形","C. 不等邊三角形"]'::jsonb,
  correct_answer = 'C. 不等邊三角形',
  question_text  = replace(question_text, '(等腰/等邊/不等邊三角形)', '')
WHERE id = '25001231-5df8-4f65-b198-212d323e3645';

-- Triangle by side type → 等腰三角形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 等腰三角形","B. 等邊三角形","C. 不等邊三角形"]'::jsonb,
  correct_answer = 'A. 等腰三角形',
  question_text  = replace(question_text, '(等腰/等邊/不等邊三角形)', '')
WHERE id = '6c6b776e-9fd5-4cdc-b5a5-de362cdc9999';

-- ════════════════════════════════════════════════════════════
-- CAT F: Shape-composition answers → multiple_choice
-- ════════════════════════════════════════════════════════════

-- 不等邊三角形拼接 → 梯形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 正方形","B. 長方形","C. 梯形","D. 菱形"]'::jsonb,
  correct_answer = 'C. 梯形'
WHERE id = '70d5d8a1-c1ef-4b91-a2af-a189243edeec';

-- 等邊三角形拼接 → 菱形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 長方形","B. 正方形","C. 菱形","D. 梯形"]'::jsonb,
  correct_answer = 'C. 菱形'
WHERE id = '73107a7f-abe0-49f9-98a8-082f5a933be2';

-- 直角三角形拼接 → 平行四邊形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 正方形","B. 梯形","C. 菱形","D. 平行四邊形"]'::jsonb,
  correct_answer = 'D. 平行四邊形'
WHERE id = 'be26501f-c03b-47ae-b438-2641f5e25458';

-- 等腰三角形拼接 → 菱形
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 長方形","B. 正方形","C. 梯形","D. 菱形"]'::jsonb,
  correct_answer = 'D. 菱形'
WHERE id = 'fa4b02c8-5006-4678-ab38-18c681871cb2';

-- ════════════════════════════════════════════════════════════
-- CAT G: Clock-face letter-pair answers → multiple_choice
-- ════════════════════════════════════════════════════════════

-- 時鐘__和__構成銳角 → D和F
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. A和B","B. B和E","C. D和F","D. C和E"]'::jsonb,
  correct_answer = 'C. D和F',
  question_text  = replace(question_text, '（格式：X和Y）', '')
WHERE id = '27f4cc11-5eb6-4220-98b0-b766533df307';

-- 時鐘__和__構成直角 → A和C
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. A和C","B. B和D","C. A和B","D. D和F"]'::jsonb,
  correct_answer = 'A. A和C',
  question_text  = replace(question_text, '（格式：X和Y）', '')
WHERE id = 'bc177f0b-b961-4974-b355-02a5cf39f1bc';

-- ════════════════════════════════════════════════════════════
-- CAT H: Street/company name text answers → multiple_choice
-- ════════════════════════════════════════════════════════════

-- 哪一間旅行社收費最貴 → 心心旅行社
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 大大旅行社","B. 心心旅行社","C. 樂樂旅行社","D. 三間一樣貴"]'::jsonb,
  correct_answer = 'B. 心心旅行社'
WHERE id = '6e897541-4eda-4335-8b5f-dbf250a738cf';

-- 與隧道垂直的街道 → 育才街
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 大眾街","B. 樂思街","C. 海濱街","D. 育才街"]'::jsonb,
  correct_answer = 'D. 育才街'
WHERE id = '8f2a61d6-0a8a-4bb4-9824-7315ab6ecbd8';

COMMIT;
