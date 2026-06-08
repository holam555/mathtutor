-- Drop long_questions.total_marks.
--
-- LQ marking will be handled as a paper-level system later, not per-question.
-- The column was added in 0020 but never used in any UI scoring logic.

ALTER TABLE long_questions DROP COLUMN IF EXISTS total_marks;
