-- ================================================================
-- Sprint 8: 模擬考試試卷 (Mock Exam Paper)
--
-- Replaces 考試衝刺練習 with a structured 40-question mock paper:
--   - 多項選擇題 (MC) + 短答題 (SQ) → done in-app via PracticeFlow
--   - 長答題 (LQ) → printed/iPad PDF, parent uploads photos, AI extracts
--     handwriting, teacher reviews
--
-- Default composition: 18 MC + 17 SQ + 5 LQ = 40 (paper-level target only;
-- selection logic fills to 40 best-effort).
-- Difficulty target across whole paper: 20% basic / 60% enhancement / 20% advanced.
-- 50-minute timer pauses between MC+SQ and LQ phases.
-- ================================================================


-- ----------------------------------------------------------------
-- 1. long_questions — LQ bank (separate from assessment_questions)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS long_questions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id        uuid        NOT NULL REFERENCES curriculum_topics(id) ON DELETE RESTRICT,
  question_text   text        NOT NULL,
  model_answer    text        NOT NULL,
  total_marks     int         NOT NULL CHECK (total_marks > 0),
  difficulty_tier text        NOT NULL CHECK (difficulty_tier IN ('basic','enhancement','advanced')),
  image_url       text,
  source_paper    text,
  source_question text,
  notes           text,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_long_questions_topic_tier
  ON long_questions (topic_id, difficulty_tier) WHERE is_active;

ALTER TABLE long_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher manages long questions"
  ON long_questions FOR ALL
  USING (is_teacher())
  WITH CHECK (is_teacher());

-- Students/parents read active LQs (needed to render the LQ paper PDF page).
CREATE POLICY "Authenticated reads active long questions"
  ON long_questions FOR SELECT
  TO authenticated
  USING (is_active = true);


-- ----------------------------------------------------------------
-- 2. mock_exam_papers — one row per generated paper
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mock_exam_papers (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            uuid        NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  exam_scope_id         uuid        REFERENCES exam_scopes(id) ON DELETE SET NULL,
  scope_unit_ids        uuid[]      NOT NULL,
  mc_sq_question_ids    uuid[]      NOT NULL DEFAULT '{}',
  lq_question_ids       uuid[]      NOT NULL DEFAULT '{}',
  mc_sq_session_id      uuid        REFERENCES practice_sessions(id) ON DELETE SET NULL,
  mc_sq_count           int         NOT NULL DEFAULT 0,
  lq_count              int         NOT NULL DEFAULT 0,
  difficulty_actual     jsonb,
  timer_started_at      timestamptz,
  timer_paused_at       timestamptz,
  timer_elapsed_seconds int         NOT NULL DEFAULT 0,
  timer_status          text        NOT NULL DEFAULT 'not_started'
    CHECK (timer_status IN ('not_started','running','paused_for_lq','finished')),
  status                text        NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','mc_sq_done','lq_uploaded','reviewed')),
  ai_comment            text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mock_exam_papers_student
  ON mock_exam_papers (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mock_exam_papers_status
  ON mock_exam_papers (status, created_at DESC);

ALTER TABLE mock_exam_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student reads own mock papers"
  ON mock_exam_papers FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Parent reads linked child mock papers"
  ON mock_exam_papers FOR SELECT
  USING (is_parent_of(student_id));

CREATE POLICY "Teacher manages mock papers"
  ON mock_exam_papers FOR ALL
  USING (is_teacher())
  WITH CHECK (is_teacher());


-- ----------------------------------------------------------------
-- 3. mock_exam_lq_submissions — student/parent photo upload + AI extract
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mock_exam_lq_submissions (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id                  uuid        NOT NULL REFERENCES mock_exam_papers(id) ON DELETE CASCADE,
  long_question_id          uuid        NOT NULL REFERENCES long_questions(id) ON DELETE RESTRICT,
  image_urls                text[]      NOT NULL DEFAULT '{}',
  ai_extracted_answer       text,
  teacher_corrected_answer  text,
  teacher_comment           text,
  reviewed_by               uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at               timestamptz,
  created_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paper_id, long_question_id)
);

CREATE INDEX IF NOT EXISTS idx_mock_exam_lq_paper
  ON mock_exam_lq_submissions (paper_id);

ALTER TABLE mock_exam_lq_submissions ENABLE ROW LEVEL SECURITY;

-- Student reads own LQ submissions (via paper ownership).
CREATE POLICY "Student reads own LQ submissions"
  ON mock_exam_lq_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mock_exam_papers p
    WHERE p.id = mock_exam_lq_submissions.paper_id
      AND p.student_id = auth.uid()
  ));

-- Parent reads + writes (uploads) for linked children.
CREATE POLICY "Parent reads linked child LQ submissions"
  ON mock_exam_lq_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mock_exam_papers p
    WHERE p.id = mock_exam_lq_submissions.paper_id
      AND is_parent_of(p.student_id)
  ));

CREATE POLICY "Parent inserts LQ submissions"
  ON mock_exam_lq_submissions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM mock_exam_papers p
    WHERE p.id = mock_exam_lq_submissions.paper_id
      AND is_parent_of(p.student_id)
  ));

CREATE POLICY "Parent updates own uploads pre-review"
  ON mock_exam_lq_submissions FOR UPDATE
  USING (
    reviewed_at IS NULL
    AND EXISTS (
      SELECT 1 FROM mock_exam_papers p
      WHERE p.id = mock_exam_lq_submissions.paper_id
        AND is_parent_of(p.student_id)
    )
  );

CREATE POLICY "Teacher manages LQ submissions"
  ON mock_exam_lq_submissions FOR ALL
  USING (is_teacher())
  WITH CHECK (is_teacher());


-- ----------------------------------------------------------------
-- 4. Extend practice_sessions.session_type to accept 'mock_exam'
-- ----------------------------------------------------------------
ALTER TABLE practice_sessions
  DROP CONSTRAINT IF EXISTS practice_sessions_session_type_check;

ALTER TABLE practice_sessions
  ADD CONSTRAINT practice_sessions_session_type_check
  CHECK (session_type IN (
    'new', 'retry_wrong', 'variation', 'unit', 'exam_sprint', 'mock_exam'
  ));


-- ================================================================
-- Storage bucket setup (do once in Supabase Dashboard > Storage):
--
-- 1. Create bucket "mock-exam-lq" (private)
-- 2. Policies:
--    INSERT ("Parents upload LQ photos"):
--      authenticated, USING: (storage.foldername(name))[1] = auth.uid()::text
--    SELECT ("Owners read own LQ photos"):
--      authenticated, USING: (storage.foldername(name))[1] = auth.uid()::text
--    Service role bypasses RLS.
-- ================================================================
