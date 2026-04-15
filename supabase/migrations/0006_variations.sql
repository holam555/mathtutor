-- ============================================================
-- 0006_variations.sql
-- variation_templates + generated_questions tables
-- ============================================================

-- Variation prompt templates (one per category)
create table if not exists variation_templates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references question_categories(id) on delete cascade,
  template_prompt text not null,
  example_question text,
  constraints text,
  last_generated_at timestamptz,   -- for 24-hour rate limiting
  created_at timestamptz default now(),
  unique (category_id)
);

create index if not exists idx_variation_templates_category
  on variation_templates (category_id);

-- AI-generated question variations (pending teacher review)
create table if not exists generated_questions (
  id uuid primary key default gen_random_uuid(),
  parent_question_id uuid references questions(id) on delete set null,
  category_id uuid not null references question_categories(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice','fill_in','calculation')),
  options jsonb,
  correct_answer text not null,
  difficulty int not null default 1 check (difficulty between 1 and 3),
  reviewed_by uuid references auth.users(id),
  is_approved boolean not null default false,
  is_rejected boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists idx_generated_questions_category
  on generated_questions (category_id);
create index if not exists idx_generated_questions_pending
  on generated_questions (is_approved, is_rejected, created_at desc);

-- ── RLS ─────────────────────────────────────────────────────

alter table variation_templates enable row level security;

create policy "variation_templates_read_all"
  on variation_templates for select to authenticated using (true);

create policy "variation_templates_teacher_write"
  on variation_templates for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

alter table generated_questions enable row level security;

-- Students can only see approved questions
create policy "generated_questions_student_read"
  on generated_questions for select to authenticated
  using (is_approved = true or public.is_teacher());

-- Teachers can do everything
create policy "generated_questions_teacher_write"
  on generated_questions for all to authenticated
  using (public.is_teacher()) with check (public.is_teacher());
