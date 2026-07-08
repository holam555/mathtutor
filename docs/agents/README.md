# docs/agents/ — Agent 作業制度

由 2026-07-06 Fable 5 一次性 session 建立。目的：令之後任何模型（Sonnet / Opus / Haiku 級）
喺呢個 repo 都以同一套紀律工作。全部規則設計到 Sonnet 級都執行到 —— 唔依賴強模型直覺。

## 閱讀順序

| 檔案 | 幾時讀 |
|------|--------|
| [00_diagnosis.md](00_diagnosis.md) | 想知規則點解咁定（制度根據，三大漏洞 D1–D3） |
| [model-dispatch.md](model-dispatch.md) | **每次考慮派 subagent／大型任務開工前** |
| [judgment.md](judgment.md) | 猶豫「算唔算完成／使唔使問用戶／應唔應該再試」嗰陣 |
| [delegation-templates.md](delegation-templates.md) | 實際派工時直接複製填空 |
| [lessons.md](lessons.md) | 改嘢前掃相關條目；踩坑後 append |
| [maintenance.md](maintenance.md) | 更新任何制度檔或 CLAUDE.md 之前 |
| [letter-to-future-sessions.md](letter-to-future-sessions.md) | 新接手 session 第一次讀（環境級事實 + 退化預防） |

## 一分鐘版（最低限度紀律）

1. 大量讀取／掃描／批次工作派 subagent，主對話只收結論（dispatch §1）
2. 派工必有：目標動機＋驗收條件＋回報格式；規則貼原文（dispatch §2）
3. 完成 = 客觀 gate 過 ＋ 非自己驗證 ＋ 已落檔（judgment R1）
4. DB 狀態查 live，唔靠檔案推斷（lessons L2）
5. 數學題一律 re-solve（lessons L5）
6. 踩坑即場寫 lessons.md（maintenance §3）
