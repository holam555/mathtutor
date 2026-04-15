-- ================================================================
-- Sprint 5: Token System + allow students to upload past papers
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. Add token_balance to student_profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS token_balance int DEFAULT 0;

-- 2. Update past_paper_uploads RLS: allow students (not just parents)
DROP POLICY IF EXISTS "Parents can view own uploads" ON past_paper_uploads;
DROP POLICY IF EXISTS "Parents can insert own uploads" ON past_paper_uploads;

CREATE POLICY "Students and parents can view own uploads"
  ON past_paper_uploads FOR SELECT
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Students and parents can insert own uploads"
  ON past_paper_uploads FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- 3. Configurable redemption options (teacher manages in /admin/redemptions)
CREATE TABLE IF NOT EXISTS redemption_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_description text NOT NULL,
  tokens_required int NOT NULL CHECK (tokens_required > 0),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE redemption_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read active options"
  ON redemption_options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage options"
  ON redemption_options FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher');

-- 4. Token audit log
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  amount int NOT NULL,
  reason text NOT NULL CHECK (reason IN ('past_paper_upload', 'manual_adjustment', 'redemption')),
  reference_id uuid,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all transactions"
  ON token_transactions FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher');

-- 5. Redemption requests
CREATE TABLE IF NOT EXISTS token_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES redemption_options(id),
  tokens_used int NOT NULL CHECK (tokens_used > 0),
  reward_description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE token_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own redemptions"
  ON token_redemptions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all redemptions"
  ON token_redemptions FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher');

CREATE POLICY "Teachers can update redemptions"
  ON token_redemptions FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher');

-- 6. RPC helpers for atomic token balance updates
CREATE OR REPLACE FUNCTION increment_token_balance(p_student_id uuid, p_amount int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE student_profiles
  SET token_balance = COALESCE(token_balance, 0) + p_amount
  WHERE id = p_student_id;
$$;

-- 7. Seed default redemption options
INSERT INTO redemption_options (reward_description, tokens_required) VALUES
  ('課程折扣 $50', 100),
  ('課程折扣 $100', 180),
  ('免費試堂 1 次', 300)
ON CONFLICT DO NOTHING;
