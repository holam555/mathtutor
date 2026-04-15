-- ============================================================
-- 0001_initial_schema.sql
-- 建立所有核心 tables（Sprint 1 範圍）
-- ============================================================

create extension if not exists "pgcrypto";

-- ----- 題目分類 -----
create table if not exists question_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  grade int not null,
  semester text not null check (semester in ('上', '下')),
  code text not null unique,
  description text,
  created_at timestamptz default now()
);

create index if not exists idx_question_categories_grade_semester
  on question_categories (grade, semester);

-- ----- 題目 -----
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references question_categories(id) on delete restrict,
  question_text text not null,
  question_image_url text,
  question_type text not null check (question_type in ('multiple_choice', 'fill_in', 'calculation')),
  options jsonb,
  correct_answer text not null,
  difficulty int not null default 1 check (difficulty between 1 and 3),
  source text default 'manual' check (source in ('manual', 'past_paper', 'ai_generated')),
  school_name text,
  exam_year int,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_questions_category on questions (category_id);
create index if not exists idx_questions_active on questions (is_active);

-- ----- 學生檔案 -----
create table if not exists student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  grade int check (grade in (5, 6)),
  parent_id uuid,
  school_name text,
  created_at timestamptz default now()
);

-- ----- 家長檔案 -----
create table if not exists parent_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  token_balance int not null default 0,
  created_at timestamptz default now()
);

-- ----- 練習記錄 -----
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  session_type text not null check (session_type in ('new', 'retry_wrong', 'category')),
  category_id uuid references question_categories(id),
  started_at timestamptz default now(),
  completed_at timestamptz,
  total_questions int not null default 0,
  correct_count int
);

create index if not exists idx_practice_sessions_student on practice_sessions (student_id);

-- ----- 答題記錄 -----
create table if not exists answer_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practice_sessions(id) on delete cascade,
  student_id uuid not null references student_profiles(id) on delete cascade,
  question_id uuid not null,
  question_source text not null default 'questions' check (question_source in ('questions', 'generated_questions')),
  student_answer text,
  is_correct boolean not null,
  time_spent_seconds int,
  answered_at timestamptz default now()
);

create index if not exists idx_answer_records_session on answer_records (session_id);
create index if not exists idx_answer_records_student on answer_records (student_id);

-- ----- 錯題收集 -----
create table if not exists wrong_question_bank (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references student_profiles(id) on delete cascade,
  question_id uuid not null,
  question_source text not null default 'questions',
  category_id uuid not null references question_categories(id),
  wrong_count int not null default 1,
  correct_streak int not null default 0,
  last_wrong_at timestamptz default now(),
  is_resolved boolean not null default false,
  unique (student_id, question_id, question_source)
);

create index if not exists idx_wrong_bank_student on wrong_question_bank (student_id);
create index if not exists idx_wrong_bank_unresolved on wrong_question_bank (student_id, is_resolved);
