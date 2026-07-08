# Harness 診斷 — 三大漏洞同修法（2026-07-06，Fable 5 一次性審計）

> 讀者：之後接手呢個 repo 嘅任何模型（Sonnet / Opus / Haiku 級別）。
> 呢份係 `docs/agents/` 成套制度嘅根據。其他檔案引用呢度嘅編號（D1/D2/D3）。
> 制度總覽同閱讀順序見 [README.md](README.md)。

## D1 — CLAUDE.md 肥大 + 新舊真相混雜（最大 token 漏 + 最大誤導源）

**症狀（有實證）**：
- 重寫前 CLAUDE.md 44,401 bytes，每個 session 開場全載，其中超過一半係已標明 legacy / 已完成 sprint 嘅敘事。
- 檔內自相矛盾：「手機 UX 設計規範」寫主色 `#4A90E2`、答錯用紅色；但 Sprint 6 段落寫明學生介面已全改 teal `#1D9E75`、答錯用 amber `#EF9F27` 零負面語言。一個冇讀晒全文嘅模型（或 context 被 compact 後）會跟錯舊規範。
- 檔內引用唔存在嘅嘢：`scripts/verify_assessment_answers.py`（檔案唔喺 repo）、`/practice`、`/results/[sessionId]` 等 Phase 1 規劃路由（實際係 `/student/practice/...`）。
- Legacy A1–I4 分類 + 成段 `question_categories` INSERT SQL 佔百幾行，文件自己都話「已不再使用」。

**代價**：每 session 白燒 ~10k+ tokens；更貴嘅係*錯誤跟從*——弱模型分唔清「歷史敘事」同「現行規則」。

**修法（已執行）**：CLAUDE.md 重寫為薄路由層（見 [maintenance.md](maintenance.md) 嘅防再肥條款）；全文備份喺 `docs/archive/CLAUDE_pre_rewrite_2026-07-06.md`。鐵律：**CLAUDE.md 只放現行真相 + 指向詳細檔嘅 pointer；歷史一律去 docs/archive/**。

## D2 — 主對話下場做批量工作 → context 爆 → compaction 失焦

**症狀（由工作型態推斷，呢個 repo 嘅任務天然批量重）**：
- 典型任務：入一份 past paper（9 頁 PDF、37 題）、驗證 231 條 seed SQL、掃 57 處 `createServiceClient`、寫 100+ 條題嘅 seed。主模型自己逐頁讀、逐條驗，兩三個任務就迫爆 context。
- Context 一旦 compact，最先蒸發嘅係細粒度規則（帶分數 space 格式、C6 禁字元、MCQ distractor 規則），而呢啲正正係後半段先用到嘅規則 → 後半 batch 出錯率明顯高過前半。
- 自己讀 3,000 行 seed SQL 入 context，之後每一個 turn 都重複為呢啲垃圾付費。

**修法（制度化喺 [model-dispatch.md](model-dispatch.md)）**：指揮官唔落場。大量讀取／全 repo 掃描／批次驗證／批次改檔一律派 subagent，主對話只收結論＋檔案:行號。批量任務要**分批派工**（例如每 40 題一個 agent），每批之間主對話重申一次格式鐵律（重申成本幾百 token，遠平過重做）。

## D3 — 自驗自證 + 三個真相源漂移（最大出錯源）

**症狀（有實證，來自 git/memory 歷史）**：
- 真相有三份：**Supabase DB（用戶手動喺 SQL Editor apply）**、repo 入面嘅 seed 檔、CLAUDE.md 描述。三者已多次漂移：`seed_p5_long_questions_sample.sql` 個名叫 sample 但係 live seed（險被 cleanup 刪除）；`seed_p6aa_test.sql` 喺 repo 存在但 DB 零 rows（從未 apply）；有 94 rows 喺 DB 但檔案已刪。
- 模型改完自己宣布「完成」，冇 fresh-context 驗證。歷史證明連老師提供嘅答案都錯過兩次（p6_21c 入庫時 re-solve 捉到 2 條錯答案）——「來源話係啱」唔等於啱。
- `.claude/`（所有 project skills）係 gitignored：換機／clone 會無聲消失，之後嘅模型會以為 skill 唔存在而重造或跳過驗證 gate。`scripts/extract_figures/` toolchain 真身 committed 喺未 merge 嘅 branch `feat/figure-extraction-pipeline`——當前 branch 本機只見 output dirs，好易誤判「唔存在」。

**修法**：
1. 任何涉及「DB 有乜」嘅判斷，先查 DB（skill `question-bank-check` 有 live scan），唔好靠 seed 檔或文件推斷。
2. 驗證不自驗：完成宣稱要過 [judgment.md](judgment.md) R1 嘅客觀 gate（tsc/lint/build/check_i18n/題庫 scan），高風險產出派 fresh-context agent read-back／實跑（流程喺 [model-dispatch.md](model-dispatch.md) §6）。
3. 數學內容一律 re-solve，唔信任何來源答案（包括校方答案紙）。
4. gitignored 資產嘅風險同備份要求寫入 [letter-to-future-sessions.md](letter-to-future-sessions.md)。

---

## 次要（唔入前三，但值得知）

- **Skill 唔觸發**：`.claude/skills/` 有 4 個 project skill（paper-ingestion、question-bank-check、seo-audit、seo-content-page），弱模型可能唔記得用。修法：CLAUDE.md 路由表明寫「乜任務 → 用乜 skill」。
- **文件引用斷鏈**：docs 互相引用多，刪檔／改名冇人 check。修法：maintenance.md 要求改名時 grep 引用。
- **回合尾唔落檔**：長任務中斷時未寫入檔案嘅結論全部蒸發。修法：隨做隨寫（每完成一個單元即刻落檔），呢條已寫入 model-dispatch.md。
