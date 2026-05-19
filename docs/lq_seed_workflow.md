# Long Question (長答題) Seed Workflow

Use this guide when extracting LQs into the `long_questions` table.
Hand this doc to a fresh Claude Code session and say "follow this guide".

## Where input files live

Screenshots (or PDFs) of past-paper LQs live in **grade-specific local
folders** that are gitignored — content never gets pushed to GitHub:

```
_lq_input/p3/
_lq_input/p4/
_lq_input/p5/
_lq_input/p6/
```

Drop the screenshots / cropped PDF pages into the matching grade folder.
**Each screenshot should contain ONE LQ — the question text AND the
model answer side-by-side or stacked** — so the extractor has both
pieces in one image.

If a single image holds multiple LQs, that's fine too; the extractor
will pull them all out. Just keep one "paper" per file (don't merge
unrelated papers into one image).

### Naming suggestion (optional but helpful)

```
_lq_input/p5/p5_s1_paper1_Q41.png
_lq_input/p5/p5_s1_paper1_Q42.png
_lq_input/p5/p5_s2_review_Q05.png
```

The filename becomes the default `source_question` if it looks like
`…_Q<num>.<ext>`. The paper prefix (`p5_s1_paper1`) becomes the default
`source_paper`. Otherwise the extractor will ask you to pick one.

---

## What counts as a 長答題

**Include**: questions whose model answer in the answer key contains
**multi-step working** — at minimum a setup line + a working line + an
答 line. Typical markers:

- 設…為 x (algebra setup)
- Multiple intermediate calculations on separate lines
- 「解：」 prefix
- Final 「答：…」 line
- Often application / word problems
- Usually worth more marks than fill-in-the-blank

**Exclude**:

- Fill-in-the-blank with one-line answer (e.g. `48 ÷ 4 = 12`)
- Multiple choice (A/B/C/D)
- True/false
- Questions whose answer is just a number, fraction, or single word
- Questions that depend on figures (diagrams) — skip these for now,
  human will add image-based LQs separately

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
-- Source: <pdf filename or paper id>
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

1. User drops screenshots into the matching `_lq_input/p<N>/` folder.
2. User opens a fresh chat in the project root.
3. User says one of:
   - "Follow `docs/lq_seed_workflow.md`. Extract all LQs from `_lq_input/p5/`."
   - "Follow `docs/lq_seed_workflow.md`. Extract LQs from these specific files: [list]"
4. Claude reads each image via the `Read` tool (it handles PNG/JPG/PDF).
5. Claude identifies LQ candidates by checking each image for:
   - Multi-step working in the model answer
   - The criteria listed under "What counts as a 長答題" above
6. Claude writes ONE SQL file per grade per paper (or one per batch),
   at `supabase/seed_p<grade>_lq_<paper_or_batch>.sql`.
7. Claude reports back:
   - Count of LQs extracted, per topic
   - Anything skipped + why (figure-dependent, classification unclear,
     answer key missing from screenshot, etc.)
8. User reviews the SQL, applies in Supabase SQL Editor.

## What you need in each screenshot

For Claude to extract reliably, each screenshot must include:

- **The full question text** (with all sub-parts a/b/c if any)
- **The matching model answer** with all working steps

If your past paper has the question paper and answer key on separate
pages, screenshot them together (or stack two screenshots into one
image). Without the model answer, Claude can't write `model_answer` —
it will skip the question with a note.

---

## What to do when…

**The answer key isn't in the same PDF**: stop and ask. Extracting
question without verifying the model answer matches is unsafe.

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
