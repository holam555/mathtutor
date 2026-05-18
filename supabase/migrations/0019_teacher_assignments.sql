-- 0019_teacher_assignments.sql
-- Teacher-managed daily practice assignments per student.
-- When a student has active assignments, 開始練習 pulls only from those topics.

CREATE TABLE student_topic_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES curriculum_topics(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, topic_id)
);

CREATE INDEX ON student_topic_assignments (student_id, is_active);

-- RLS: teacher can read/write all; student can only read their own
ALTER TABLE student_topic_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher full access to assignments"
  ON student_topic_assignments
  FOR ALL
  TO authenticated
  USING (is_teacher())
  WITH CHECK (is_teacher());

CREATE POLICY "student read own assignments"
  ON student_topic_assignments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());
