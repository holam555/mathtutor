-- ================================================================
-- Sprint 7: 考試衝刺練習 (Exam Sprint Practice) + unify practice on assessment_questions
--
-- 1. exam_scopes table  — parent uploads photo of school exam scope sheet,
--    Gemini Vision matches to curriculum_units for that child's grade,
--    student sees a 考試衝刺練習 card on /student.
--
-- 2. Practice unification:
--    - answer_records.question_source CHECK extended to allow
--      'assessment_questions'
--    - wrong_question_bank.category_id becomes nullable, gains topic_id
--      column referencing curriculum_topics
--    - practice_sessions.session_type CHECK extended to allow
--      'unit' and 'exam_sprint'
--    - New RPCs upsert_wrong_assessment_question + get_student_unit_stats
--
-- 3. Legacy questions migration:
--    - Every row in questions copied into assessment_questions under a
--      synthetic "舊題庫（待整理）" unit/topic per grade, marked inactive,
--      so future curation can happen via the assessment_questions tooling.
--    - questions.is_active set to false everywhere so practice never pulls
--      from the legacy pool again.
--
-- Run this in Supabase SQL Editor.
-- ================================================================


-- ----------------------------------------------------------------
-- 1. exam_scopes table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_scopes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid        NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  uploaded_by  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade        int         NOT NULL CHECK (grade BETWEEN 3 AND 6),
  exam_name    text,
  exam_date    date,
  image_paths  text[]      NOT NULL,
  unit_ids     uuid[]      NOT NULL,
  ai_raw       jsonb,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_scopes_student_active
  ON exam_scopes (student_id, is_active, created_at DESC);

ALTER TABLE exam_scopes ENABLE ROW LEVEL SECURITY;

-- Student can read own scopes
CREATE POLICY "Student reads own exam scopes"
  ON exam_scopes FOR SELECT
  USING (auth.uid() = student_id);

-- Parent can read/insert/update for their linked children
CREATE POLICY "Parent reads linked child exam scopes"
  ON exam_scopes FOR SELECT
  USING (is_parent_of(student_id));

CREATE POLICY "Parent inserts linked child exam scopes"
  ON exam_scopes FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by AND is_parent_of(student_id));

CREATE POLICY "Parent updates linked child exam scopes"
  ON exam_scopes FOR UPDATE
  USING (is_parent_of(student_id))
  WITH CHECK (is_parent_of(student_id));

-- Teacher can do everything
CREATE POLICY "Teacher manages exam scopes"
  ON exam_scopes FOR ALL
  USING (is_teacher())
  WITH CHECK (is_teacher());


-- ----------------------------------------------------------------
-- 2. Extend answer_records to record assessment-source answers
-- ----------------------------------------------------------------
ALTER TABLE answer_records
  DROP CONSTRAINT IF EXISTS answer_records_question_source_check;

ALTER TABLE answer_records
  ADD CONSTRAINT answer_records_question_source_check
  CHECK (question_source IN ('questions', 'generated_questions', 'assessment_questions'));


-- ----------------------------------------------------------------
-- 3. Extend wrong_question_bank for assessment_questions
-- ----------------------------------------------------------------
ALTER TABLE wrong_question_bank
  ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE wrong_question_bank
  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES curriculum_topics(id);

CREATE INDEX IF NOT EXISTS idx_wrong_bank_topic
  ON wrong_question_bank (topic_id) WHERE topic_id IS NOT NULL;


-- ----------------------------------------------------------------
-- 4. Extend practice_sessions session_type
-- ----------------------------------------------------------------
ALTER TABLE practice_sessions
  DROP CONSTRAINT IF EXISTS practice_sessions_session_type_check;

ALTER TABLE practice_sessions
  ADD CONSTRAINT practice_sessions_session_type_check
  CHECK (session_type IN ('new', 'retry_wrong', 'category', 'unit', 'exam_sprint'));


-- ----------------------------------------------------------------
-- 5. RPC: upsert into wrong_question_bank for an assessment_questions row
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_wrong_assessment_question(
  p_student_id  uuid,
  p_question_id uuid,
  p_topic_id    uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO wrong_question_bank
    (student_id, question_id, question_source, category_id, topic_id,
     wrong_count, correct_streak, last_wrong_at, is_resolved)
  VALUES
    (p_student_id, p_question_id, 'assessment_questions', NULL, p_topic_id,
     1, 0, now(), false)
  ON CONFLICT (student_id, question_id, question_source)
  DO UPDATE SET
    wrong_count   = wrong_question_bank.wrong_count + 1,
    correct_streak = 0,
    last_wrong_at = now(),
    is_resolved   = false;
END;
$$;


-- ----------------------------------------------------------------
-- 6. RPC: per-unit accuracy stats for a student (last p_days)
--    Mirrors get_student_category_stats but joins via assessment_questions
--    → curriculum_topics → curriculum_units.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_unit_stats(
  p_student_id uuid,
  p_days       int DEFAULT 30
)
RETURNS TABLE (
  unit_id        uuid,
  unit_name      text,
  total_attempts bigint,
  correct_count  bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id          AS unit_id,
    u.name        AS unit_name,
    count(ar.id)  AS total_attempts,
    sum(CASE WHEN ar.is_correct THEN 1 ELSE 0 END) AS correct_count
  FROM answer_records ar
  JOIN assessment_questions aq
    ON ar.question_id = aq.id
   AND ar.question_source = 'assessment_questions'
  JOIN curriculum_topics t ON aq.topic_id = t.id
  JOIN curriculum_units  u ON t.unit_id   = u.id
  WHERE ar.student_id = p_student_id
    AND ar.answered_at >= now() - (p_days || ' days')::interval
  GROUP BY u.id, u.name
  ORDER BY count(ar.id) DESC;
$$;


-- ----------------------------------------------------------------
-- 7. Legacy questions migration into assessment_questions (inactive)
--
-- Every legacy row is copied under a per-grade "舊題庫（待整理）" bucket
-- so it shows up in the assessment_questions admin tooling for later
-- curation, but never appears in practice (is_active = false).
--
-- Strategy: create a bucket unit per grade encountered in questions
-- (grades come from question_categories.grade; rows without a category
-- or grade default to 5).
-- ----------------------------------------------------------------

-- 7a. Bucket unit + topic per grade (3,4,5,6). idempotent via WHERE NOT EXISTS.
DO $$
DECLARE
  g int;
  v_unit_id  uuid;
  v_topic_id uuid;
BEGIN
  FOREACH g IN ARRAY ARRAY[3,4,5,6]
  LOOP
    -- Unit
    SELECT id INTO v_unit_id
    FROM curriculum_units
    WHERE grade = g AND unit_number = 999 AND name = '舊題庫（待整理）';

    IF v_unit_id IS NULL THEN
      INSERT INTO curriculum_units
        (grade, semester, unit_number, name, textbook_ref, display_order)
      VALUES
        (g, 'A', 999, '舊題庫（待整理）', 'legacy', 9999)
      RETURNING id INTO v_unit_id;
    END IF;

    -- Topic
    SELECT id INTO v_topic_id
    FROM curriculum_topics
    WHERE unit_id = v_unit_id AND lesson_number = 999;

    IF v_topic_id IS NULL THEN
      INSERT INTO curriculum_topics
        (unit_id, lesson_number, name, display_order)
      VALUES
        (v_unit_id, 999, '舊題庫（待整理）', 9999);
    END IF;
  END LOOP;
END$$;

-- 7b. Copy legacy questions into assessment_questions (idempotent via source_question).
INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer,
   difficulty_tier, source_paper, source_question, image_url, is_active)
SELECT
  t.id AS topic_id,
  q.question_text,
  q.question_type,
  CASE WHEN q.options IS NULL THEN NULL ELSE q.options END,
  q.correct_answer,
  CASE q.difficulty
    WHEN 1 THEN 'basic'
    WHEN 2 THEN 'enhancement'
    WHEN 3 THEN 'advanced'
    ELSE 'basic'
  END AS difficulty_tier,
  'legacy_questions' AS source_paper,
  q.id::text         AS source_question,
  q.question_image_url,
  false              AS is_active
FROM questions q
LEFT JOIN question_categories qc ON q.category_id = qc.id
JOIN curriculum_units u
  ON u.grade = COALESCE(qc.grade, 5)
 AND u.unit_number = 999
 AND u.name = '舊題庫（待整理）'
JOIN curriculum_topics t
  ON t.unit_id = u.id AND t.lesson_number = 999
WHERE NOT EXISTS (
  SELECT 1 FROM assessment_questions aq
  WHERE aq.source_paper = 'legacy_questions' AND aq.source_question = q.id::text
);

-- 7c. Hard-deactivate legacy questions so practice never pulls from them.
UPDATE questions SET is_active = false WHERE is_active = true;


-- ================================================================
-- Storage bucket setup (do this once in Supabase Dashboard > Storage):
--
-- 1. Create a new bucket named "exam-scopes"
-- 2. Set it to PRIVATE
-- 3. RLS policies on the bucket (Storage > Policies):
--
-- INSERT policy ("Parents upload exam scopes"):
--   Target roles: authenticated
--   USING:  (storage.foldername(name))[1] = auth.uid()::text
--
-- SELECT policy ("Owners read own exam scopes"):
--   Target roles: authenticated
--   USING:  (storage.foldername(name))[1] = auth.uid()::text
--
-- Service role bypasses RLS (no policy needed).
-- ================================================================
