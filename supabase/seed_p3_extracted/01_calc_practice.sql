-- File 1 計算練習 一/二/三 (純文字, 64 條)
-- Source: sub-agent extraction. All cross-checked vs answer PDFs.
-- Lesson mapping notes:
--   3A lesson 3 framed as 三位數加法 — extended to 4-digit (skill is same)
--   3A lesson 5 framed as 三位數減法 — extended to 4-digit
--   3A lesson 6 隔位退位減法 (zero-borrow cases)
--   3A lesson 7 加減混合與括號 (all of 練習三)

BEGIN;

DELETE FROM assessment_questions
  WHERE source_paper IN ('三年級計算練習一', '三年級計算練習二', '三年級計算練習三');

-- ============================================================
-- 三年級計算練習一 – 四位數加減法
-- ============================================================
INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '1118 + 1160 = ?', 'fill_in', NULL, '2278', 'basic', '三年級計算練習一', 'Q1', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '1042 + 1319 = ?', 'fill_in', NULL, '2361', 'basic', '三年級計算練習一', 'Q2', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '1939 + 1820 = ?', 'fill_in', NULL, '3759', 'basic', '三年級計算練習一', 'Q3', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '1598 + 1172 = ?', 'fill_in', NULL, '2770', 'basic', '三年級計算練習一', 'Q4', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '3310 + 2603 = ?', 'fill_in', NULL, '5913', 'basic', '三年級計算練習一', 'Q5', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '3498 + 3058 = ?', 'fill_in', NULL, '6556', 'basic', '三年級計算練習一', 'Q7', '連續進位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '3332 + 2839 = ?', 'fill_in', NULL, '6171', 'basic', '三年級計算練習一', 'Q8', '連續進位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '4643 + 4509 = ?', 'fill_in', NULL, '9152', 'basic', '三年級計算練習一', 'Q10', '連續進位接近萬'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '3645 + 3548 = ?', 'fill_in', NULL, '7193', 'basic', '三年級計算練習一', 'Q13', '連續進位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '4790 + 3688 = ?', 'fill_in', NULL, '8478', 'basic', '三年級計算練習一', 'Q14', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '3887 + 3045 = ?', 'fill_in', NULL, '6932', 'basic', '三年級計算練習一', 'Q15', '連續進位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '2458 - 986 = ?', 'fill_in', NULL, '1472', 'basic', '三年級計算練習一', 'Q16', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '1979 - 1018 = ?', 'fill_in', NULL, '961', 'basic', '三年級計算練習一', 'Q17', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '2261 - 1319 = ?', 'fill_in', NULL, '942', 'basic', '三年級計算練習一', 'Q19', '連續退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '4130 - 2083 = ?', 'fill_in', NULL, '2047', 'basic', '三年級計算練習一', 'Q20', '連續退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '3275 - 2907 = ?', 'fill_in', NULL, '368', 'basic', '三年級計算練習一', 'Q21', '連續退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '4252 - 2233 = ?', 'fill_in', NULL, '2019', 'basic', '三年級計算練習一', 'Q23', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 6),
  '3003 - 1225 = ?', 'fill_in', NULL, '1778', 'basic', '三年級計算練習一', 'Q24', '隔位退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '9806 - 3438 = ?', 'fill_in', NULL, '6368', 'basic', '三年級計算練習一', 'Q25', '連續退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '9732 - 3540 = ?', 'fill_in', NULL, '6192', 'basic', '三年級計算練習一', 'Q26', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '7796 - 3419 = ?', 'fill_in', NULL, '4377', 'basic', '三年級計算練習一', 'Q28', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 6),
  '7110 - 4265 = ?', 'fill_in', NULL, '2845', 'basic', '三年級計算練習一', 'Q30', '隔位退位');

-- ============================================================
-- 三年級計算練習二 – 四位數加減法
-- ============================================================
INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '1009 + 1976 = ?', 'fill_in', NULL, '2985', 'basic', '三年級計算練習二', 'Q1', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '1484 + 1637 = ?', 'fill_in', NULL, '3121', 'basic', '三年級計算練習二', 'Q2', '連續進位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '1698 + 1206 = ?', 'fill_in', NULL, '2904', 'basic', '三年級計算練習二', 'Q3', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '2665 + 3509 = ?', 'fill_in', NULL, '6174', 'basic', '三年級計算練習二', 'Q5', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '2076 + 3985 = ?', 'fill_in', NULL, '6061', 'basic', '三年級計算練習二', 'Q6', '連續進位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '2943 + 2188 = ?', 'fill_in', NULL, '5131', 'basic', '三年級計算練習二', 'Q8', '連續進位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '2505 + 3649 = ?', 'fill_in', NULL, '6154', 'basic', '三年級計算練習二', 'Q9', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '4343 + 3393 = ?', 'fill_in', NULL, '7736', 'basic', '三年級計算練習二', 'Q10', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '4149 + 3553 = ?', 'fill_in', NULL, '7702', 'basic', '三年級計算練習二', 'Q12', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '4071 + 3876 = ?', 'fill_in', NULL, '7947', 'basic', '三年級計算練習二', 'Q13', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 3),
  '4511 + 4505 = ?', 'fill_in', NULL, '9016', 'basic', '三年級計算練習二', 'Q14', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '2481 - 868 = ?', 'fill_in', NULL, '1613', 'basic', '三年級計算練習二', 'Q16', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '2407 - 1164 = ?', 'fill_in', NULL, '1243', 'basic', '三年級計算練習二', 'Q17', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '2460 - 882 = ?', 'fill_in', NULL, '1578', 'basic', '三年級計算練習二', 'Q18', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '2102 - 1211 = ?', 'fill_in', NULL, '891', 'basic', '三年級計算練習二', 'Q19', '連續退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '3184 - 2527 = ?', 'fill_in', NULL, '657', 'basic', '三年級計算練習二', 'Q20', '連續退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '4117 - 2642 = ?', 'fill_in', NULL, '1475', 'basic', '三年級計算練習二', 'Q21', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '3320 - 1438 = ?', 'fill_in', NULL, '1882', 'basic', '三年級計算練習二', 'Q23', '連續退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '4871 - 1067 = ?', 'fill_in', NULL, '3804', 'basic', '三年級計算練習二', 'Q24', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '8242 - 2602 = ?', 'fill_in', NULL, '5640', 'basic', '三年級計算練習二', 'Q25', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '9411 - 3447 = ?', 'fill_in', NULL, '5964', 'basic', '三年級計算練習二', 'Q27', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '9182 - 2159 = ?', 'fill_in', NULL, '7023', 'basic', '三年級計算練習二', 'Q28', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 5),
  '9577 - 5979 = ?', 'fill_in', NULL, '3598', 'basic', '三年級計算練習二', 'Q30', '連續退位');

-- ============================================================
-- 三年級計算練習三 – 帶括號四位數加減法 (lesson 7)
-- ============================================================
INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper, source_question, notes)
VALUES
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '2307 - (664 + 871) = ?', 'fill_in', NULL, '772', 'enhancement', '三年級計算練習三', 'Q1', '括號內加法'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '1308 - (388 + 418) = ?', 'fill_in', NULL, '502', 'enhancement', '三年級計算練習三', 'Q2', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '1285 - (693 + 153) = ?', 'fill_in', NULL, '439', 'enhancement', '三年級計算練習三', 'Q3', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '2070 - (423 + 751) = ?', 'fill_in', NULL, '896', 'enhancement', '三年級計算練習三', 'Q4', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '1730 - (440 + 795) = ?', 'fill_in', NULL, '495', 'enhancement', '三年級計算練習三', 'Q5', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '1258 - (190 + 174) = ?', 'fill_in', NULL, '894', 'enhancement', '三年級計算練習三', 'Q6', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '459 - (462 - 229) = ?', 'fill_in', NULL, '226', 'enhancement', '三年級計算練習三', 'Q7', '括號內減法'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '559 - (843 - 409) = ?', 'fill_in', NULL, '125', 'enhancement', '三年級計算練習三', 'Q8', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '746 - (719 - 362) = ?', 'fill_in', NULL, '389', 'enhancement', '三年級計算練習三', 'Q9', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '536 - (569 - 156) = ?', 'fill_in', NULL, '123', 'enhancement', '三年級計算練習三', 'Q10', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '913 - (983 - 485) = ?', 'fill_in', NULL, '415', 'enhancement', '三年級計算練習三', 'Q11', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '839 - (895 - 494) = ?', 'fill_in', NULL, '438', 'enhancement', '三年級計算練習三', 'Q12', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '6540 - (1421 + 2197) = ?', 'fill_in', NULL, '2922', 'enhancement', '三年級計算練習三', 'Q13', '四位數帶括號'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '4862 - (1031 + 2809) = ?', 'fill_in', NULL, '1022', 'enhancement', '三年級計算練習三', 'Q14', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '6576 - (1074 + 2562) = ?', 'fill_in', NULL, '2940', 'enhancement', '三年級計算練習三', 'Q15', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '7362 - (2733 + 1882) = ?', 'fill_in', NULL, '2747', 'enhancement', '三年級計算練習三', 'Q16', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '4271 - (4203 - 1238) = ?', 'fill_in', NULL, '1306', 'advanced', '三年級計算練習三', 'Q17', '4位數帶括號減法+連續退位'),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '4868 - (4064 - 2067) = ?', 'fill_in', NULL, '2871', 'advanced', '三年級計算練習三', 'Q18', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '4091 - (5438 - 2825) = ?', 'fill_in', NULL, '1478', 'advanced', '三年級計算練習三', 'Q19', NULL),
((SELECT id FROM curriculum_topics WHERE lesson_number = 7),
  '5365 - (3880 - 1347) = ?', 'fill_in', NULL, '2832', 'advanced', '三年級計算練習三', 'Q20', NULL);

COMMIT;
