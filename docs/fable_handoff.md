# Fable 交接 — 未完成任務嘅 copy-paste prompts

> 背景：2026-07-05 一個 7-task batch，由 Opus 4.8 分流。強模型 Fable 負責高風險 / 需深度綜合 / 寫 skill 嘅任務。
> 完成狀態同每個 prompt 喺下面。

## 狀態

| Task | 狀態 |
|------|------|
| 1. SEO | ✅ Opus 完成：docs/seo_strategy.md + robots.ts/sitemap.ts/layout JSON-LD。前置未做：Vercel set 真實 `NEXT_PUBLIC_APP_URL`。內容*寫作*留畀 Fable（見 Prompt 3）。 |
| 3. 家長配對 | ⏭️ 用戶 skip |
| 4. 題庫檢查 skill | ✅ Opus 完成：`.claude/skills/question-bank-check/` |
| 6. Code review | ✅ Opus 完成 review + 修咗 #1（dead legacy grading 分支）、#2（hc- id 繞過 regrade）。餘下 #3/#4/#5 為 nice-to-have，見文末。 |
| 5. Repo cleanup | ✅ Fable 完成（2026-07-05）：報告 docs/repo_cleanup_report.md，已執行 quarantine + archive + dead-code 移除，全部驗證過。用戶手動搬走 `_cleanup_quarantine/` 即完成 |
| 7. Ingestion skill | ⬜ Fable — **Prompt 2** |
| SEO 可持續 skills | ⬜ Fable — **Prompt 3** |
| Code-review + Security skills | ⬜ Fable — **Prompt 4** |

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

## Task 6 餘下 nice-to-have（未修，Opus / Fable 皆可）

- #3 answerUtils.ts：`又`→space 喺 whitespace collapse 之後，"3 又 1/2" 會變 triple space grade 唔中（僅影響 legacy 又+空格資料）。修法：把 `\s+`→' ' 移到最後。
- #4 practice/answer/route.ts:103-141：mock_exam session 仍寫 practice wrong-bank —— 確認是否 intended，唔係就 gate `session_type !== 'mock_exam'`。
- #5 DRY：兩個 Fisher-Yates shuffle（assessmentSelection / mockExamSelection）可抽共用 util；mockExamSelection pickGroupsByTier O(n²) filter 可用 counter。
```
