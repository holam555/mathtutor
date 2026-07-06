# Paper Ingestion SOP — 草稿等 review（skill 藍圖）

> 目標：一條龍 — 你放低一份 PDF（或 screenshots folder），最後題目（連圖、連答案）
> 入晒 `assessment_questions` / `long_questions`。呢份係 SOP 草稿；你 approve 後
> 會用 skill-creator 寫成 `.claude/skills/paper-ingestion/`。
>
> 基建：`scripts/extract_figures/`（batch/contact_sheet/gen_seed）＋
> `.claude/skills/question-bank-check/`（驗證 gate）＋
> `docs/lq_seed_workflow.md`（LQ 路線）＋ CLAUDE.md 題型規範。

---

## 輸入要求（Stage 0）

| 項目 | 要求 |
|---|---|
| 檔案 | **PDF 優先**（自動逐頁轉 150dpi PNG）；screenshots folder 都得（一頁一張、直向、full page） |
| 答案 | 三種都接受：①乾淨卷＋另附 answer key 頁 ②改咗嘅卷（紅筆手寫答案/圈咗 MC）③無答案（AI 解題，全部標 verify flag） |
| 開工前你要話我知 | ① 年級 ② `source_paper` id（例 `p6_school3_exam3_2026`）③（可選）考試範圍單元 |

命名慣例：`source_paper` = `p<年級>_<學校或來源>_<卷名>_<年份>`；`source_question` = 卷上原題號（`Q5`, `Q5a`, `Q31`）。

## 流程（7 個 stage，3 個人手 gate）

```
Stage 1  CV 抽圖+綁定      node scripts/extract_figures/batch.js <pdf或folder>
                           → 每頁 crops + annotated + questions.json stub + contact sheet
Stage 2  Transcription     Claude 逐頁讀原 PDF/PNG，填 questions.json（規則見下）
                           → 再行一次 batch.js，contact sheet 變 DB-row preview
Stage 3  🙋 GATE 1         你開 contact_sheet.html：逐題睇 crop 啱唔啱、答案啱唔啱
                           → 剔選 → Export selection.json
Stage 4  生成 SQL           node scripts/extract_figures/gen_seed.js …
                           → 政策 validation hard-fail → seed SQL + upload manifest
Stage 5  🙋 GATE 2         跑 question-bank-check skill（answerable? correct?
                           uniquely correct?）+ C1-C8 checklist → 有錯改完再 gen
Stage 6  Apply             你喺 Supabase SQL Editor apply seed SQL
Stage 7  圖片上載＋收尾      按 manifest 上載 crops（upload_lq_images.ts pattern）
                           → UPDATE image_url → /admin/questions 抽查 →
                           報告（題數/單元分佈/tier 分佈/skip 清單）
```

## Transcription 規則（Stage 2 核心，skill 會 encode 晒）

### 路由：每題三揀一

| 特徵 | 去邊 |
|---|---|
| MC / 短答（一個數字答案） | `assessment_questions` |
| 列式計算、多步 working、答案紙有步驟 | `long_questions`（model_answer 逐字保留，跟 `docs/lq_seed_workflow.md`） |
| 作圖題（補全棒形圖/折線圖）、量度題（用尺）、英文題 | **SKIP**（報告列明原因） |

### question_type 判定（hard rules，gen_seed 會擋）

1. `fill_in_number` 只可以係：純數字 `60`、小數 `1.25`、分數 `5/18`、
   帶分數 **space form** `1 5/8`（永遠唔用「又」）
2. 答案有中文/單位/冒號/任何其他字元（`4小時5分鐘`、`09:45`、`八折`）→
   **一律轉 `multiple_choice`**（政策 2026-07-06：唔要學生打中文）
3. Multi-blank（`___小時___分鐘`）→ 轉 MC（成個組合做選項）；
   兩空位獨立嘅就拆做 (a)(b) 兩題共用 `group_id`
4. MC：4 個 distinct options `A. `–`D. `；干擾項 = 學生常犯錯（漏一步/移位/
   顛倒）；same domain；正確答案位置分散（唔好成日 B）
5. 比較符號答案（`>` `<` `=`）→ MC（C6）

### 答案來源與可信度

- 改咗嘅卷：紅筆/手寫 = 答案線索，**但一定要重新解過**（學生可能答錯！）——
  解出嚟同紅筆唔同就標 `needs_human_review` flag
- 無答案卷：AI 解題，每題 flag `answer=AI解，C1核對`
- 圖上讀數（時鐘/量杯/刻度）：一律 flag 人手核對

### 圖片規則

- Binding 一律嚟自 detect.js 幾何計算，transcription 唔准自己配圖
- 裝飾圖（唔影響作答）→ contact sheet 剔「無圖」
- Pictorial 題（數量藏喺圖入面，好似「盛滿水的壺」）→ composite crop +
  題幹寫明圖中數量
- (a)(b) 共用圖 → 同一 `group` tag → gen_seed 自動出共用 `group_id`

### Curriculum mapping

- 按**內容**配 unit（cross-grade 允許，例：P6 卷嘅平均數題 → P5 U18），
  單元表以 CLAUDE.md 為準；P3 先有 lesson-level（`lesson_number`）
- 唔肯定 → 配最近嘅 unit + flag；永遠唔 hardcode topic UUID（SQL subquery）

### 特殊題型

- 承上題（靠上一題答案）→ 將上文併入題幹；併唔到就 skip
- 估算+計算兩步 → 只保留計算（p6aa 先例）
- Inline MC `（多／少）` → 轉標準 A/B options

## 驗證（Stage 5 = question-bank-check + C1-C8）

question-bank-check scanner 重點：exact-string grading — `0.5`≠`1/2`≠`.5`，
所以 stored answer 必須係鍵盤會輸出嘅格式。另加人手 checklist：

| | 檢查 | 常犯 |
|---|---|---|
| C1 | 重解每題 | 紅筆答案照抄（可能係學生錯答案） |
| C2 | unit/topic 啱 | 淨睇卷名唔睇內容 |
| C3 | 唯一正確答案 | MC 兩個 option 都啱；fill 有 equivalent form |
| C4 | options distinct | `0.5` 同 `1/2` 並存 |
| C5 | 年級深淺 | — |
| C6 | 無 `: > < = %` | 時間/比例答案 |
| C7 | 題問單位答案有單位 | MC option 漏單位 |
| C8 | 每 unit ≥1 basic + ≥1 enhancement | 成批全部 enhancement |
| ＋ | 帶分數 space form | `1又5/8` |
| ＋ | group 完整（sub_order 連續、共用圖一致） | (b) 冇咗 (a) 嘅 setup |
| ＋ | seed idempotent（source_paper+source_question 唯一） | 題號重複 |

## Skill 會包埋（等你確認）

1. `SKILL.md` — 觸發詞（「入呢份卷」「ingest pdf」「加題庫」…）+ 上面成個流程
2. `reference.md` — transcription 規則全文 + C-checklist + 特殊題型 + LQ 路線
3. 開工 intake 問卷（年級/source_paper/範圍/有冇答案）— 缺一唔開工
4. 報告格式：題數、路由統計（AQ/LQ/skip+原因）、單元/tier 分佈、
   flags 清單、下一步指令（apply → upload → verify）

## 開放問題（review 時答我）

1. **列式計算短題**（好似 trial PDF Q6「鴨比雞多百分之幾？(4%) 列式計算」）—
   佢有 marks + working box，但答案係一個數。入 `long_questions`（俾學生寫步驟、
   老師改）定 `assessment_questions`（淨對答案）？我建議：**跟卷面 section**
   — 有 working box 嘅入 LQ，冇嘅入 AQ。
2. **Marks 欄**（`(4%)`）— AQ 冇 marks column（mock exam 用 type 定分數），
   建議照 skip；LQ 都冇（migration 0021 拆咗）。OK？
3. 一份卷想**一次過入埋 LQ**定係 LQ 用返現有 `lq_seed_workflow.md` 分開做？
   我建議一齊做（同一個 contact sheet review），LQ 部分出第二份 seed SQL。
