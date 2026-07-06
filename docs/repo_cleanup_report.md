# Repo Cleanup 審查報告

> 2026-07-05 由 Fable 產出（Prompt 1）。**✅ 已執行（同日，用戶確認後）**：
> A 組 17 檔 + `src/data/assessmentQuestions.ts` → `_cleanup_quarantine/`；B2 四份報告 → `docs/archive/`；
> B1 legacy branch 已移除；B4 `.DS_Store` 已清；D 組 CLAUDE.md 已修正。
> 驗證全過：`tsc` ✅ `next lint` ✅ `next build` ✅ `check_i18n` ✅ qbank scan（0🔴/197🟠/24🔵，同 cleanup 前完全一致 — active 題庫不變）。
> 用戶已把 quarantine 檔案搬出 repo；PR 以「刪除」形式提交（隨時可由 git history 還原）。
> 執行方式（用戶指定）：確認後唔會 `rm`，而係 `git mv` 入 repo 根目錄新資料夾 `_cleanup_quarantine/`（保留原有子路徑），由用戶自行搬出 mathtutor 資料夾外。
>
> 證據基準：
> 1. CLAUDE.md「題庫種子檔案」表（✅/❌）
> 2. 全 repo grep 交叉引用（每項附結果）
> 3. **Live DB 實測**：`assessment_questions` + `long_questions` 逐行統計 `source_paper × is_active`（2026-07-05 讀取，read-only）— 呢個係最終真相來源

---

## 總覽

| 組別 | 數量 |
|------|------|
| 🟢 A. 安全移入 quarantine | 17 檔 |
| 🟡 B. 建議處理／合併（要小改動或搬位，非純移除） | 4 項 |
| 🔵 C. 保留（連原因） | 其餘全部 |
| 📝 D. 文件 drift 修正（CLAUDE.md） | 3 處 |

---

## 🟢 A. 安全移入 `_cleanup_quarantine/`（17 檔）

### A1. 一次性 hotfix SQL（13 檔）— `supabase/fix_*.sql`

`fix_chinese_answers.sql` `_v2` `_v3` `_v4` `_v5` `_v6`、`fix_disable_flagged_questions.sql`、`fix_misplaced_questions.sql`、`fix_post_cleanup_v4.sql`、`fix_topic_gap_coverage.sql`、`fix_wording_v3.sql`、`fix_wrong_answers_v1.sql`、`fix_wrong_answers_v2.sql`

- **性質**：2026-05 期間對 P3 題庫嘅 ad-hoc 修正（改答案／停用／搬 topic），全部已喺 Supabase SQL Editor 執行過。
- **DB 證據**：修正結果已在 live rows 入面（`P3題庫修正2026` source 有 27 active rows；被停用嘅 rows 以 `is_active=false` 保存喺 DB）。重新執行永遠唔需要 — 災難復原靠 DB backup，唔靠呢啲檔。
- **Grep 證據**：無 code / script 引用。5 檔喺 `docs/assessment_question_workflow.md` 出現，但只係歷史敘述（「當時跑咗呢啲 fix」），檔案唔在唔會 break 任何嘢。
- **安全規則檢查**：呢啲檔唔係任何 active seed；移走後 active 題庫一條都唔變。✅

### A2. `supabase/seed_p6aa_test.sql`（1 檔）

- **DB 證據（決定性）**：live DB **完全冇** `source_paper='p6aa'` 嘅 row（0 active、0 inactive）。即係呢個 test seed 從未 apply（或已清走）。正式 P6 pool 係 `p6_ax_2026`（179 active rows，來自 `seed_p6_assessment.sql`）。
- **Grep**：只有 `docs/p6aa_extraction_report.md`（實驗報告，見 B2 一齊 archive）提及。
- **安全規則檢查**：quarantine 對 DB 零影響。✅

### A3. `supabase/seed_p5_assessment_questions.sql`（1 檔）

- **DB 證據**：佢嘅 sources（`p5_hardcoded_sept/nov/jan/mar/may`）全部 **is_active=false**（52 rows），已被 `seed_p5_replacement.sql` 停用 — 同 CLAUDE.md ❌ 標記一致。Inactive rows 本身保存喺 DB（歷史），唔依賴呢個檔。
- **Grep**：只有 CLAUDE.md 種子表提及（歷史狀態行）。
- **安全規則檢查**：對 active 題庫（`p5_ax_2026` 231 rows）零影響。✅

### A4. 頂層無主檔案（2 檔）

| 檔 | 證據 |
|----|------|
| `hardcoded_p5_export.csv` | grep 全 repo 零引用。內容 = 舊 hardcoded P5 題目 export，該批數據已喺 DB（inactive）。 |
| `tutoring_app_business_eval.html` | grep 全 repo 零引用。一次性商業評估文件，同 codebase 無關。 |

---

## 🟡 B. 建議處理／合併（4 項 — 涉及小改動，唔係純檔案移動）

### B1. 移除 dead legacy 評估路徑（code 改動 + 1 檔入 quarantine）

- **對象**：`src/data/assessmentQuestions.ts`（31KB）+ `src/app/api/assessment/questions/route.ts` 嘅 legacy branch（行 40-70）。
- **證據**：全 repo 得 questions route 一個引用（submit route 嘅引用已由 Opus 喺 2026-07-05 移除）。該 branch 只喺 `grade ∉ {3,4,5,6}` 先行 — UI 只提供 P3-P6，即 valid flow 永不觸發。DB 證據：P4/P6 而家全部 DB-backed（`p4_ax_2026` 156 + `p6_ax_2026` 179 active rows）。
- **做法**：questions route legacy block 改成直接回 `{ error: '暫未支援該年級', empty: true }`；然後 `assessmentQuestions.ts` 入 quarantine。跑 `tsc` + CI 驗證。
- **風險**：低 — 只影響冇 UI 入口嘅 grade 值；response shape 不變。

### B2. docs/ 一次性報告 → `docs/archive/`（4 檔搬位，唔入 quarantine）

`p5_assessment_gap_report.md`、`p6_lq_batch1_report.md`、`p6_lq_batch2_report.md`、`p6aa_extraction_report.md`

- **理由**：一次性 batch 報告，使命已完成，但 `docs/fable_handoff.md` Prompt 2（Task 7 ingestion skill）指明要讀 `*_report.md` 做 grounding — 所以**搬去 `docs/archive/` 保留可讀**，唔好出 repo。Task 7 完成後可再降級入 quarantine。

### B3. CLAUDE.md 種子表更新（文件修正，見 D 組詳情）

### B4. OS / build 垃圾（可以隨時直接刪，唔使入 quarantine）

- `.DS_Store`（根目錄、`supabase/`、`_lq_input/`、`_lq_input:/` 等）— macOS 產物，已 gitignore，自動再生。
- `tsconfig.tsbuildinfo` — build artifact，已 gitignore，自動再生。
- 呢啲唔屬「唔知會唔會用」類，直接 `find . -name .DS_Store -delete` 即可（唔碰 git）。

---

## 🔵 C. 保留（附原因）

### C1. 全部 active seed（安全規則 #1 + 災難復原價值）

| 檔 | Live DB 證據 |
|----|--------------|
| `seed_p3_assessment_questions.sql` + `seed_p3_extracted/`（10 檔） | P3 school-paper sources（A015/A062/B003/…/P3必做100題）合共 400+ **active** rows |
| `seed_p3_curriculum.sql`、`seed_p3_teaching_methods.sql` | P3 curriculum + teaching_methods（submit route P3 report 用緊） |
| `seed_p4_curriculum.sql`、`seed_p4_assessment.sql` | `p4_ax_2026` 156 active |
| `seed_p5_curriculum.sql`、`seed_p5_replacement.sql` | `p5_ax_2026` 231 active |
| `seed_p6_curriculum.sql`、`seed_p6_assessment.sql` | `p6_ax_2026` 179 active |
| **`seed_p5_long_questions_sample.sql`** ⚠️ | 個名叫 "sample" 但 `p5_sample_2026_paper2` 有 **3 條 active rows 喺 long_questions** — 係 live seed，唔好被個名呃到 |
| 全部 `seed_*_lq_batch*.sql`（10 檔） | 每個 batch source 都有 active rows（17+24+16+30+19+31+33+7+20+27 = 224 條 LQ 全部 active） |
| `supabase/update_lq_image_urls.sql` | in-flight（2026-07-05 untracked 新檔，由 `scripts/upload_lq_images.ts` 生成，等 apply） |

### C2. Legacy Sprint 1-3 相關（retirement 有專門 runbook，唔好喺 cleanup 順手做）

- `supabase/seed.sql`（question_categories）+ `seed_variations.sql`（variation_templates）：**兩個 table 仲有 live read** — `variationGenerator.ts`／`admin/variations` 寫讀 `generated_questions`+`variation_templates`；`fetchStudentReport`／`wrong-bank`／`practice` 讀 `questions`+`question_categories`（舊 wrong-bank rows 向後兼容）。Grep 證據：14 處 `from('questions'|'question_categories'|'generated_questions'|'variation_templates')`。→ 跟 `docs/legacy_consolidation.md` 嘅 retirement 步驟一齊退役，唔好單獨郁 seed 檔。
- 對應 legacy code（variations feature 等）同理保留。

### C3. Migrations（全部 22 檔）

Append-only 歷史，全部保留（0013 缺號係正常 gap）。`0001`-`0022` 有 schema 演進完整鏈。

### C4. 其他

| 項 | 原因 |
|----|------|
| `docs/legacy_consolidation.md`、`legacy_taxonomy.md` | CLAUDE.md 直接連結，retirement / 歷史參考用 |
| `docs/assessment_question_workflow.md`、`lq_seed_workflow.md`、`i18n_conventions.md`、`seo_strategy.md`、`fable_handoff.md`、`audit_2026-07.md` | 活躍 runbook / 策略文件（audit 係 2026-07-05 新鮮產出） |
| `assessment_quality_review_cleaned.csv` | `assessment_question_workflow.md` artifact 表引用：「Latest LLM verification findings」— 最新驗證記錄 |
| `supabase/email_templates/confirm_signup.html` | Supabase Dashboard email template 源檔（dashboard 冇 version control，呢度係唯一備份） |
| `_lq_input/`（Jul 3 結構）| LQ 匯入工作目錄，`.gitignore` 有專門規則，`upload_lq_images.ts` 用 |
| `_lq_input:/`（colon typo 孖生，May 25） | **Local-only**（.gitignore 有註解：350+ 有版權試卷截圖，防止意外 push）。對 repo 零影響。⚠️ 建議用戶自行目測：如內容已被 `_lq_input/` 取代就手動搬走 — 涉及版權原始檔，唔由自動流程處理 |
| `scripts/check_i18n.mjs`、`upload_lq_images.ts` | CI + LQ 圖片 pipeline 用緊 |
| `.claude/skills/question-bank-check/` | 2026-07-05 新建 skill |

---

## 📝 D. CLAUDE.md 文件 drift（建議修正，唔使等 quarantine）

1. **種子表列咗兩個已唔存在嘅檔**：`seed_p5_exam_review.sql`、`seed_p5_image_questions.sql` 已唔喺 disk。而且 DB 顯示 `五年級期末複習手冊` 其實有 94 rows（inactive）— 即係「❌ 未 apply」嘅描述唔啱，實情係「applied 過然後被 replacement 停用，檔案已刪」。`p5_image_questions` 43 rows inactive 同理。→ 兩行改為「已刪除；數據以 inactive 保存喺 DB」。
2. **Apply order 冇 P3**：「新 setup 由零開始」只列 P4/P6/P5_replacement，但 P3 題庫（400+ active rows）來自 `seed_p3_*` + `seed_p3_extracted/` — 應補一行。
3. **A1-A4 quarantine 後**：種子表相應行加「已移除（2026-07 cleanup）」註記。

---

## 執行清單（等用戶確認先做）

```bash
# 1. 建 quarantine 資料夾（保留子路徑，方便還原）
mkdir -p _cleanup_quarantine/supabase

# 2. A 組 17 檔（git mv 保留歷史；untracked 檔用普通 mv）
git mv supabase/fix_chinese_answers.sql supabase/fix_chinese_answers_v2.sql \
       supabase/fix_chinese_answers_v3.sql supabase/fix_chinese_answers_v4.sql \
       supabase/fix_chinese_answers_v5.sql supabase/fix_chinese_answers_v6.sql \
       supabase/fix_disable_flagged_questions.sql supabase/fix_misplaced_questions.sql \
       supabase/fix_post_cleanup_v4.sql supabase/fix_topic_gap_coverage.sql \
       supabase/fix_wording_v3.sql supabase/fix_wrong_answers_v1.sql \
       supabase/fix_wrong_answers_v2.sql supabase/seed_p6aa_test.sql \
       supabase/seed_p5_assessment_questions.sql _cleanup_quarantine/supabase/
git mv hardcoded_p5_export.csv tutoring_app_business_eval.html _cleanup_quarantine/

# 3. B2：docs archive
mkdir -p docs/archive
git mv docs/p5_assessment_gap_report.md docs/p6_lq_batch1_report.md \
       docs/p6_lq_batch2_report.md docs/p6aa_extraction_report.md docs/archive/

# 4. B1（code 改動）：另行做 + tsc + CI
# 5. B4：find . -name .DS_Store -delete
# 6. D：更新 CLAUDE.md 種子表
# 7. 之後用戶自行把 _cleanup_quarantine/ 搬出 mathtutor/
```

**驗證步驟（執行後）**：`npx tsc --noEmit` → `npm run build` → 跑 `.claude/skills/question-bank-check/scripts/qbank_scan.mjs` confirm active 題庫 row 數不變（400+ P3 / 156 P4 / 231+3 P5 / 179 P6 / 224 LQ）。
