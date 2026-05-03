-- Add teaching_methods column to curriculum_topics.
-- Stores the 「五維教研核心內容」 method names per lesson (mostly 維度三 CPA話術 +
-- 維度四 SOP 高階解題與防錯機制) so the report's solution recommendations can
-- reference霖楓學苑's own teaching system rather than generic methods.
--
-- Format: jsonb array of short method-name strings, e.g.
--   ["五間房守門員模型", "數位點格法", "讀數分節口訣"]

ALTER TABLE curriculum_topics
  ADD COLUMN IF NOT EXISTS teaching_methods jsonb;

COMMENT ON COLUMN curriculum_topics.teaching_methods IS
  '一系列來自課程大綱「五維教研核心內容」的教學方法名稱，例如「五間房守門員模型」、「數位點格法」。';
