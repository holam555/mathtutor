# 踩坑教訓 Log

> 格式（append-only，新條目加喺最底）：
> `## L<編號> — <一句標題>（YYYY-MM-DD）` + **症狀** / **根因** / **規則**（一句命令式，寫畀下一個模型執行）。
> 幾時寫、幾時精簡：見 [maintenance.md](maintenance.md) §3。改嘢前用標題掃一眼相關條目。

## L1 — 帶分數格式統一 space（2026-07-06 記錄；事發更早）
**症狀**：題庫混用 `1又5/8` 同 `1 5/8`，同鍵盤輸出唔一致，評分靠 normalize 補救。
**根因**：出題時冇對齊 `UnifiedKeyboard.tsx` 實際輸出。
**規則**：新內容一律 `1 5/8` space 格式；自然中文「又」（又進貨了）唔准誤轉。已知殘留 bug：`normalizeAnswer` 嘅 `又`→space 喺 whitespace collapse 之後，`3 又 1/2` 會 grade 唔中（見 docs/fable_handoff.md Task 6 #3）。

## L2 — DB 先於檔案，檔名唔可信（2026-07-05）
**症狀**：cleanup 時 `seed_p5_long_questions_sample.sql` 個名叫 sample，險被當垃圾刪 —— 其實係 3 條 active LQ 嘅 live seed。同日發現 `seed_p6aa_test.sql` 喺 repo 但 DB 零 rows；另有已刪檔案喺 DB 留低 94 rows。
**根因**：用戶手動喺 Supabase SQL Editor apply，repo 檔案同 DB 狀態冇機制同步。
**規則**：任何「DB 有乜／可唔可以刪」嘅判斷，必須查 live DB（skill `question-bank-check` 或直接 query），唔准由檔名、檔案存在與否推斷。

## L3 — Figure binding 係頁面幾何，唔係語義配對（2026-07-06）
**症狀**：用「圖同題目內容語義配對」做圖題綁定，多次迭代都只有 3/15 命中。
**根因**：問題定義錯 —— 圖屬於「包含佢嘅題號帶」（page geometry），同內容無關。
**規則**：連續低命中率唔好再調 prompt，退後一步重新定義問題（judgment.md R4）。圖題綁定一律用 `scripts/extract_figures/` CV 幾何 pipeline（真身喺 branch `feat/figure-extraction-pipeline`，見 L7）。

## L4 — % 同中文單位答案唔可以係 fill_in_number（2026-07-06，用戶裁定）
**症狀**：`45%`、`4小時5分鐘` 呢類答案出咗 fill_in_number，學生鍵盤根本打唔出。
**根因**：出題時冇對照鍵盤可輸入字符集。
**規則**：答案含 `%`、`:`、`>`、`<`、`=` 或中文單位 → 一律 multiple_choice（= C6 檢查嘅根據）。2 選項題直接 skip。

## L5 — 校方答案紙都會錯（2026-07-06）
**症狀**：p6_21c 入庫時 re-solve 發現 2 條老師提供嘅答案係錯。
**根因**：人手答案紙有錯係常態，唔係例外。
**規則**：每條數學題必須獨立 re-solve 先入庫；同來源答案唔一致時唔好自動信任何一方，升級裁決（judgment.md R3）。

## L6 — 列式計算題 route "both"（2026-07-06）
**症狀**：「列式計算」題唔知入 AQ 定 LQ，兩邊各有損失。
**根因**：呢類題同時有短答案（可自動評分）同過程（要人批）。
**規則**：route `both` —— assessment_questions 入 answer-only 版 + long_questions 入 verbatim model_answer 版。詳見 `.claude/skills/paper-ingestion/`。

## L7 — `.claude/` 同大部分 `scripts/` 唔喺當前 branch 嘅 git（2026-07-06）
**症狀**：skills（paper-ingestion、question-bank-check、seo-audit、seo-content-page）gitignored 唔入 git，換機／fresh clone 會無聲消失。`scripts/extract_figures/` toolchain 喺當前 branch 本機只見 output dirs，好易誤判「唔存在」。
**根因**：.gitignore 明文 ignore `.claude/` 同 `/scripts/*`（截至 2026-07-06 白名單只有 check_i18n.mjs、check_seo.mjs、upload_lq_images.ts — 以 .gitignore 現行為準）；extract_figures 真身 committed 喺未 merge 嘅 branch `feat/figure-extraction-pipeline`。
**規則**：搵唔到 skill/script ≠ 唔存在 —— 先 `git branch -a` + `git ls-tree <branch> scripts/` 查其他 branch，再問用戶；建議用戶備份 `.claude/`（見 letter-to-future-sessions.md）。

## L8 — CLAUDE.md 肥大 + 新舊真相混雜（2026-07-06）
**症狀**：44KB 每 session 全載；檔內新舊規則矛盾（`#4A90E2` vs `#1D9E75`）；引用唔存在嘅 script。
**根因**：只加唔減，歷史敘事同現行規則冇分層。
**規則**：CLAUDE.md 只放現行真相 + pointer；完成咗嘅嘢寫一行 + 指去 docs/；歷史入 docs/archive/。防再肥條款見 maintenance.md §2。

## L9 — 唔好喺 dev server 行緊時跑 `next build`（2026-07-08）
**症狀**：preview 突然變晒無 CSS 嘅裸 HTML（暗色 UA default），所有 `_next/static` chunk 404，SSR 500 `Cannot find module './8948.js'`。
**根因**：`npx next build` 同 `next dev` 共用 `.next/` — production build 剷咗 dev 嘅 chunk manifest。
**規則**：跑 build gate 前先停 dev server（或接受跑完要 `rm -rf .next` + 重啟 dev）。壞咗嘅修法就係：停 server → `rm -rf .next` → 重啟。

## L10 — Subagent 會因 plan session limit 中途死亡，留低半完成 edit（2026-07-08）
**症狀**：兩個 reskin subagent 行到一半彈「You've hit your session limit」，回報空白；其中一個留低 unclosed `<div>`（JSX 唔 balance，tsc fail），另一個只做咗一半 scope。
**根因**：subagent 同主對話共用 plan quota；批量 edit 任務中途斷，冇機會自查驗收。
**規則**：每個會寫檔嘅 subagent 完成（或死亡）後，指揮官必須 `git diff --stat` + 跑 `tsc` 先當佢完成咗；agent 冇回報驗收結果 = 當未驗證，逐檔檢查。Scope 未掂嘅部分由指揮官 inline 執手尾，唔好再派（quota 已爆）。
