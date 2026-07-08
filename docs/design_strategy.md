# 設計策略 — 公開 marketing surface（landing + /resources）

> 撰寫：2026-07-07（Fable session，設計 + 實作咗第一版）。
> 讀者：之後接手嘅模型（Opus）同人類。呢份 doc 係公開頁設計嘅 owning file；
> **學生 app 內部 UI 規範係另一樣嘢**，owner 係 CLAUDE.md「🎨 學生 UI 設計規範」章節，唔好喺度重複佢。
> SEO/內容策略 owner 係 [seo_strategy.md](seo_strategy.md) — 呢度只講「點樣着衫」，唔講「賣乜」。

---

## 1. 定位：兩個 surface，一套品牌

| Surface | 目標用戶 | 目標行為 | Owner |
|---------|---------|---------|-------|
| **公開 marketing**（`/`、`/resources`、`/resources/[grade]/[slug]`） | 未登入嘅香港家長（手機為主）+ 搜尋引擎 / AI crawler | 明白 app 係乜 → 做免費評估（主轉化）→ 註冊 | 呢份 doc |
| **App 內部**（/student /parent /assessment） | 已登入用戶 | 練習、跟進 | **視覺語言**（色板、paper 底、卡片樣式）跟呢份 doc §2＋§6；**學生 UX 鐵律**（零負面語言、teal primary、56px 選項、數字鍵盤）跟 CLAUDE.md 設計章節 — 兩份唔衝突，一個管「著咩衫」一個管「點互動」 |
| **Admin**（/admin） | 老師 | 管理 | 功能優先，**唔喺 reskin scope**（2026-07-08 決定） |

公開頁嘅設計原則：**家長要喺 10 秒內明白「呢個 app 幫小朋友搵數學弱項、對準嚟練」**。
所有 section 都服務呢句話。

## 2. 視覺語言 —「楓葉練習簿」美學（2026-07-08 第二版）

Landing page（`src/app/page.tsx`）用「香港數學練習簿 × 手繪楓葉」隱喻。第一版
（highlighter + 分欄 hero）同用戶另一個 app 'otsheet' 太似，2026-07-08 重設計成
現版。**個 logo 本身係手繪 crayon 風（橙楓葉 + 墨綠書本）— 呢個手繪感就係
差異化來源**，所有裝飾筆觸都要似「人手畫喺練習簿上」。

### 色板（logo 取色 — 語義固定，唔好調轉用）

| Token | Hex | 語義 |
|-------|-----|------|
| 楓葉橙 | `#E8792F`（hover `#D96820`，gradient 淺端 `#F08A3C`） | **行動**：primary CTA、accent link、AI 標籤 |
| 書本墨綠 | `#1F4D36`（gradient 深端 `#2D5A3D`） | **信任**：所有 h1/h2 標題、final CTA panel 底色 |
| 品牌青綠 | `#1D9E75` | **成功／成長**：app 內 primary button、✓、進度、格仔紙格線 |
| 鼓勵 amber | `#EF9F27` | 「建議加強」／答錯提示 — **永遠唔用紅色**（零負面語言） |
| 輔助 blue | `#4A90E2` | 第三性 accent（老師角色、圖表第三色） |

### 簽名元素

- **格仔紙 background**：`globals.css` 嘅 `.paper-grid`（公開頁，有 dark variant）
  同 `.paper-grid-light`（app portal，light-only）。
- **手繪橙圈**：hero 重點詞「先要補啱位」由 inline SVG path 圈住（stroke `#E8792F`、
  linecap round、起筆收筆故意唔閉合 — 手繪感）。取代咗第一版嘅 highlighter 斜間。
- **概念方程式 strip**（hero 記憶點）：`[🔍 搵弱項] ＋ [🎯 對準練] ＝ [⭐ 升分]`
  三張微微 rotate 嘅 sticker chip（綠 ring／橙 ring／墨綠實底），用「一條數」講價值主張。
- **浮動數學符號**：`÷ ¾ % × π` 超大 glyph，opacity 0.07–0.09（dark ×2），`aria-hidden`。
- **診斷報告 mock card**（而家喺 hero 下面嘅 showcase section，唔再喺 hero 分欄）：
  rotate 白卡 + 橙影卡。**內容係裝飾性示意** — 三個單元名已用 `t()` 包（EN mode 會翻譯），
  唔係真數據。
- **楓葉 🍁**：badge 前綴 + final CTA panel 嘅大型半透明裝飾。用得少先有效。
- **字體**：Nunito（layout 已有 `next/font`），中文行 system font。冇加新字體 — 中文主導嘅
  page，個性靠色彩/構圖/隱喻嚟，唔靠 Latin display font。
- **Dark mode（2026-07-08 加）**：Tailwind `darkMode` 冇設定 = v3 default `media`
  （跟 OS `prefers-color-scheme`，冇 toggle）。格仔紙背景係 `globals.css` 嘅
  `.paper-grid` class（light `#FBFAF5` / dark `#101613`，dark 格線 opacity 加倍先睇到）。
  Landing 全部 section 有 `dark:` variants；**logo 用 `mixBlendMode: multiply`，dark 底會隱形
  — 一定要包喺 `dark:bg-[#FBFAF5]` 嘅光色 chip 入面**（header + footer 兩處）。
  App 內部 portal 照舊 light-only，唔好擴散。
- **AI 定位（2026-07-08 加）**：landing 明示 AI — hero badge「AI 智能診斷」、
  副文案「免費 AI 學前評估」、step 2「AI 診斷報告」、feature #1「AI 智能出題」、
  mock card 標籤「AI 即時生成」。誠實邊界：AI 實際用喺分析/出題（Gemini），
  唔好吹噓成「AI 老師」。

呢套語言將來做 `/faq`、blog、og.png 都要跟：paper 底 + 格仔 + teal 墨 + amber 螢光筆。

## 3. Landing page 結構（`src/app/page.tsx`，2026-07-08 版）

由上到下，每個 section 嘅任務：

1. **Header**：logo（dark mode 要包光色 chip）+ 免費資源（`hidden sm:block`）/
   登入（anchor 去 `#login`）/ 免費評估（**橙** CTA）。
   ⚠️ mobile 要 `pt-14` 避開全站 fixed top-centre 嘅 `LanguageToggle` pill。
2. **Hero（置中式，唔係分欄）**：🍁 badge → 墨綠大標題 + 手繪橙圈 → 副文案 →
   **概念方程式 strip**（見 §2 簽名元素）→ 雙 CTA（橙 primary / 白 secondary）→
   三個 ✓ trust chips。**唔好改返做左右分欄 SaaS hero — 嗰個係 otsheet 撞樣問題嘅根源。**
3. **AI 診斷 showcase**：左邊 h2「AI 即時診斷，一眼睇晒強弱」+ 三點 ✓ list，
   右邊診斷報告 mock card（由第一版 hero 搬落嚟）。
4. **三步 how-it-works**：超大 `01 02 03` 數字水印，橙／綠／橙相間。
5. **五格 features**：AI 智能出題 / 錯題追蹤 / 模擬考試 / Past Paper 題庫 / 星星獎勵
   （單數卡時最後一張 `sm:col-span-2` 排滿行），下面 dashed amber callout 講零負面語言。
6. **免費學習指南**：由 `src/content/unitGuides/registry.ts` 攞**array 頭 4 篇**
   （array 順序 = featured 順序，registry 有註釋）— 加新 guide 自動出現，唔使改 page.tsx。
7. **`#login` 角色入口**：三張角色卡（學生/家長/老師）+ 註冊 link。
8. **Final CTA**：墨綠 gradient panel + 兩塊半透明 🍁 + **橙**按鈕。
9. **Footer**（真實聯絡：電話 `+852 5601 1931`、WhatsApp、Instagram `@lf.academy.hk`
   — 同時喺 `src/app/layout.tsx` JSON-LD 有 `telephone`/`contactPoint`/`sameAs`，
   改聯絡方法要兩邊一齊改）。

已登入用戶照舊 redirect 去角色首頁（page 頂嘅 redirect 邏輯冇郁）。

## 4. 文案 voice

- 廣東話書面語，同 app 內一致（「唔使」「搵出」「操卷」）。對象係家長，唔係小朋友。
- 賣點次序：**診斷（補啱位）> 免費 > 方便**。唔好賣「題目多」— band1/p1-p6 嗰啲
  下載站先係鬥量；我哋 differentiator 係智能診斷（見 seo_strategy.md §6.5）。
- 所有 UI 文字跟 [i18n_conventions.md](i18n_conventions.md) 用 `t()` 包 + dict entry
  （marketing 文案都係 UI chrome）。Guide 內文係 content，**唔包 `t()`**。

## 5. 點樣延伸（Opus 接手指南）

- **加一篇 unit guide** = 用 skill `seo-content-page`（本機 `.claude/`，gitignored —
  搵唔到就問用戶，唔好重造）；純 code 層面只需要喺 registry 加 entry，
  route/sitemap/check_seo/landing 全部自動派生。
- **改 landing 文案**：改 `page.tsx` 嘅 `t()` string + `src/lib/i18n/dict.ts` 同步改 key，
  跑 `node scripts/check_i18n.mjs`。
- **驗證程序**（每次改公開頁）：`npx tsc --noEmit` → `npx next lint` →
  `node scripts/check_i18n.mjs` → `node scripts/check_seo.mjs` → `npx next build`
  → preview 實睇（mobile 375px 一定要睇，記住 LanguageToggle 遮擋問題）→ skill `seo-audit`。
- **設計未做 / backlog**（roadmap owner 係 seo_strategy.md §8–9，呢度只列設計相關）：
  - `public/og.png` **已存在**（1200×630，2026-07-06 版，白底 flat 風格）— backlog 係
    **restyle** 佢跟 §2 視覺語言（paper + 格仔 + amber 螢光筆），唔係新建
  - `/faq` 頁 — 用 guide page 嘅版式（breadcrumb + answer-first + FAQPage schema）
  - Blog 版式 — 起稿時直接抄 guide page 嘅 article 樣式
  - Hero 報告 mock 將來可以考慮換做真報告截圖（要先問用戶攞消毒版）

## 6. App portal 一致性規則（2026-07-08 起）

Portal（student / parent / assessment / login / signup）reskin 跟以下規則，
將來加新 portal 頁都要跟：

1. Page 背景一律 `paper-grid-light`（唔跟 OS dark mode — portal 係 light-only，
   dark mode 只屬公開頁）。
2. 頁面／section 標題 `text-[#1F4D36]`（墨綠），body 文字照舊 gray。
3. 卡片統一：白底、`rounded-2xl`、`ring-1 ring-gray-900/5`、
   `shadow-[0_1px_3px_rgba(16,24,40,0.08)]`。
4. **Primary button 喺 portal 內維持 teal `#1D9E75`**（學生已建立嘅心智模型 +
   CLAUDE.md 鐵律）；橙 `#E8792F` 只做 accent（連結、強調 chip、家長上載入口）。
5. 印刷版面（mock-exam LQ A4、print-exam、ExamPaperSheet）**完全唔郁** — 要乾淨黑白。
6. `UnifiedKeyboard.tsx`、評分邏輯、i18n 機制唔屬 reskin 範圍。

## 7. 本次實作驗證紀錄（2026-07-07）

- tsc / lint / check_i18n / check_seo 全過（check_seo 0 error；唯一 warning 係
  `NEXT_PUBLIC_APP_URL` 未設 — 已知前置，見 seo_strategy.md §3.1）。
- Preview 實測：desktop + mobile 375px、zh + EN 兩個 lang、`/resources/p6/百分數應用`
  新 guide 渲染齊全。
