-- Add question_ids to practice_sessions so we can reload questions on page refresh
alter table practice_sessions
  add column if not exists question_ids jsonb not null default '[]'::jsonb;
