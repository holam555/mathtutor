# 判斷 Rubric — 把「感覺」變成可執行嘅判準

> 讀者：任何等級嘅接手模型。每條判準附正例（✅ 應該咁做）同反例（❌ 唔好咁做），
> 大部分例子來自呢個 repo 嘅真實歷史。

## R1. 幾時算「真係完成」

**判準**：完成 = 全部客觀 gate 過 + 一項非自己嘅驗證 + 產出已落檔。三者缺一就唔准講「完成」，只可以講「做咗、未驗」。

客觀 gate（code 改動）：`npx tsc --noEmit` → `npx next lint` → `node scripts/check_i18n.mjs` → `npx next build`。
非自己嘅驗證：見 [model-dispatch.md](model-dispatch.md) §6（fresh agent read-back / 實跑 / 抽查）。

- ✅ 正例：改咗 grading 邏輯 → 四個 gate 過 → 用一條真實答案（`1 5/8` 同 `1又5/8`）打 API 實測 grade 結果 → 報告「完成，佐證：…」。
- ❌ 反例：寫完 231 條 seed SQL，話「已按 C1–C8 生成，完成」——生成時「有跟規則」唔係驗證；歷史上就係咁樣先出現批量格式錯誤。冇跑過 `question-bank-check` 或抽查嘅 batch 一律當未完成。

**特別條款**：涉及 DB 嘅「完成」永遠係兩段式 —— repo 內 seed/migration 寫好 = 「準備好」；用戶喺 Supabase apply 咗先係「完成」。報告時明寫「⚠️ 需用戶喺 SQL Editor apply」。

## R2. 幾時停低問用戶（vs 自主推進）

**判準**：命中以下任一 → 停，問；否則自主做完再報告。
1. 不可逆／外向操作：刪 DB rows、deactivate 題目、push、publish、send email、改任何金錢/分數制度（token 兌換率、MC/SQ/LQ 分值）
2. 兩個合理方案會導致**用戶層面**唔同結果（唔係 code 內部取捨），而 CLAUDE.md / docs / lessons 冇答案
3. 需要 harness 外嘅真相而查唔到（Vercel env、用戶同校方嘅約定、家長實際用法）
4. 教學／品味判斷（題目深淺係咪適合、文案語氣）而且會直接出街畀學生家長睇

- ✅ 正例：cleanup 時發現 `seed_p5_long_questions_sample.sql` 個名叫 sample —— 冇當垃圾刪，先查 DB，發現 3 條 active rows，改為標注「live seed 唔好刪」。（真實事件，lessons.md L2）
- ❌ 反例：「呢個 route 冇 rate limit，我順手加埋」然後自己揀 limit 數值出 PR —— 加唔加係合理自主，但數值影響真實用戶，應該加完用保守值並明確標出「數值請確認」。
- ❌ 反例（另一方向）：改一個 UI 文字 typo 都走去問用戶 —— 可逆、有 CI 驗證嘅嘢唔好問，做完報告。

## R3. 幾時升級模型（sonnet → opus）

**判準**：任務本身「答案唔明顯而且錯咗好貴」。具體訊號：
- 數學 re-solve 同來源答案唔一致（要裁決邊個啱）
- 安全／權限判斷（RLS、createServiceClient、role gating）
- 刪除／退役任何嘢之前嘅最終覆核
- 同一任務 sonnet 兩次 fail 驗收且錯法唔同

- ✅ 正例：p6_21c 入庫時 re-solve 發現 2 條同老師答案紙唔一致 → 呢種裁決值得 opus（或第二個獨立 agent）再解一次，兩者一致先改。
- ❌ 反例：為「掃描邊啲檔用咗 `#4A90E2`」開 opus —— 機械掃描，haiku 都做到，貴模型留返畀判斷。

## R4. 方向錯咗嘅訊號（換路，唔好再 retry）

**判準**：任一命中 → 停低，寫低現況，換方法或問用戶。唔好第三次用同一招。
1. 同一個 fix 試咗兩次，錯誤訊息唔同咗但問題仲喺度 → 你嘅 mental model 錯咗，唔係手勢問題
2. 為咗令方案成立，你開始加第二、三個「特殊情況處理」 → 通常係 abstraction 揀錯咗
3. 你發現自己喺度改測試／改驗收條件去遷就產出 → 即刻停
4. 花緊嘅時間同任務份量明顯唔成比例（例：一個 typo fix 搞咗 30 分鐘）

- ✅ 正例（真實）：figure–question binding 用「語義配對」做極都係 3/15 命中，冇再調 prompt，而係退後一步問「binding 嘅本質係乜」→ 發現係**頁面幾何**問題（圖屬於包含佢嘅題號帶）→ 換成 CV 幾何方案即刻 10/10。教訓：連續低命中率 = 問題定義錯，唔係執行差。
- ❌ 反例:同一個 regex 改第五次，每次令一個 case 過但另一個 case 爆 —— 應該喺第二次已經停低，列晒全部 case 重新設計。

## R5. 品質底線點驗（唔同產出各有底線）

| 產出 | 底線（fail 任一 = 唔准出手） |
|------|------------------------------|
| 新題目 | C1–C8 全過 + re-solve 有步驟 + question_type 揀啱（睇 CLAUDE.md 格式鐵律） |
| Code | 四 gate 過 + 唔破壞安全鐵律（correct_answer 唔出 browser、家長必過 parent_student_relationships） |
| 文件 | 每個引用嘅路徑/檔名 grep 過確認存在；冇同 CLAUDE.md 現行規則矛盾 |
| Seed SQL | idempotent（source_paper + source_question key）+ 唔會誤傷 active rows（UPDATE/DELETE 有精確 WHERE） |
| 對用戶嘅報告 | 講咗乜做咗、乜未做、乜要用戶做（apply SQL / set env / commit），三樣分開列 |

- ✅ 正例：seed SQL 用 `WHERE source_paper = 'p6_21c'` 精確圈住先 UPDATE。
- ❌ 反例：`UPDATE assessment_questions SET is_active = false WHERE grade = 5` 咁樣寫 deactivate —— 會誤殺新 pool。任何無 source_paper 條件嘅批量 UPDATE 都要人手覆核。

## R6. 模糊題／品味題（誠實條款）

**判準**：如果「啱唔啱」冇客觀判準（語氣、美感、教學取捨、市場判斷），呢套制度**補唔到**。做法按次序：
1. 收窄：出 2–3 個具體選項 + 各自 trade-off（多 agent 各出一版亦可），唔好扮客觀評分
2. 升級 opus 出推薦 + 標明信心程度
3. 出唔到有把握嘅推薦 → 明講「呢題係品味判斷，我嘅建議係 X 但請你定奪」，唔好包裝成技術結論

- ✅ 正例：「答錯文案用『再試一次！💪』定『差少少！』」→ 列兩個 + 指出零負面語言原則傾向前者 → 交用戶。
- ❌ 反例：自己發明一套「文案評分 rubric」打分然後宣布 8.5 分勝出 —— 假精確，好過唔講。
