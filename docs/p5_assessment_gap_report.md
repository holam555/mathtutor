# P5 學前評估題庫 — Gap Report

Generated after migrating hardcoded P5 (5 enrollment-month papers) to DB.

## Pool summary

- **Total questions imported**: 52
- **Source**: `src/data/assessmentQuestions.ts` (5 papers × 12 Qs, all unique post-dedupe)
- **Skipped**: 8 questions on 速率 (rate/speed) — P6 syllabus, not P5

## Tier distribution

| Tier        | Count |
| ----------- | ----- |
| basic       | 43    |
| enhancement | 9     |
| advanced    | 0     |
| **Total**   | **52**|

## Per-topic coverage (only topics WITH questions)

| Lesson | Topic                                      | Count |
| ------ | ------------------------------------------ | ----- |
| L3     | 異分母分數加減法：通分基礎                  | 1     |
| L4     | 異分母分數加減法：基礎計算                  | 5     |
| L6     | 分數乘法：整數乘分數                        | 1     |
| L12    | 簡易方程（一）：方程的意義與一步加減法方程  | 1     |
| L13    | 簡易方程（一）：一步乘除法方程與應用題      | 2     |
| L15    | 多邊形的面積：平行四邊形與三角形面積        | 6     |
| L17    | 體積的認識：體積單位與正方體/長方體體積     | 5     |
| L21    | 小數加法和減法：基礎計算                    | 7     |
| L23    | 小數乘法：基礎計算                          | 2     |
| L26    | 小數除法：除數是小數的小數除法              | 3     |
| L27    | 小數和分數的互化                            | 3     |
| L28    | 分數除法：基礎計算                          | 1     |
| L31    | 分數除法：應用題專項突破                    | 2     |
| L33    | 百分數：應用題專項突破                      | 8     |
| L36    | 立體圖形：長方體和正方體的體積與容積        | 3     |
| L37    | 平均數                                      | 2     |

**16 of 35 P5 topics have questions.**

## Empty topics (19)

L1, L2, L5, L7, L8, L9, L11, L14, L16, L18, L19, L22, L24, L25, L29, L32, L34, L35, L38

These topics have **zero** questions in the migrated pool. Parents who pick
units containing only these topics will hit the gap-fill safety net (see
`assessmentSelection.ts`) which guarantees ≥1 question per scope using
nearest-neighbor borrow + cross-tier fill. If a parent picks ONLY a unit
whose topics are all empty, the assessment will return < 20 questions with a
warning — the UI should display this gracefully.

## Decisions

1. **Tier quota for P5**: `{ basic: 12, enhancement: 8, advanced: 0 }` (total 20).
   - Reflects the actual pool: zero advanced questions exist, so we don't
     allocate a slot for them. Cross-tier fill (basic ← enhancement, never
     advanced) handles overflow within selected scopes.
2. **Thin-topic policy**: tolerate. Algorithm safety nets cover the failure
   modes; no manual top-up for now per user's "use what's there" directive.
3. **Distribution strategy**: even (uniform across selected units).
   `allocateByLinearWeight` is being replaced by `allocateByEvenDist` in
   Phase 5 — applies to BOTH P3 and P5.
