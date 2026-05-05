-- fix_topic_gap_coverage.sql
-- Restores question coverage for 3 topics that fix_disable_flagged_questions.sql
-- left empty (or near-empty) in the basic / enhancement tiers.
--
--   • U16 行程表閱讀與時間綜合應用       — revive 4 flight-table questions
--   • U9  重量綜合應用題（淨重/毛重）   — revive 1 + add 2 new basic questions
--   • U12 分數綜合應用題專項突破       — add 2 new basic 整體/部分 questions
--
-- Run AFTER fix_disable_flagged_questions.sql in Supabase SQL Editor.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. U16 行程表閱讀與時間綜合應用 — revive 4 flight-table questions
--    They were only flagged for "info_repeated_inline" (the same flight table
--    appears in 4 questions), but the math/options/answers are all valid.
-- ─────────────────────────────────────────────────────────────────────────

UPDATE assessment_questions
SET is_active = true
WHERE id IN (
  'ccf8a8db-a5ff-476d-a41f-caafa661da6c',  -- (basic) 飛往大阪 → 下午 9 時 20 分
  'a220ebce-5f25-4ebe-90a5-d2a3e269595c',  -- (basic) 最後一班 → D. 大阪
  '329f2b59-884e-4a86-aa04-15de4c03fcea',  -- (basic) 多少下午起飛 → 4
  '24dc8f31-5546-4531-ae93-21d51420560f'   -- (enhancement) 巴黎 vs 北京 相差 4 小時 45 分鐘
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. U9 重量綜合應用題（淨重/毛重）— revive 1 + add 2 new basic
--    The 粟米 question genuinely uses 「淨重」 → revive.
-- ─────────────────────────────────────────────────────────────────────────

UPDATE assessment_questions
SET is_active = true
WHERE id = 'd7701432-20b9-448e-8116-b37498cca8b5';  -- 粟米淨重 320 克

-- Two fresh basic-tier 淨重/毛重 questions (key concept: 毛重 = 淨重 + 皮重)
INSERT INTO assessment_questions (
  topic_id, difficulty_tier, question_type, question_text, options,
  correct_answer, source_paper, source_question, is_active
) VALUES
(
  'c4d62b62-eb78-4c90-8811-469454e1fda4',
  'basic', 'fill_in_number',
  '一罐巧克力連罐共重 540 克，淨重 480 克。罐子（包裝）重多少克？',
  NULL,
  '60',
  'manual_seed',
  '淨重/毛重 basic 1',
  true
),
(
  'c4d62b62-eb78-4c90-8811-469454e1fda4',
  'basic', 'fill_in_number',
  '一盒餅乾的毛重是 320 克，包裝盒重 20 克。餅乾的淨重是多少克？',
  NULL,
  '300',
  'manual_seed',
  '淨重/毛重 basic 2',
  true
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. U12 分數綜合應用題專項突破 — add 2 new basic 整體/部分 questions
--    Curriculum lesson 27 = 整體 vs 部分 application (NOT fraction add/sub).
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO assessment_questions (
  topic_id, difficulty_tier, question_type, question_text, options,
  correct_answer, source_paper, source_question, is_active
) VALUES
(
  'af11042b-7367-4b3a-b517-54094cca5029',
  'basic', 'fill_in',
  '班上有 7 名男生和 4 名女生。男生佔全班的幾分之幾？（請填分數，例如 a/b）',
  NULL,
  '7/11',
  'manual_seed',
  '分數整體部分 basic 1',
  true
),
(
  'af11042b-7367-4b3a-b517-54094cca5029',
  'basic', 'fill_in',
  '媽媽買了 9 個蘋果，吃了 2 個。剩下的蘋果佔原本的幾分之幾？（請填分數，例如 a/b）',
  NULL,
  '7/9',
  'manual_seed',
  '分數整體部分 basic 2',
  true
);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────
-- After running, expected new active counts:
--   U12 分數綜合應用題:               basic 0 → 2,  enhancement still 1
--   U16 行程表閱讀與時間綜合應用:        basic 0 → 3,  enhancement 0 → 2 (was 2)
--   U9  重量綜合應用題（淨重/毛重）:     basic 0 → 2,  enhancement 0 → 1
-- Total active: ~599 → ~606
-- ─────────────────────────────────────────────────────────────────────────
