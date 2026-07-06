# 圖片抽取＋綁定題目 — 失敗診斷 + 新 approach（草稿，等 review）

> 目標：畀 AI 睇一版完整 past paper，可靠咁 (1) 判斷邊題有圖 (2) 喺頁面 crop 出嚟
> (3) bind 返去啱嘅題目，最後令 image-dependent 題目可以入庫。
> 本文件係 **診斷 + 提案**，未寫 pipeline。任何 build 都會喺 scratch/scripts 做，
> 唔掂 live DB。

---

## Part 1 — 過去三次嘗試同失敗模式（有佐證）

### 嘗試 A：Sprint 4 one-shot Gemini bbox（live code，而家仲喺度）

位置：`src/lib/gemini.ts` `extractQuestionsFromImages()` + `src/app/api/past-paper/upload/route.ts:104-140`

做法：一個 Gemini 2.5 Flash call 同時做晒「transcribe 全部題目 + 分類 + 判斷 has_image +
輸出 `image_region` percent bbox」，之後 server 用 sharp 照 bbox crop。

點解失敗：

1. **Percent bbox 唔係 Gemini 嘅 native detection 格式。** Gemini 2.x/2.5 嘅 object
   detection 係訓練成輸出 `box_2d = [ymin, xmin, ymax, xmax]`，normalized 0–1000。
   我哋個 prompt 要佢輸出自創嘅 `{x, y, w, h}` percent 格式，等於放棄咗佢 detection
   訓練，變成「靠估」。VLM freeform 估 spatial percentage 出名唔準。
2. **一個 call 做太多嘢。** Transcription、答案、分類、localization 全部迫入一個 JSON
   —— attention 分薄咗，bbox 質素進一步跌。
3. **Crop 完全冇 verification。** Crop 出嚟嘅嘢從來冇畀任何人／model 覆核「係咪真係呢題
   嘅圖、圖完唔完整」。`route.ts:136` 仲係 `catch {}` silent swallow —— crop 失敗
   靜靜雞變 `image_url = null`，冇人知。
4. Binding 係 implicit（bbox 掛喺題目 object 上面），dense page 一錯位就全錯，冇任何
   cross-check。

結果：crop 唔準（切爛圖／crop 到隔離題）、漏圖，老師喺 ReviewForm 只可以人手重新上載。

### 嘗試 B：人手 crop + semantic match（`docs/lq_seed_workflow.md`，現行 LQ 流程）

做法：用戶人手 crop 每張 diagram 放 `_lq_input/p<N>/images/`，AI 再靠
「檔名 Q-number hint → 唔得就 semantic content match（圖入面嘅字/數字 vs 題目文字）」
配對，出 HIGH/MEDIUM/LOW confidence。

實際結果（見 `docs/archive/p6_lq_batch1_report.md` / `p6_lq_batch2_report.md`）：

- Batch1：15 張圖只有 3 張配到（HIGH），**12 張 orphan** —— 因為 dense
  multi-LQ 頁面「too small to read」，題目文字都抽唔出，semantic match 冇嘢可以 match。
- 要用戶**逐題重新 screenshot 一次**（batch2 嘅 20 張 rescreenshot）先至配返 11/12
  —— 即係成個流程要人手做兩輪先 work，工作量 ~2×。
- Semantic match 只喺「圖入面嘅數字/標籤 verbatim 出現喺題目文字」先係 HIGH（梯形
  1.2/2.4/1.35 嗰種）。**冇共用數字嘅圖（裝飾圖、純圖表、幾何示意圖）就係 LOW／配唔到**；
  同類圖多過一張（P6 U6 十條容積題全部係長方體示意）就有配錯風險。
- 人手 crop 本身就係 bottleneck —— 呢步唔自動化，成個目標都達唔到。

### 嘗試 C：p6aa Word 檔 embedded media 抽取（`docs/archive/p6aa_extraction_report.md`）

做法：`.doc → .docx → unzip → 30 個 .wmf → png`。

結果：抽圖係得嘅（Word 源頭嘅圖 = 完美 crop，唔使 vision），但 30 個 WMF 大部分係
inline 數學符號（分數、圈圈 bullet），只有 ~7 個係真 diagram，靠 file size >30KB
呢啲粗糙 heuristic 過濾；而且**冇 binding 機制** —— 邊個 WMF 屬邊題完全冇做。
Image-essential 題（該卷 ~17%）照舊 SKIP。

### 根本原因（三次共通）

> **三次全部將 binding 當成「語義配對」問題（圖嘅內容 vs 題目文字），
> 但佢其實係「頁面幾何」問題。**

喺一版卷上面，一張圖屬於邊題，係由**位置**決定：圖一定喺該題題號開始、下一題題號
之前嘅 vertical band 入面（睇 `_lq_input:/p6/p6a/Screenshot ...16.41.19.png` 呢版：
⑭⑮⑯⑰ 四題，每題嘅圖都喺自己 band 嘅右側）。語義配對係捨易取難 ——
放棄咗頁面上免費、確定性嘅 geometry 訊號，去猜兩個 lossy channel（transcribed text
vs image content）嘅交集。所以先會出現「同類圖分唔開」「冇共用數字配唔到」呢啲失敗。

另外兩個共通缺陷：

- **冇 verification loop** —— 冇一步係攞住 (crop, 題目) pair 獨立覆核。
- **冇 eval set** —— 每次改方法都冇得量度有冇進步。

---

## Part 2 — 新 approach（提案）

### 設計原則

1. **Binding 由 geometry 決定，semantic 只做 verifier。** 配對唔再係猜，係計。
2. **三件事分三個 pass**（localize / transcribe / verify），每個 pass 輸出窄。
3. **兩個獨立 detector 互相 cross-check** —— 一致先算高信心。
4. **每個 binding 有 confidence score + 人手 gate**，高信心先可以 pre-tick，
   永遠唔會未經肉眼確認就入庫（硬性要求）。

### Pipeline（5 步）

```
page image ──┬─ Step 1  CV figure detection（sharp/OpenCV，唔用 LLM）
             │          binarize → morphological dilate → connected components
             │          → filter（size / aspect / ink density / 唔似 text-line）
             │          → tight bbox per figure candidate
             │
             ├─ Step 2  Anchor detection（Gemini native detection 格式）
             │          淨係問一件事：「搵出所有題號 token（1./⑭/Q3/(a)）嘅
             │          box_2d [ymin,xmin,ymax,xmax] 0-1000」
             │          → 每題一個 vertical band（支援雙欄：先 detect column split）
             │
             ├─ Step 3  Structural binding（純計算，零 AI）
             │          figure bbox ∈ 邊個 band → 屬邊題。
             │          Edge cases：跨 band 嘅圖（罰 overlap ratio）、
             │          band 內多過一張圖（全部 bind 落同一題或 sub-questions）、
             │          group_id 共用 setup 圖。
             │
             ├─ Step 4  Verification pass（獨立 fresh VLM call，每個 pair 一次）
             │          input:  crop + 該題 transcribed text（transcription 係
             │                  另一個現成 pass，即係現行題目抽取）
             │          output: { belongs: yes/no, essential: 必需/裝飾,
             │                    alt_text, labels_seen: [...] }
             │          機械 cross-checks：
             │          • label overlap：crop 入面 OCR 到嘅數字 vs 題目文字
             │          • conservation：頁面 figure 數 vs has_image 題數，唔對數
             │            即 flag（捉「漏圖／多圖」）
             │
             └─ Step 5  Human contact sheet（沿用 _lq_input: 入面已證實好用嘅
                        preview HTML pattern）
                        每行：crop thumbnail｜題目文字｜confidence｜verifier 理由
                        ✅ AUTO（geometry 唯一 + verifier yes + label overlap）pre-tick
                        ⚠️ 其他一律要人剔
                        → 剔咗嘅先生成 seed SQL（local: placeholder，行返
                          scripts/upload_lq_images.ts 現有 plumbing）
```

### Confidence scoring（binding 級別）

| 分數 | 條件 |
|---|---|
| **AUTO**（pre-tick） | band 內唯一 figure + figure 完全喺 band 內 + verifier belongs=yes + label overlap ≥1 個數字 |
| **HIGH** | geometry 唯一 + verifier yes，但冇 label overlap（裝飾圖常見） |
| **REVIEW** | geometry 有歧義（跨 band / band 多圖）或 verifier 唔肯定 |
| **REJECT** | verifier belongs=no，或 conservation check 唔對數 |

配錯題係最大失敗模式，所以規則係：**要兩個獨立訊號（geometry + semantic verifier）
同時同意先出 AUTO**；single-signal 一律人手。

### 點解呢個 approach 應該得

- Step 1 用 CV 而唔係 LLM：試卷嘅圖係白底 line-art，四圍 whitespace，connected
  component 搵出嚟嘅 bbox 係 pixel-tight，直接解決「crop 唔準」——
  完全冇 hallucination 空間。sharp 已經係 project dependency。
- Step 2 只叫 Gemini 做佢 native 訓練過嘅嘢（detection 格式 box_2d 0-1000），
  而且題號係高對比、規則性極強嘅 token，係 detection 最易嘅 case。
- Step 3 零 AI —— binding 本身變成確定性計算，semantic 錯配呢類 failure mode
  structurally 消失。
- Step 4/5 保證「唔可以配錯題」硬性要求：AI 只能提名，唔能夠入庫。
- Word 源頭嘅卷（`past paper in word/`）行 Attempt C 路線攞完美圖，
  再入同一個 Step 3-5 binding + verification —— 兩條入口，一套驗證。

### 現成 eval set（唔使搵新數據）

`_lq_input:/` 有齊原始 dense pages，而 batch1/2 report + 現有 seed SQL 記低咗
**~15 對人手驗證過嘅 figure↔question binding**（例：`16.47.59.png`↔LQ10 梯形、
`16.48.02.png`↔LQ11 的士）。攞返啲原始頁面行 pipeline，量度：

1. **Binding precision**（最重要）：配咗嘅 pair 有幾多係啱 —— 目標 100%，
   錯嘅一定要跌入 REVIEW/REJECT，唔可以以 AUTO/HIGH 出現
2. **Recall**：15 對 ground truth 捉返幾多
3. **Crop quality**：CV bbox vs 人手 crop 嘅 IoU
4. **Conservation check 靈敏度**：故意刪一張圖，睇 flag 唔 flag 到

### 分階段交付

| Phase | 內容 | 產出 | 掂唔掂 DB |
|---|---|---|---|
| **1. 實驗** | 喺 scratch 寫 detection + binding 腳本，行 eval set | metrics report 畀你睇 | ❌ 完全唔掂 |
| **2. 工具化** | `scripts/extract_figures/` CLI：input 頁面 folder → output crops + contact sheet + draft seed SQL | 可以攞嚟做 P5 43 條 inactive image questions 同 折線圖/行程圖 deferred folders | ❌ 只出 SQL 草稿，人 apply |
| **3.（可選）** | 接入 past-paper upload route，取代而家嘅 percent-bbox crop | 家長上載都受惠 | PR review 先郁 |

### 未解問題（想聽你意見）

1. **裝飾圖政策**：好似「四個橙」「蛋糕」嗰啲唔影響作答嘅插圖 —— 入埋庫（無害，仲靚）
   定係 verifier 標 essential=false 就唔入？我傾向**入埋**（present 靚啲），但入唔入由
   contact sheet 剔選決定。
2. **手影相 vs screenshot**：eval set 全部係 screenshot（正、無 skew）。家長影嘅相
   會歪。Phase 1 先做 screenshot/PDF；photo deskew（perspective correction）留到
   Phase 3 先加，避免一開始 scope 爆。
3. **折線圖/行程圖 folders**（P6 deferred 嘅 5+3 張）：chart-essential 題係呢個
   pipeline 嘅直接受益人，建議做 Phase 2 嘅 acceptance test。
