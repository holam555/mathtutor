-- ============================================================
-- 0002_rls_policies.sql
-- 啟用 RLS 並建立 policies
-- 老師判斷：auth.users.raw_user_meta_data->>'role' = 'teacher'
-- ============================================================

-- Helper function：是否為老師
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher',
    false
  );
$$;

-- ============================================================
-- question_categories
-- 所有登入用戶可讀；老師可寫
-- ============================================================
alter table question_categories enable row level security;

drop policy if exists "categories_read_all" on question_categories;
create policy "categories_read_all"
  on question_categories for select
  to authenticated
  using (true);

drop policy if exists "categories_teacher_write" on question_categories;
create policy "categories_teacher_write"
  on question_categories for all
  to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

-- ============================================================
-- questions
-- 所有登入用戶可讀（只能看 active）；老師可讀寫所有
-- ============================================================
alter table questions enable row level security;

drop policy if exists "questions_read_active" on questions;
create policy "questions_read_active"
  on questions for select
  to authenticated
  using (is_active = true or public.is_teacher());

drop policy if exists "questions_teacher_write" on questions;
create policy "questions_teacher_write"
  on questions for all
  to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

-- ============================================================
-- student_profiles
-- 學生只能讀寫自己；老師可讀所有
-- ============================================================
alter table student_profiles enable row level security;

drop policy if exists "students_read_own" on student_profiles;
create policy "students_read_own"
  on student_profiles for select
  to authenticated
  using (id = auth.uid() or public.is_teacher());

drop policy if exists "students_write_own" on student_profiles;
create policy "students_write_own"
  on student_profiles for all
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- parent_profiles
-- 家長只能讀寫自己；老師可讀所有
-- ============================================================
alter table parent_profiles enable row level security;

drop policy if exists "parents_read_own" on parent_profiles;
create policy "parents_read_own"
  on parent_profiles for select
  to authenticated
  using (id = auth.uid() or public.is_teacher());

drop policy if exists "parents_write_own" on parent_profiles;
create policy "parents_write_own"
  on parent_profiles for all
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- practice_sessions
-- 學生只能讀寫自己的；老師可讀所有
-- ============================================================
alter table practice_sessions enable row level security;

drop policy if exists "sessions_read_own" on practice_sessions;
create policy "sessions_read_own"
  on practice_sessions for select
  to authenticated
  using (student_id = auth.uid() or public.is_teacher());

drop policy if exists "sessions_write_own" on practice_sessions;
create policy "sessions_write_own"
  on practice_sessions for all
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ============================================================
-- answer_records
-- 學生只能讀寫自己的；老師可讀所有
-- ============================================================
alter table answer_records enable row level security;

drop policy if exists "answers_read_own" on answer_records;
create policy "answers_read_own"
  on answer_records for select
  to authenticated
  using (student_id = auth.uid() or public.is_teacher());

drop policy if exists "answers_write_own" on answer_records;
create policy "answers_write_own"
  on answer_records for all
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ============================================================
-- wrong_question_bank
-- 學生只能讀寫自己的；老師可讀所有
-- ============================================================
alter table wrong_question_bank enable row level security;

drop policy if exists "wrong_bank_read_own" on wrong_question_bank;
create policy "wrong_bank_read_own"
  on wrong_question_bank for select
  to authenticated
  using (student_id = auth.uid() or public.is_teacher());

drop policy if exists "wrong_bank_write_own" on wrong_question_bank;
create policy "wrong_bank_write_own"
  on wrong_question_bank for all
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
