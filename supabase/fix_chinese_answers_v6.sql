-- fix_chinese_answers_v6.sql
-- Converts all 31 remaining comma-format (元角 / 商餘 / 時分) questions to MC.
-- Step 1: strip format-hint parentheticals and ___,___ placeholders from all 31.
-- Step 2: individual MC conversion with close distractors.
-- Run in Supabase SQL Editor.

BEGIN;

-- ════════════════════════════════════════════════════════════
-- Step 1: bulk question_text cleanup
-- Removes patterns like（答案格式：元,角，例：89,4）and（元,角格式，例：32,4）
-- and replaces ___,___ with ？
-- ════════════════════════════════════════════════════════════
UPDATE assessment_questions
SET question_text = trim(regexp_replace(
  replace(question_text, '___,___', '？'),
  '（[^）]*(格式|例：)[^）]*）',
  '', 'g'))
WHERE id IN (
  '010eed86-9a2f-4a4f-a253-d94d41456b41',
  '0f0cc83f-11be-4418-bfdf-fc55d4fb47a1',
  '139e6f76-a403-4824-85ce-7ae2a522bb22',
  '18f5a333-d6a4-4d00-a462-27a81a90d5b4',
  '1a86754c-fa5d-4232-98d1-e1887548cd3d',
  '1b1c1234-564b-41cf-8045-8d9c05012105',
  '212fe6c8-5645-4049-9e5e-f1f3d6a29068',
  '24b18076-f1cb-47c8-9eec-a0727f240cf7',
  '24dc8f31-5546-4531-ae93-21d51420560f',
  '381bd214-9019-4f16-9c33-2e59b0bc893f',
  '3a76049c-f765-4860-8c86-9b1ef8b96791',
  '42bf2e20-9219-4bdd-afa1-822700322a39',
  '485f5621-d36b-48af-a509-38cc25fc4462',
  '4c94225d-d072-4e37-9583-7f9bc3ea4b5d',
  '50e6bfbc-e1b0-435c-b93b-db17289bd28c',
  '5416e516-7917-407e-af31-f71d41700659',
  '635bb4e3-c2c1-4f3b-8efe-965d470bb520',
  '695d8f61-e4c1-48c9-bf48-e0fc44080f3f',
  'a108e40a-904e-41b1-83e1-47762e0a190e',
  'ac0c6b41-0c80-481e-a3ce-9ed0dd5decb5',
  'aff0fe2c-62e0-427d-93ef-84448b8bf9d5',
  'b1a1bb03-283b-40ca-a28c-5f6ccb299f6c',
  'c013c609-b306-4f8d-ac2b-0c4ec43adf86',
  'c92fbec9-e430-47a4-a291-19b55735e7c8',
  'ccce3bab-2250-4f1d-b548-d50f23793ac7',
  'ce31c26c-6551-4069-90ce-e131c0cc8565',
  'd30c6d94-24ff-410a-8055-6eaf9bba8927',
  'd31507ca-7820-4ef6-b6a9-c8ca45456ee9',
  'd38c356f-491f-4fae-b1d1-62225c41a31c',
  'ed375ddd-a8b7-441a-9862-370f58fefdd2',
  'eec46984-ceb8-4df7-bc9a-6a2db11a4c13'
);

-- ════════════════════════════════════════════════════════════
-- Step 2a: TIME questions (小時,分鐘)
-- ════════════════════════════════════════════════════════════

-- 飛往巴黎(21:00) 與 飛往北京(16:15) 相差 → 4小時45分鐘
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 4小時45分鐘","B. 4小時35分鐘","C. 4小時55分鐘","D. 5小時45分鐘"]'::jsonb,
  correct_answer = 'A. 4小時45分鐘'
WHERE id = '24dc8f31-5546-4531-ae93-21d51420560f';

-- 老師 20:23 開始，21:35 完成 → 1小時12分鐘
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 1小時12分鐘","B. 1小時2分鐘","C. 1小時22分鐘","D. 2小時12分鐘"]'::jsonb,
  correct_answer = 'A. 1小時12分鐘'
WHERE id = '42bf2e20-9219-4bdd-afa1-822700322a39';

-- 香港→南京 13:15 出發，14:02 到達 → 47分鐘
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 47分鐘","B. 37分鐘","C. 57分鐘","D. 1小時7分鐘"]'::jsonb,
  correct_answer = 'A. 47分鐘'
WHERE id = '5416e516-7917-407e-af31-f71d41700659';

-- 飛機原定 20:43，實際 22:12，遲了 → 1小時29分鐘
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 1小時29分鐘","B. 1小時19分鐘","C. 1小時39分鐘","D. 2小時29分鐘"]'::jsonb,
  correct_answer = 'A. 1小時29分鐘'
WHERE id = 'b1a1bb03-283b-40ca-a28c-5f6ccb299f6c';

-- SQ710 12:29，JL513 13:56，SQ710 比 JL513 早 → 1小時27分鐘
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 1小時27分鐘","B. 1小時17分鐘","C. 1小時37分鐘","D. 2小時7分鐘"]'::jsonb,
  correct_answer = 'A. 1小時27分鐘'
WHERE id = 'ed375ddd-a8b7-441a-9862-370f58fefdd2';

-- ════════════════════════════════════════════════════════════
-- Step 2b: 元/角 questions
-- ════════════════════════════════════════════════════════════

-- 巧克力28元2角×2 + 餅乾16元5角×2 → 89元4角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 89元4角","B. 88元4角","C. 89元5角","D. 90元4角"]'::jsonb,
  correct_answer = 'A. 89元4角'
WHERE id = '010eed86-9a2f-4a4f-a253-d94d41456b41';

-- 草莓布丁23元8角×6 → 142元8角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 142元8角","B. 141元8角","C. 142元9角","D. 143元8角"]'::jsonb,
  correct_answer = 'A. 142元8角'
WHERE id = '0f0cc83f-11be-4418-bfdf-fc55d4fb47a1';

-- 111元÷6 → 18元5角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 18元5角","B. 17元5角","C. 18元6角","D. 19元5角"]'::jsonb,
  correct_answer = 'A. 18元5角'
WHERE id = '212fe6c8-5645-4049-9e5e-f1f3d6a29068';

-- 3元2角 + 10元4角 → 13元6角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 13元6角","B. 12元6角","C. 13元7角","D. 14元6角"]'::jsonb,
  correct_answer = 'A. 13元6角'
WHERE id = '24b18076-f1cb-47c8-9eec-a0727f240cf7';

-- 162元÷5 → 32元4角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 32元4角","B. 31元4角","C. 32元5角","D. 33元4角"]'::jsonb,
  correct_answer = 'A. 32元4角'
WHERE id = '381bd214-9019-4f16-9c33-2e59b0bc893f';

-- 70元 + 6元7角×4 → 96元8角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 96元8角","B. 95元8角","C. 96元9角","D. 97元8角"]'::jsonb,
  correct_answer = 'A. 96元8角'
WHERE id = '3a76049c-f765-4860-8c86-9b1ef8b96791';

-- 326元－38元8角 → 287元2角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 287元2角","B. 286元2角","C. 287元3角","D. 288元2角"]'::jsonb,
  correct_answer = 'A. 287元2角'
WHERE id = '485f5621-d36b-48af-a509-38cc25fc4462';

-- 85元9角×3 → 257元7角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 257元7角","B. 256元7角","C. 257元8角","D. 258元7角"]'::jsonb,
  correct_answer = 'A. 257元7角'
WHERE id = '50e6bfbc-e1b0-435c-b93b-db17289bd28c';

-- 98元4角÷4 → 24元6角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 24元6角","B. 23元6角","C. 24元7角","D. 25元6角"]'::jsonb,
  correct_answer = 'A. 24元6角'
WHERE id = 'a108e40a-904e-41b1-83e1-47762e0a190e';

-- 53元9角×4 → 215元6角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 215元6角","B. 214元6角","C. 215元7角","D. 216元6角"]'::jsonb,
  correct_answer = 'A. 215元6角'
WHERE id = 'ac0c6b41-0c80-481e-a3ce-9ed0dd5decb5';

-- 巧克力28元2角×3 + 餅乾16元5角 → 101元1角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 101元1角","B. 100元1角","C. 101元2角","D. 102元1角"]'::jsonb,
  correct_answer = 'A. 101元1角'
WHERE id = 'c013c609-b306-4f8d-ac2b-0c4ec43adf86';

-- 312元6角 - 105元8角 → 206元8角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 206元8角","B. 205元8角","C. 206元9角","D. 207元8角"]'::jsonb,
  correct_answer = 'A. 206元8角'
WHERE id = 'c92fbec9-e430-47a4-a291-19b55735e7c8';

-- 100元 - 9元5角×4 = 62元 (找回整數元)
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 62元","B. 60元","C. 61元","D. 63元"]'::jsonb,
  correct_answer = 'A. 62元'
WHERE id = 'ce31c26c-6551-4069-90ce-e131c0cc8565';

-- 12元8角×9 → 115元2角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 115元2角","B. 114元2角","C. 115元3角","D. 116元2角"]'::jsonb,
  correct_answer = 'A. 115元2角'
WHERE id = 'd30c6d94-24ff-410a-8055-6eaf9bba8927';

-- 71元÷2 → 35元5角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 35元5角","B. 34元5角","C. 35元6角","D. 36元5角"]'::jsonb,
  correct_answer = 'A. 35元5角'
WHERE id = 'd38c356f-491f-4fae-b1d1-62225c41a31c';

-- 38元÷5 → 7元6角
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 7元6角","B. 6元6角","C. 7元7角","D. 8元6角"]'::jsonb,
  correct_answer = 'A. 7元6角'
WHERE id = 'eec46984-ceb8-4df7-bc9a-6a2db11a4c13';

-- ════════════════════════════════════════════════════════════
-- Step 2c: 商/餘數 questions
-- ════════════════════════════════════════════════════════════

-- 229 ÷ 7 = 商32餘5
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商32餘5","B. 商33餘5","C. 商32餘4","D. 商31餘5"]'::jsonb,
  correct_answer = 'A. 商32餘5'
WHERE id = '139e6f76-a403-4824-85ce-7ae2a522bb22';

-- 751 ÷ 7 = 商107餘2
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商107餘2","B. 商106餘2","C. 商107餘3","D. 商108餘2"]'::jsonb,
  correct_answer = 'A. 商107餘2'
WHERE id = '18f5a333-d6a4-4d00-a462-27a81a90d5b4';

-- 33 ÷ 4 = 商8餘1
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商8餘1","B. 商7餘1","C. 商8餘2","D. 商9餘1"]'::jsonb,
  correct_answer = 'A. 商8餘1'
WHERE id = '1a86754c-fa5d-4232-98d1-e1887548cd3d';

-- 716 ÷ 7 = 商102餘2
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商102餘2","B. 商101餘2","C. 商102餘3","D. 商103餘2"]'::jsonb,
  correct_answer = 'A. 商102餘2'
WHERE id = '1b1c1234-564b-41cf-8045-8d9c05012105';

-- 44 ÷ 5 = 商8餘4
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商8餘4","B. 商7餘4","C. 商8餘3","D. 商9餘4"]'::jsonb,
  correct_answer = 'A. 商8餘4'
WHERE id = '4c94225d-d072-4e37-9583-7f9bc3ea4b5d';

-- 374 ÷ 5 = 商74餘4
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商74餘4","B. 商73餘4","C. 商74餘3","D. 商75餘4"]'::jsonb,
  correct_answer = 'A. 商74餘4'
WHERE id = '635bb4e3-c2c1-4f3b-8efe-965d470bb520';

-- 247 ÷ 2 = 商123餘1
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商123餘1","B. 商122餘1","C. 商123餘0","D. 商124餘1"]'::jsonb,
  correct_answer = 'A. 商123餘1'
WHERE id = '695d8f61-e4c1-48c9-bf48-e0fc44080f3f';

-- 287 ÷ 5 = 商57餘2
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商57餘2","B. 商56餘2","C. 商57餘1","D. 商58餘2"]'::jsonb,
  correct_answer = 'A. 商57餘2'
WHERE id = 'aff0fe2c-62e0-427d-93ef-84448b8bf9d5';

-- 80 ÷ 6 = 商13餘2
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商13餘2","B. 商12餘2","C. 商13餘3","D. 商14餘2"]'::jsonb,
  correct_answer = 'A. 商13餘2'
WHERE id = 'ccce3bab-2250-4f1d-b548-d50f23793ac7';

-- 89 ÷ 6 = 商14餘5
UPDATE assessment_questions SET
  question_type  = 'multiple_choice',
  options        = '["A. 商14餘5","B. 商13餘5","C. 商14餘4","D. 商15餘5"]'::jsonb,
  correct_answer = 'A. 商14餘5'
WHERE id = 'd31507ca-7820-4ef6-b6a9-c8ca45456ee9';

COMMIT;
