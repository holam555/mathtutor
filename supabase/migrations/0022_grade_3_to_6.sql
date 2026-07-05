-- The app supports P3–P6 (curriculum, assessment, uploads, and now public
-- student signup), but two CHECK constraints from Sprint 1 still only allow
-- grades 5–6:
--   · student_profiles.grade  — a P3/P4 student signup fails to save
--   · past_paper_uploads.grade — the parent upload form offers 小三/小四
--     but the insert is rejected
-- Widen both to 3–6.

ALTER TABLE student_profiles
  DROP CONSTRAINT IF EXISTS student_profiles_grade_check;
ALTER TABLE student_profiles
  ADD CONSTRAINT student_profiles_grade_check CHECK (grade IN (3, 4, 5, 6));

ALTER TABLE past_paper_uploads
  DROP CONSTRAINT IF EXISTS past_paper_uploads_grade_check;
ALTER TABLE past_paper_uploads
  ADD CONSTRAINT past_paper_uploads_grade_check CHECK (grade IN (3, 4, 5, 6));
