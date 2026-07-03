# mathtutor

A web app that uses AI to generate practice questions mirroring real exams and analyze student performance, while helping parents and tutors manage questions and results.

Built to give lower-income families access to quality, affordable math practice — 50+ students using it within two months of launch. Three roles, one app: students work through mobile-first practice sessions, parents set exam scopes and track progress, tutors curate the question bank and mark long-answer work. Built solo, end to end — schema design, RLS policies, AI pipelines, the works.

Live Demo: https://mathtutor-delta.vercel.app/

## What it does

- **Diagnostic assessment** — before a student starts a course, the app pulls a weighted sample of questions across curriculum units (P3–P6) to find weak spots, with per-unit and per-difficulty quotas so the sample is actually representative, not random noise.
- **Mock exam generator** — parents pick the units on the upcoming school test, and the app assembles a 40-question paper (MC + short-answer + long-answer) matched to that scope, with a fixed easy/medium/hard mix and sub-question groups kept intact (you can't split 5(a) from 5(b) when they share a diagram).
- **Past paper ingestion** — parents photograph old exam papers; Gemini Vision extracts questions, a teacher reviews/corrects, and approved questions flow into the bank. Parents earn redeemable credits per approved page.
- **AI-generated variations** — when a student keeps missing a question type, Gemini generates fresh practice questions in the same pattern for teacher approval, instead of just repeating the same failed question.
- **Long-answer marking loop** — students photograph handwritten LQ answers, papers sit in a `lq_pending` state with the timer frozen, and results unlock once a teacher grades them.
- **Wrong-question bank & spaced retry** — mistakes get tracked per student and resurface until answered correctly twice.
- **Gamified student home** — daily goal ring, streak tracker, trophy shelf — all computed on the fly from practice stats, no separate trophies table to keep in sync.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Supabase** — Postgres, Auth, Storage, and Row Level Security as the actual authorization layer (not just app-level checks — `is_parent_of()` / `is_teacher()` SQL functions gate every student-data table)
- **Gemini 2.5 Flash** (Vision + text) for OCR extraction and question generation
- **sharp** / **pdfjs-dist** / **canvas** for image and PDF processing on uploaded exam papers

## Scale, for context

~19.5k lines of TypeScript, 20 SQL migrations, 3 role-specific auth flows, and question banks spanning 4 grade levels — built and iterated solo over about 6 weeks.

## Running it locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Gemini keys
npm run dev
```

Then apply the SQL migrations in `supabase/migrations/` in order, and seed a curriculum + question bank from `supabase/seed_*.sql` (see `CLAUDE.md` for the exact apply order — there's a few grades' worth of seed files and they're not all independent).
