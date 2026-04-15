-- RPC function to safely upsert into wrong_question_bank
create or replace function public.upsert_wrong_question(
  p_student_id uuid,
  p_question_id uuid,
  p_category_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into wrong_question_bank (student_id, question_id, question_source, category_id, wrong_count, correct_streak, last_wrong_at, is_resolved)
  values (p_student_id, p_question_id, 'questions', p_category_id, 1, 0, now(), false)
  on conflict (student_id, question_id, question_source)
  do update set
    wrong_count = wrong_question_bank.wrong_count + 1,
    correct_streak = 0,
    last_wrong_at = now(),
    is_resolved = false;
end;
$$;
