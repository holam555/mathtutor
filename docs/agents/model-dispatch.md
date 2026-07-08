# 模型調度守則（model dispatch）

> 讀者：主對話裡面嘅模型（「指揮官」）。呢份係用戶嘅**長期授權**：用戶已明確授權按此守則派 subagent，
> 唔使每次再問。但授權 ≠ 亂派 — 跟以下門檻。
> 根據：[00_diagnosis.md](00_diagnosis.md) D2（主對話落場爆 context）同 D3（自驗自證）。

## 0. 誠實前提（本 harness 嘅實際能力）

- Agent tool 有 `subagent_type`（本 repo 常見：`Explore` 讀-only 搜尋 / `Plan` 規劃 / `general-purpose` / `claude`）同 `model` override（enum 以當時 tool schema 為準；`fable` 唔會長期存在，升級目標預設 `opus`）。
- **冇 API 級 effort 參數。** Effort 只能用兩樣嘢控制：(a) prompt 語言（「快速確認」vs「徹底、逐檔核對」+ Explore 嘅 breadth 指示 "medium"/"very thorough"）；(b) skill 自帶檔位（如 `/code-review low|high`）。文件講「指定 effort」一律指呢兩種。
- Subagent 係 cold start：唔會識你頭先傾過乜。所有 context 要寫入 prompt。
- `SendMessage` 可以延續一個已派過嘅 agent（保留佢嘅 context）；`run_in_background: true` 可並行；`isolation: "worktree"` 畀批次改檔用獨立 worktree。
- 每個 session 開場嘅 system reminder 會列當時可用嘅 agent types — 以嗰個列表為準，唔好靠呢份檔案背名。

## 1. 指揮官不下場（幾時必須派）

主對話嘅 context 係最貴嘅資源：入咗嘅嘢每個 turn 都重複收費，爆咗就 compact 失焦。

**必須派 subagent（任一命中）**：
- 預計要讀 **>3 個大檔**（seed SQL、成頁 route file）或 **>10 個檔案**先答到嘅問題 → `Explore`
- 全 repo 掃描（「所有 createServiceClient」「邊度用咗 X」跨多目錄）→ `Explore`
- 批次改檔（>5 個檔嘅機械式改動）→ `general-purpose`（大批用 `isolation: "worktree"`）
- 批次驗證（>20 條題目 re-solve、C1–C8 全 batch）→ 分批派，見 §5
- 網頁研究 / 多篇文件閱讀 → `general-purpose`（背景跑）
- 讀 PDF 逐頁轉錄 → `general-purpose`，每 agent 最多 ~10 頁

**唔好派（inline 自己做）**：
- 讀 1–3 個已知路徑嘅檔、改 1–2 個檔、跑一條 command、答用戶問題
- 你已經知答案喺邊，只係要確認 → 直接 Read 嗰幾行
- 判斷性強、需要同用戶來回嘅嘢（subagent 唔可以問用戶）

**主對話只進結論**：subagent 回報照 §3 合約；指揮官唔好叫 subagent 貼原文返嚟。

## 2. 派工三件套（每個 delegation prompt 必有）

1. **目標＋動機**：做乜、點解要做（動機令 agent 遇到邊界情況識得取捨）。
2. **驗收條件**：客觀、可自查（「tsc 過」「每條題附 re-solve 步驟」「輸出檔存在且 >N 行」）。冇驗收條件 = 唔好派。
3. **回報格式**：明確講返嚟要乜（見 §3）。

另外必附：**grounding**（要讀邊啲檔，包括相關嘅格式鐵律原文——唔好淨係話「跟 CLAUDE.md」，subagent 可能唔載入佢；直接貼關鍵規則或叫佢讀指定 section）＋**硬性禁區**（唔准 delete、唔准 apply SQL、唔准 commit 等）。

現成模板：[delegation-templates.md](delegation-templates.md)。

## 3. 回報合約

- Subagent 只回：**結論 + 佐證（檔案:行號）+ 驗收條件逐項 pass/fail + 未解決事項**。
- 長產物（報告、seed SQL、批量 findings）**一律落檔**，回報只傳路徑 + 3 行摘要。存放：正式產出入 `docs/` 或對應目錄；中途產物入 session scratchpad 或 `docs/archive/`。
- 禁止：貼大段原始碼 / 原文返主對話；「我覺得應該 OK」呢類冇佐證嘅判斷。
- 指揮官收報告後：只把**結論**寫低（必要時落檔），唔好復述細節。

## 4. Model 揀邊個 + 升降級

| 任務 | model |
|------|-------|
| 機械掃描、格式檢查、逐字轉錄、跑 command 收集輸出 | `haiku` |
| 一般搜尋、實作、重構、批次驗證、寫 doc | `sonnet`（預設，唔使寫都得） |
| 數學 re-solve 有爭議、架構決策、安全審查、高風險刪除判斷 | `opus` |

**升級訊號**（sonnet → opus，或 opus → 問用戶）：
- 同一任務兩次嘗試都 fail 驗收，且錯法唔同（唔係同一個 bug）
- 兩個 agent 對同一題答案唔一致
- 判斷涉及不可逆操作（刪 DB rows、改計分制度）
- 品味／模糊題（「呢個 UX 好唔好」）— 見 [judgment.md](judgment.md) §模糊題

**降級訊號**：發現任務其實係機械式（清單化、無判斷）→ 下次同類任務用 haiku + 更嚴格模板。

## 5. 批次任務嘅派法（本 repo 最常見）

- **分批**：題目驗證 / 轉錄每批 ≤40 條（一份 paper 一批亦可）。每批 prompt 重申格式鐵律（帶分數 space、C6 禁字元、MCQ 規則）——唔好假設 agent 記得上一批。
- **騎縫驗證**：每批完成後由**另一個** fresh agent 抽查 20%（隨機），fail >1 條 → 全批重驗。
- **隨做隨寫**：每批結果即刻落檔（append 到輸出檔），先開下一批。Session 隨時會斷。

## 6. 驗證不自驗（verification protocol）

寫嘢嘅 agent 唔可以係驗嘢嘅 agent。指揮官自己改嘅嘢，都唔可以只靠自己講「完成」。

| 產出類型 | 驗法 |
|---------|------|
| 檔案／文件 | fresh-context agent read-back：畀佢路徑 + 驗收條件，問「呢份檔有冇矛盾、斷鏈、缺項」，唔好畀佢睇你嘅草稿過程 |
| 程式碼 | 客觀 gate 先行：`npx tsc --noEmit` → `npx next lint` → `node scripts/check_i18n.mjs` → `npx next build`；UI 改動加 preview 實跑（preview_* tools）；邏輯改動搵/寫測試或最少一次真輸入實跑 |
| 題庫 batch | skill `question-bank-check` + §5 騎縫抽查 |
| 高風險判斷（刪嘢、改制度、安全） | 第二意見：多開一個 opus agent 獨立判斷；兩者唔一致 → 停，問用戶 |
| 多方案擇優 | 派 2–3 個 agent 各出一版 → 另一個 fresh agent 做評審（畀 rubric），指揮官只看評審結論 |

**Fresh-context 嘅意思**：新 Agent call（唔係 SendMessage 延續），prompt 只含任務+驗收條件，唔含你嘅結論 — 免得佢 anchor 咗照抄你講「pass」。

## 7. 極限（誠實條款）

呢套制度補到：執行品質、覆蓋率、機械錯誤。**補唔到**：
- **品味／模糊題**（文案語氣、UX 取捨、教學設計）：多 agent 評審可以縮窄選項，但最終判斷升級 opus 或直接問用戶，唔好扮有把握。
- **真相喺 harness 外**（DB 實際狀態、Vercel env、用戶意圖）：查得到就查（DB 有 live scan），查唔到就明寫「未驗證」，唔准編造。
- Subagent 冇你嘅對話記憶：任何依賴「頭先傾過」嘅嘢必須寫入 prompt，寫漏咗係指揮官嘅錯，唔係 agent 蠢。
