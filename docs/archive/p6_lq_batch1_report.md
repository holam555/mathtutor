# P6 LQ Batch 1 — Extraction Report

**Source folder**: `_lq_input:/p6/` (note: trailing-colon folder name is an iCloud sync artifact, files are findable normally)

**Output**: `supabase/seed_p6_lq_batch1.sql`

## Summary

| | Count |
|---|---|
| LQ Q+A screenshots provided | 12 |
| **Cleanly extractable** | 7 LQs (from 6 screenshots) |
| **Need re-screenshot** | ~15-20 LQs (across 5-6 dense multi-LQ screenshots — text too small) |
| Image candidates provided | 15 |
| **Matched to extracted LQs** | 3 (HIGH confidence) |
| **Orphan images** (likely match the unreadable LQs) | 12 |
| Skipped folder (`折線圖/`) | 5 screenshots — per your direction |

## ✅ Extracted LQs (7)

| # | Topic | Question summary | Answer | Image |
|---|---|---|---|---|
| LQ01 | P6 U1 小數除法 | 西米 15÷8 | 1.875 公斤 | — |
| LQ02 | P6 U1 小數除法 | 綠茶 3.6 是豆奶 0.24 幾倍 | 15 倍 | — |
| LQ03 | P6 U1 小數除法 | 30 元買 $4.70 膠紙最多幾卷 | 6 卷 餘 1.8 元 | ✓ HIGH `16.47.54.png` ($4.70 tape) |
| LQ04 | P6 U1 小數除法 | 0.65 米正方形紙鋪 2.1×0.65 米告示板 | 4 張（需進位） | — |
| LQ05 | P5 U18 平均數 | 射擊遊戲 6 槍平均分 | 45 分 | — (target rings already in screenshot) |
| LQ06 | P5 U18 平均數 | 茬言英/數小測 (a)(b) | 48 分 / 不可以 44 分 | ✓ HIGH `16.48.30.png` (小測表) |
| LQ07 | P6 U6 容量和體積 | 容器半滿 + 3cm 正方體最多放幾個 | 88 個 餘 24 cm³ | ✓ HIGH `16.49.00.png` (25cm 容器) |

### Topic distribution

| Unit | Count |
|---|---|
| P6 U1 小數除法 | 4 |
| P5 U18 平均數 (cross-grade) | 2 |
| P6 U6 容量和體積 | 1 |

## ⚠ Unreadable screenshots — please re-screenshot

These contain 3-4 LQs packed onto one page at small zoom. Transcribing risks hallucination. Re-screenshot **one LQ per image** (or at higher zoom showing 1-2 LQs max):

| Screenshot | What I can vaguely see | Likely matched orphan images |
|---|---|---|
| `16.41.19.png` | 4 LQs: 柳橙汁 / 保鮮盒 / 梯形面積 / 甲池乙池排水 | `16.47.59` 梯形, `16.48.02` 的士收費表 |
| `16.41.32.png` | 3 LQs: 涼茶店 / 子珊買盒 LCM / 餅乾連包裝盒 | — |
| `16.42.53.png` | 3 LQs: 蛋糕款式平均 / 三角形梯形面積 / 跑步 | `16.48.18` 蛋糕款式銷量 |
| `16.45.46.png` | 3-4 LQs: 露天魚缸 / 360 mL / 長方體體積 / 木盒 | `16.48.34` 18×14×12, `16.48.36` 20×4×8, `16.48.38` cube into 20cm, `16.48.42` 27×27×42 |
| `16.45.52.png` | 3 LQs: 玩具車排水 / 量杯量取 | `16.48.44` 2L beaker, `16.48.46` 玩具車 |
| `16.45.58.png` | 3 LQs: 玻璃缸放珠 / 木盒水滿 | `16.48.49` 200mL 珠, `16.48.54` 18×10×2.5, `16.48.57` 木盒 30×14×7 |

**Estimated additional LQs** if you re-screenshot: ~15-20.

## How `image_url` was populated

The SQL writes `image_url = 'local:_lq_input/p6/images/<filename>'` — that's a **placeholder string**, not a valid Supabase Storage path. After applying the seed, you have two options:

1. **Lazy path**: open `/admin/long-questions/<id>` and re-upload the image via the existing image field — saves the real storage path
2. **Bulk path**: upload all images to Supabase Storage `past-papers/long-question-images/`, then run an UPDATE to replace `local:…` with the real path

LQs without a matched image have `image_url = NULL`.

## What this proved about the workflow

✅ Single-LQ or 2-LQ-per-image screenshots transcribe reliably
✅ Semantic image matching works when chart titles / numbers / objects in the image appear in question text (all 3 matches were HIGH confidence)
✅ Cross-grade topic mapping continues to work (LQ05/LQ06 → P5 U18 despite being from a P6 paper)
✅ Multi-step LQ model answers with sub-parts (a)(b) capture verbatim

⚠ Dense multi-LQ-per-page screenshots (4 LQs at small zoom) are not reliably readable — would need either zoom-in re-screenshots or a per-LQ crop

## Recommendation for the rest

For the 6 unreadable screenshots: take screenshots **one LQ at a time** (or 2 LQs max per image). Drop them in the same `_lq_input:/p6/` folder. The matched orphan images will then bind correctly via semantic match.

The 12 orphan images stay in `_lq_input:/p6/images/` — no action needed; they'll be picked up when the matching LQs become readable.
