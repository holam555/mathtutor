# SEO + AI 推薦策略（GEO）— 霖楓學苑數學升分平台

> 目標：令網站在 (1) 傳統搜尋引擎（Google 為主）同 (2) AI 推薦（ChatGPT / Claude / Perplexity / Google AI Overviews）都被**頻繁搜尋到同引用**。
> 對象市場：香港小三至小六家長，繁體中文，關鍵詞環繞「呈分試 / past paper / 小學數學練習」。
> 撰寫：2026-07-05。Source of truth：呢份 doc。實作進度見文末 §9。

---

## 1. 現況診斷（先講痛點，因為策略要對症）

| 問題 | 影響 | 嚴重度 |
|------|------|--------|
| **成個 app 幾乎全部 gated（要登入）** — 公開可爬頁面只有 `/`、`/login/*`、`/signup/*`、`/assessment` | 搜尋引擎同 AI **冇內容可以 index / 引用**。一個補習 app 冇公開內容 = 永遠唔會排名或被 AI 引用 | 🔴 致命 |
| **冇 technical SEO 基礎** — 無 `metadataBase`、無 per-page metadata、無 `sitemap.xml`、無 `robots.txt`、無 JSON-LD、無 OG image | Google 爬得差、social 分享冇 preview、AI 引擎 parse 唔到結構 | 🟠 高 |
| **i18n 用 cookie（`lang`），唔係 path-based** | Google 只會見到一個語言版本；EN/中 唔會分別 index，hreflang 冇得做 | 🟡 中 |
| **首頁 logged-in 會 redirect** | 首頁本身 OK（未登入先見到），但要確保 crawler（未登入）見到有意義內容 + metadata | 🟡 中 |
| **production domain 未設定**（`NEXT_PUBLIC_APP_URL=localhost`） | 所有 canonical / OG / sitemap URL 都要靠呢個，未 set 就全部壞 | 🟠 高（前置） |
| **競爭對手已霸佔 SERP** — band1.org / p1-p6.com / s1-s6.com（免費 past paper 下載站）、學而思（補習中心） | 純靠品牌詞排唔到，要用內容差異化切入 | 🟡 中 |

**核心結論**：技術修補只係入場券。真正嘅增長槓桿係 **建立一層公開內容（public content surface）**。冇呢層，做幾多 meta tag 都無用 —— 因為根本冇嘢畀人 index。

---

## 2. 策略總覽 — 兩個引擎

```
                 ┌─────────────────────────────┐
                 │   公開內容層 (Content Layer) │  ← 最大槓桿，§4
                 │  免費資源 / 年級單元指南 / FAQ / Blog │
                 └───────────┬─────────────────┘
                             │ 餵料
              ┌──────────────┴───────────────┐
              ▼                              ▼
   ┌────────────────────┐        ┌────────────────────────┐
   │  傳統 SEO (Google)  │        │  GEO / AI 推薦          │
   │  §3 技術 + §4 內容   │        │  §5 (被 ChatGPT/Claude   │
   │  排名 → 自然流量      │        │  /Perplexity 引用)      │
   └────────────────────┘        └────────────────────────┘
```

兩個引擎共用同一批公開內容，但優化手法唔同：
- **傳統 SEO** 要 keyword、排名、backlink、Core Web Vitals。
- **GEO** 要「答案前置」、Q&A 結構、E-E-A-T 權威訊號、被高權威來源引用、俾 AI crawler 爬到。

---

## 3. Part A — 技術基礎（一次性、低風險、即刻做）

呢部分我已經幫你落咗一部分安全 code（見 §9）。以下係完整 checklist：

### 3.1 前置：設定 production domain
- **用戶決定（2026-07-08）：暫時用 Vercel 免費 domain，唔買自訂 domain。**
  行動：Vercel project → Settings → Environment Variables →
  `NEXT_PUBLIC_APP_URL=https://<project-name>.vercel.app`（以 Vercel dashboard 顯示嘅
  production URL 為準），然後 redeploy。將來升級自訂 domain 只需改呢個 env。
- `metadataBase` 用呢個 env，所有 canonical / OG / sitemap 先會正確 resolve。
- ⚠️ vercel.app subdomain 嘅 SEO 天花板較低（domain authority 屬 vercel.app），
  內容做起有流量後建議升級自訂 domain — 到時 Google Search Console 要重新 verify。

### 3.2 `robots.txt`（`src/app/robots.ts`）— ✅ 已建立
- **Allow** 公開頁；**Disallow** `/admin`、`/student`、`/parent`、`/api`、`/login`、`/signup`（gated / 私隱）。
- **明確 allow AI crawler**：`GPTBot`、`ClaudeBot`、`PerplexityBot`、`Google-Extended`、`OAI-SearchBot`、`Bytespider` —— 唔畀爬 = 唔會被 AI 引用。
- 指向 `sitemap.xml`。

### 3.3 `sitemap.xml`（`src/app/sitemap.ts`）— ✅ 已建立
- 只列**公開**頁。之後每加一篇資源 / blog，就要動態加入（見 §4 會變成 DB-driven）。

### 3.4 每頁 metadata
- Root layout：`metadataBase`、`title` template、`description`、`keywords`、`openGraph`、`twitter`、`alternates.canonical` — ✅ 已加強。
- 每個公開頁（`/assessment`、將來每篇資源）用 `generateMetadata()` 各自寫獨立 title（55–60 字內）、description（150–160 字）、canonical 指向自己。

### 3.5 JSON-LD 結構化資料（AI 同 Google 都靠佢 parse）— ✅ layout 已加 Organization + WebSite + EducationalOrganization
- **Sitewide**（layout）：`Organization` + `WebSite` + `EducationalOrganization`（補習社性質）。
- **Per-page**（將來）：
  - 資源 / 教學文 → `Article` + `HowTo`
  - 年級單元指南 → `Course` / `LearningResource`
  - FAQ 頁 → `FAQPage`
  - 麵包屑 → `BreadcrumbList`
- 用 `JSON.stringify` inline `<script type="application/ld+json">`，避免 escaping 問題。

### 3.6 OG image
- 整一張 1200×630 品牌圖（logo + 「香港小學數學升分平台」），放 `public/og.png`，layout `openGraph.images` 指住佢。或者用 Next.js `opengraph-image.tsx` 動態生成。

### 3.7 效能（Core Web Vitals — 排名因素）
- 已用 `next/font`（Nunito）+ `next/image` + `priority` on logo，底子好。
- 檢查點：LCP < 2.5s、CLS < 0.1。用 Vercel Analytics / PageSpeed Insights 定期睇。

### 3.8 i18n / hreflang（中期）
- 現況 cookie-based，Google 只 index 一個版本。
- **建議**：主打繁中 `zh-Hant`（市場就係香港家長），EN 版**唔係** SEO 重點。短期可以唔郁；如果將來要 EN 都 rank，就要改成 path-based（`/en/...`）+ `alternates.languages` hreflang。**現階段標記為 low priority**，唔好為咗 SEO 打爛現有 cookie 機制。

---

## 4. Part B — 公開內容層（**最大增長槓桿**）

> 呢個係整份策略最重要嘅一 part。冇公開內容，Part A 全部係空殼。

補習 app 唔應該淨係得登入牆。要起一層**免費、對家長有用、可被 index / 被 AI 引用**嘅內容。你手上已經有現成彈藥：**課程大綱（curriculum_units/topics）+ LQ 題庫 + past paper 分析能力**。

### 4.1 內容支柱（pillar）建議

| 支柱 | 頁面例子 | 目標關鍵詞 | 為何有效 |
|------|---------|-----------|---------|
| **A. 年級 × 單元 學習指南** | `/resources/p5/異分母分數加減` 逐個大單元一頁：概念講解 + 常見錯誤 + 3 條例題（可連去評估） | 「小五 異分母 分數 加減」「P5 數學 分數」 | 你有 19+17+13 個單元 = 幾十至上百頁長尾內容，直接由 curriculum 生成 |
| **B. 呈分試 / 考試準備** | `/blog/呈分試-數學-溫習策略`、「小六呈分試數學重點」 | 「呈分試 數學」「小五 呈分試 練習」 | 香港家長最高意圖搜尋詞，商業價值高 |
| **C. Past paper 相關** | `/resources/past-paper-數學-練習` + 免費模擬卷樣本 | 「小學 數學 past paper」「數學 試卷 下載」 | 直接對打 band1 / p1-p6，但你賣「智能診斷」而唔係純 PDF |
| **D. 家長 FAQ** | `/faq`：「小朋友數學差點算？」「網上數學練習有用嗎？」 | 長尾問句 = AI 引用金礦 | 問句式內容最易被 ChatGPT/Claude 引用 |
| **E. 免費學前評估（已有！）** | `/assessment` — 加 metadata + 內容說明 | 「免費 數學 評估」「數學 程度 測試」 | 你已經有呢個 killer feature，只係冇 SEO 包裝 |

### 4.2 內容產出模式（配合你 DB）
- 由 `curriculum_units` + `curriculum_topics` **動態生成**單元指南頁（server-rendered，可爬）。內容 = 概念 + 你 LQ 題庫抽 1–2 條示範 + 「立即免費評估」CTA。
- Blog 用 MDX 或簡單 DB table（`articles`），每篇針對一個家長問句。
- **每頁一定要 server-rendered（唔可以 client-only）**，`sitemap.ts` 動態 include。

### 4.3 GEO 寫法規範（每篇內容都跟）
1. **答案前置**：開頭 1–2 句直接答問題（AI 抽 snippet 就係抽呢度）。
2. **Q&A / 標題結構**：用 `<h2>` 問句，下面即刻答。
3. **具體、可驗證**：數字、步驟、例題 > 空泛描述。
4. **E-E-A-T**：署名（真人老師 / 補習社）、更新日期、「香港課程」明確定位。
5. 每篇底加 `FAQPage` schema。

---

## 5. Part C — GEO / AI 推薦（點樣俾 ChatGPT / Claude 引用）

根據 2026 研究：AI 轉介流量按年升 ~527%，AI 搜尋已佔英文資訊查詢 12–18%。各引擎引用習慣唔同：

| 引擎 | 引用偏好 | 對我哋嘅打法 |
|------|---------|-------------|
| **ChatGPT** | Wikipedia (47.9%) + 新聞 + **教育資源** | 做權威教育內容；爭取 Wikipedia / 教育目錄提及 |
| **Claude** | 高 Domain Authority 機構、穩定內容、避開 UGC | 砌 E-E-A-T、穩定 evergreen 內容（單元指南最啱） |
| **Perplexity** | Reddit (46.7%) + 90 日內新內容 | 保持內容更新；相關討論區出現（家長 forum） |
| **Google AI Overviews** | 傳統 SEO 排名高 + schema 清晰 | Part A + Part B 做好就會覆蓋 |

**GEO 行動清單**：
1. ✅ `robots.txt` 放行 `GPTBot` / `ClaudeBot` / `PerplexityBot` / `Google-Extended` / `OAI-SearchBot`（已做）。
2. 每篇內容跟 §4.3 寫法（答案前置 + Q&A + schema）。
3. 爭取被 **AI 常引用嘅來源**提及：香港教育目錄、家長 forum（BK Milk、親子王國）、學校資源列表。
4. 砌 `FAQPage` / `HowTo` / `Course` schema — AI parse 得最好。
5. 內容要「機構級可信」：真實補習社名、地址、聯絡、師資 → `EducationalOrganization` schema 填齊。

---

## 6. Part D — 本地 / 站外（off-page）

1. **Google Business Profile**（如有實體補習社）：本地搜尋 + Google Maps + 直接餵 Google 知識圖譜。
2. **香港教育目錄 / 家長平台**登記：親子王國、BK Milk、Timable、本地補習目錄 → backlink + AI 引用來源。
3. **內容 backlink**：免費資源 / 模擬卷值得被家長 blog、forum 連結。
4. **社群**：Facebook / IG 家長群組分享免費評估 → 品牌詞搜尋量上升（品牌搜尋係強 SEO 訊號）。
5. **差異化定位對打 band1 / p1-p6**：佢哋賣「PDF 下載」；你賣「免費智能診斷 + 個人化練習 + 升分追蹤」。內容一律強調呢個 differentiator。

---

## 7. 關鍵詞地圖（繁中，按意圖分）

| 意圖 | 關鍵詞例子 | 落地頁 |
|------|-----------|--------|
| 資訊型（高 GEO 值） | 「小五數學難點」「異分母分數點加」「呈分試數學溫習」「小朋友數學差點算」 | §4 資源 / blog / FAQ |
| 導航型 | 「霖楓學苑」「LF Academy 數學」 | 首頁（品牌 schema） |
| 商業型（高轉化） | 「小學數學補習」「網上數學練習」「數學 past paper 練習」「免費數學評估」 | 首頁 / `/assessment` / 資源 |
| 長尾 × 年級單元 | 「P3 數學 因數」「小六 百分數 應用題」…（幾十組） | §4.1(A) 動態單元頁 |

---

## 8. 優先次序 / Roadmap

| 階段 | 內容 | 工作量 | 誰做 |
|------|------|-------|------|
| **P0（即刻，已部分完成）** | domain 設定、robots.ts、sitemap.ts、layout metadata + JSON-LD、OG image | 半日 | Opus 可完成 |
| **P1（2 週內）** | `/assessment` SEO 包裝、`/faq` 頁（10 條家長問句 + FAQPage schema）、GA4 + Search Console + Bing Webmaster 接入 | 2–3 日 | Opus 可完成 |
| **P2（1 個月）** | 動態單元指南頁（由 curriculum 生成，先做 P5/P6 高流量單元）+ sitemap 動態化 | 1 週 | Opus / Fable 皆可 |
| **P3（持續）** | Blog（每週 1 篇呈分試 / 家長主題）、backlink outreach、Google Business Profile、監測 AI 引用 | 持續 | 人 + Opus 輔助 |

---

## 9. 實作進度（截至 2026-07-05）

**已落 code（安全、additive，唔影響現有邏輯）：**
- [x] `src/app/robots.ts` — 放行 AI crawler、擋 gated 路徑、指向 sitemap
- [x] `src/app/sitemap.ts` — 列公開頁
- [x] `src/app/layout.tsx` — `metadataBase`（讀 `NEXT_PUBLIC_APP_URL`）、keywords、openGraph、twitter、canonical + Organization/WebSite/EducationalOrganization JSON-LD

**2026-07-06 追加**：`/resources` 內容層基建（unit-guide registry + dynamic route + FAQPage/LearningResource schema）、`scripts/check_seo.mjs` 掃描、第一篇 guide（P5 異分母分數加減）。

**2026-07-07 追加**：
- [x] `/` 由純登入頁改成整版 marketing landing（§4.1(E) 嘅 SEO 包裝 + 首頁 internal links 去 /resources；設計規範見 [design_strategy.md](design_strategy.md)）
- [x] 第二篇 guide：P6 百分數應用（`/resources/p6/百分數應用`）
- [x] layout JSON-LD 加真實聯絡：`telephone` +852 5601 1931、`contactPoint`、`sameAs`（Instagram @lf.academy.hk）— E-E-A-T 訊號（§5 行動 5）

**2026-07-08 追加**：
- [x] 再加 5 篇 guide（合共 7 篇）：P4 公倍數和公因數、P5 分數除法、P5 多邊形的面積、P6 圓周的計算、P6 速率與行程圖 — §4.1(A) 長尾矩陣開始成形
- [x] Landing 加 AI 定位文案 + dark mode（`prefers-color-scheme`，見 design_strategy.md §2）
- [x] Domain 決策：暫用 vercel.app（見 §3.1 更新）— **user 仍需喺 Vercel set `NEXT_PUBLIC_APP_URL`**

**未做（需要你決定 / 之後 session）：**
- [ ] **設定真實 `NEXT_PUBLIC_APP_URL`**（前置，一定要做，否則上面 canonical/OG 全部指 localhost）
- [x] `public/og.png`（1200×630 品牌圖，2026-07-06 已落；如要 restyle 跟 landing 視覺語言見 design_strategy.md §5）
- [ ] `/faq` 頁 + FAQPage schema
- [ ] 動態單元指南頁（§4，最大槓桿）
- [ ] Google Search Console / Bing Webmaster / GA4 接入 + 提交 sitemap
- [ ] Blog 系統

## 10. 量度工具
- **Google Search Console**（自然搜尋表現、index 狀態、提交 sitemap）— 必裝
- **Bing Webmaster**（ChatGPT 用 Bing index，做 GEO 必裝）
- **GA4**（流量、轉化）
- **AI 引用監測**：定期用 ChatGPT/Claude/Perplexity 問「香港 小學 數學 練習 app 推薦」睇有冇提到你；或用 GEO 工具（Profound / LLMrefs）
- KPI：自然流量、index 頁數、品牌詞搜尋量、AI 引用次數、`/assessment` 完成率
