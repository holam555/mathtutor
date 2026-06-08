# P6 6AA 預設試卷 — Test Extraction Report

**Source**: `past paper in word/六年級上學期/單元一至四/p6aa_presets.doc` + `p6aa_presett.doc`
**Pipeline**: `.doc` → `.pdf` (soffice) → read in chat → SQL seed.
**Output**: `supabase/seed_p6aa_test.sql`

## Summary

| | Count |
|---|---|
| Total questions in paper | 30 |
| Seeded | 25 (24 MC/SQ + 1 LQ) |
| Skipped | 5 |

## Type classification

| Question Type | Count | Section header (verbatim) |
|---|---|---|
| MC | 7 | 選出答案 / 把答案圈起來 |
| SQ | 17 | 計算以下各題 / 先估算再計算 / 把答案填在橫線上 / 回答以下各題 |
| LQ | 1 | 完成以下各題 |

The Chinese section headers are explicit type tags — classification was deterministic, not judgment-based.

## Topic mapping (by content, cross-grade)

| Topic | Grade.Unit | Questions |
|---|---|---|
| 小數除法 | P6 U1 | Q01-Q08, Q12, Q16, Q19 (11) |
| 異分母分數比較 | P5 U2 | Q14, Q15 (2) |
| 小數加法和減法 | P5 U10 | Q17 (1) |
| 小數和分數的互化 | P5 U13 | Q13, Q25-Q27 (4) |
| 平均數 | P5 U18 | Q09, Q21-Q24, Q28 (6) |
| 正方形和長方形面積 | P4 U16 | Q18 (1) |

Note: the paper claims 單元一至四 but content includes 平均數 (P5 U18), 分數 互化 (P5 U13), 折線圖 (P6 U8) and other P5/P4 topics. Per your direction, we map **by content** — cross-grade references go to the most appropriate unit.

## Complete question table

| Q | Type | Section | Content | Answer | Topic | Notes |
|---|---|---|---|---|---|---|
| Q01 | SQ | 計算 | 6.4 ÷ 4 | 1.6 | P6 U1 | |
| Q02 | SQ | 計算 | 3 ÷ 0.6 | 5 | P6 U1 | |
| Q03 | SQ | 計算 | 0.17 ÷ 3 取至兩位 | 0.06 | P6 U1 | |
| Q04 | SQ | 計算 | 50.6 ÷ 3.1 取至百分位 | 16.32 | P6 U1 | |
| Q05 | SQ | 估算+計算 | 42.3 ÷ 6 | 7.05 | P6 U1 | Estimate scaffolding dropped |
| Q06 | SQ | 估算+計算 | 9.9 ÷ 2.2 | 4.5 | P6 U1 | Same |
| Q07 | MC | 選出答案 | 0.33 ÷ 0.001 ÷ 100 | B. 3.3 | P6 U1 | |
| Q08 | MC | 選出答案 | 結果不同 | B. 0.018 ÷ 0.001 | P6 U1 | |
| Q09 | MC | 選出答案 | 哪組平均數最小 | B | P5 U18 | |
| **Q10** | MC | 選出答案 | 雨量折線圖 | — | — | **SKIP: chart-essential** |
| **Q11** | MC | 選出答案 | 膠瓶回收折線圖 | — | — | **SKIP: chart-essential** |
| Q12 | MC | 選出答案 | ☆ 小數除法估算 | A | P6 U1 | |
| Q13 | MC | 圈起來 | 5 7/18 範圍 | C. 5 和 5.5 | P5 U13 | Inline (X/Y/Z) → A/B/C |
| Q14 | MC | 圈起來 | 5/8 vs 4/9 | C. 大於 | P5 U2 | Inline → A/B/C |
| Q15 | MC | 圈起來 | 接近 1 的分數 | A. 1 1/10 | P5 U2 | Inline → A/B/C |
| Q16 | SQ | 填橫線 | 復活蛋售價 | 16.5 | P6 U1 | |
| Q17 | SQ | 填橫線 | 找錢 | 43.3 | P5 U10 | Price table inlined |
| Q18 | SQ | 填橫線 | 正方形長方形面積差 | 55.1 | P4 U16 | Dimensions in text |
| Q19 | SQ | 填橫線 | 車費平均 | 21 | P6 U1 | |
| **Q20** | SQ | 填橫線 | 排列由大至小 | 3 7/10 > 3.62 > 3 3/5 | — | **SKIP: ordering, multi-blank** |
| Q21 | SQ | 填橫線 | 4 數平均 8.5 求總和 | 34 | P5 U18 | |
| Q22 | SQ | 填橫線 | 數卡平均反求 | 49 | P5 U18 | Number cards in text |
| Q23 | SQ | 填橫線 | 取最高 3 次平均 | 7.7 | P5 U18 | |
| Q24 | SQ | 填橫線 | 4 班功課第三天 | 31 | P5 U18 | |
| Q25 | SQ | 回答 | 化 0.4 為分數 | 2/5 | P5 U13 | |
| Q26 | SQ | 回答 | 化 11/500 為小數 | 0.022 | P5 U13 | |
| Q27 | SQ | 回答 | 化 1 7/9 為小數兩位 | 1.78 | P5 U13 | |
| Q28 | **LQ** | 完成 | 升降機平均 (a)(b) | 59 / 56 減少 | P5 U18 | Multi-step model answer |
| **Q29** | LQ | 完成 | 藝術館折線圖 (a-d) | — | — | **SKIP: chart-essential** |
| **Q30** | LQ | 完成 | 湊整 + 繪折線圖 | — | — | **SKIP: drawing required** |

## Pipeline tested + working

| Step | Tool | Status |
|---|---|---|
| `.doc` → `.pdf` | `soffice --headless --convert-to pdf` | ✅ 2.4MB output, layout preserved |
| Read PDF in chat | Built-in `Read` tool (page range) | ✅ Chinese + math + diagrams render |
| `.doc` → `.docx` | `soffice --headless --convert-to docx` | ✅ |
| Unzip `.docx` → media | `unzip -o file.docx -d dir/` | ✅ 30 `.wmf` files |
| `.wmf` → `.png` | `soffice --headless --convert-to png` | ✅ Diagrams readable |

The `.docx` extracts 30 WMF files but most are inline math (fractions, circle bullets) — only ~7 are real diagrams. Filtering by file size (>30KB usually = real diagram) works as a rough heuristic.

## What to verify after applying

1. Apply `supabase/seed_p6aa_test.sql` in Supabase SQL Editor
2. Go to `/admin/questions?grade=6` — should see 11 new questions under P6 U1 小數除法
3. Cross-grade check: `/admin/questions?grade=5` — should see 13 new questions under P5 U2/U10/U13/U18
4. P4 check: `/admin/questions?grade=4` — 1 new question under U16
5. `/admin/long-questions?grade=5` — Q28 should appear under P5 U18 平均數
6. The 6 inline-MC parsings (Q13/14/15) should render as standard A/B/C choice buttons in the practice flow
7. Test a mock exam paper for a P5 student with U18 in scope — Q28 should appear in the LQ pool

## What this dry run proved

- ✅ `.doc` (binary Word) → readable PDF works
- ✅ All three question types (MC, SQ, LQ) extractable from one paper
- ✅ Inline-options MC (`( X / Y / Z )`) parses cleanly into A/B/C
- ✅ Cross-grade topic mapping by content is the right call
- ✅ Section header → type rule is deterministic
- ✅ Multi-step LQ model answers with working can be captured verbatim
- ⚠ Image-essential questions (~17% of this paper) need a separate image-extraction pass

## Open questions before bulk extraction (4 grades × ~4 papers)

1. **Image strategy**: text-render where possible (Q17/18/22 done that way), defer chart questions (Q10/11/29/30) to a second image-extraction pass. Confirm OK.
2. **Ordering questions** (Q20-type): policy? Skip, split, or LQ with multi-blank model_answer?
3. **Compound estimation questions** (Q5/6-type): keep simplified (only final answer) or preserve estimate as separate SQ row via `group_id`?
4. **Per-paper SQL file vs combined**: currently one file per paper (`seed_p6aa_test.sql`). For ~16 papers across grades, consider combining per grade (`seed_p6_all.sql`).
5. **Difficulty tier**: all set to `enhancement` for the test. Want to spend time pre-classifying basic/enh/advanced, or default everything to enhancement and let teacher adjust?
