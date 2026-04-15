-- ================================================================
-- Sprint 4: Past Paper Uploads + Parent Profiles
-- Run this in Supabase SQL Editor
-- ================================================================

-- Parent profiles
CREATE TABLE IF NOT EXISTS parent_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  phone text,
  token_balance int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own profile"
  ON parent_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can view all parent profiles"
  ON parent_profiles FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher');

-- Past paper uploads
CREATE TABLE IF NOT EXISTS past_paper_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  school_name text,
  grade int CHECK (grade IN (5, 6)),
  exam_year int,
  exam_type text,
  image_paths text[] DEFAULT '{}',          -- storage paths (not public URLs)
  ai_extracted_questions jsonb DEFAULT '[]', -- array of ExtractedQuestion
  review_status text DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  tokens_awarded int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE past_paper_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own uploads"
  ON past_paper_uploads FOR SELECT
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Parents can insert own uploads"
  ON past_paper_uploads FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Teachers can view all uploads"
  ON past_paper_uploads FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher');

CREATE POLICY "Teachers can update uploads"
  ON past_paper_uploads FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher');

-- ================================================================
-- Storage bucket setup (do this in Supabase Dashboard > Storage):
--
-- 1. Create a new bucket named "past-papers"
-- 2. Set it to PRIVATE (not public)
-- 3. Add the following RLS policies on the bucket:
--
-- INSERT policy (allow parents to upload):
--   Name: "Parents can upload past papers"
--   Target roles: authenticated
--   USING expression: (storage.foldername(name))[1] = auth.uid()::text
--
-- SELECT policy (allow owners to read their own):
--   Name: "Parents can view own files"
--   Target roles: authenticated
--   USING expression: (storage.foldername(name))[1] = auth.uid()::text
--
-- Service role can read everything (no policy needed — service role bypasses RLS)
-- ================================================================
