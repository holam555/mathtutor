# 維護協議 — 點樣安全更新呢套制度

> 讀者：任何接手模型。呢套檔案（CLAUDE.md + docs/agents/*）係活嘅 —— 唔更新會腐化，
> 亂更新會失去公信力。以下規則定義乜嘢可以自行改、乜嘢要問用戶。

## 1. 權限分級

**✅ 可以自行改（改完喺報告入面提一句就得）**：
- 事實更新：seed 表狀態、路由表、schema 摘要 —— 但只可以喺**已驗證**（跑過 command／查過 DB／grep 過 code）之後改，唔可以「我覺得應該係」就改
- append 新 lesson 落 `lessons.md`（跟該檔格式）
- 修斷鏈、錯 typo、錯行號
- 任務路由表加新 skill／新 doc 嘅指向

**⚠️ 改之前要問用戶**：
- 刪或者實質改寫任何規則（格式鐵律、C1–C8、安全鐵律、R1–R6、dispatch 門檻）—— 就算你認為佢錯咗，先問；規則背後可能有你睇唔到嘅歷史
- 分數制度、token 兌換率、TIER_QUOTA 等業務數值
- 刪 `lessons.md` 條目（精簡歸檔可以，見 §3；刪唔可以）
- 任何會令 docs/agents/ 檔案數量增加嘅「新制度檔」—— 制度膨脹本身係退化模式（見 letter），新增要用戶同意

**🚫 唔准做**：
- 改 `docs/archive/` 入面任何嘢（archive = 唯讀歷史）
- 未備份就重寫成份檔（見 §2 備份規則）

## 2. 改檔程序

1. **備份**：實質重寫（唔係小修）任何既有檔前，先 `cp` 一份去 `docs/archive/<原名>_pre_<YYYY-MM-DD>.md`
2. **改**：新內容寫落原檔；如果內容長，抽做新檔 + 原檔留 pointer
3. **防肥條款（CLAUDE.md 專用）**：CLAUDE.md 上限 15KB（2026-07-06 重寫後基準 13KB；中文一字 3 bytes）。加新 section 前先問「呢樣嘢係咪每個 session 都要知？」——唔係就寫入專門 doc，CLAUDE.md 只加一行 pointer。完成咗嘅工作**唔准**加敘事段落，最多改一行狀態
4. **驗證**：grep 你改動中引用嘅每個路徑／檔名確實存在；如果你改咗檔名，grep 邊個引用緊佢並一併更新（`grep -rn "舊名" docs/ CLAUDE.md`）
5. **報告**：話畀用戶知改咗乜 + 點解，等佢決定幾時 commit（唔好自己 commit）

## 3. Lessons 累積同精簡

- **幾時寫**：一個錯誤浪費咗 >15 分鐘、或者會影響出街內容、或者根因係「規則冇寫低」→ 即場 append 一條。唔好等收尾先寫（session 隨時斷）
- **格式**：跟 `lessons.md` 頭部規定（症狀／根因／一句命令式規則）
- **幾時精簡**：條目 >20 條 或 檔案 >250 行 → 做一次 consolidation：相同根因嘅合併；已升格入 CLAUDE.md 鐵律嘅條目縮成一行 + 「已入鐵律」標記；全程唔刪資訊，被合併原文搬去 `docs/archive/lessons_archive.md`
- **升格判準**：同一條 lesson 被第二次踩中 → 佢唔應該淨係喺 log，升格做 CLAUDE.md 鐵律或者對應 workflow doc 嘅硬性步驟

## 4. Memory（`~/.claude/projects/.../memory/`）同 docs 嘅分工

- **docs/agents/** = 制度同 repo 事實（入 git，換機都喺度）→ 預設寫呢度
- **memory** = 用戶偏好、跨 project 事實、任務隊列狀態（唔入 git）
- 同一件事唔好兩邊寫：memory 只放一行 pointer 指向 docs 檔案（例：`fable-pending-tasks.md` 指向 `docs/fable_handoff.md`）

## 5. 制度健康檢查（每次被要求「執一執」或者每 ~10 個 session 做一次）

跑呢個 checklist，每項 pass/fail：
1. CLAUDE.md ≤15KB？（`wc -c CLAUDE.md`）
2. CLAUDE.md 有冇引用唔存在嘅檔？（逐個路徑 `ls`）
3. lessons.md 使唔使精簡？（§3 門檻）
4. seed 表／路由表同現實有冇 drift？（抽 3 項驗證）
5. docs/agents/ 檔案數有冇膨脹？（基準 8 個：README、00_diagnosis、model-dispatch、judgment、delegation-templates、lessons、maintenance、letter-to-future-sessions；多過 8 個 → 檢視係咪應該合併）
