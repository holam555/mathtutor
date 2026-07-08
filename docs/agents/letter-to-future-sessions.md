# 給未來 Session 的信

> 寫於 2026-07-06，Fable 5 一次性 session。你（讀緊呢封信嘅模型）大概率係 Sonnet 或 Opus。
> 呢封信講三件用戶冇問、但我判斷對呢個環境最重要嘅事，加上呢套制度最可能點樣退化同點預防。

## 一、三件最重要嘅事

### 1. 真相喺 Supabase DB，唔喺 repo；而你最有用嘅工具有一半唔喺 git

用戶（Kate）係一個人運營呢間補習社嘅系統：SQL 佢手動喺 Supabase SQL Editor apply、
env 佢手動喺 Vercel set、commit 時機佢自己揀。呢個 workflow 唔會變，你要適應佢：
- Repo 有 seed 檔 ≠ DB 有 data；檔案刪咗 ≠ DB 冇 rows（lessons.md L2 有血淚實證）
- 你交付任何 SQL，**必須**喺報告結尾明寫「⚠️ 要你喺 Supabase SQL Editor apply」；交付 env 改動同理（已知欠帳：`NEXT_PUBLIC_APP_URL` 喺 Vercel 仲係 localhost，SEO 靠佢）
- `.claude/`（4 個 project skills）係 gitignored，只存在 Kate 部機——搵唔到就問 Kate 攞備份，
  值得主動建議（要佢同意）將 skills 搬入 git 或定期 zip 備份。`scripts/extract_figures/` toolchain
  真身 committed 喺未 merge 嘅 branch `feat/figure-extraction-pipeline`（當前 branch 只見 output dirs），
  搵唔到 script 先查其他 branch（lessons.md L7）

### 2. 呢個產品賣嘅係信任，唔係 code

商業模式係「升分保證」：家長畀錢，學生做題。一條錯答案出街 = 學生被系統話佢錯、
家長信心受損，成本遠高過你慳嗰啲驗證時間。所以優先次序永遠係：**出街內容正確性 > 功能進度 > 優雅**。
具體姿勢：
- 數學內容一律 re-solve，包括「權威來源」（校方答案紙錯過兩次，lessons.md L5）
- 學生介面零負面語言係產品原則，唔係裝飾（答錯 = amber + 「再試一次！💪」，永不紅色、永不顯示對錯統計）
- 改 grading／抽題邏輯時，寧願多派一個 fresh agent 驗多次

### 3. 同 Kate 協作嘅正確頻寬

Kate 用廣東話工作，會畀你高自由度（歷史 prompt 風格：「方法自己決定，constraint 我講明」）。
佢期望嘅回報唔係過程直播，係：**結論 → 佐證 → 「你要做嘅嘢」清單**（apply SQL / set env / 手動搬檔 / commit）。
未完成嘅嘢有隊列文化：`docs/fable_handoff.md` + memory `fable-pending-tasks.md`。
你完成或新增任務，更新嗰兩度，唔好開新嘅隊列檔。
截至 2026-07-06 已知欠帳：fable_handoff Prompt 4（mathtutor-review + security skills）、
Task 6 nice-to-have #3/#4/#5、Vercel env `NEXT_PUBLIC_APP_URL`。
（`_cleanup_quarantine/` 已搬走 — 2026-07-06 確認唔存在，唔使追。）

## 二、呢套制度最可能點退化 + 預防

1. **趕工時跳過驗證**（最大風險）。「今次簡單，唔使派 fresh agent 驗」——錯就係喺「簡單」任務出。
   預防：judgment.md R1 係鐵律唔係建議；如果真係要跳，喺報告明寫「未經獨立驗證」，畀 Kate 知風險喺邊。
2. **CLAUDE.md 重新長肥**。每個 session 加少少「有用背景」，一年後又係 44KB。
   預防：maintenance.md §2 防肥條款（上限 15KB、完成敘事唔准入）；§5 健康檢查會捉到。
3. **制度檔膨脹**。將來嘅模型可能想加 09_xxx.md、10_yyy.md 顯示勤力。檔案多 = 冇人讀。
   預防：maintenance.md §1 規定新增制度檔要 Kate 同意；基準 8 個檔。
4. **規則變教條**。有日某條規則會同實際情況打架（例如 dispatch 門檻對一個超簡單批量任務太重）。
   預防：規則服務目標（Kate 嘅時間 + 內容正確性）。偏離規則可以，但要 (a) 喺報告講明偏離咗乜同點解，
   (b) 如果偏離啱咗，append lesson 並按 maintenance §1 問 Kate 改唔改規則。
5. **lessons.md 變垃圾場**。乜都寫 → 冇人掃。預防：只寫「>15 分鐘代價／影響出街／根因係規則缺失」嘅坑（maintenance §3）。

## 三、誠實交底（呢套制度嘅極限）

- 拆解＋驗證＋多樣本評審補到執行品質；**品味、教學設計、市場判斷補唔到**。遇到就照 judgment.md R6：
  收窄選項 → 升級 opus 出有標明信心嘅推薦 → 或者明話 Kate「呢題你定奪」。唔好扮客觀。
- 我（Fable）冇辦法預知未來 harness 嘅工具面貌。model 名、agent types、skill 觸發機制都會變。
  呢套制度寫嘅係**原則層**（唔落場、三件套、驗證不自驗、DB 先於檔案）——工具名過期時，原則照用，
  然後按 maintenance §1 更新事實部分。
- 本 session 冇改任何 product code、冇 commit、冇掂 DB。全部產出係 docs + CLAUDE.md 重寫
 （原文完整備份喺 `docs/archive/CLAUDE_pre_rewrite_2026-07-06.md`）。

做得好啲嘅唔係模型，係制度。跟住佢，佢會令你睇起上嚟好聰明。

— Fable 5，2026-07-06
