# extract_figures — 圖片抽取 + 幾何綁定（Phase 1 實驗版）

> 背景、失敗診斷、成個 approach：見 `docs/figure_extraction_diagnosis.md`。
> 呢個係 Phase 1 實驗 script — **零 AI、零 DB**，純 CV。

## 用法

```bash
node scripts/extract_figures/detect.js "<page image>" [--out <dir>] [--threshold 180]
```

每版 page 輸出（default `out/<name>/`）：

| 檔案 | 內容 |
|---|---|
| `candidates.json` | anchors（題號圈位置）、figure candidates（bbox + band binding + pinkRatio） |
| `annotated.png` | 原頁 overlay：紅框 F#（figure→band）、藍框 A#（anchor）、綠虛線（band 分界）— 畀 Claude / 人肉眼 verify 用 |
| `crop_F#.png` | 每個 figure candidate 嘅 tight crop（pad 6px） |

## 做緊乜（三步，全部確定性計算）

1. **Figure detection** — binarize → connected components → large-CC seeds
   + tinted-panel seeds（淺色底表格）→ merge 附近 CC（圖嘅尺寸標籤會併入）
   → filter（填充橫線 / 粉紅答案 blank / 全頁 frame）
2. **Anchor detection** — 左 margin 搵題號圈：空心 + 深色 + 唔飽和 +
   **bbox 四角冇墨**（圓形幾何；中文字筆畫會伸到角落）
3. **Binding** — figure 中心 y 落喺邊個 anchor band 就屬邊題

## Phase 1 eval 結果（2026-07-06）

against batch1/2 report 嘅人手 ground truth（`docs/archive/p6_lq_batch*_report.md`）：

- 肉眼核對 10 對 binding：**10/10 啱，0 配錯**
- Essential figures recall（核對過嘅頁面）：100%
- 已知殘留 noise（全部由 Step 4 verifier / Step 5 human gate 吸收，見 doc）：
  - 中文字偶然滑過 corner test → false anchor；但 false anchor 只會將
    同一題 split 成兩個 band，唔會令圖跌落第二題 —— 最後 band→題號
    一步係讀圈內數字（Claude/verifier），所以 binding 唔受影響
  - 底線人名（雪欣、可琪…）merge 成 junk candidate → verifier reject
  - 一題多圖（before/after 量杯 pair）→ 需要 same-band merge policy（Phase 2）
  - Chart 喺題組上面嘅 shared-figure layout（折線圖/行程圖 folder）→
    「first-anchor 之前嘅圖 bind 落成個題組」rule（Phase 2）
  - 細圈 ①② style anchors（細 screenshot）recall 仲低 → Phase 2 tune

## Phase 2（未做）

CLI 化：input folder → 全部 page 行一次 → contact sheet HTML（crop + 題目文字
+ confidence 剔選）→ 剔完先生成 seed SQL（`local:` placeholder，行返
`scripts/upload_lq_images.ts` 現有 plumbing）。Acceptance test：折線圖/行程圖 folders。
