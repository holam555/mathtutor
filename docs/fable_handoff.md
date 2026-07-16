# Fable 交接 — 未完成任務嘅 copy-paste prompts

> 背景：2026-07-05 一個 7-task batch，由 Opus 4.8 分流。強模型 Fable 負責高風險 / 需深度綜合 / 寫 skill 嘅任務。
> 完成狀態同每個 prompt 喺下面。

## 狀態

| Task | 狀態 |
|------|------|
| 1. SEO | ✅ Opus 完成：docs/seo_strategy.md + robots.ts/sitemap.ts/layout JSON-LD。前置 ✅ 用戶已 set Vercel `NEXT_PUBLIC_APP_URL`（2026-07-14，vercel.app alias 足夠，唔使買域名）。 |
| 3. 家長配對 | ⏭️ 用戶 skip |
| 4. 題庫檢查 skill | ✅ Opus 完成：`.claude/skills/question-bank-check/` |
| 6. Code review | ✅ Opus 完成 review + 修咗 #1（dead legacy grading 分支）、#2（hc- id 繞過 regrade）。餘下 #3/#4/#5 為 nice-to-have，見文末。 |
| 5. Repo cleanup | ✅ Fable 完成（2026-07-05）：報告 docs/repo_cleanup_report.md，已執行 quarantine + archive + dead-code 移除，全部驗證過。用戶手動搬走 `_cleanup_quarantine/` 即完成 |
| 7. Ingestion skill | ✅ Fable 完成（2026-07-06）：`.claude/skills/paper-ingestion/`（7-stage 一條龍，SOP 藍圖 `docs/paper_ingestion_sop_draft.md`）。首次實戰 p6_21c：37 AQ + 4 LQ + 12 圖 |
| SEO 可持續 skills | ✅ 完成：`.claude/skills/seo-audit/` + `seo-content-page/`（PR #10，landing + /resources 已上線） |
| Code-review + Security skills | ✅ Fable 完成（2026-07-14）：`.claude/skills/mathtutor-review/` + `mathtutor-security/`（security baseline inventory 喺 reference.md，71 處 createServiceClient 全數盤點） |
| 圖片抽取＋綁定題目（長期難題） | ✅ Fable 完成（2026-07-06）：Phase 1-3 全落地（CV 幾何綁定，Path A CLI + Path B 家長流程）。診斷+設計：`docs/figure_extraction_diagnosis.md`；branch `feat/figure-extraction-pipeline` |

## 點樣 prompt Fable（granularity）

**對 constraint / context 要詳細；對 method 要放手。** Fable 係強模型，逐步指令會浪費佢判斷力。所以每個 prompt：畀 goal + grounding（叫佢讀邊啲 file）+ 硬性約束 + guardrail（draft-first），但**點做由佢決定**。

## 建議執行次序

1. **Prompt 1（cleanup）先跑** — 乾淨 repo 幫到後面。
2. Prompt 2 / 3 任何時候。
3. **Prompt 4 喺 Prompt 1 之後** — review/security skill 引用嘅 code 最好已 cleanup。

共通：所有 skill 用 `anthropic-skills:skill-creator`，放 `.claude/skills/<name>/`，用已完成嘅 `.claude/skills/question-bank-check/`（SKILL.md + reference.md + scripts/）做結構範本。**一律先出 SKILL.md / 報告草稿等用戶 review，先至生成大 script 或做刪除。**

---

## Prompt 1 — Repo cleanup（Task 5，高風險，先跑）

```
你係 Fable，最強模型。呢個 repo（霖楓學苑香港小學數學 app，Next.js 14 + Supabase）經過長期 iteration，累積咗好多可能過時 / 重複嘅檔案：seed SQL、migration、docs、scripts、legacy code。

目標：審查全 repo，搵出唔再有用 / 過時 / 重複嘅檔案同 code，出一份刪除／合併建議報告。你自己決定盤點方法。

🔴 硬性安全規則（絕對唔可以破壞）：
1. 現正使用中嘅題庫（assessment_questions / long_questions / curriculum_units / curriculum_topics）同對應嘅 active seed，一條都唔可以受影響。先讀 CLAUDE.md「題庫種子檔案」+「Apply order」表，分清 active（✅）vs inactive（❌）seed。
2. migration 檔 = append-only 歷史，預設保留（除非確認從未 apply 且無被引用）。
3. 任何「可刪」判斷，都要用 grep 交叉確認冇被 code / doc / 其他 seed 引用，並附佐證。

已知 lead（Opus 2026-07 review 發現，可作起點但要自己 verify）：
- Legacy grading 路徑而家係 dead：src/data/assessmentQuestions.ts 嘅 getAssessmentPaper + `hc-` id 方案，喺 submit route 已移除；questions route 只喺 grade ∉ {3,4,5,6} 先行（即 valid grade 永不觸發）。→ 成條 legacy hardcoded 評估路徑係刪除候選，但要確認冇其他 live 引用。
- docs/ 有多份一次性 report（p5_assessment_gap_report、p6_lq_batch*_report、p6aa_extraction_report 等）+ audit_2026-07.md + legacy_consolidation.md — 判斷邊啲已完成使命可 archive。
- 舊 questions / question_categories / generated_questions 等 Sprint 1-3 legacy table 相關 code（read-only 向後兼容）— 見 docs/legacy_consolidation.md 嘅 retirement 分析。

輸出：docs/repo_cleanup_report.md，分三組「安全刪除 / 建議合併 / 保留（連原因）」，每項附佐證。⚠️ 未經用戶確認唔好真係 delete —— 出報告先。
```

---

## Prompt 2 — 新題庫匯入 workflow skill（Task 7）

```
你係 Fable。用戶目前用「揀新 PDF + 截圖 → 叫 AI 把題目 optimize 入 assessment_questions table」嘅方式擴充題庫，但成日有溝通誤差。

目標：反推出一套最少誤差、可重複嘅匯入流程，寫成 skill。方法自己決定。

Grounding（讀）：
1. 過去 session 歷史（用 session 搜尋 / transcript 工具）— 搵出用戶過往實際點做題庫匯入、邊度出錯、邊啲步驟 work。
2. docs/assessment_question_workflow.md、docs/lq_seed_workflow.md、各 *_report.md。
3. CLAUDE.md「🎯 學前評估系統」+ C1–C8 checklist + 帶分數 space 格式 + MCQ distractor rules。
4. 已完成嘅姊妹 skill `.claude/skills/question-bank-check/`（驗證階段可直接複用，唔好重複造）。

skill 要 cover：PDF/截圖 input 格式要求 → 分類到 curriculum unit/topic → 生成 question_type / options / correct_answer（跟鍵盤可輸入性 + 帶分數規則）→ 跑 question-bank-check 做驗證 gate → 生成 idempotent seed SQL（source_paper + source_question）→ 常見錯誤 checklist。

先出流程 SOP 草稿等用戶 review，再用 skill-creator 寫成 skill（放 .claude/skills/）。
```

---

## Prompt 3 — SEO 可持續 skills（Skill A）

```
你係 Fable。呢個 project（霖楓學苑數學 app，Next.js 14 App Router）嘅 SEO 策略同技術基礎已落好。目標：寫 skill 令 SEO 可長期維持、唔會隨住加頁而 regress。要寫邊幾個 skill / 點拆，你自己判斷；以下係建議。

Grounding（讀，seo_strategy.md 係 source of truth）：
- docs/seo_strategy.md（策略 + §4.3 GEO 寫法規範 + §9 已落 code）
- docs/i18n_conventions.md（UI 文字用 t()，DB 內容唔翻譯）
- 現有 src/app/robots.ts、sitemap.ts、layout.tsx（metadata + JSON-LD）
- 結構範本：.claude/skills/question-bank-check/

建議兩個 skill：
1) seo-audit — 一鍵掃全部公開 route，report：邊頁缺 generateMetadata / canonical / OG、sitemap 有無漏新公開頁、JSON-LD 是否 valid、metadataBase 是否仲係 localhost、robots 有無擋錯。可寫成 script（參考 scripts/check_i18n.mjs 風格）令 CI 或人手都跑得到。
2) seo-content-page — 由 curriculum_units/curriculum_topics 生成一版 GEO-optimized 單元指南頁：server-rendered、跟 §4.3（答案前置、Q&A <h2>、FAQPage schema）、自動寫 generateMetadata、自動加入 sitemap。呢個係 §4 最大增長槓桿。

相關（唔使今次做，但係你嘅 sweet spot）：seo_strategy.md §4 嘅高質繁中 evergreen 內容*寫作*（能被 AI 引用嘅單元指南 / 家長 FAQ / 呈分試文章）值得由 Fable 產。

先出 SKILL.md 草稿等用戶 review。
```

---

## Prompt 4 — 專案化 Code-review + Security skills（Skill B + C）

```
你係 Fable。寫兩個 project-specific 審查 skill，補足內置 generic /code-review 同 /security-review 唔識嘅 mathtutor 專屬規則。兩個 skill 共用「讀 CLAUDE.md + 盤點 invariant」嘅前置，所以一齊做。放 .claude/skills/mathtutor-review/ 同 .claude/skills/mathtutor-security/，用 .claude/skills/question-bank-check/ 做結構範本。

先讀：CLAUDE.md、docs/fable_handoff.md（文末 Task 6 findings 做 test case）、docs/i18n_conventions.md。

Skill B（mathtutor-review）要 encode 嘅 invariant：
- Grading security：correct_answer 永遠唔送 browser；答案一定 server-side regrade；唔信 client is_correct（見 api/assessment/submit、api/practice/answer）。
- 題目規範 C1–C8 + MCQ distractor + 帶分數 space 格式 + fill_in_number 鍵盤可輸入性（cross-ref .claude/skills/question-bank-check/）。
- i18n：UI 文字一律 t()，dict 無 duplicate key（CI 跑 check_i18n.mjs）。
- Supabase：createClient（RLS）vs createServiceClient（bypass RLS）用得啱唔啱。
- 已知 bug pattern（Task 6）：dead legacy 分支、grade gating、id 繞過 regrade、normalizeAnswer 又/空格 ordering。

Skill C（mathtutor-security）要 audit 嘅 attack surface（先 grep 盤點再定 checklist）：
- Role/auth gating：每個 route 驗 role（student/parent/teacher 分離）；middleware（src/middleware.ts）未授權跳 /。
- RLS bypass：createServiceClient 全 repo 57 處（grep）—— 每處繞過 RLS，要逐個確認有無自己做 ownership 檢查（尤其 parent 睇 child 一定要查 parent_student_relationships）。
- 答案外洩：mock-exam 唔可以 leak 對錯（practice/answer session_type==='mock_exam' 分支）。
- Rate limiting：目前只有 api/assessment/submit + questions 用 rateLimit()（src/lib/rateLimit.ts）；其他公開 / mutating route（signup、past-paper upload、mock-exam start 等）要檢查有無漏。
- PII：parent_email / parent_phone 唔可以 log、唔可以出畀非授權角色。
- Input validation：API body 有無 validate。

兩個 skill 各出 SKILL.md（checklist + 每項點捉 + mathtutor 例子）；security 另出 reference.md（三角色權限矩陣 + createServiceClient 使用守則）。先出草稿等 review，唔好一次過生成。
```

---

## Prompt 5 — 圖片抽取 + 綁定正確題目（長期難題，只講 goal）

> 背景：呢個係 image-dependent 題目一直入唔到庫嘅根本原因。之前幾次方法都失敗。用戶明確話：只講 goal，方法由 Fable 自己諗；Fable 要先 track 返 problem-solving history 再嘗試解決。

```
你係 Fable。有一個一直搞唔掂嘅難題要你解決 —— 之前幾次方法都失敗。

🎯 GOAL（只講目標，方法你自己決定）：
畀 AI 睇一版完整嘅 past paper（相 / PDF page，未 crop），要可靠咁：
(1) 判斷邊條題目附帶圖 / 圖表 / 圖形；
(2) 喺原頁面搵到嗰個圖嘅位置並 crop 出嚟（乾淨、只含該題嘅圖）；
(3) 把 crop 出嚟嘅圖正確 bind 返去對應嘅題目（唔可以配錯題）。
最終令 image-dependent 題目可以自動入庫，而唔係好似而家一律人手 skip / 人手 crop。

📌 先做（重要）：
1. Track 返過去嘅 problem-solving history —— 用 session 搜尋 / transcript 工具，搵返之前試過咩方法、喺邊一步失敗、失敗模式係咩（配錯題？crop 唔準？漏圖？多圖分唔開？）。唔好由零開始重蹈覆轍。
2. 讀現有 pipeline + 資料模型做 grounding（見下）。
3. 診斷「點解之前失敗」，提出你嘅 approach 畀用戶 review，再動手 build / 試。

🧭 Grounding（現況，唔係叫你跟）：
- 現行做法：docs/lq_seed_workflow.md —— 人手 crop diagram 放 _lq_input/p<N>/images/，再由 AI 靠 question text + 檔名 confidence 去 match（連呢個 match 步驟都「quite failed」）。
- Image plumbing：scripts/upload_lq_images.ts（`local:…` placeholder → Supabase Storage）、src/lib/storage.ts signQuestionImage、past-paper crop UI 喺 src/app/admin/past-papers/[id]/ReviewForm.tsx。
- 資料模型：assessment_questions.image_url + image_alt_text；long_questions.image_url。
- CLAUDE.md「Image-dependent questions」：新題庫而家一律 SKIP，就係因為呢個問題未解決。

🔴 硬性要求：
- 唔可以配錯題（wrong figure↔question binding 係最大失敗模式，方案要自帶驗證 + 可信度分）。
- 唔可以影響任何 live 題庫 row（read + 提議，唔好亂改 DB）。
- 方案要可驗證：要有辦法畀人快速肉眼 confirm「呢個 crop 屬於呢題」先入庫。

方法（cropping 技術、bounding box、OCR、tiling、multi-pass、human-in-the-loop… 全部）由你決定。呢個係難題，Fable 就係嚟諗突破。先出「失敗診斷 + approach」草稿等 review，唔好即刻寫大 pipeline。
```

呢個解決咗之後，成果會直接餵返 Prompt 2（Task 7 ingestion skill）—— 圖片步驟係嗰個 skill 目前最弱嘅一環。

---

## Task 6 nice-to-have — ✅ 全部完成（2026-07-14，commit 74a938e）

- #3 ✅ 修咗：`又`→space 移到 whitespace collapse 之前，加 regression test。
- #4 ✅ 用戶裁定保持現狀：mock exam 錯題**即時**入 wrong-bank（接受考試中途 peek 風險）。已寫入 code comment + CLAUDE.md，唔好再「修」。
- #5 ✅ 抽咗 `src/lib/shuffle.ts` 共用（shuffle=copy / shuffleInPlace=mutate）。pickGroupsByTier O(n²) 冇改 — pool size 細，唔值得。
```
