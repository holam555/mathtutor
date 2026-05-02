-- Sprint 8: P3 學前評估改版
-- Curriculum hierarchy (大單元 → 小單元) + assessment question bank tagged by 小單元
-- Replaces month-based hardcoded assessment with curriculum-driven question selection.

-- ============================================================================
-- 1. 大單元 (textbook units, e.g. "3A 單元 1 五位數")
-- ============================================================================
CREATE TABLE curriculum_units (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  grade         int         NOT NULL,
  semester      text        NOT NULL CHECK (semester IN ('A', 'B')),  -- A=上學期, B=下學期
  unit_number   int         NOT NULL,
  name          text        NOT NULL,                  -- e.g. '五位數'
  textbook_ref  text        NOT NULL,                  -- e.g. '3A 單元 1 五位數'
  display_order int         NOT NULL,                  -- 全年級教學順序 (1..N)
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade, semester, unit_number)
);

CREATE INDEX idx_curriculum_units_grade_order
  ON curriculum_units (grade, display_order);

-- ============================================================================
-- 2. 小單元 (= 課程主題 = 每堂課, e.g. "五位數的認識與規範讀寫")
-- ============================================================================
CREATE TABLE curriculum_topics (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id       uuid        NOT NULL REFERENCES curriculum_units ON DELETE CASCADE,
  lesson_number int         NOT NULL,                  -- 全年級堂數 (1..40)
  name          text        NOT NULL,                  -- e.g. '五位數的認識與規範讀寫'
  display_order int         NOT NULL,                  -- 在 unit 內嘅排序
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, lesson_number)
);

CREATE INDEX idx_curriculum_topics_unit
  ON curriculum_topics (unit_id, display_order);

-- ============================================================================
-- 3. 學前評估題庫 (separate from existing `questions` table for practice mode)
-- ============================================================================
CREATE TABLE assessment_questions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        uuid        NOT NULL REFERENCES curriculum_topics ON DELETE RESTRICT,
  question_text   text        NOT NULL,
  question_type   text        NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_in', 'fill_in_number', 'calculation')),
  options         jsonb,                                -- ["A. ...", ...] for multiple_choice
  correct_answer  text        NOT NULL,
  difficulty_tier text        NOT NULL CHECK (difficulty_tier IN ('basic', 'enhancement', 'advanced')),
  -- 'basic'       = 1-step (基礎達標, 3 marks)
  -- 'enhancement' = 2-3 steps (能力提升, 5 marks)
  -- 'advanced'    = 4+ steps (拔尖拓展, 10 marks)
  -- Multi-part questions:
  --   group_id   = NULL → standalone question, occupies 1 quota slot, full tier marks
  --   group_id   = uuid → linked sub-questions sharing one quota slot;
  --                       all rows in same group share the tier marks (split equally,
  --                       remainder to lowest sub_order). Pulled together by selector.
  group_id        uuid,                                 -- NULL for standalone
  sub_order       int         NOT NULL DEFAULT 1,       -- display order within a group (a=1, b=2, ...)
  source_paper    text,                                 -- e.g. '2023-P3校內模擬考試'
  source_question text,                                 -- e.g. 'Q14' or 'Q12a'
  image_url       text,                                 -- Supabase Storage URL if has figure
  image_alt_text  text,                                 -- Description for AI / screen reader
  notes           text,                                 -- Extraction-time notes by Claude
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_q_topic_tier
  ON assessment_questions (topic_id, difficulty_tier)
  WHERE is_active;

CREATE INDEX idx_assessment_q_group
  ON assessment_questions (group_id, sub_order)
  WHERE group_id IS NOT NULL;

-- ============================================================================
-- 4. assessment_sessions: track 大/小單元 selection + diagnostic tier
-- ============================================================================
ALTER TABLE assessment_sessions
  ADD COLUMN selected_unit_ids  uuid[],                 -- 家長揀嘅大單元
  ADD COLUMN selected_topic_ids uuid[],                 -- 家長揀嘅小單元 (drill-down)
  ADD COLUMN diagnostic_tier    text;                   -- 'advanced' (>=80) | 'basic_mastery' (50-79) | 'weak' (<50)

-- ============================================================================
-- 5. RLS: curriculum tables are public-readable (no auth required for assessment)
-- ============================================================================
ALTER TABLE curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curriculum_units_public_select"
  ON curriculum_units FOR SELECT USING (true);

CREATE POLICY "curriculum_topics_public_select"
  ON curriculum_topics FOR SELECT USING (true);

CREATE POLICY "assessment_questions_public_select"
  ON assessment_questions FOR SELECT USING (is_active);

-- Teachers can manage curriculum + question bank (auth.jwt() role check)
CREATE POLICY "curriculum_units_teacher_all"
  ON curriculum_units FOR ALL
  USING (((auth.jwt() -> 'user_metadata') ->> 'role') = 'teacher')
  WITH CHECK (((auth.jwt() -> 'user_metadata') ->> 'role') = 'teacher');

CREATE POLICY "curriculum_topics_teacher_all"
  ON curriculum_topics FOR ALL
  USING (((auth.jwt() -> 'user_metadata') ->> 'role') = 'teacher')
  WITH CHECK (((auth.jwt() -> 'user_metadata') ->> 'role') = 'teacher');

CREATE POLICY "assessment_questions_teacher_all"
  ON assessment_questions FOR ALL
  USING (((auth.jwt() -> 'user_metadata') ->> 'role') = 'teacher')
  WITH CHECK (((auth.jwt() -> 'user_metadata') ->> 'role') = 'teacher');
