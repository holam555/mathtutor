-- ============================================================
-- 0005_sprint2_indexes_and_stats.sql
-- New indexes for Sprint 2 analytics queries + stats functions
-- ============================================================

-- Indexes for 7-day category accuracy stats
create index if not exists idx_answer_records_student_answered_at
  on answer_records (student_id, answered_at desc);

create index if not exists idx_answer_records_question_source
  on answer_records (question_id, question_source);

create index if not exists idx_practice_sessions_student_completed
  on practice_sessions (student_id, completed_at desc);

create index if not exists idx_questions_category_active
  on questions (category_id, is_active);

-- ============================================================
-- Function: get per-category accuracy stats for a student
-- ============================================================
create or replace function public.get_student_category_stats(
  p_student_id uuid,
  p_days int default 7
)
returns table (
  category_id   uuid,
  category_name text,
  category_code text,
  total_attempts bigint,
  correct_count  bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    qc.id          as category_id,
    qc.name        as category_name,
    qc.code        as category_code,
    count(ar.id)   as total_attempts,
    sum(case when ar.is_correct then 1 else 0 end) as correct_count
  from answer_records ar
  join questions q
    on ar.question_id = q.id
   and ar.question_source = 'questions'
  join question_categories qc
    on q.category_id = qc.id
  where ar.student_id  = p_student_id
    and ar.answered_at >= now() - (p_days || ' days')::interval
  group by qc.id, qc.name, qc.code
  order by count(ar.id) desc;
$$;

-- ============================================================
-- Function: get all students' summary stats (for admin)
-- ============================================================
create or replace function public.get_all_students_stats()
returns table (
  student_id      uuid,
  student_name    text,
  grade           int,
  session_count   bigint,
  total_answers   bigint,
  correct_answers bigint,
  wrong_unresolved bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sp.id              as student_id,
    sp.name            as student_name,
    sp.grade,
    count(distinct ps.id)                                       as session_count,
    count(ar.id)                                                as total_answers,
    sum(case when ar.is_correct then 1 else 0 end)              as correct_answers,
    (select count(*) from wrong_question_bank wqb
      where wqb.student_id = sp.id and wqb.is_resolved = false) as wrong_unresolved
  from student_profiles sp
  left join practice_sessions ps
    on ps.student_id = sp.id and ps.completed_at is not null
  left join answer_records ar
    on ar.student_id = sp.id
  group by sp.id, sp.name, sp.grade
  order by sp.name;
$$;
