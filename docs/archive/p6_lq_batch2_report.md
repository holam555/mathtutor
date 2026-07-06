# P6 LQ Batch 2 — Re-screenshot Extraction Report

**Source folder**: `_lq_input:/p6/p6a rescreenshot/`
**Output**: `supabase/seed_p6_lq_batch2.sql`

## Summary

| | Count |
|---|---|
| Re-screenshots provided | 20 |
| **Extracted** | 20 LQs (100% clean) |
| Orphan images from batch1 | 12 |
| **Now matched (HIGH confidence)** | 11 |
| **Still unmatched** | 1 (`16.48.30` 小測表 — already matched in batch1 to LQ06) |

The one-LQ-per-screenshot format worked perfectly — every page was readable, every answer traceable.

## ✅ All 20 LQs (batch2: LQ08–LQ27)

### P6 U1 小數除法 (5 LQs)

| # | Question | Answer | Image |
|---|---|---|---|
| LQ08 | 4 個橙 12.8 元 → 7 個 | 22.4 元 | — |
| LQ09 | 蛋糕 0.94 vs 一打西餅 0.84 | 0.87 公斤 | — |
| LQ11 | 的士車費 2 km + 6.4 km | 78.4 元 | ✓ `16.48.02.png` |
| LQ12 | 8 升杏仁茶 ÷ 0.75 升瓶子 | 11 個 (需進位) | — |
| LQ13 | 16 元 ÷ 5 角硬幣 (a)(b) | 32 個 / 缺點解釋 | — |

### P5 U7 多邊形的面積 (1, cross-grade)

| # | Question | Answer | Image |
|---|---|---|---|
| LQ10 | 梯形面積 (1.2+2.4)×1.35÷2 | 2.43 平方米 | ✓ `16.47.59.png` |

### P5 U18 平均數 (4, cross-grade)

| # | Question | Answer | Image |
|---|---|---|---|
| LQ14 | 5 款蛋糕平均銷量 | 32 個 | ✓ `16.48.18.png` |
| LQ15 | 6 人平均身高 | 142.3 cm | — |
| LQ16 | 投籃反求最後一次 | 34 分 | — |
| LQ17 | 跑步反求一天 | 3.1 km | — |

### P6 U6 容量和體積 (10 LQs)

| # | Question | Answer | Image |
|---|---|---|---|
| LQ18 | 18×14 水深 5 cm | 1.26 L | ✓ `16.48.34.png` |
| LQ19 | 360 mL → 水深 | 4.5 cm | ✓ `16.48.36.png` |
| LQ20 | 20cm 正方體盒 + 4×2×5 積木 | 200 塊 | ✓ `16.48.38.png` |
| LQ21 | 木箱厚壁容量 (扣內尺寸) | 12.5 L | ✓ `16.48.42.png` |
| LQ22 | 量杯 1400 + 3 塊 17 cm³ | 1451 cm³ | ✓ `16.48.44.png` |
| LQ23 | 2 輛玩具車排水 | 150 cm³/輛 | ✓ `16.48.46.png` |
| LQ24 | 量杯 + 8 玻子求原水量 | 100 mL | ✓ `16.48.49.png` |
| LQ25 | 摩天輪排水 (18×10×2.5) | 450 cm³ | ✓ `16.48.54.png` |
| LQ26 | 56 粒波子水位上升 | 1 厘米 | — |
| LQ27 | 木箱 + 玻璃珠最少幾粒溢出 | 7 粒 | ✓ `16.48.57.png` |

## Image matching — 11/12 orphans bound

| Image | Match | Confidence |
|---|---|---|
| `16.47.59` (梯形) | LQ10 (梯形面積) | ✓ HIGH — same 1.2/2.4/1.35 dimensions |
| `16.48.02` (的士收費表) | LQ11 (的士車費) | ✓ HIGH — same fare values |
| `16.48.18` (蛋糕銷量) | LQ14 (蛋糕平均) | ✓ HIGH — same table values |
| `16.48.34` (18×14×12) | LQ18 (1.26 L) | ✓ HIGH — same dimensions |
| `16.48.36` (20×4×8) | LQ19 (360 mL) | ✓ HIGH — same box |
| `16.48.38` (20cm + 5×4×2 cube) | LQ20 (200 塊) | ✓ HIGH — same setup |
| `16.48.42` (27×27×42) | LQ21 (12.5 L 厚壁) | ✓ HIGH — same outer dimensions |
| `16.48.44` (2L 量杯) | LQ22 (1451 cm³) | ✓ HIGH |
| `16.48.46` (玩具車 displacement) | LQ23 (150 cm³/輛) | ✓ HIGH |
| `16.48.49` (200mL + 珠) | LQ24 (100 mL) | ✓ HIGH |
| `16.48.54` (water + box 18×10) | LQ25 (摩天輪 450 cm³) | ✓ HIGH |
| `16.48.57` (木盒 30×14×7) | LQ27 (玻璃珠 7 粒) | ✓ HIGH |

## Combined totals (batch1 + batch2)

| Topic | Count |
|---|---|
| P6 U1 小數除法 | 9 (4 + 5) |
| P6 U6 容量和體積 | 11 (1 + 10) |
| P5 U18 平均數 (cross-grade) | 6 (2 + 4) |
| P5 U7 多邊形的面積 (cross-grade) | 1 |
| **Total LQs** | **27** |

## Difficulty distribution

| Tier | Count |
|---|---|
| basic | 1 (LQ22) |
| enhancement | 19 |
| advanced | 7 (LQ06, LQ07, LQ11, LQ17, LQ21, LQ24, LQ27) |

The "advanced" tag is for problems requiring 4+ steps or multi-stage reasoning (compound subtraction, reverse averaging, wall-thickness calculation, etc.). You can tweak per-question via `/admin/long-questions/[id]`.

## What to apply

```
1. supabase/seed_p6_lq_batch1.sql   (7 LQs, 3 images)
2. supabase/seed_p6_lq_batch2.sql   (20 LQs, 12 images)
```

Both are idempotent via `source_paper`. Apply in order.

After applying:
- `/admin/long-questions?grade=6` → 20 new entries (P6 U1 and P6 U6)
- `/admin/long-questions?grade=5` → 7 new entries (P5 U7, P5 U18)
- Re-upload the 15 matched images via each LQ's edit page to replace
  the `local:…` placeholders with real Supabase Storage paths.

## What's still untouched

- 折線圖/ folder (5 chart screenshots) — per your direction, defer
- No other folders need attention

The bulk extraction recipe is validated. 27 LQs across 4 topic units, all with verbatim model answers, 15 image-attached LQs ready for upload.
