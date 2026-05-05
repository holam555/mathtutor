# 學前評估題庫工作流程（Assessment Question Workflow）

A practical runbook for the P3 學前評估 question bank — from seeding new
questions all the way to confirming the assessment selector still works
end-to-end. Written for whoever (Kate, future Claude, a tutor) inherits
this database and wants to extend or audit it.

Last verified: **2026-05-05**, against an active pool of ~500 questions
in 17 units / 32 topics.

---

## 0. Schema mental model

Three Supabase tables hold the bank. RLS is locked down so only the
service-role can read; all assessment API routes use `createServiceClient()`.

```
curriculum_units      ── 17 P3 units (3A 1-7, 3B 8-17)
   │
   ▼ unit_id
curriculum_topics     ── 32 lesson-level topics (lesson 1-40)
   │                       teaching_methods JSON column for AI prompts
   ▼ topic_id
assessment_questions  ── ~700 rows (active + inactive)
                          - question_text / options / correct_answer
                          - difficulty_tier: basic | enhancement | advanced
                          - group_id + sub_order: linked sub-questions
                          - image_url + image_alt_text for figure questions
                          - is_active: false = soft-disabled, kept for review
```

Key invariants:

- `correct_answer` is **never sent to the browser**. Server grades on submit.
- `is_active = false` removes a question from selection without deleting it.
- A `group_id` cluster counts as **one selectable item** in the algorithm.
- `display_order` on units/topics drives the curriculum-order sort.

---

## 1. Adding new questions

### 1a. Manual SQL insert (for one-off questions)

Use `source_paper = 'manual_seed'` so they're easy to find later.
Topic IDs are fixed UUIDs — get them from `curriculum_topics`.

```sql
-- Look up the topic_id you want first:
-- SELECT id, name FROM curriculum_topics WHERE unit_id IN (...);

INSERT INTO assessment_questions (
  topic_id, difficulty_tier, question_type, question_text, options,
  correct_answer, source_paper, source_question, is_active
) VALUES (
  '<topic uuid>', 'basic', 'fill_in_number',
  '一罐巧克力連罐共重 540 克，淨重 480 克。罐子（包裝）重多少克？',
  NULL, '60', 'manual_seed', '淨重/毛重 basic 1', true
);
```

For MC, `options` is a JSON array: `'["A. ...", "B. ...", ...]'::jsonb`,
and `correct_answer` is the full option string including the prefix.

Conventions:

| `question_type`    | options? | correct_answer format                |
| ------------------ | -------- | ------------------------------------ |
| `multiple_choice`  | yes      | `"A. 答案文字"` (must match an option) |
| `fill_in`          | NULL     | text or fraction                     |
| `fill_in_number`   | NULL     | a plain number (`"60"`, `"7/9"`)     |
| `calculation`      | NULL     | a number or expression result        |

### 1b. Bulk extraction from past papers

Done previously by sub-agents reading PDF mock papers. Recipe in
`feedback_past_paper_figure_workflow.md` (figures) and
`docs/p3_question_extraction.md` (general extraction).

When extracting, ALWAYS include:

- `topic_id` matching curriculum lesson 1-40
- `difficulty_tier` based on solve-step count (1 step = basic,
  2-3 steps = enhancement, 4+ = advanced)
- `source_paper` + `source_question` for traceability

---

## 2. Exporting the current state

PostgREST capping at 100 rows in the dashboard is bypassed via the
service-role REST API:

```bash
python3 scripts/export_assessment_questions.py
```

Writes `assessment_questions_full.csv` (UTF-8 BOM, opens in Excel cleanly)
with all active questions joined to their unit + topic. Use
`--include-inactive` to also dump the disabled ones.

Columns: `unit_number, semester, unit_name, topic_lesson, topic_name,
difficulty_tier, question_type, question_text, options, correct_answer,
image_url, image_alt_text, group_id, sub_order, is_active, question_id`.

---

## 3. Verifying correctness

### 3a. Pattern-based scan (fast, free)

```bash
python3 scripts/verify_assessment_answers.py
```

Catches:

- Pure arithmetic mismatches (`4487 + 1539 + 257` → recomputes)
- Division `商X餘Y` mismatches (`80 ÷ 6` → `商13餘2`)
- MC stored-answer-not-in-options
- Negation MCs flagged for human review (「不正確」/「不等於」)

Outputs `assessment_answers_verification.csv`. ~10 seconds for 500 rows.

### 3b. LLM deep verification (slower, more thorough)

Spawn a sub-agent to read each question and solve it from scratch.
Pattern-scan misses word problems, unit conversions, multi-step logic,
and distractor quality.

Recipe in [§4](#4-llm-verification-prompt-template). Runs in 5–10 min for 500
questions. Output: `post_cleanup_verify_report.csv` (or whatever path
you gave the agent).

Severities:

- `wrong` — definite math error, fix immediately
- `inconsistent` — e.g. MC with two correct options, contradictory wording
- `needs_human_review` — agent's <80% confidence
- `unsolvable_in_isolation` — a 「承上題」 missing its prior

### 3c. Curriculum alignment check (also LLM)

Different agent prompt that reads the P3 curriculum PDF
(`pre assessment curriculum/【天花板級別】香港小學三年級…pdf`) and confirms each
question's `unit/topic` assignment matches what the syllabus says is
taught there. Caught ~67 misclassifications on the first run.

### 3d. Image question review (manual eyeball)

```bash
python3 scripts/render_image_questions_html.py
open active_image_questions.html
```

Generates a printable HTML page with every active image question — image
loaded inline, alt text shown beside, options + correct answer
highlighted. Scroll through, compare against the actual image, note
any IDs where alt text contradicts what's pictured.

LLM agents can't see the image itself, so this step is genuinely manual.

---

## 4. LLM verification prompt template

When spawning a sub-agent, structure the prompt with:

1. **Inputs**: absolute path to the CSV; describe the columns.
2. **Skip list**: question_ids already verified or fixed (avoids noise).
3. **Focus areas**: be specific about what the agent should pay extra
   attention to. Different passes catch different things — see what's
   already been checked, target the gaps.
4. **Output spec**: CSV path, exact columns, severity values.
5. **Constraints**: no DB writes, no other-file mutations, no spawning
   sub-agents, encode UTF-8 BOM.
6. **Length cap** on final response.

Example focus categories used so far:

| Pass    | Focus                                                          |
| ------- | -------------------------------------------------------------- |
| 1       | Math correctness, MC integrity, multi-step word problems       |
| 2       | Estimation, fractions, unit conversions, ordering, money       |
| 3       | Curriculum alignment, distractor quality, image alt-text, P3 reading level |
| 4 (post-cleanup) | Final pre-launch confirmation on text-only pool      |

Run multiple passes with **different framings**. Diminishing returns
after ~2 passes — if pass 2 finds 0 new errors that pass 1 missed, the
pool is clean.

---

## 5. Fixing issues — SQL convention

All fixes go in `supabase/fix_*.sql` (one-off) or
`supabase/migrations/00NN_*.sql` (schema/policy changes).

Conventions:

- Wrap every change in `BEGIN; ... COMMIT;` for atomicity.
- Add `AND correct_answer = '<old>'` guard on UPDATEs so re-running
  is idempotent and won't double-apply.
- Comment every block with what + why, not just what.
- Include the question_id and a 1-line summary of the question text so
  the SQL is self-documenting.
- For bulk disables, add a revert SQL stub at the bottom of the file:

```sql
-- Revert: UPDATE assessment_questions SET is_active = true WHERE id IN (...);
```

Naming: `fix_<short-noun>_v<n>.sql`. Past examples in the repo:

- `fix_disable_flagged_questions.sql` — bulk soft-disable
- `fix_topic_gap_coverage.sql` — revive + add new for empty topics
- `fix_misplaced_questions.sql` — topic reassignment
- `fix_wrong_answers_v1.sql`, `_v2.sql` — incremental answer fixes
- `fix_wording_v3.sql` — pure question_text rewrites

---

## 6. Validating the selection algorithm

After ANY change to the active pool size or the
`assessmentSelection.ts` algorithm:

```bash
python3 scripts/simulate_question_selection.py
```

Mirrors the production TS algorithm in Python. Runs 132 scenarios:

- Every topic alone (32) — drill-down focus mode
- Every unit alone (17) — single-unit selection
- Random combos of 2/3/5 units (15)
- All units / all topics (2)

For each scenario × algorithm (LINEAR vs EVEN weighting), records
total questions, tier breakdown, empty scopes, and warnings.

Decision rule:

- **All multi-unit scenarios** should hit ≥ 18 questions (basic + enhancement).
- **Single-unit scenarios** should hit ≥ 15 unless the unit's pool is
  inherently smaller (U9, U11, U13 are known thin units — accept their
  pool size).
- **Drill-down topic scenarios**: accept whatever the topic's pool
  delivers; warn the parent in the UI if < 15.

Output: `simulate_selection_report.csv`. Open in Excel + filter to spot
regressions.

---

## 7. Pre-launch checklist

Before exposing the assessment to real parents:

- [ ] All `fix_*.sql` files in `supabase/` have been run in Supabase
- [ ] Re-export CSV: `python3 scripts/export_assessment_questions.py`
- [ ] Re-run pattern verifier — 0 hard errors
- [ ] Re-run LLM verifier on text-only subset — 0 `wrong` severity
- [ ] Manual eyeball pass on `active_image_questions.html`
- [ ] Re-run selection simulator — multi-unit scenarios all green
- [ ] Try the assessment end-to-end in dev:
      `npm run dev` → `/assessment` → P3 → pick 3 units → answer 20 →
      submit → see report with module mastery
- [ ] Smoke-test a thin selection (e.g. only U13 角的認識) — should
      gracefully return 5 questions with a warning, not crash
- [ ] Verify the `is_active = false` count matches expectation
      (`SELECT count(*) FROM assessment_questions WHERE NOT is_active;`)
- [ ] Confirm RLS: try `SELECT * FROM assessment_questions` from the
      Supabase SQL editor authenticated as anon — should return 0 rows

---

## 8. Recurring maintenance

Whenever you add ≥ 20 questions OR change the algorithm:

1. Re-export → pattern verify → LLM verify (1 pass) → simulator.
2. Bump `display_order` on `curriculum_topics` if you reorganise.
3. Update `assessment_questions_full.csv` baseline in repo so diffs
   are visible to future audits.

Whenever you disable questions:

- Run the simulator to catch newly-empty topics.
- If a topic drops to 0 in basic or enhancement, write a
  `fix_topic_gap_coverage.sql` style revival/insertion.

---

## Reference table — files used in this workflow

| File                                           | What                                            |
| ---------------------------------------------- | ------------------------------------------------ |
| `scripts/export_assessment_questions.py`       | Export DB → CSV, paged via REST                  |
| `scripts/verify_assessment_answers.py`         | Pattern-based math correctness scan              |
| `scripts/render_image_questions_html.py`       | Generate printable image-question review HTML    |
| `scripts/simulate_question_selection.py`       | Validate selection algorithm coverage            |
| `assessment_questions_full.csv`                | Current snapshot of active pool                  |
| `assessment_quality_review_cleaned.csv`        | Latest LLM verification findings                 |
| `active_image_questions.html`                  | Latest image-review render                       |
| `simulate_selection_report.csv`                | Latest algorithm simulation results              |
| `supabase/fix_*.sql`                           | One-off corrective SQL                           |
| `supabase/migrations/00NN_*.sql`               | Schema / RLS policy changes                      |
| `pre assessment curriculum/【天花板級別】…P3…pdf`    | Canonical curriculum source                      |
| `src/lib/assessmentSelection.ts`               | Production selection algorithm                   |
| `src/types/assessment.ts`                      | TIER_QUOTA + types                               |

---

## When in doubt

Re-run all four scripts in this order — it's idempotent and takes < 1 min:

```bash
python3 scripts/export_assessment_questions.py
python3 scripts/verify_assessment_answers.py
python3 scripts/render_image_questions_html.py
python3 scripts/simulate_question_selection.py
```

If any of them surfaces unexpected results, follow §3 / §6 to diagnose.
