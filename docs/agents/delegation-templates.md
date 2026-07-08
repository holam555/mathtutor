# 派工 Prompt 模板

> 用法：指揮官複製對應模板，填晒所有 `[[…]]` 空格先派。空格填唔到 = 你自己都未諗清楚，唔好派。
> 通則見 [model-dispatch.md](model-dispatch.md)：三件套（目標動機／驗收／回報格式）、
> subagent 係 cold start（規則要貼原文，唔好淨係引用檔名）、長產物落檔傳路徑。
> 每個模板頭一行標建議嘅 subagent_type + model。

---

## T1. 搜尋／盤點（Explore，model 預設；廣度用文字指定）

```
喺 repo [[或指定目錄]] 搵出 [[目標：例如「所有直接 SELECT assessment_questions 而冇 filter is_active 嘅位置」]]。
動機：[[點解要搵，令你識判斷邊啲算命中，例如「準備加 soft-delete 一致性檢查」]]。
搜尋廣度：[[medium / very thorough —— 涉及刪嘢或安全一律 very thorough]]。
命中定義：[[乜先算，乜唔算：例如「type definition 唔算，只計 runtime query」]]。

回報格式（唔好貼大段 code）：
- 每個命中一行：檔案:行號 + 半句描述
- 結尾：總數、你唔肯定嘅邊緣 case 單獨列出、有冇搜過但零命中嘅假設
驗收：聲明你用咗邊幾個唔同關鍵詞／pattern 掃（至少 3 個變體，防漏）。
```

## T2. 實作（general-purpose；預設 sonnet）

```
任務：[[一句講明改乜，例如「/api/mock-exam/start 加 rateLimit()」]]。
動機：[[點解，例如「呢個 route 會創建 DB rows，未有 rate limit」]]。
先讀：[[grounding 檔案清單，例如 src/lib/rateLimit.ts + 一個已有 rate limit 嘅 route 做樣板]]。
必守規則（原文貼畀你，唔好靠記憶）：
[[貼相關鐵律，例如「correct_answer 永遠唔送 browser」/ i18n：UI 文字一律 t() 並加 dict entry / 帶分數 space 格式]]
禁區：唔准 commit、唔准改 [[…]]、唔准 apply 任何 SQL 落 DB。

驗收條件（全過先算完成）：
1. npx tsc --noEmit 過
2. npx next lint 過
3. [[任務特定驗證：例如「用 curl 打兩次證明第 N 次 429」]]
4. node scripts/check_i18n.mjs 過（如有改 UI 文字）

回報格式：改咗邊啲檔（檔案:行號）、每項驗收 pass/fail 附命令輸出摘要、
你做過嘅取捨（一句一項）、未解決事項。唔好貼全 diff。
```

## T3. 重構（general-purpose；預設 sonnet；>5 檔用 isolation: worktree）

```
重構目標：[[例如「抽共用 Fisher-Yates shuffle 去 src/lib/shuffle.ts」]]。
動機：[[例如「assessmentSelection 同 mockExamSelection 各有一份，已 drift 風險」]]。
不變量（行為唔准變）：[[列明：例如「抽題結果分佈不變；TIER_QUOTA 數值不變；public API signature 不變」]]。
先讀：[[涉及檔案]]。
禁區：唔准順手「改善」不變量以外嘅行為；發現 bug 唔好修，記低回報。

驗收條件：
1. npx tsc --noEmit + npx next lint + npx next build 全過
2. [[行為證據：例如「重構前後各跑一次同 seed 嘅抽題，輸出一致」；冇測試就寫個一次性 script 對比，落檔喺 scratchpad]]
3. git diff --stat 貼返嚟（只 stat，唔要全文）

回報格式：改動摘要（每檔一句）、行為證據、發現咗但冇修嘅問題清單。
```

## T4. 研究（general-purpose；預設 sonnet；網研可 run_in_background）

```
研究問題：[[一句，例如「Next.js 14 App Router 做 per-route metadata 嘅 X 做法有冇官方支持」]]。
動機＋將點用：[[答案會影響乜決定]]。
來源要求：[[官方 docs 優先／要日期／要版本號]]。唔准編造：搵唔到就寫「查無」。

回報格式：
- 結論（≤3 句，直接答研究問題）
- 佐證：每項附來源 URL + 關鍵原句
- 信心：高／中／低 + 點解
- 長筆記落檔 [[路徑，例如 docs/archive/research_YYYY-MM-DD_主題.md]]，回報只傳路徑
驗收：結論同佐證一一對應；冇來源嘅句子唔准出現喺結論。
```

## T5. 審查／驗證（fresh agent；一般 sonnet，高風險 opus）

```
你係獨立審查者，之前冇參與呢件工作（維持 fresh：唔好畀佢睇作者嘅自評）。
審查對象：[[檔案路徑 / diff 範圍 / 題目 batch 標識，例如 source_paper='p6_21c']]。
審查目的：[[搵乜類問題：正確性？同現行規則矛盾？斷鏈？]]。
判準（逐項核對，唔好靠印象）：
[[貼判準原文：例如 C1–C8 表 / judgment.md R5 品質底線相應行 / 「檔內引用嘅路徑要 grep 確認存在」]]
抽查規模：[[全量 or 隨機 20%（批量題目用 20%，講明點隨機）]]。

回報格式：
- 每個 finding：位置（檔案:行號 or 題目 source_question）+ 一句問題 + 一句佐證
- 冇 finding 嘅判準都要列「已查，過」——唔准跳項
- 最後一行：PASS（可出手）或 FAIL（附最嚴重嗰 3 個）
禁區：只報告，唔准自己修改。
```

---

## 填空快查

- **驗收條件寫法**：必須係「第三者跑一條命令／睇一個檔就 check 到」嘅陳述。「code 要乾淨」❌；「tsc --noEmit exit 0」✅。
- **回報收窄**：預設「結論 + 檔案:行號 + pass/fail」。你發現自己想睇 agent 嘅過程 = 任務拆得唔夠細，重拆。
- **批量任務**：套 T2/T5 之外再跟 [model-dispatch.md](model-dispatch.md) §5（≤40 條一批、每批重申鐵律、騎縫抽查、隨做隨寫）。
