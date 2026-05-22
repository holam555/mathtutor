# Long Question (長答題) Seed Workflow

Use this guide when extracting LQs into the `long_questions` table.
Hand this doc to a fresh Claude Code session and say "follow this guide".

## Where input files live

Two parallel folders per grade — both gitignored, content stays local:

```
_lq_input/p3/          ← LQ screenshots (Q + answer text)
_lq_input/p3/images/   ← Diagrams that belong to specific LQs

_lq_input/p4/
_lq_input/p4/images/

_lq_input/p5/
_lq_input/p5/images/

_lq_input/p6/
_lq_input/p6/images/
```

### Folder 1: `_lq_input/p<N>/` — LQ Q+A screenshots

What goes here: photos / screenshots of past-paper pages showing **the
question text AND the matching model answer** (one screenshot may
contain several LQs from the same page). The user has already filtered
to LQs only before screenshotting.

Behaviour:

- ✅ Expect **multiple LQs per image** — extract every Q/A pair visible
- ✅ Match question to answer by question number if they're in separate
  images
- ✅ Preserve original question numbering (Q41, Q42…) as `source_question`
- ❌ Do **not** filter — the user already filtered. Capture everything
- ❌ Do **not** read PDFs or anything outside this folder

### Folder 2: `_lq_input/p<N>/images/` — diagram images per LQ

What goes here: separate diagram / chart / figure images, **one per LQ
that needs one**. Naming convention is required so Claude can match
the image to the question row:

```
<source_paper>_Q<num>.<ext>
```

Examples:

```
_lq_input/p5/images/p5_s1_paper1_Q42.png
_lq_input/p5/images/p5_s1_paper1_Q43.png
_lq_input/p6/images/p6_s2_paper2_Q05.png
```

Rules for matching:

- The image filename `<source_paper>_Q<num>` must match the `source_paper`
  + `source_question` of the corresponding LQ row in folder 1
- If a question has no image in `images/`, leave `image_url` NULL
- If the user drops an image in `images/` but Claude can't find a matching
  LQ in folder 1, log a warning and skip it

Claude **does not invent** image references. If `_lq_input/p5/` has a
Q42 but `_lq_input/p5/images/` has no `*_Q42.<ext>` file → `image_url`
stays NULL. The user adds the image later if needed.

## Filename convention for screenshots in Folder 1 (optional)

```
_lq_input/p5/p5_s1_paper1_p3.png        ← page 3 of paper 1, S1
_lq_input/p5/p5_s2_paper2_p5.png        ← page 5 of paper 2, S2
_lq_input/p5/p5_s1_paper1_ans.png       ← answer key from paper 1
```

Use whatever paper id pattern is in the filename as `source_paper`, and
the question number visible inside the image as `source_question`.

---

## Filtering — already done by the user

The user has already decided every question in the screenshots is an
LQ before screenshotting. **Do not skip questions based on your own
LQ-vs-SQ judgement.** Capture everything visible.

The only legitimate reasons to skip:

- ❌ The question references a figure / diagram that isn't shown in the
  screenshot (and we can't reproduce it)
- ❌ The matching model answer is not visible (no working shown)
- ❌ Question is in English (the app is Traditional Chinese only)

If you skip a question, note it in the report-back so the user knows
which ones to redo.

If unsure, **err on the side of skipping**. Better to miss a borderline
question than dilute the LQ pool with SQs.

---

## Schema

`long_questions` columns (after migration 0021 dropped `total_marks`):

| Column | Type | Required | Notes |
|---|---|---|---|
| `topic_id` | uuid | ✅ | FK to `curriculum_topics` |
| `question_text` | text | ✅ | Question verbatim from paper |
| `model_answer` | text | ✅ | Verbatim from answer key, preserve line breaks |
| `difficulty_tier` | text | ✅ | `basic` / `enhancement` / `advanced` |
| `image_url` | text | — | Leave NULL for now (skip image-dependent LQs) |
| `source_paper` | text | recommended | e.g. `p5_s1_paper1_2026` |
| `source_question` | text | recommended | e.g. `Q41`, `Q42` |
| `notes` | text | optional | One-line hint about the question |
| `is_active` | boolean | defaults true | leave true |

---

## Model answer formatting rules (verbatim)

The previous P5 sample (`seed_p5_long_questions_sample.sql`) uses
**verbatim handwriting** as model answer, e.g.:

```
園丁需付：
40÷4×10×10
=1000 元
```

**Do**:
- Preserve line breaks exactly as in the answer key
- Use ÷ × not / *
- Use Chinese 元/克/升 etc. inline (`=5 元`, not `= 5 元`)
- Use space-form mixed numbers: `1 5/8`, not `1又5/8`
- Quote the 答 line as written
- If answer key writes `40 ÷ 4 × 10 × 10`, write it the same way

**Don't**:
- Expand into multi-paragraph 老師解說 form
- Add explanatory text not in the answer key
- Convert fractions to decimals or vice versa unless the key did

---

## Difficulty tier rule

Count solve steps in the model answer:

- **basic** — 1 step (e.g. direct formula application)
- **enhancement** — 2–3 steps (most LQs land here)
- **advanced** — 4+ steps, multi-stage word problems, algebraic setup

When in doubt → `enhancement`.

---

## Topic mapping

Look up `topic_id` via subquery — never hardcode UUIDs. Pattern:

```sql
(SELECT t.id FROM curriculum_topics t
   JOIN curriculum_units u ON u.id = t.unit_id
   WHERE u.grade = 5 AND u.unit_number = 7
   ORDER BY t.lesson_number LIMIT 1)
```

This picks the first topic under `P5 U7`. For P3 (which has per-lesson
topics), specify `t.lesson_number = N` instead of `LIMIT 1`.

### Unit reference

**P3** — 17 units, 32 topics, lesson-level granularity
See `supabase/migrations/0014_p3_curriculum_assessment.sql`.

**P4** — 17 units (U1–U18, missing U6/U?), one placeholder topic each
- 4A: U1 倍數和因數, U2 公倍數和公因數, U3 乘法, U4 除法, U5 四則混合運算, U7 平行與垂直, U8 四邊形, U9 周界
- 4B: U10 分數的認識（一）, U11 擴分與約分, U12 同分母分數加減法, U13 小數的認識, U14 圖形的拼砌與分割, U15 對稱圖形, U16 正方形和長方形面積, U17 棒形圖（一）單式, U18 棒形圖（二）複式

**P5** — 19 units, one placeholder topic each
- 5A: U1 多位數, U2 異分母分數加法和減法, U3 分數乘法, U4 代數符號, U5 簡易方程（一）, U6 方向, U7 多邊形的面積, U8 體積的認識, U9 複合棒形圖
- 5B: U10 小數加法和減法, U11 小數乘法, U12 小數除法, U13 小數和分數的互化, U14 分數除法, U15 百分數, U16 圓的初步認識, U17 長方體和正方體的表面積與體積, U18 平均數, U19 折線圖

**P6** — 13 units, one placeholder topic each
- 6A: U1 小數除法, U2 百分數的認識, U3 數型, U4 圓的認識, U5 軸對稱和旋轉對稱圖形, U6 容量和體積, U7 圓周的計算, U8 折線圖
- 6B: U9 百分數應用, U10 簡易方程（三）, U11 截面與圓面積, U12 速率與行程圖, U13 圓形圖

If a question doesn't fit any unit, put it under the closest-matching
unit and add a `notes` field flagging the mismatch.

---

## SQL output format

One file per source paper. Naming: `supabase/seed_<grade>_lq_<paper>.sql`.

Template:

```sql
-- Long Question seed: <human-readable description>
-- Source: <paper id (e.g. p5_s1_paper1)>
-- Apply once in Supabase SQL Editor after migrations 0020 + 0021.
-- Idempotent via source_paper + source_question.

BEGIN;

-- Clear any prior runs of this exact seed
DELETE FROM long_questions
WHERE source_paper = '<source_paper>'
  AND source_question IN ('Q01', 'Q02', ...);

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   source_paper, source_question, notes, is_active)
VALUES
  (
    (SELECT t.id FROM curriculum_topics t
       JOIN curriculum_units u ON u.id = t.unit_id
       WHERE u.grade = 5 AND u.unit_number = 7
       ORDER BY t.lesson_number LIMIT 1),
    '<question text>',
    '<model answer with \n line breaks>',
    'enhancement',
    '<source_paper>', 'Q41', '<notes>', true
  ),
  -- … more rows …
  ;

COMMIT;
```

Multi-line strings: PostgreSQL accepts literal newlines inside single
quotes. Don't use `E'…\n…'` form unless escaping is needed.

---

## Quality checklist (run before COMMIT)

For each row, mentally check:

- **C1** Math correct? Re-solve and verify final answer matches model.
- **C2** Topic correct? Question content belongs to the unit's syllabus.
- **C3** Single valid answer (no equivalent forms slipping in).
- **C4** No mobile-unfriendly chars in answer (`>` `<` `=` `%` `:` if it were `fill_in_number` — for LQ this is fine because answer is freeform text).
- **C5** Grade-appropriate (P3 not too hard, P6 not too trivial).
- **C7** Units in answer where the question asks for units (元/米/升…).
- **C8** Each unit should accumulate at least 1 basic + 1 enhancement
  across the whole seed batch — flag if you only added 1 type.

---

## Workflow for a fresh Claude Code session

1. User drops Q+A screenshots into `_lq_input/p<N>/`.
2. (Optional) User drops matching diagram images into
   `_lq_input/p<N>/images/`, named `<source_paper>_Q<num>.<ext>`.
3. User opens a fresh chat in the project root.
4. User says:
   > Follow `docs/lq_seed_workflow.md`. Extract all LQs from
   > `_lq_input/p5/`.
5. Claude reads only the image files in the folder (top-level), not
   PDFs and not the `images/` subfolder yet.
6. For each top-level image, Claude identifies **every Q/A pair visible**
   and notes the `source_paper` + `source_question` for each.
7. Claude lists the files in `_lq_input/p<N>/images/` and matches each
   `<source_paper>_Q<num>.<ext>` to the corresponding LQ. For each
   matched LQ, the `image_url` will reference that local path until
   the user uploads it to Supabase Storage (see below).
8. Claude writes ONE SQL file at
   `supabase/seed_p<grade>_lq_<batch_name>.sql` where `batch_name` is
   derived from the filenames.
9. Claude reports back:
   - Count of LQs extracted, with `source_paper` + `source_question`
     per row
   - Topic distribution across the batch
   - Which LQs have a matching image in `images/` (✓) and which don't
   - Any orphan images in `images/` that didn't match any LQ
   - Any Q/A pair skipped + why
10. User reviews the SQL, applies in Supabase SQL Editor.

## How `image_url` gets populated

The SQL leaves a placeholder `image_url` value: a string like
`local:_lq_input/p5/images/p5_s1_paper1_Q42.png`. This is **not a
valid Supabase Storage path** — it tells the user "this LQ needs an
image, here's the local file to upload."

After applying the seed, the user:

1. Uploads each `images/*.<ext>` file to Supabase Storage bucket
   `past-papers` under `long-question-images/`
2. Runs an UPDATE to replace `local:…` paths with the storage path
   (e.g. `long-question-images/p5_s1_paper1_Q42.png`)

Or: the user uploads via the `/admin/long-questions/[id]` edit page,
which already supports image upload — the form replaces `image_url`
with the real storage path on save. Claude will note both options in
the report.

## What each batch of screenshots must contain

Across the images in a folder, every Q/A pair must have BOTH:

- the question text (full text + any sub-parts)
- the matching model answer with working steps

These two can be in the **same image** (typical when the user
photographs a page that shows both the question and its solution) OR in
**different images** (e.g. one screenshot of the question page, one of
the answer key page). Claude should match questions to their answers
by question number (Q41 in image A pairs with Q41 in image B).

---

## What to do when…

**Question and answer are in different images**: match by question
number. If Q42's answer is missing from any image in the batch, skip
Q42 and note it in the report.

**Question has a figure / diagram**: skip it. Add a `-- SKIPPED: Q42 (depends on figure)` comment in the SQL output so the user can revisit.

**Multiple sub-parts ((a)(b)(c))**: include them all in `question_text`
as one LQ. The model answer should cover every sub-part in order.

**Question is in English**: skip (this app is Traditional Chinese only).

**Two questions cover the same concept (variations)**: include both.
Variation builds the bank.

**Answer key uses `又` form for mixed numbers**: convert to space form
in the model answer (`1 5/8` not `1又5/8`).

**Question references real money / dates**: keep verbatim — don't
modernise.
