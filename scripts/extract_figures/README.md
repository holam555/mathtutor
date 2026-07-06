# extract_figures — 圖片抽取 + 幾何綁定 pipeline（Phase 2）

> 背景、失敗診斷、設計：`docs/figure_extraction_diagnosis.md`。
> 零外部 API（Path A）：CV 係本地 script，VLM 角色（transcription/verify）由
> Claude Code session 內擔任。任何嘢入 DB 前必須經人手 tick。

## Path A workflow（自己嘅 past paper 入庫）

```bash
# 1. 每版卷一張圖（screenshot / scan / PDF page render），放一個 folder
node scripts/extract_figures/batch.js <folder> [--out <dir>] [--title <t>]
#    → 每頁 candidates.json + crops + annotated.png + questions.json STUB
#    → contact_sheet.html（暫時只有 crops + bindings）

# 2. 開 Claude Code session：叫 Claude 讀每頁原圖，填晒每個
#    <out>/<page>/questions.json（transcription：題目文字、type、答案、
#    unit_number；binding 唔關 Claude 事 — 全部嚟自 detect.js）

# 3. 再行一次 batch.js → contact_sheet.html 變成 DB-row preview

# 4. 喺 browser 開 sheet：逐題揀 crop（或「無圖」）→ ⬇︎ Export selection.json

# 5. node scripts/extract_figures/gen_seed.js \
#      --out-dir <out> --selection selection.json \
#      --grade 6 --source-paper p6_myschool_2026
#    → seed_<paper>.sql + upload_manifest.json（validation fail 就唔出 SQL）

# 6. 檢查 SQL → Supabase SQL Editor apply → 跑 question-bank-check skill
#    → 按 manifest 上載 crops（scripts/upload_lq_images.ts）→ UPDATE image_url
```

單頁模式：`node detect.js <image>`、`node contact_sheet.js --candidates … --questions … --out …`。

## 政策（hard rules，gen_seed.js 會擋）

- `fill_in_number` 答案只可以係純數字 / 小數 / 分數 / space-form 帶分數。
  **答案有中文（`4小時5分鐘`）或 C6 字元（`:` `>` `<` `=` `%`）一律轉
  `multiple_choice`**（用戶決定 2026-07-06；學生唔會打中文）。
- 裝飾圖唔入庫（tick「無圖」）。
- MC 要 4 個 distinct `A. `–`D. ` options，correct_answer 要喺入面。
- 冇喺 selection.json 入面 tick 過嘅題目唔會出現喺 SQL。

## 點 detect（三步，全 deterministic）

1. **Figure detection** — 頁框移除（邊緣 25% run + CC 級 skew-tolerant 殘骸
   偵測：貼邊+長+稀疏）→ ink CC seeds（≥50px）+ tinted-panel seeds →
   frozen-bbox attach（label 併入圖，文字唔會 chain）→ filters：
   underline strips、pink 答案 blank、**thickness**（每個真 figure 至少有一件
   min-dim ≥ 5%W 嘅成員；文字/blank block 冇）
2. **Anchor detection** — 兩個 profile 自動揀多者：圈號（空心+深色+唔飽和+
   bbox 四角冇墨）；朴素數字欄（「31.」喺直線左邊 cluster）
3. **Binding** — figure 中心 y ∈ 邊個 anchor band 就屬邊題；band 內 ≥2 件 →
   加 composite candidate（pictorial 題成套 union）；第一個 anchor 之前嘅圖
   → bind band 1 + `sharedAbove`（題組共用 chart）

Default crop pick（contact_sheet.js）：1 件 → 佢（AUTO）；≥3 件 → composite；
2 件 → 水平 gap <20%W 就 composite 否則大嗰件（一律 REVIEW）。

## 驗證紀錄

- **Phase 1（2026-07-06）**：p6a workbook eval，人手 ground truth 10/10 binding
  正確，0 配錯（舊 semantic match 同批 pages 3/15）
- **真掃描卷 sample（Q31-33）**：3 anchors、pictorial composite（Q31 成套
  壺杯圖）、時鐘單圖、量杯+箭嘴+盒 composite 全啱；negative test 證明
  政策 gate 會擋非數字 fill_in_number + C6
- **Acceptance（折線圖/行程圖 folders）**：行程圖 3 頁每頁恰好 1 candidate
  =幅 chart（junk 0）；折線圖頁 table/chart/題目框全部捉到

## 已知限制

- 純幼線 figure（例如淨係一條數線）會被 thickness filter 誤殺 —— 遇到就
  人手 crop 補
- 折線圖「補全作圖」題型本身唔適合 app 作答（要畫嘢）— transcription 階段
  按政策 skip 或轉 LQ
- 手影相（skew/glare/shadow）未支援 — Phase 3（Path B，app runtime + Gemini）
- 雙欄 layout 未實裝（現時 corpus 冇；遇到先加 column split）
