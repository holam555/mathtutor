-- 0017_lock_assessment_curriculum_select.sql
-- Security fix: 0014 created public SELECT policies on assessment_questions,
-- curriculum_units and curriculum_topics. The assessment_questions one
-- (USING is_active) lets anyone with the anon key dump every P3
-- correct_answer, completely bypassing the C2 hardening that strips
-- correct_answer from /api/assessment/questions responses.
--
-- All three tables are only read by API routes via createServiceClient()
-- (which bypasses RLS), so locking to service-only is behavior-preserving.
-- The existing teacher policies (FOR ALL, role check) remain intact and
-- continue to allow teachers to manage these tables through the admin UI.

DROP POLICY IF EXISTS "assessment_questions_public_select" ON assessment_questions;
DROP POLICY IF EXISTS "curriculum_units_public_select" ON curriculum_units;
DROP POLICY IF EXISTS "curriculum_topics_public_select" ON curriculum_topics;

CREATE POLICY "assessment_questions_service_only_select"
  ON assessment_questions FOR SELECT
  USING (false);

CREATE POLICY "curriculum_units_service_only_select"
  ON curriculum_units FOR SELECT
  USING (false);

CREATE POLICY "curriculum_topics_service_only_select"
  ON curriculum_topics FOR SELECT
  USING (false);
