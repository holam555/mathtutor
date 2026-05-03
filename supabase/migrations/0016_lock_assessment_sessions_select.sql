-- 0016_lock_assessment_sessions_select.sql
-- Security fix: assessment_sessions previously had a public SELECT policy
-- (USING true) which allowed anyone with the anon key to dump all parent
-- contact info and reports. Lock it down so only the service role (server
-- routes via createServiceClient) can read the table. The report page and
-- /admin/assessments page already use the service client, so this is a
-- behavior-preserving change for the app.

DROP POLICY IF EXISTS "assessment_public_select" ON assessment_sessions;

CREATE POLICY "assessment_service_only_select"
  ON assessment_sessions FOR SELECT
  USING (false);
