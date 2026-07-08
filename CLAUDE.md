# CLAUDE.md — 補習社數學練習 App（香港小三至小六）

一個為香港網上補習社設計嘅數學練習 Web App（小三至小六，介面全繁體中文，設計參考 Duolingo：手機優先、一頁一題、即時回饋）。核心：學前評估搵弱項、錯題追蹤、AI 出題、past paper 入庫、模擬考試。

**技術棧**：Next.js 14 App Router + Tailwind / Supabase (PostgreSQL + Auth + Storage) / Gemini 2.5 Flash（AI 分析）/ Vercel 部署。

> **呢份檔案只放「現行真相」+ pointer。** 歷史敘事、舊 spec、legacy 分類全部喺
> `docs/archive/CLAUDE_pre_rewrite_2026-07-06.md`（重寫前全文）同 `docs/legacy_taxonomy.md`。
> 更新本檔前先讀 [docs/agents/maintenance.md](docs/agents/maintenance.md)。

---

## 🧭 開工前必讀（agent 作業制度）

| 檔案 | 內容 |
|------|------|
| [docs/agents/00_diagnosis.md](docs/agents/00_diagnosis.md) | 本 harness 三大漏洞（肥文件／主對話落場／自驗自證）— 制度根據 |
| [docs/agents/model-dispatch.md](docs/agents/model-dispatch.md) | **派工守則**：幾時派 subagent、model 揀邊個、驗證不自驗 |
| [docs/agents/judgment.md](docs/agents/judgment.md) | 判斷 rubric：幾時算完成／幾時問用戶／幾時換路唔好重試 |
| [docs/agents/delegation-templates.md](docs/agents/delegation-templates.md) | 派工 prompt 模板（搜尋／實作／重構／研究／審查） |
| [docs/agents/lessons.md](docs/agents/lessons.md) | 踩坑教訓 log（改嘢前掃一眼相關條目） |
| [docs/agents/maintenance.md](docs/agents/maintenance.md) | 點樣安全更新以上檔案同本檔 |
| [docs/agents/letter-to-future-sessions.md](docs/agents/letter-to-future-sessions.md) | 環境級重要事項 + 制度退化預防 |

## 📌 任務路由表（乜任務 → 用乜工具）

| 任務 | 用 |
|------|-----|
| 入新 past paper／PDF／截圖落題庫 | skill `paper-ingestion`（wrap `scripts/extract_figures/` toolchain — 真身喺 branch `feat/figure-extraction-pipeline`，當前 branch 只有 output dirs，用前要 merge/checkout） |
| 驗證題庫（答案啱唔啱、可唔可以輸入） | skill `question-bank-check`（有 live DB scan） |
| SEO 檢查／新公開頁之後 | skill `seo-audit` |
| 寫公開單元指南內容頁 | skill `seo-content-page`（跟 `docs/seo_strategy.md` §4.3） |
| 改 UI 文字 | 先讀 `docs/i18n_conventions.md`，驗證 `node scripts/check_i18n.mjs` |
| 加 LQ seed | `docs/lq_seed_workflow.md` |
| 加 assessment 題目 batch | `docs/assessment_question_workflow.md` + C1–C8（下表） |
| 動 legacy `questions`/`question_categories` 相關 code | `docs/legacy_consolidation.md` |

⚠️ **`.claude/`（所有 skills）同 `scripts/`（除 `check_i18n.mjs`、`check_seo.mjs`、`upload_lq_images.ts`）係 gitignored** — 只存在本機。如果搵唔到 skill，唔代表無：問用戶，唔好重造。

---

## 🎯 學前評估系統（現行）

### 各年級

| 年級 | 揀題單位 | 題庫來源 |
|------|---------|---------|
| P3 | 大單元 或 小單元（有 topic_select drill-down） | past paper 人手分類到 `curriculum_topics.lesson_number` |
| P4–P6 | 大單元 only | 《小學數學新思維(第二版)》配套習題 |

### 抽題（`src/lib/assessmentSelection.ts`）
- 平均分配 across 揀咗嘅單元（tied 時 earlier scope 攞多嗰條）
- 三層配額 `TIER_QUOTA = { basic: 10, enhancement: 8, advanced: 2 }` = 20 條（4 個年級一樣；`TIER_QUOTA_P5` 已退役，`assessmentSelection.ts` 頭部註釋未更新，唔好照佢「修正」返轉頭）
- 每單元至少 1 條；配額拎唔晒可 cross-tier fill 至最多 30；揀少單元唔夠 20 唔強制補

### question_type（`assessment_questions`）

| Type | 何時用 | 答案格式 |
|------|-------|---------|
| `fill_in_number` | 答案係**純數字**／小數／分數／帶分數 | `60`、`5/18`、`1.25`、`1 5/8` |
| `multiple_choice` | 答案唔係純數字（單位、形狀名、文字、比較、多值、含 % 或中文單位） | 4 選項，`correct_answer` 連 prefix `"B. 答案文字"` |
| `calculation` / `fill_in` | **已棄用** | 全部已轉 multiple_choice |

### 格式鐵律（新題必守）
1. **帶分數一律 space 格式** `1 5/8`，唔係 `1又5/8`（鍵盤輸出 space；`normalizeAnswer()` 兼容舊 `又`）。適用於 correct_answer、MCQ option 文字、題目文字。例外：自然中文嘅「又」（如「又進貨了」）唔改。
2. **MCQ distractor**：4 個選項數學上互不等值（`0.5` 同 `1/2` 唔可以同時出現）；干擾項要係學生常犯錯誤；同 domain（單位對單位、形狀對形狀）；正確答案位置分散。
3. **fill_in_number 答案唔可以有** `:` `>` `<` `=` `%` 或中文單位（鍵盤打唔到）→ 呢啲一律出 MC。
4. **Image-dependent 題新題庫一律 SKIP**（人手另行處理）。
5. **難度 tier** 按解題步數：1 步 = `basic`；2–3 步 = `enhancement`；4+ 步 = `advanced`。
6. **數學題一律 re-solve 驗證**，唔信任何來源答案（校方答案紙都錯過）。

### C1–C8 驗證 checklist（每個新 batch 都要過）

| Code | 檢查 |
|------|------|
| C1 | 重新 solve，答案要啱 |
| C2 | 題目內容夾乎指定 unit/topic |
| C3 | 單一正確答案（MCQ 冇兩個都啱） |
| C4 | MCQ 選項互不相等 |
| C5 | 內容啱年級（P3 唔好深、P6 唔好淺） |
| C6 | fill_in_number 嘅 correct_answer 冇 `:` `>` `<` `=` `%` |
| C7 | 問「多少元/克/升」→ MCQ 答案要含單位 |
| C8 | 每 unit 至少 1 條 basic + 1 條 enhancement |

Runbook：`docs/assessment_question_workflow.md`。Live DB 驗證用 skill `question-bank-check`。
（舊文件提及嘅 `scripts/verify_assessment_answers.py` 唔喺 repo — 唔好引用。）

---

## 🗄️ Schema（現行 = assessment；legacy 見文末）

```sql
curriculum_units   (id, grade 3-6, semester 'A'|'B', unit_number, name, textbook_ref, display_order)
curriculum_topics  (id, unit_id→curriculum_units, lesson_number, name, display_order, teaching_methods jsonb)
assessment_questions (
  id, topic_id→curriculum_topics ON DELETE RESTRICT,
  question_text, question_type, options jsonb, correct_answer,
  difficulty_tier 'basic'|'enhancement'|'advanced',
  group_id uuid,          -- 同 group 嘅 sub-questions (Q5a/b/c) 抽題時一齊行動
  sub_order, source_paper, source_question,   -- source_* 兩欄 = idempotent key
  image_url, image_alt_text, notes, is_active, created_at
)
long_questions (id, topic_id, question_text, model_answer /*答案紙 verbatim*/,
  difficulty_tier, image_url, source_paper, source_question, notes, is_active)
  -- 無 group_id；total_marks 已喺 migration 0021 DROP（改為 paper-level 計分）
exam_scopes (student_id, parent_id, exam_name, exam_date, unit_ids uuid[], notice/toc_image_urls)
mock_exam_papers (student_id, exam_scope_id, mc/sq/lq_question_ids uuid[], status,
  timer_started_at/paused_at/elapsed_seconds, timer_status)
```

**🔒 安全鐵律：`correct_answer` 永遠唔送去 browser — 一律 server-side 評分**
（`/api/assessment/submit`、`/api/practice/answer`）。唔信 client 傳嚟嘅 is_correct。

**課程大綱**：P3 = 17 大單元/32 小單元（`0014_p3_curriculum_assessment.sql`）；P4 = 17、P5 = 19、P6 = 13 大單元（各 1 placeholder topic，`seed_p{4,5,6}_curriculum.sql`）。單元名單見各 seed 檔。

### Legacy 雙表並存
`questions` + `question_categories` 等 = Sprint 1-3 舊 schema，**所有寫入已遷移**去 `assessment_questions`；剩低 read-only 向後兼容（舊 wrong-bank rows）。Retirement 分析：`docs/legacy_consolidation.md`。舊 A1–I4 題型分類 + variation prompt 範本：`docs/legacy_taxonomy.md`。

---

## 🌱 題庫 seed 檔案（現況 2026-07）

| 檔案 | 內容 | DB 狀態 |
|------|------|--------|
| `seed_p3_*` + `0014` migration | P3 curriculum + 題目 | ✅ active |
| `seed_p4_curriculum.sql` + `seed_p4_assessment.sql` | P4 + 156 條 | ✅ active |
| `seed_p5_curriculum.sql` | P5 curriculum | ✅ active |
| `seed_p5_replacement.sql` | P5 新 231 條 + deactivate 舊 pool | ✅ active |
| `seed_p5_long_questions_sample.sql` | ⚠️ 個名叫 sample 但係 **live seed**（3 條 active LQ）唔好刪 | ✅ active |
| `seed_p6_curriculum.sql` + `seed_p6_assessment.sql` | P6 + 169 條 | ✅ active |
| `seed_p*_lq_batch*.sql`（P3A/P3B/P4A/P4B×2/P5A/P5B/P6×3） | 長答題庫 | ✅ active |
| 已刪檔案（p5 sept/nov/jan、期末複習、image questions、p6aa） | DB 有 inactive rows 或零 rows | ❌ 詳見 archive 版 CLAUDE.md |

**Apply order（由零 setup）**：先跑**全部** `supabase/migrations/`（0001–0022，按序，一個都唔可以跳 — assessment 建表喺 0010，mock exam 喺 0020）→ P3（curriculum → teaching_methods → 題目）→ P4 → P6 → `seed_p5_replacement.sql` → 各 LQ batch + `update_lq_image_urls.sql`。

⚠️ **DB 先於檔案**：用戶手動喺 Supabase SQL Editor apply — repo 有檔 ≠ DB 有 data，檔案刪咗 ≠ DB 冇 rows。判斷 DB 狀態一律用 `question-bank-check` live scan 或直接查，唔好靠檔案推斷（見 lessons.md L2）。

---

## 📝 模擬考試（Sprint 7 現行規則）

- **分數**（`src/lib/mockExamMarks.ts` = single source of truth，唔好 hardcode）：MC 1.5 / SQ 2 / LQ 6。標準卷 18 MC + 17 SQ + 5 LQ = 91 分。
- **抽題**（`src/lib/mockExamSelection.ts`）：`exam_scopes.unit_ids` → topic ids → SQL 層 `.in('topic_id', …)` 強制過濾（唔係 display-only）；難度 20/60/20；`group_id` 相同嘅 sub-questions 一齊抽（atomicity）；MC pool 不足優先補 MC；LQ 唔用 group_id。
- **Timer**：`running`（MC+SQ）→ `paused_for_lq`（做 LQ，freeze）→ `finished`。`MockExamTimer` 只喺 running tick。
- **LQ 列印**：`/student/mock-exam/[paperId]/lq` server-rendered A4。
- 家長設定範圍：`/parent/exam-scope/upload`（強制 `parent_student_relationships` 檢查 + unit_ids 必須係子女年級）。

---

## 🗺️ 路由總覽（現行）

```
公開:   /  /login/{student,parent,teacher}（/login → redirect /）  /signup/{student,parent}
        /resources  /resources/[grade]/[slug]（SEO 內容頁）
評估:   /assessment  /assessment/report/[sessionId]
學生:   /student  /student/trophies  /student/wrong-bank  /student/results/[sessionId]
        /student/practice/{select-category,[sessionId],exam-sprint,exam-sprint/print}
        /student/mock-exam/[paperId]/{start,lq,lq-timer,results}
家長:   /parent  /parent/child/[id]{,/print-exam,/session/[sessionId]}  /parent/upload
        /parent/exam-scope/upload  /parent/mock-exam/[paperId]/upload（/parent/tokens → redirect /parent）
老師:   /admin  /admin/questions{,/new,/[id]}  /admin/long-questions{,/new,/[id]}  /admin/variations
        /admin/past-papers{,/[id]}  /admin/mock-exam{,/[paperId]}  /admin/assessments
        /admin/redemptions  /admin/students{,/[id]}
API:    /api/practice/{start,answer,complete}（mock exam 嘅 MC/SQ 提交都行 answer，session_type='mock_exam' 分支，唔准 leak 對錯）
        /api/assessment/{curriculum,questions,submit}
        /api/mock-exam/start  /api/mock-exam/[paperId]/{extract,submit-lq-photos,timer}
        /api/past-paper/{upload,upload-image}  /api/parent/exam-scope/upload  /api/variations/generate
```

呢個表由 `find src/app -name page.tsx -o -name route.ts` 生成（2026-07-06，branch feat/seo-skills）。改路由後照跑重生成，唔好手寫。Path B crop-review 路由（`/parent/upload/[id]`、`/api/past-paper/confirm-crops`）喺未 merge 嘅 branch `feat/figure-extraction-pipeline`。

角色分離：middleware 未授權跳 `/`（唔好暴露路由）。RLS：學生本人／老師／已連結家長三條 policy；helper `is_parent_of()`、`is_teacher()`。家長睇子女**必須**過 `parent_student_relationships`。

---

## 🎨 學生 UI 設計規範（現行 — 舊藍紅配色已廢）

> 公開 marketing 頁（`/` landing、`/resources`）嘅設計規範係另一份 owning file：
> [docs/design_strategy.md](docs/design_strategy.md)。以下只管 app 內部（學生）UI。

- 主色 teal `#1D9E75`（學生介面所有舊 `#4A90E2` 藍已替換）
- **零負面語言**：答錯用 amber `#EF9F27`（唔係紅），文案「再試一次！💪」；結果頁只顯示 ⭐，唔顯示對錯統計
- 答對 teal + 「答對了！+1 ⭐」；Daily goal hardcode 10（`src/lib/trophies.ts`，獎杯純 JS 計算無 table）
- 手機優先：一頁一題、選項按鈕 56px 高、圓角 12px、fill_in_number 用自定義數字鍵盤（`src/components/UnifiedKeyboard.tsx`，4×4 含 `/` 同空格）

## 🌐 i18n + ⚙️ CI

- UI chrome 支援 EN/中（`lang` cookie + `src/lib/i18n/` flat dict）；**DB 內容永不翻譯**。改 UI 文字前必讀 `docs/i18n_conventions.md`；驗證 `node scripts/check_i18n.mjs`。
- CI（`.github/workflows/ci.yml`）每 PR：`tsc --noEmit` → `next lint` → `check_i18n.mjs` → `next build`。全過先 merge。本地完成宣稱前跑同一套（見 judgment.md R1）。

## ⚙️ 環境 + 帳戶

```env
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SECRET_KEY
GEMINI_API_KEY / NEXT_PUBLIC_APP_URL / TOKENS_PER_PAPER_PAGE=10
```
- 帳戶：`user_metadata.role` ∈ `student|parent|teacher`；學生要有 `student_profiles` row；家長連結手動 insert `parent_student_relationships`。
- Storage bucket `past-papers`（private，RLS 見 `0007_past_papers.sql` 末尾）。
- Token（UI 叫「代幣」）：上載 past paper 每頁批准 +10；歸入第一個關聯子女嘅 `student_profiles.token_balance`。

---

## 📜 歷史 + 深入文件

| 想知 | 去 |
|------|-----|
| Sprint 1–7 完整敘事、原始 Phase 1–4 spec、舊 UX 規範、legacy 完整 schema SQL | `docs/archive/CLAUDE_pre_rewrite_2026-07-06.md` |
| 2026-07 repo cleanup 做咗乜 | `docs/repo_cleanup_report.md` |
| SEO 策略 | `docs/seo_strategy.md` |
| 公開頁設計策略（landing / resources 視覺語言 + 延伸指南） | `docs/design_strategy.md` |
| 未完成任務隊列 | `docs/fable_handoff.md` + memory `fable-pending-tasks.md` |
| Figure extraction pipeline（Path A/B） | `scripts/extract_figures/README.md`（committed 喺 branch `feat/figure-extraction-pipeline`，未 merge） |
