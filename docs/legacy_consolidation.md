# Legacy question-bank consolidation — decision & retirement plan

**Decision (2026-07): consolidate the WRITE paths now; retire the READ
paths and legacy tables later.** Rationale below, then the exact remaining
steps for a future session.

## What the investigation found

The "dual schema" framing in earlier docs was half-stale. Actual state:

| Feature | Legacy involvement | Verdict |
|---|---|---|
| Wrong-question bank | Already dual-source: `wrong_question_bank.question_source` distinguishes `'questions'` vs `'assessment_questions'`; new wrongs write topic-keyed rows via `upsert_wrong_assessment_question`. Legacy reads are backward-compat only. | Already consolidated ✅ |
| Practice retry | `practice/start` splits retry IDs by `question_source`; the legacy branch reads an empty table → returns nothing, harmlessly. | Harmless compat code |
| **Past-paper approval** | **Inserted extracted questions into legacy `questions` — which nothing serves.** Teacher review effort + parent credits produced questions that silently vanished. | **BROKEN — fixed in this branch** |
| **AI-variation approval** | **Same black hole: approved variations inserted into `questions`.** | **BROKEN — fixed in this branch** |
| Variation auto-trigger | Fires only from legacy-source wrongs, which no longer accrue → never fires. Manual generation from `/admin/variations` still works (templates are category-keyed). | Dormant; manual path kept |

Also fixed while in there: both approval flows persisted **short-lived
signed URLs** (1-2h expiry) as question images. They now persist raw
storage paths (`past-papers` bucket), matching the teacher-upload
convention in `admin/questions/actions.ts`.

## What changed in this branch

- `admin/past-papers/[id]` review: the legacy category dropdown is replaced
  by a **unit → topic cascade** (filtered to the upload's declared grade);
  approval inserts into `assessment_questions` with
  `source_paper='parent_upload'`, `source_question='upload:<id8>#<n>'`,
  school/year in `notes`, `difficulty_tier` via `intToTier()`
  (`src/lib/difficulty.ts`, unit-tested).
- `admin/variations` review: each card gains a unit → topic picker;
  approve is disabled until a topic is chosen; insert goes to
  `assessment_questions` with `source_paper='ai_variation'`.
- `/api/past-paper/upload-image` returns `{ url, path }` so the client can
  display the signed URL but persist only the path.
- No DB migration needed: `assessment_questions` already has every column
  used. No data migration needed: legacy `questions` is empty in prod.

## Why not finish the retirement now

The remaining legacy references are **read paths guarding historical
data** (old `answer_records` / `wrong_question_bank` rows with
`question_source='questions'` may exist even though the questions table is
empty — reads return null and the UIs handle it). Ripping them out touches
`practice/start` (the most intricate route in the app) for zero user-visible
gain, and dropping tables is irreversible without a backup step the owner
should run deliberately, not as a side effect of a feature branch.

## Retirement checklist (future session, in order)

1. Verify in prod SQL editor there are truly no live rows:
   `SELECT count(*) FROM questions;`
   `SELECT count(*) FROM wrong_question_bank WHERE question_source='questions' AND is_resolved=false;`
   `SELECT count(*) FROM generated_questions WHERE is_approved=false AND is_rejected=false;`
   (pending variations should be reviewed/cleared through the UI first —
   approving them now correctly lands them in assessment_questions).
2. Remove the legacy branches: `legacyIds` handling in
   `api/practice/start/route.ts`, the `questionSource==='questions'` branch
   + `triggerVariationIfNeeded` in `api/practice/answer/route.ts`, the
   `question_categories` bucket path in `student/wrong-bank/page.tsx`,
   legacy joins in `lib/fetchStudentReport.ts` and
   `parent/child/[id]/session/[sessionId]/page.tsx`.
3. Decide the variation pipeline's future: either rebuild
   `variation_templates` keyed on `curriculum_topics` (the
   `teaching_methods` jsonb on P3 topics was added for exactly this) or
   remove the feature. Until then it still generates from legacy templates,
   which is fine — approval now lands in the right table.
4. Only after 1–3: migration to drop `questions`, `question_categories`,
   `variation_templates` (keep `generated_questions` — it's the review
   queue and is schema-independent). Take a Supabase backup first.

## Known pre-existing gap noted in passing (not fixed here)

`admin/questions` list and the practice flow render
`assessment_questions.image_url` **raw**; only the question *edit* page
signs storage paths. Teacher-uploaded and (now) approval-inserted images
store raw paths per convention, so images may not render in the list view
and student practice until those views sign paths the way
`admin/questions/[id]/page.tsx` does. Small, self-contained fix — good
first task for a future session.
