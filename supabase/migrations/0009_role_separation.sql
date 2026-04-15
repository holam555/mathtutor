-- ================================================================
-- Sprint 6: Role separation, gamification data, and parent↔student linkage
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. parent_student_relationships (link parents to their children)
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own links"
  ON parent_student_relationships FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Teachers can manage links"
  ON parent_student_relationships FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher');

-- Helper: is auth.uid() parent of given student?
CREATE OR REPLACE FUNCTION is_parent_of(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM parent_student_relationships
    WHERE parent_id = auth.uid() AND student_id = p_student_id AND is_active = true
  );
$$;

-- Helper: is auth.uid() a teacher?
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher';
$$;

-- 2. Tighten RLS on student-owned data
-- Drop permissive older policies, re-add scoped policies.

-- student_profiles: own, parent of, teacher
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
DROP POLICY IF EXISTS "Teachers can view all profiles" ON student_profiles;

CREATE POLICY "Student own profile" ON student_profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Parent view linked student" ON student_profiles
  FOR SELECT USING (is_parent_of(id));

CREATE POLICY "Teacher view all students" ON student_profiles
  FOR SELECT USING (is_teacher());

CREATE POLICY "Teacher update students" ON student_profiles
  FOR UPDATE USING (is_teacher());

-- practice_sessions
DROP POLICY IF EXISTS "Students manage own sessions" ON practice_sessions;
DROP POLICY IF EXISTS "Teachers view all sessions" ON practice_sessions;

CREATE POLICY "Student own sessions" ON practice_sessions
  FOR ALL USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Parent view linked sessions" ON practice_sessions
  FOR SELECT USING (is_parent_of(student_id));

CREATE POLICY "Teacher view all sessions" ON practice_sessions
  FOR SELECT USING (is_teacher());

-- answer_records
DROP POLICY IF EXISTS "Students manage own answers" ON answer_records;
DROP POLICY IF EXISTS "Teachers view all answers" ON answer_records;

CREATE POLICY "Student own answers" ON answer_records
  FOR ALL USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Parent view linked answers" ON answer_records
  FOR SELECT USING (is_parent_of(student_id));

CREATE POLICY "Teacher view all answers" ON answer_records
  FOR SELECT USING (is_teacher());

-- wrong_question_bank
DROP POLICY IF EXISTS "Students manage own wrong bank" ON wrong_question_bank;
DROP POLICY IF EXISTS "Teachers view all wrong bank" ON wrong_question_bank;

CREATE POLICY "Student own wrongs" ON wrong_question_bank
  FOR ALL USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Parent view linked wrongs" ON wrong_question_bank
  FOR SELECT USING (is_parent_of(student_id));

CREATE POLICY "Teacher view all wrongs" ON wrong_question_bank
  FOR SELECT USING (is_teacher());

-- 3. RPCs used by student home, admin, and parent pages
-- get_student_streak: how many consecutive days ending today have a completed session
CREATE OR REPLACE FUNCTION get_student_streak(p_student_id uuid)
RETURNS int
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  streak int := 0;
  check_date date := CURRENT_DATE;
  has_session boolean;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM practice_sessions
      WHERE student_id = p_student_id
        AND completed_at IS NOT NULL
        AND DATE(completed_at AT TIME ZONE 'Asia/Hong_Kong') = check_date
    ) INTO has_session;

    IF NOT has_session THEN
      -- If today has no session yet, check streak ending yesterday
      IF check_date = CURRENT_DATE AND streak = 0 THEN
        check_date := check_date - 1;
        CONTINUE;
      END IF;
      EXIT;
    END IF;

    streak := streak + 1;
    check_date := check_date - 1;
    IF streak > 365 THEN EXIT; END IF;
  END LOOP;

  RETURN streak;
END;
$$;

-- get_today_progress: answers today
CREATE OR REPLACE FUNCTION get_today_answer_count(p_student_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::int FROM answer_records
  WHERE student_id = p_student_id
    AND DATE(answered_at AT TIME ZONE 'Asia/Hong_Kong') = CURRENT_DATE;
$$;

-- get_week_completion_dots: 7 booleans for Mon..Sun of current HK week
CREATE OR REPLACE FUNCTION get_week_completion(p_student_id uuid)
RETURNS TABLE(day_offset int, has_practice boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH days AS (
    SELECT generate_series(0, 6) AS day_offset
  ),
  week_start AS (
    -- ISO Monday of current HK week
    SELECT (date_trunc('week', CURRENT_DATE))::date AS monday
  )
  SELECT
    d.day_offset,
    EXISTS(
      SELECT 1 FROM practice_sessions ps
      WHERE ps.student_id = p_student_id
        AND ps.completed_at IS NOT NULL
        AND DATE(ps.completed_at AT TIME ZONE 'Asia/Hong_Kong') = (week_start.monday + d.day_offset)
    ) AS has_practice
  FROM days d, week_start
  ORDER BY d.day_offset;
$$;

-- get_student_total_correct: for trophies
CREATE OR REPLACE FUNCTION get_student_total_correct(p_student_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::int FROM answer_records
  WHERE student_id = p_student_id AND is_correct = true;
$$;

-- get_student_total_answered
CREATE OR REPLACE FUNCTION get_student_total_answered(p_student_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::int FROM answer_records
  WHERE student_id = p_student_id;
$$;

-- get_student_highest_category_accuracy: best category with ≥10 attempts in 30 days
CREATE OR REPLACE FUNCTION get_student_best_category(p_student_id uuid)
RETURNS TABLE(category_name text, accuracy numeric, attempts int)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT qc.name AS category_name,
         (COUNT(*) FILTER (WHERE ar.is_correct)::numeric * 100 / COUNT(*))::numeric AS accuracy,
         COUNT(*)::int AS attempts
  FROM answer_records ar
  JOIN questions q ON q.id = ar.question_id
  JOIN question_categories qc ON qc.id = q.category_id
  WHERE ar.student_id = p_student_id
    AND ar.answered_at >= now() - interval '30 days'
  GROUP BY qc.name
  HAVING COUNT(*) >= 10
  ORDER BY accuracy DESC
  LIMIT 1;
$$;

-- get_class_weakest_categories: teacher class-overview top weakest
CREATE OR REPLACE FUNCTION get_class_weakest_categories(p_days int DEFAULT 7)
RETURNS TABLE(category_id uuid, category_code text, category_name text, total_attempts bigint, accuracy numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT qc.id AS category_id,
         qc.code AS category_code,
         qc.name AS category_name,
         COUNT(*) AS total_attempts,
         ROUND((COUNT(*) FILTER (WHERE ar.is_correct)::numeric * 100 / COUNT(*))::numeric, 1) AS accuracy
  FROM answer_records ar
  JOIN questions q ON q.id = ar.question_id
  JOIN question_categories qc ON qc.id = q.category_id
  WHERE ar.answered_at >= now() - (p_days || ' days')::interval
  GROUP BY qc.id, qc.code, qc.name
  HAVING COUNT(*) >= 5
  ORDER BY accuracy ASC
  LIMIT 3;
$$;
