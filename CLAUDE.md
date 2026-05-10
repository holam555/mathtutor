# CLAUDE.md — 補習社數學練習 App（香港小三至小六）

## 專案概覽

這是一個為香港網上補習社設計的數學練習 Web App，服務小三至小六學生，介面全部使用繁體中文。核心理念是透過**學前評估**找出學生弱項、錯題追蹤、智能出題和 past paper 分析，給家長一個「升分保證」的體驗。

設計風格參考 Duolingo：手機優先，一頁一題，即時回饋，流暢直觀。

---

## 🎯 學前評估系統（當前真相來源 / source of truth）

**重要**：以下章節描述的是**目前實際運作的設計**。本文件後面（從 [題目分類與 Variation Prompt](#題目分類與-variation-prompt小五上學期共32個文字題型) 開始）的舊分類 A1-A6, B1-B10 等是 legacy reference，已不再使用 — 題目都改為 DB-backed in `assessment_questions` table。

### 各年級評估流程

| 年級 | 揀題單位 | 大單元 drill-down 至小單元？| 題庫來源 |
|------|---------|---------------------------|---------|
| **P3** | 大單元 OR 小單元 (家長可揀) | ✅ 有 (topic_select 介面) | 由 past paper 抽出，逐題人手分類至 `curriculum_topics.lesson_number` |
| **P4** | 大單元 only | ❌ 沒有 | 《小學數學新思維(第二版)》單元配套習題 PDF |
| **P5** | 大單元 only | ❌ 沒有 | 同上 |
| **P6** | 大單元 only | ❌ 沒有 | 同上 |

理由：P3 題庫經過長期人手 curate，每個 lesson 都有夠多題；P4-P6 用新教材，題量較少（每大單元 5-15 條），所以只用大單元層級。

### 抽題規則 (`src/lib/assessmentSelection.ts`)

- **平均分配**（uniform / even distribution）across 揀咗嘅單元 — 每個單元拎差唔多數量。Earlier scopes get the extra in tied cases.
- **三層難度配額**：`TIER_QUOTA = { basic: 10, enhancement: 8, advanced: 2 }` = 20 條（across all 4 grades）
- 每個單元至少 1 條（minimum coverage）；如基本配額拎唔晒，可用 cross-tier fill 補到最多 30 條
- 揀少量單元唔夠 20 條都唔緊要 — 唔強制補

### 題目類型 (`question_type` in `assessment_questions`)

| Type | 何時用 | 答案格式 |
|------|-------|---------|
| `fill_in_number` | 答案係純數字、小數、分數、帶分數 | 例 `60`、`5/18`、`1.25`、`1 5/8` (見下文 帶分數) |
| `multiple_choice` | 答案唔係純數字 (shape names, units, words, comparisons, multiple values) | 4 個選項，正確答案連 prefix `"B. 答案文字"` |
| `calculation` | 已棄用 (deprecated) | 全部變咗 multiple_choice |
| `fill_in` | 已棄用 (deprecated) — 答案有 `>` `<` `=` mobile 唔友善 | 全部變咗 multiple_choice |

**MCQ distractor rules**:
1. 4 個選項全部不同，無兩個 mathematically equivalent (e.g. `0.5` 同 `1/2` 唔可以同時出現)
2. 干擾項要 plausible (學生常犯嘅錯誤，e.g. 漏咗一步、decimal 移位、顛倒分子分母)
3. Same domain：if 正確 = 單位名 → 其他選項都係單位名；if = 形狀名 → 都係形狀名
4. Correct answer 位置要分散（唔好成日係 A 或 C）

### 帶分數格式（重要！）

**統一用 SPACE 格式**：`1 5/8`（整數 + 空格 + 真分數），**唔係** `1又5/8`。

理由：
- 數學鍵盤 (`src/components/UnifiedKeyboard.tsx`) 輸出嘅就係 space 格式 (`"1 2/3"`)
- 評分邏輯 (`src/lib/answerUtils.ts` `normalizeAnswer()`) 會自動把 `又` 轉做 space，所以舊資料用 `又` 都仲 grade 正確 — 但所有新題目一律用 space，避免歧義

**Apply scope**:
- ✅ `correct_answer` for fill_in_number rows
- ✅ MCQ option text (`"A. 1 5/8 公斤"`)
- ✅ Question text 中提及嘅帶分數
- ⚠️ 例外：自然中文嘅 `又` (e.g. "又進貨了 30 公斤") **唔可以** 改 — 只有「`數字又數字/數字`」嘅 pattern 先轉

### Image-dependent questions

**新題庫一律 SKIP** (圖形描述、作圖、補全棒形圖、point-counting 立體積木、圓形圖閱讀、行程圖)。Image questions 由人手另行處理。

當前 P5 仲有 43 條 image questions 由舊 `questions` table migrate 過嚟（`source_paper = 'p5_image_questions'`），目前 `is_active = false` (deactivated)。

### 課程大綱（curriculum）

當前 grade-aware schema：`curriculum_units` (大單元) + `curriculum_topics` (小單元)。

**P3** — 17 大單元 / 32 小單元（lesson 1-40，部分 review 跳過）
- 詳見 `supabase/migrations/0014_p3_curriculum_assessment.sql`
- 來源：《天花板級別》香港小三課程大綱

**P4** — 17 大單元（每大單元 1 個 placeholder topic）
- 4A 上：U1 倍數和因數 / U2 公倍數和公因數 / U3 乘法 / U4 除法 / U5 四則混合運算
- 4A 上 (B 冊)：U7 平行與垂直 / U8 四邊形 / U9 周界
- 4B 下 (A 冊)：U10 分數的認識（一） / U11 擴分與約分 / U12 同分母分數加減法 / U13 小數的認識 / U14 圖形的拼砌與分割
- 4B 下 (B 冊)：U15 對稱圖形 / U16 正方形和長方形面積 / U17 棒形圖（一）單式 / U18 棒形圖（二）複式
- 詳見 `supabase/seed_p4_curriculum.sql`

**P5** — 19 大單元（每大單元 1 個 placeholder topic）
- 5A 上：U1 多位數 / U2 異分母分數加法和減法 / U3 分數乘法 / U4 代數符號 / U5 簡易方程（一）/ U6 方向 / U7 多邊形的面積 / U8 體積的認識 / U9 複合棒形圖
- 5B 下：U10 小數加法和減法 / U11 小數乘法 / U12 小數除法 / U13 小數和分數的互化 / U14 分數除法 / U15 百分數 / U16 圓的初步認識 / U17 長方體和正方體的表面積與體積 / U18 平均數 / U19 折線圖
- 詳見 `supabase/seed_p5_curriculum.sql`（已存在）+ `seed_p5_replacement.sql`

**P6** — 13 大單元（每大單元 1 個 placeholder topic）
- 6A 上：U1 小數除法 / U2 百分數的認識 / U3 數型 / U4 圓的認識 / U5 軸對稱和旋轉對稱圖形 / U6 容量和體積 / U7 圓周的計算 / U8 折線圖
- 6B 下：U9 百分數應用 / U10 簡易方程（三）/ U11 截面與圓面積 / U12 速率與行程圖 / U13 圓形圖
- 詳見 `supabase/seed_p6_curriculum.sql`

### 題庫種子檔案

| 檔案 | 內容 | 是否 active in DB |
|------|------|-----------------|
| `seed_p4_curriculum.sql` + `seed_p4_assessment.sql` | P4 17 大單元 + 156 條題目 | ✅ active |
| `seed_p5_curriculum.sql` | 舊 P5 curriculum (仲用緊，因為 unit name 一致) | ✅ active (curriculum 部分) |
| `seed_p5_replacement.sql` | 新 P5 231 條題目 + deactivate 舊 P5 pool | ✅ active (新題目) |
| `seed_p5_assessment_questions.sql` | 舊 P5 hardcoded sept/nov/jan (52 條) | ❌ inactive (deactivated by replacement) |
| `seed_p5_exam_review.sql` | 舊 P5 期末複習手冊 (94 條) | ❌ 未 apply (用唔到，新 pool 取代) |
| `seed_p5_image_questions.sql` | 舊 P5 image questions (43 條) | ❌ 未 apply |
| `seed_p6_curriculum.sql` + `seed_p6_assessment.sql` | P6 13 大單元 + 169 條題目 | ✅ active |

**Apply order in Supabase SQL editor** (新 setup 由零開始)：
```
1. seed_p4_curriculum.sql      → seed_p4_assessment.sql
2. seed_p6_curriculum.sql      → seed_p6_assessment.sql
3. seed_p5_replacement.sql     (UPDATE old to inactive + INSERT new)
```

### C1–C8 驗證 Checklist

每次新加題庫，跑兩 pass：

**Pass A — Pattern scan (fast, free)**
```bash
python3 scripts/verify_assessment_answers.py
```
捉純算術錯誤、fraction format、MC answer 唔在 options。

**Pass B — LLM deep verify (parallel sub-agent per grade)**

| Code | 檢查 |
|------|------|
| C1 | **Math correctness** — 重新 solve, 答案要啱 |
| C2 | **Right unit/lesson** — 題目內容夾乎指定 unit/topic |
| C3 | **Single correct answer** — 無 equivalent 正確答案 (e.g. MCQ 兩個都啱) |
| C4 | **Distinct MCQ options** — 無兩個答案相等 (e.g. `1/2` 同 `0.5`) |
| C5 | **Grade scope** — 內容啱嗰個年級 (P3 唔好太深、P6 唔好太淺) |
| C6 | **Mobile chars** — `correct_answer` 唔可以有 `:`, `>`, `<`, `=`, `%` (fill_in_number only) |
| C7 | **Unit mismatch** — 題目問「多少元/克/升」答案要包含單位 |
| C8 | **Tier coverage** — 每個 unit 至少 1 條 `basic` + 1 條 `enhancement` |

**Difficulty tier rule** (number of solve steps)：
- 1 step → `basic`
- 2-3 steps → `enhancement`
- 4+ steps → `advanced`

詳細 runbook：`docs/assessment_question_workflow.md`

---

## 🚀 已完成 Sprint（截至 Sprint 6）

### Sprint 1–5 摘要
- **Sprint 1**：基礎骨架（Supabase Auth + DB + Storage，老師上傳題目，學生登入做題，錯題庫）
- **Sprint 2**：進度儀表板、按題型練習、隨機抽題、老師學生數據
- **Sprint 3**：Gemini 2.5 Flash AI 生成 variation，老師審核頁面 `/admin/variations`
- **Sprint 4**：Past Paper 上載（Gemini Vision 分析），老師審核頁面 `/admin/past-papers/[id]`
- **Sprint 5**：Token 系統（上載獲 +10/頁，兌換獎勵，老師審批 + 手動調整）

### Sprint 6（角色分離 + 學生遊戲化 + 老師/家長個別頁面）
**實際完成內容：**

1. **登入系統分離**
   - 三個獨立登入頁：`/login/student`、`/login/parent`、`/login/teacher`
   - 首頁 `/` 顯示三個角色按鈕
   - 每個登入 action 驗證 role，錯誤 role 會被登出並顯示錯誤訊息
   - 未授權訪問時 middleware 跳轉到 `/`（不是 `/login`，避免暴露路由）
   - `/login`（舊路徑）自動跳轉到 `/`

2. **嚴格 RLS 與 `parent_student_relationships`**
   - 新表 `parent_student_relationships (parent_id, student_id, is_active)`
   - 所有學生資料表（`student_profiles` / `practice_sessions` / `answer_records` / `wrong_question_bank`）RLS 改為三條：學生本人、老師、已連結家長
   - Helper function：`is_parent_of(student_id)`、`is_teacher()`

3. **學生遊戲化主頁 `/student`**
   - 打招呼 header（依時段顯示 早晨 / 下午好 / 晚上好）
   - 今日目標 SVG 圓環（`DAILY_GOAL = 10`，見 `src/lib/trophies.ts`）
   - 本週連續練習條（7 個圓點，週一至週日，今天加邊框）
   - 獎杯架（橫向滾動，最多 6 個）
   - 下一個獎杯進度條
   - 開始練習大按鈕（teal `#1D9E75`）

4. **零負面語言的答題頁 `/student/practice/[sessionId]`**
   - 答對：teal 綠色 + 「答對了！+1 ⭐」
   - 答錯：amber `#EF9F27`（非紅色）+ 「再試一次！💪 已加入挑戰題，下次再戰！」
   - 結果頁 `/student/results/[sessionId]` 只顯示獲得的 ⭐ 數量，不顯示對錯統計
   - 所有 `#4A90E2` 藍色已改為 `#1D9E75` teal（學生相關介面）

5. **獎杯頁 `/student/trophies`**
   - 8 個獎杯：初出茅廬、答題新星、火焰勳章、進步之星、鑽石之心、百題達人、題型大師、練習冠軍
   - 已解鎖：橙金漸變底色
   - 未解鎖：灰階 + 進度條 + 解鎖條件文字

6. **老師班級總覽 `/admin/students`**
   - 全班平均正確率、需跟進學生數、總學生數（3 格 metric）
   - 本週最弱題型 Top 3（`get_class_weakest_categories` RPC）
   - 學生列表：頭像（姓氏首字）、次數/題數/正確率、狀態 badge
     - 優秀 ≥85% / 良好 70-84% / 尚可 50-69% / 需跟進 <50% 或 session <3

7. **老師個別學生頁 `/admin/students/[id]`**
   - 本週 / 本月 / 全部 時間範圍切換（`?range=week|month|all`）
   - 三個 tab（`?tab=overview|wrong|history`）：
     - **整體表現**：4 格 metric（完成題數、正確率、連續天數、平均每題用時）、各題型正確率 bar、系統備注（弱項 <50% 自動提示）
     - **錯題詳情**：按題型分組，顯示錯誤次數
     - **練習歷史**：每次 session 的日期、時間、對錯、用時

8. **家長子女報告**
   - `/parent` 列出所有關聯子女（`parent_student_relationships`）+ 上載 Past Paper + 近期記錄
   - `/parent/child/[id]` 使用同一個 `StudentReport` 元件（`mode='parent'`）
     - 親切語氣（「小明的表現」、「可以多加練習的題型」）
     - 無老師備注
     - 後端強制 `parent_student_relationships` 檢查，未關聯直接 redirect 回 `/parent`

### 與原設計不同的決定
| 項目 | 原設計 | 實際 | 原因 |
|------|--------|------|------|
| 獎杯儲存 | 專用 table | JS 計算（`src/lib/trophies.ts`）| 獎杯條件純粹由 stats 決定，無需持久化 |
| Daily goal 數值 | 可調 | Hardcode 10 | Phase 1 簡化；之後可加到 `student_profiles` |
| `/parent/tokens` | 顯示 token 列表 | Redirect 到 `/parent` | 解耦後 token 屬於學生；家長需先揀子女再看 |
| 家長上載 token 歸屬 | 原為 `parent_profiles.token_balance` | 歸入第一個關聯子女的 `student_profiles.token_balance` | 配合 Sprint 5 的 schema；家長多個子女時預設第一個 |
| `StudentDetailModal` | modal 彈出 | 獨立頁面 `/admin/students/[id]` | 更多資料需要完整畫布 |
| 登入頁 | 單一 `/login` | 三個 role-specific 頁面 | 嚴格分離、減少 role 錯亂 |

---

## 📋 下一 Sprint 前置條件

開始下一個 Sprint 前，必須在 Supabase SQL Editor 執行以下 migration 檔（按順序）：
```
supabase/migrations/0005_sprint2_indexes_and_stats.sql   -- Sprint 2 stats RPCs
supabase/migrations/0006_variations.sql                  -- Sprint 3 AI variation
supabase/migrations/0007_past_papers.sql                 -- Sprint 4 past paper tables
supabase/migrations/0008_tokens.sql                      -- Sprint 5 token system
supabase/migrations/0009_role_separation.sql             -- Sprint 6 parent_student_relationships + 嚴格 RLS + gamification RPCs
```

Supabase Storage 設定（只需做一次）：
- Bucket `past-papers`（private），配合 `0007_past_papers.sql` 末尾附的 RLS policy SQL

帳戶設定（由老師透過 Supabase Dashboard 建立）：
- 必須在 `user_metadata` 設 `role` 為 `'student' | 'parent' | 'teacher'` 其中一個
- 每位學生需在 `student_profiles` 建 row
- 家長與子女的連結要在 `parent_student_relationships` 手動 insert：
  ```sql
  INSERT INTO parent_student_relationships (parent_id, student_id)
  VALUES ('<parent_user_uuid>', '<student_user_uuid>');
  ```

---

## 🗺️ 目前路由總覽

```
公開：
  /                              角色選擇首頁
  /login                         → 重導到 /
  /login/student                 學生登入
  /login/parent                  家長登入
  /login/teacher                 老師登入

學生（role='student'）：
  /student                       遊戲化主頁（目標圓環、連勝條、獎杯架）
  /student/trophies              所有獎杯
  /student/wrong-bank            錯題庫
  /student/practice/select-category 按題型練習
  /student/practice/[sessionId]  答題中
  /student/results/[sessionId]   練習完成畫面

家長（role='parent'）：
  /parent                        子女列表 + 上載記錄
  /parent/child/[id]             個別子女詳細報告（3 tabs）
  /parent/upload                 上載 Past Paper
  /parent/tokens                 → 重導到 /parent

老師（role='teacher'）：
  /admin                         老師後台 hub
  /admin/questions               題目管理
  /admin/questions/new           新增題目
  /admin/variations              AI 生成及審核
  /admin/past-papers             Past Paper 審核列表
  /admin/past-papers/[id]        Past Paper 詳細審核
  /admin/redemptions             兌換申請 + 手動調整 + 選項管理
  /admin/students                班級總覽
  /admin/students/[id]           個別學生詳細（3 tabs）

API：
  /api/practice/start            開始練習
  /api/practice/answer           提交答案
  /api/practice/complete         完成 session
  /api/variations/generate       生成 AI variation
  /api/past-paper/upload         上載 past paper + Gemini 分析
```

---

## 技術棧

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes 或 Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth（學生、家長、老師三種角色）
- **AI**: Google Gemini 2.5 Flash API（題目生成、variation、past paper 分析）
- **Storage**: Supabase Storage（past paper 圖片）
- **部署**: Vercel

---

## 使用者角色

| 角色 | 功能 |
|------|------|
| 學生 | 做題、查看錯題、重做練習 |
| 家長 | 上載 past paper、查看子女進度、兌換 token |
| 老師（管理員）| 上傳題目、審核 past paper、查看 variation 庫、查看所有學生數據 |

---

## 資料庫 Schema（Supabase）

> ⚠️ **雙表並存**：以下 `questions` + `question_categories` 係**舊** Sprint 1-3 schema（仲存在但已 deprecated for assessment）。
> **學前評估**用嘅係 newer schema：`curriculum_units` + `curriculum_topics` + `assessment_questions`（見 `0014_p3_curriculum_assessment.sql`）。
> 詳見上方「🎯 學前評估系統」章節對 `assessment_questions` 嘅 columns。

### Assessment schema (current — for the prelesson assessment)

```sql
curriculum_units (
  id uuid PRIMARY KEY,
  grade int NOT NULL,                -- 3, 4, 5, 6
  semester text CHECK (IN ('A','B')),-- 上 = A, 下 = B
  unit_number int NOT NULL,
  name text NOT NULL,                -- e.g. '異分母分數加法和減法'
  textbook_ref text,
  display_order int
)

curriculum_topics (
  id uuid PRIMARY KEY,
  unit_id uuid REFERENCES curriculum_units,
  lesson_number int NOT NULL,        -- 1-40 for P3; = unit_number for P4-P6 (placeholder)
  name text NOT NULL,
  display_order int,
  teaching_methods jsonb             -- AI generation prompts (P3 only)
)

assessment_questions (
  id uuid PRIMARY KEY,
  topic_id uuid REFERENCES curriculum_topics ON DELETE RESTRICT,
  question_text text NOT NULL,
  question_type text CHECK (IN ('multiple_choice','fill_in','fill_in_number','calculation')),
  options jsonb,                     -- ["A. ...","B. ...","C. ...","D. ..."]
  correct_answer text NOT NULL,      -- "B. 答案" for MCQ; "60" or "1 5/8" for fill_in_number
  difficulty_tier text CHECK (IN ('basic','enhancement','advanced')),
  group_id uuid,                     -- NULL for standalone; UUID for linked sub-questions
  sub_order int DEFAULT 1,
  source_paper text,                 -- 'p4_ax_2026' / 'p5_ax_2026' / 'p6_ax_2026' / 'p3_*' / etc.
  source_question text,              -- 'U1Q1' / 'U2Q5a' / 'CSV row 11'
  image_url text,                    -- Supabase Storage URL if has figure
  image_alt_text text,
  notes text,
  is_active boolean DEFAULT true,    -- false = soft-disabled (preserved for history)
  created_at timestamptz
)
```

`SECURITY: correct_answer never sent to browser — server grades on /api/assessment/submit.`

### Legacy schema (Sprint 1-3, still used for the wrong-question bank + variation)

```sql
-- 題目分類
question_categories (
  id uuid PRIMARY KEY,
  name text NOT NULL,           -- 例如「分數加減」
  name_en text,                 -- 英文分類名
  grade int,                    -- 5 或 6
  description text,
  created_at timestamp
)

-- 題目主表
questions (
  id uuid PRIMARY KEY,
  category_id uuid REFERENCES question_categories,
  question_text text NOT NULL,
  question_image_url text,      -- 如有圖形題
  question_type text NOT NULL,  -- 'multiple_choice' | 'fill_in' | 'calculation'
  options jsonb,                -- 選擇題選項 ["A. 1", "B. 10", "C. 30", "D. 60"]
  correct_answer text NOT NULL,
  difficulty int DEFAULT 1,     -- 1=易 2=中 3=難
  source text,                  -- 'manual' | 'past_paper' | 'ai_generated'
  school_name text,             -- 來自哪間學校的 past paper
  exam_year int,
  is_active boolean DEFAULT true,
  created_at timestamp
)

-- Variation 模板
variation_templates (
  id uuid PRIMARY KEY,
  category_id uuid REFERENCES question_categories,
  template_prompt text NOT NULL, -- 給 Claude 的生成指示
  example_question text,
  constraints text,              -- 例如「分母不超過 20」「答案為正數」
  created_at timestamp
)

-- AI 生成的 Variation 題目
generated_questions (
  id uuid PRIMARY KEY,
  parent_question_id uuid REFERENCES questions,
  category_id uuid REFERENCES question_categories,
  question_text text NOT NULL,
  question_type text NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  reviewed_by uuid,              -- 老師 user id
  is_approved boolean DEFAULT false,
  created_at timestamp
)

-- 學生檔案
student_profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  name text NOT NULL,
  grade int,                     -- 5 或 6
  parent_id uuid,
  school_name text,
  created_at timestamp
)

-- 家長檔案
parent_profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  name text NOT NULL,
  phone text,
  token_balance int DEFAULT 0,
  created_at timestamp
)

-- 練習記錄
practice_sessions (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES student_profiles,
  session_type text,             -- 'new' | 'retry_wrong' | 'variation'
  started_at timestamp,
  completed_at timestamp,
  total_questions int,
  correct_count int
)

-- 答題記錄
answer_records (
  id uuid PRIMARY KEY,
  session_id uuid REFERENCES practice_sessions,
  student_id uuid REFERENCES student_profiles,
  question_id uuid,              -- questions 或 generated_questions
  question_source text,          -- 'questions' | 'generated_questions'
  student_answer text,
  is_correct boolean,
  time_spent_seconds int,
  answered_at timestamp
)

-- 錯題收集
wrong_question_bank (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES student_profiles,
  question_id uuid,
  question_source text,
  category_id uuid REFERENCES question_categories,
  wrong_count int DEFAULT 1,
  last_wrong_at timestamp,
  is_resolved boolean DEFAULT false  -- 做對兩次後標記為 resolved
)

-- Past Paper 上載記錄
past_paper_uploads (
  id uuid PRIMARY KEY,
  uploaded_by uuid REFERENCES parent_profiles,
  school_name text,
  grade int,
  exam_year int,
  exam_type text,                -- 例如「第一段考」
  image_urls text[],             -- 每頁一個 URL
  ai_extracted_questions jsonb,  -- Claude 第一步分析結果
  review_status text DEFAULT 'pending', -- 'pending' | 'reviewed' | 'approved'
  reviewed_by uuid,
  tokens_awarded int DEFAULT 0,
  created_at timestamp
)

-- Token 交易記錄
token_transactions (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES parent_profiles,
  amount int,                    -- 正數為獲得，負數為使用
  reason text,                   -- 'past_paper_upload' | 'redemption'
  reference_id uuid,             -- past_paper_uploads.id 或 redemption.id
  created_at timestamp
)

-- Token 兌換記錄
token_redemptions (
  id uuid PRIMARY KEY,
  parent_id uuid REFERENCES parent_profiles,
  tokens_used int,
  reward_description text,       -- 例如「課程折扣 $50」
  status text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at timestamp
)
```

---

## 題目分類與 Variation Prompt（小五上學期，共32個文字題型）

> ⚠️ **LEGACY / ARCHIVED** — 以下分類 (A1-A6, B1-B10, C1-C7, D1-D9, E1-E7, F1-F3, G1-G4, H1-H4, I1-I4) 係 Sprint 1-3 設計時用嘅 reference，**已不再使用**。
>
> 真實題庫已遷移到 DB-backed `assessment_questions` table，分類用 `topic_id` (FK 去 `curriculum_topics`)，唔再用呢啲 letter codes。
>
> **要見當前題庫設計，睇上面「🎯 學前評估系統」章節**。
>
> 以下保留作為：
> 1. AI variation generation prompt 嘅 reference (Phase 2 功能)
> 2. 對 question_categories table 嘅歷史記錄（仲喺舊 `questions` table 用緊）

以下所有題型已從4份小五上學期 past paper 確認。每個分類包含：題型說明、難度分級、variation prompt 範本。

---

### A. 數字與運算

---

**A1. 因數識別**
- 說明：判斷某數是否某數的因數，或找出某數的所有因數
- 難度：1
- 題型：選擇題 / 填充

```
variation_prompt:
你是香港小五數學老師。請生成5條關於「因數識別」的題目。
規則：
- 被測試的數在 12 至 96 之間
- 選擇題格式：4個選項，其中一個不是該數的因數
- 答案必須正確，所有選項都是合理的數字
- 只輸出JSON，格式如下：
{
  "questions": [
    {
      "question_text": "下列哪個數不是48的因數？",
      "question_type": "multiple_choice",
      "options": ["A. 6", "B. 8", "C. 9", "D. 12"],
      "correct_answer": "C. 9",
      "difficulty": 1
    }
  ]
}
```

---

**A2. 倍數識別**
- 說明：判斷某數是否某數的倍數
- 難度：1
- 題型：選擇題

```
variation_prompt:
你是香港小五數學老師。請生成5條關於「倍數識別」的題目。
規則：
- 題目格式：哪個數是X的倍數（X在2至12之間）
- 4個選項，只有一個是正確倍數
- 選項數字在100至1000之間
- 只輸出JSON，格式同上
```

---

**A3. 最大公因數 HCF**
- 說明：求兩個數的最大公因數
- 難度：1至2
- 題型：填充

```
variation_prompt:
你是香港小五數學老師。請生成5條求「最大公因數（H.C.F.）」的填充題。
規則：
- 兩個數都在 8 至 60 之間
- 難度1：答案在 2 至 6 之間（例如 8 和 12，HCF=4）
- 難度2：答案在 7 至 20 之間（例如 24 和 36，HCF=12）
- 題目格式：「＿＿ 和 ＿＿ 的H.C.F.是＿＿」
- 只輸出JSON
```

---

**A4. 最小公倍數 LCM**
- 說明：求兩個數的最小公倍數
- 難度：1至2
- 題型：填充

```
variation_prompt:
你是香港小五數學老師。請生成5條求「最小公倍數（L.C.M.）」的填充題。
規則：
- 兩個數都在 4 至 20 之間
- 難度1：答案在 12 至 40 之間
- 難度2：答案在 40 至 120 之間
- 題目格式：「＿＿ 和 ＿＿ 的L.C.M.是＿＿」
- 只輸出JSON
```

---

**A5. 第N個公倍數**
- 說明：求兩個數的第N個公倍數
- 難度：2
- 題型：填充

```
variation_prompt:
你是香港小五數學老師。請生成5條求「第N個公倍數」的填充題。
規則：
- 兩個數都在 3 至 15 之間
- N在 2 至 4 之間
- 答案不超過 500
- 題目格式：「＿＿ 和 ＿＿ 的第＿＿個公倍數是＿＿」
- 只輸出JSON
```

---

**A6. 大數運算與數位識別**
- 說明：包含大數乘除、括號混合運算、取約數到某位、識別某數字在哪個數位
- 難度：1至2
- 題型：填充 / 選擇題
- 備注：此類型細分為三個子題型，建議各自出題

```
variation_prompt_乘除:
生成5條整數乘除法填充題。
規則：兩位數×兩位數，或三位數÷兩位數（有餘數）。只輸出JSON。

variation_prompt_數位:
生成5條「數位識別」選擇題。
規則：給出一個5至7位數，問某個數字在哪個數位，或問某數位上的數字是多少。
4個選項。只輸出JSON。

variation_prompt_取約:
生成5條「取約數」填充題。
規則：給出一個6位數，取約至萬位或十萬位。只輸出JSON。
```

---

### B. 分數

---

**B1. 等值分數填充**
- 說明：已知分數，求等值分數的分子或分母（鏈式填充）
- 難度：1至2
- 題型：填充

```
variation_prompt:
生成5條「等值分數」填充題。
規則：
- 給出一個分數，要求填入括號使等式成立
- 格式一：a/b = ( )/c（求分子）
- 格式二：a/b = c/( )（求分母）
- 格式三：a/b = ( )/c = d/( )（鏈式，難度2）
- 分母不超過 60
- 只輸出JSON
```

---

**B2. 分數大小比較**
- 說明：在兩個分數之間填入 > < =
- 難度：1至2
- 題型：填充

```
variation_prompt:
生成5條「分數大小比較」填充題。
規則：
- 填入 >、< 或 =
- 難度1：兩個真分數比較
- 難度2：兩個帶分數比較（整數部分相同，分數部分需通分）
- 分母不超過 20
- 只輸出JSON
```

---

**B3. 分數大小排列**
- 說明：把3個分數由大至小或由小至大排列
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「分數大小排列」填充題。
規則：
- 給出3個分數（可以是真分數或帶分數混合）
- 要求由大至小或由小至大排列
- 分母不超過 12
- 只輸出JSON
```

---

**B4. 真分數加減（異分母）**
- 說明：兩個真分數相加或相減，需要通分
- 難度：1
- 題型：填充

```
variation_prompt:
生成5條「異分母真分數加減」填充題。
規則：
- 兩個真分數，分母不同，需通分
- 分母在 3 至 12 之間，LCM 不超過 36
- 答案可以是真分數或帶分數
- 答案須化至最簡分數
- 只輸出JSON
```

---

**B5. 帶分數加減（同分母）**
- 說明：兩個帶分數相加或相減，分母相同
- 難度：1
- 題型：填充

```
variation_prompt:
生成5條「同分母帶分數加減」填充題。
規則：
- 兩個帶分數，分母相同（在 5 至 15 之間）
- 整數部分在 1 至 9 之間
- 包括加法和減法各約一半
- 只輸出JSON
```

---

**B6. 帶分數加減（異分母）**
- 說明：兩個帶分數相加或相減，分母不同，需通分
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「異分母帶分數加減」填充題。
規則：
- 兩個帶分數，分母不同，LCM 不超過 40
- 整數部分在 1 至 8 之間
- 答案須化至最簡分數
- 答案為正數
- 只輸出JSON
```

---

**B7. 整數減帶分數**
- 說明：整數減去帶分數
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「整數減帶分數」填充題。
規則：
- 整數在 3 至 10 之間
- 帶分數的整數部分小於上面的整數
- 分母在 3 至 10 之間
- 答案為正數帶分數，化至最簡
- 只輸出JSON
```

---

**B8. 三個分數混合加減**
- 說明：三個分數（真分數或帶分數混合）的加減運算
- 難度：3
- 題型：填充

```
variation_prompt:
生成5條「三個分數混合加減」填充題。
規則：
- 包含2至3個不同分母，LCM 不超過 36
- 可以包含真分數、帶分數、整數
- 運算包含加和減
- 答案為正數，化至最簡分數
- 只輸出JSON
```

---

**B9. 分數乘法**
- 說明：分數乘以帶分數，或帶分數乘以帶分數
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「分數乘法」填充題。
規則：
- 格式：真分數 × 帶分數，或帶分數 × 帶分數
- 分母不超過 15
- 先化簡再計算，答案化至最簡
- 只輸出JSON
```

---

**B10. 分數估算**
- 說明：估計含分數的算式結果，選出最接近的選項
- 難度：2
- 題型：選擇題

```
variation_prompt:
生成5條「分數估算」選擇題。
規則：
- 算式包含2至3個帶分數的加減，每個帶分數先四捨五入至最近整數
- 4個選項，只有一個最接近真實答案
- 分母在 3 至 18 之間
- 只輸出JSON
```

---

### C. 應用題

---

**C1. 整數應用題（買賣找錢）**
- 說明：涉及乘除和加減的實際購買情境
- 難度：2
- 題型：列式計算

```
variation_prompt:
生成5條「買賣找錢」列式計算應用題。
規則：
- 涉及單價、數量、找錢等
- 可以包含打折、買X送Y等優惠
- 答案為整數，金額在 50 至 1000 元之間
- 用繁體中文，香港日常生活場景（食物、文具、玩具）
- 只輸出JSON，question_type 為 "calculation"
```

---

**C2. 整數應用題（分組餘數）**
- 說明：涉及分組、包裝、每組幾個的整除和餘數問題
- 難度：2
- 題型：列式計算

```
variation_prompt:
生成5條「分組餘數」列式計算應用題。
規則：
- 涉及把若干物件平均分組，求每組數量或需要多少組
- 可能有餘數，需判斷是否要進一（例如裝箱問題）
- 總數在 100 至 800 之間，每組在 5 至 25 之間
- 只輸出JSON
```

---

**C3. 整數應用題（儲蓄計劃）**
- 說明：計算需要多少時間才能儲夠某金額
- 難度：2
- 題型：填充 / 列式計算

```
variation_prompt:
生成5條「儲蓄計劃」應用題。
規則：
- 每月/每星期儲若干元，問需要多少時間儲到目標金額
- 目標金額在 100 至 2000 元之間
- 每期儲蓄在 20 至 200 元之間
- 答案為整數月/星期
- 只輸出JSON
```

---

**C4. 分數應用題（日常加減）**
- 說明：日常情境的分數加減，例如吃了幾分之幾、剩下幾分之幾
- 難度：2
- 題型：列式計算

```
variation_prompt:
生成5條「分數加減應用題」。
規則：
- 日常場景：食物、時間、距離等
- 涉及帶分數加減，需通分
- 分母不超過 12，答案化至最簡
- 必須包含完整問句和答案單位
- 只輸出JSON
```

---

**C5. 分數應用題（乘法求部分）**
- 說明：已知整體，求整體的幾分之幾是多少
- 難度：2
- 題型：列式計算

```
variation_prompt:
生成5條「分數乘法應用題」。
規則：
- 格式：A有X個/件/頁，B有A的Y/Z倍，求B是多少
- 或：A共X頁，看了全部的Y/Z，看了多少頁
- X在 50 至 500 之間，Y/Z 分母不超過 10
- 只輸出JSON
```

---

**C6. 帶分數應用題（價錢混合）**
- 說明：包含帶分數的價錢計算，例如票價、折扣
- 難度：3
- 題型：列式計算

```
variation_prompt:
生成5條「帶分數價錢應用題」。
規則：
- 涉及帶分數的加減乘運算
- 場景：樂園門票、課程收費、購物
- 金額以帶分數表示（例如 220又4/5元）
- 答案化至最簡
- 只輸出JSON
```

---

**C7. 數學規律題（代號運算）**
- 說明：已知▲×A=B，求▲×C=？的規律推理
- 難度：2
- 題型：選擇題

```
variation_prompt:
生成5條「數學規律推理」選擇題。
規則：
- 格式：如果▲×A=B，那麼▲×C=？
- A、C、B 都是整數
- C是A的整數倍（2至10倍）
- 4個選項，只有一個正確
- 只輸出JSON
```

---

### D. 量度與幾何

---

**D1. 量度單位填充**
- 說明：根據情境填上適當的量度單位（長度、重量、容量、面積、時間）
- 難度：1
- 題型：填充

```
variation_prompt:
生成8條「填上適當量度單位」填充題。
規則：
- 每條給出一個情境和數字，填入單位（mm、cm、m、km、g、kg、mL、L、cm²、m²、分鐘、小時）
- 情境要合理，例如：「一支原子筆約長15＿＿」答案是cm
- 包含長度、重量、容量、面積、時間各1至2條
- 只輸出JSON
```

---

**D2. 面積（長方形和正方形）**
- 說明：求長方形或正方形面積，或已知面積求邊長
- 難度：1至2
- 題型：填充

```
variation_prompt:
生成5條「長方形/正方形面積」題目。
規則：
- 難度1：已知長和寬，求面積
- 難度2：已知面積（完全平方數），求正方形邊長
- 難度2另：已知周界和一邊，求另一邊和面積
- 尺寸在 3cm 至 25cm 之間
- 只輸出JSON
```

---

**D3. 面積（平行四邊形）**
- 說明：求平行四邊形面積，或已知面積和底求高
- 難度：1至2
- 題型：填充

```
variation_prompt:
生成5條「平行四邊形面積」題目。
規則：
- 難度1：已知底和高，求面積（底×高）
- 難度2：已知面積和底，求高；或已知面積和高，求底
- 底在 5cm 至 30cm 之間，高在 3cm 至 20cm 之間
- 可加入文字描述（例如底是高的N倍）
- 只輸出JSON
```

---

**D4. 面積（三角形，正向求面積）**
- 說明：已知底和高，求三角形面積
- 難度：1
- 題型：填充

```
variation_prompt:
生成5條「三角形面積」題目（已知底和高求面積）。
規則：
- 公式：底×高÷2
- 底在 4cm 至 20cm 之間，高在 3cm 至 16cm 之間
- 答案為整數（選擇底和高使積為偶數）
- 只輸出JSON
```

---

**D5. 面積（三角形，已知面積求底或高）**
- 說明：已知三角形面積和底（或高），求高（或底）
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「三角形面積」題目（已知面積和底求高，或已知面積和高求底）。
規則：
- 面積在 12 至 60 之間（cm²）
- 給出的底或高使計算結果為整數
- 格式：「右圖三角形面積是＿＿cm²，它的底/高是＿＿cm」
- 只輸出JSON
```

---

**D6. 面積（梯形）**
- 說明：求梯形面積，或已知面積和其中兩邊求第三邊
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「梯形面積」題目。
規則：
- 公式：（上底＋下底）×高÷2
- 難度1：已知上底、下底、高，求面積
- 難度2：已知面積、高、其中一個底，求另一個底
- 尺寸在 3cm 至 20cm 之間
- 答案為整數
- 只輸出JSON
```

---

**D7. 周界（長方形，已知一邊求另一邊）**
- 說明：已知周界和一邊，求另一邊長度
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「長方形周界」題目（已知周界和一邊求另一邊）。
規則：
- 周界在 20cm 至 100cm 之間（或轉換為米）
- 已知的一邊在整個長度的 1/4 至 1/3 之間
- 答案為整數，必須寫上單位
- 只輸出JSON
```

---

**D8. 周界（組合圖形）**
- 說明：L形、十字形等組合圖形的周界計算
- 難度：3
- 題型：填充

```
variation_prompt:
生成5條「組合圖形周界」文字題。
規則：
- 圖形為L形（由兩個長方形組成）
- 以文字描述：例如「從一張邊長30cm的正方形紙，剪去一個邊長20cm的小正方形後，剩下L形的周界是多少？」
- 答案為整數，需寫單位
- 只輸出JSON
```

---

**D9. 容量換算**
- 說明：量杯讀數、容量加減、mL和L換算
- 難度：1至2
- 題型：填充

```
variation_prompt:
生成5條「容量計算」題目。
規則：
- 涉及mL和L的換算（1L=1000mL）
- 情境：量杯、花瓶、水壺等
- 難度1：直接換算
- 難度2：兩個容器的水合併，求總容量
- 答案為整數mL
- 只輸出JSON
```

---

---

## 題目分類（小五下學期，新增18個文字題型）

以下題型從3份小五下學期試卷確認，是在小五上學期基礎上新增的內容。

---

### E. 小數

---

**E1. 小數加減**
- 說明：小數加減，包括括號混合運算
- 難度：1至2
- 題型：填充

```
variation_prompt:
生成5條「小數加減」填充題。
規則：
- 難度1：兩個小數相加或相減，最多兩位小數
- 難度2：包含括號，例如 A - (B + C) = ?
- 所有數字在 0.01 至 99.99 之間
- 答案不為負數
- 只輸出JSON
```

---

**E2. 小數乘法**
- 說明：小數×小數，或小數×小數×小數的連乘
- 難度：1至2
- 題型：填充

```
variation_prompt:
生成5條「小數乘法」填充題。
規則：
- 難度1：兩個小數相乘，每個數最多一位小數
- 難度2：三個小數連乘，或其中一個是兩位小數
- 答案保留至三位小數
- 只輸出JSON
```

---

**E3. 小數乘法規律識別**
- 說明：給出一個基本算式，判斷哪個變形算式結果最大或最小
- 難度：2
- 題型：選擇題

```
variation_prompt:
生成5條「小數乘法規律」選擇題。
規則：
- 給出一個基本算式 A × B，然後給出4個變形（改變小數點位置）
- 問哪個結果最大或最小
- 4個選項，只有一個正確
- 只輸出JSON
```

---

**E4. 小數位值識別**
- 說明：在含小數的數中，識別某個數字在哪個小數位，或某小數位上的數字代表的數值
- 難度：1
- 題型：填充 / 選擇題

```
variation_prompt:
生成5條「小數位值」題目。
規則：
- 給出一個含小數的數（最多三位小數）
- 問某個數字位於哪個位值（十分位/百分位/千分位）
- 或問某個數字代表的數值是多少
- 只輸出JSON
```

---

**E5. 取近似值（小數）**
- 說明：把小數取值至指定位數，或把大數取近似值至指定位
- 難度：1至2
- 題型：填充 / 選擇題

```
variation_prompt:
生成5條「取近似值」題目。
規則：
- 難度1：把小數取至一位或兩位小數
- 難度2：把大數取至萬位或十萬位；或把小數取至「適當」位值（情境題）
- 只輸出JSON
```

---

**E6. 小數應用題（加減）**
- 說明：含小數的日常情境加減應用題
- 難度：2
- 題型：列式計算

```
variation_prompt:
生成5條「小數加減應用題」。
規則：
- 涉及小數加減，香港日常情境（長度、重量、金錢）
- 最多兩步計算
- 答案保留至兩位小數
- 必須包含文字解說和單位
- 只輸出JSON
```

---

**E7. 小數應用題（乘除）**
- 說明：含小數的乘除應用題，例如單價×數量、平均分配
- 難度：2至3
- 題型：列式計算

```
variation_prompt:
生成5條「小數乘除應用題」。
規則：
- 涉及小數乘以整數，或小數除以整數
- 可包含「取至小數點後兩位」的要求
- 情境：購物、量度、速度等
- 只輸出JSON
```

---

### F. 分數除法

---

**F1. 整數除以分數**
- 說明：整數 ÷ 真分數 或 整數 ÷ 帶分數
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「整數除以分數」填充題。
規則：
- 格式：整數 ÷ 真分數，或整數 ÷ 帶分數
- 整數在 5 至 50 之間，分母不超過 12
- 答案化至最簡分數或帶分數
- 只輸出JSON
```

---

**F2. 帶分數除以分數**
- 說明：帶分數 ÷ 帶分數，或帶分數 ÷ 真分數
- 難度：3
- 題型：填充

```
variation_prompt:
生成5條「帶分數除以分數」填充題。
規則：
- 格式：帶分數 ÷ 真分數 或 帶分數 ÷ 帶分數
- 分母不超過 16，答案化至最簡
- 可包含多步分數除法應用（先求幾粒再求幾包）
- 只輸出JSON
```

---

**F3. 分數除法應用題（多步）**
- 說明：需要兩步或以上的分數除法，例如先除再除
- 難度：3
- 題型：列式計算

```
variation_prompt:
生成5條「多步分數除法應用題」。
規則：
- 情境：分配物品、包裝等
- 例如：有X克藥粉，每Y克製成一粒，每Z粒放一袋，需要多少袋？
- 涉及帶分數除法，答案可能需要進位（不夠一袋也要一袋）
- 只輸出JSON
```

---

### G. 代數與方程

---

**G1. 代數式表示**
- 說明：用代數式（含字母）表示數量關係
- 難度：1至2
- 題型：填充

```
variation_prompt:
生成5條「代數式」填充題。
規則：
- 給出文字描述，要求用代數式表示
- 例如：「每袋有a個，10袋多1個，共有___個」答案是「10a+1」
- 或：「有50元，買了5把間尺，每把m元，剩下___元」答案是「50-5m」
- 包含加減乘除的代數式，字母只用一個
- 只輸出JSON
```

---

**G2. 方程識別**
- 說明：判斷哪個算式是方程，或哪個不是方程
- 難度：1
- 題型：選擇題

```
variation_prompt:
生成5條「方程識別」選擇題。
規則：
- 給出4個算式，問哪個是方程（含等號和未知數）或哪個不是
- 選項包括：純等式（2+3=5）、含字母的等式、不等式等
- 只輸出JSON
```

---

**G3. 解方程（基礎）**
- 說明：解一元一次方程，涉及加減法
- 難度：2
- 題型：列式計算

```
variation_prompt:
生成5條「解方程」題目。
規則：
- 格式一：x + a = b（求x）
- 格式二：x - a = b（求x）
- 格式三：ax = b（求x）
- 格式四：x ÷ a = b（求x）
- 答案為整數或簡單分數
- 只輸出JSON
```

---

**G4. 方程應用題**
- 說明：用方程解決實際問題，需要設未知數，建立方程，解方程
- 難度：3
- 題型：列式計算

```
variation_prompt:
生成5條「方程應用題」，必須要求學生用方程作答。
規則：
- 設未知數、建立方程、解方程三步驟齊全
- 情境：分配物品、合計費用、年齡差等
- 答案為正整數
- 只輸出JSON
```

---

### H. 立體圖形

---

**H1. 立體圖形識別**
- 說明：根據描述或名稱識別立體圖形（正方體、長方體、三角柱、三角錐、四角柱、四角錐、圓柱、圓錐、球體）
- 難度：1
- 題型：填充 / 選擇題

```
variation_prompt:
生成5條「立體圖形識別」題目。
規則：
- 給出立體圖形的特徵描述，要求填入名稱
- 例如：「有4個面，全部都是三角形」 → 三角錐
- 或：「有一個曲面，從任何角度看都是圓形」 → 球體
- 只輸出JSON
```

---

**H2. 立體圖形屬性**
- 說明：識別各立體圖形的面數、頂點數、棱數
- 難度：1
- 題型：填充

```
variation_prompt:
生成5條「立體圖形屬性」填充題。
規則：
- 問題：某立體有多少個面/頂點/棱？
- 涉及：正方體、長方體、三角柱、三角錐、圓柱、圓錐
- 只輸出JSON
```

---

**H3. 立體體積（長方體/正方體）**
- 說明：用公式計算長方體或正方體體積，或已知體積和兩個維度求第三個
- 難度：2
- 題型：列式計算

```
variation_prompt:
生成5條「長方體/正方體體積」題目。
規則：
- 公式：長 × 寬 × 高
- 難度1：已知三個維度，求體積
- 難度2：已知體積和兩個維度，求第三個維度
- 尺寸在 2cm 至 20cm 之間，答案為整數
- 只輸出JSON
```

---

**H4. 柱體體積（底面積×高）**
- 說明：已知底面積和高，求柱體體積
- 難度：2
- 題型：填充 / 列式計算

```
variation_prompt:
生成5條「柱體體積」題目。
規則：
- 公式：體積 = 底面積 × 高
- 已知底面積（平方米/平方厘米）和高，求體積
- 底面積在 10 至 500 之間，高在 3 至 30 之間
- 只輸出JSON
```

---

### I. 其他新增（小五下）

---

**I1. 假分數與帶分數互化**
- 說明：把假分數化成帶分數，或帶分數化成假分數
- 難度：1
- 題型：填充

```
variation_prompt:
生成5條「假分數與帶分數互化」題目。
規則：
- 難度1：把假分數化成帶分數（例如 15/4 = ?）
- 難度2：把帶分數化成假分數（例如 15又3/16 = ?）
- 分母不超過 20
- 只輸出JSON
```

---

**I2. 旋轉對稱識別**
- 說明：判斷哪種圖形是旋轉對稱圖形（或不是）
- 難度：1
- 題型：選擇題
- 備注：此題型涉及圖形，Phase 1 暫時以文字描述代替

```
variation_prompt:
生成5條「旋轉對稱」選擇題（純文字版）。
規則：
- 給出4種圖形的文字描述，問哪個不是旋轉對稱圖形
- 旋轉對稱圖形：正方形、長方形、等邊三角形、正六邊形、圓形
- 非旋轉對稱圖形：梯形、不規則三角形、直角三角形
- 只輸出JSON
```

---

**I3. 容量換算（進階）**
- 說明：升與毫升的大數換算（例如 50升 20毫升 = ? 毫升）
- 難度：2
- 題型：填充

```
variation_prompt:
生成5條「容量換算」題目。
規則：
- 格式：X升Y毫升 = ?毫升，或 ?毫升 = X升Y毫升
- X在 1 至 100 之間，Y在 1 至 999 之間
- 只輸出JSON
```

---

**I4. 時間計算（行程時間）**
- 說明：根據出發時間和行程時間（小時+分鐘），計算到達時間或相差時間
- 難度：2
- 題型：填充 / 列式計算

```
variation_prompt:
生成5條「時間計算」題目。
規則：
- 類型A：給出出發時間和行程時長，求到達時間（24小時制）
- 類型B：給出出發和到達時間，求行程時長（X小時Y分鐘）
- 時間跨越上午/下午
- 只輸出JSON
```

---

### 小五下學期題型總覽表（新增18個）

| 編號 | 題型名稱 | 分類 | 難度 | 年級學期 |
|------|---------|------|------|---------|
| E1 | 小數加減 | 小數 | 1至2 | 小五下 |
| E2 | 小數乘法 | 小數 | 1至2 | 小五下 |
| E3 | 小數乘法規律 | 小數 | 2 | 小五下 |
| E4 | 小數位值識別 | 小數 | 1 | 小五下 |
| E5 | 取近似值 | 小數 | 1至2 | 小五下 |
| E6 | 小數應用題（加減）| 小數 | 2 | 小五下 |
| E7 | 小數應用題（乘除）| 小數 | 2至3 | 小五下 |
| F1 | 整數除以分數 | 分數除法 | 2 | 小五下 |
| F2 | 帶分數除以分數 | 分數除法 | 3 | 小五下 |
| F3 | 分數除法應用題 | 分數除法 | 3 | 小五下 |
| G1 | 代數式表示 | 代數與方程 | 1至2 | 小五下 |
| G2 | 方程識別 | 代數與方程 | 1 | 小五下 |
| G3 | 解方程（基礎）| 代數與方程 | 2 | 小五下 |
| G4 | 方程應用題 | 代數與方程 | 3 | 小五下 |
| H1 | 立體圖形識別 | 立體圖形 | 1 | 小五下 |
| H2 | 立體圖形屬性 | 立體圖形 | 1 | 小五下 |
| H3 | 立體體積（長方體）| 立體圖形 | 2 | 小五下 |
| H4 | 柱體體積 | 立體圖形 | 2 | 小五下 |
| I1 | 假分數與帶分數互化 | 其他 | 1 | 小五下 |
| I2 | 旋轉對稱識別 | 其他 | 1 | 小五下 |
| I3 | 容量換算（進階）| 其他 | 2 | 小五下 |
| I4 | 時間計算（行程）| 其他 | 2 | 小五下 |

---

## Claude Code 開發設定

由於這個 project 用 Claude Code 來 build，以下是給 Claude Code 的重要指示。

### 建議的 CLAUDE.md 位置

```
project-root/
  CLAUDE.md          ← 這份文件放在根目錄
  src/
  supabase/
  ...
```

### Claude Code 指令優先順序

Claude Code 每次開始工作時，必須先閱讀這份 CLAUDE.md，了解：
1. 整個 project 的架構和目標
2. 目前是哪個 Sprint
3. 當前任務涉及哪些題型分類

### 資料庫 Seed 資料

開始 build 前，Claude Code 需要先跑以下 seed，把所有題型分類插入 `question_categories` 表：

```sql
-- 小五上學期（A至D類，32個）
INSERT INTO question_categories (name, grade, semester, code) VALUES
('因數識別', 5, '上', 'A1'),
('倍數識別', 5, '上', 'A2'),
('最大公因數 HCF', 5, '上', 'A3'),
('最小公倍數 LCM', 5, '上', 'A4'),
('第N個公倍數', 5, '上', 'A5'),
('大數運算與數位識別', 5, '上', 'A6'),
('等值分數填充', 5, '上', 'B1'),
('分數大小比較', 5, '上', 'B2'),
('分數大小排列', 5, '上', 'B3'),
('真分數加減（異分母）', 5, '上', 'B4'),
('帶分數加減（同分母）', 5, '上', 'B5'),
('帶分數加減（異分母）', 5, '上', 'B6'),
('整數減帶分數', 5, '上', 'B7'),
('三個分數混合加減', 5, '上', 'B8'),
('分數乘法', 5, '上', 'B9'),
('分數估算', 5, '上', 'B10'),
('整數應用題（買賣找錢）', 5, '上', 'C1'),
('整數應用題（分組餘數）', 5, '上', 'C2'),
('整數應用題（儲蓄計劃）', 5, '上', 'C3'),
('分數應用題（日常加減）', 5, '上', 'C4'),
('分數應用題（乘法求部分）', 5, '上', 'C5'),
('帶分數應用題（價錢）', 5, '上', 'C6'),
('數學規律題', 5, '上', 'C7'),
('量度單位填充', 5, '上', 'D1'),
('面積（長方形/正方形）', 5, '上', 'D2'),
('面積（平行四邊形）', 5, '上', 'D3'),
('面積（三角形，正向）', 5, '上', 'D4'),
('面積（三角形，逆向）', 5, '上', 'D5'),
('面積（梯形）', 5, '上', 'D6'),
('周界（長方形）', 5, '上', 'D7'),
('周界（組合圖形）', 5, '上', 'D8'),
('容量換算', 5, '上', 'D9');

-- 小五下學期（E至I類，22個）
INSERT INTO question_categories (name, grade, semester, code) VALUES
('小數加減', 5, '下', 'E1'),
('小數乘法', 5, '下', 'E2'),
('小數乘法規律', 5, '下', 'E3'),
('小數位值識別', 5, '下', 'E4'),
('取近似值', 5, '下', 'E5'),
('小數應用題（加減）', 5, '下', 'E6'),
('小數應用題（乘除）', 5, '下', 'E7'),
('整數除以分數', 5, '下', 'F1'),
('帶分數除以分數', 5, '下', 'F2'),
('分數除法應用題', 5, '下', 'F3'),
('代數式表示', 5, '下', 'G1'),
('方程識別', 5, '下', 'G2'),
('解方程（基礎）', 5, '下', 'G3'),
('方程應用題', 5, '下', 'G4'),
('立體圖形識別', 5, '下', 'H1'),
('立體圖形屬性', 5, '下', 'H2'),
('立體體積（長方體）', 5, '下', 'H3'),
('柱體體積', 5, '下', 'H4'),
('假分數與帶分數互化', 5, '下', 'I1'),
('旋轉對稱識別', 5, '下', 'I2'),
('容量換算（進階）', 5, '下', 'I3'),
('時間計算（行程）', 5, '下', 'I4');
```

### 小六題型（待補充）

小六 past paper 分析完成後在此加入。預計新增題型：百分數、比、速度、圓形面積、立體表面積、負數、進階代數。格式與小五章節一致。

---

### question_categories 表需更新的 Schema

```sql
ALTER TABLE question_categories ADD COLUMN semester text; -- '上' or '下'
ALTER TABLE question_categories ADD COLUMN code text;     -- 例如 'A1', 'B3'
```

### Phase 1 建議起步順序（給 Claude Code）

Sprint 1 先只做這幾個最常考、最容易出純文字題的分類：
- B4（真分數加減）、B6（帶分數加減異分母）、B8（三個分數混合加減）
- A3（HCF）、A4（LCM）
- E1（小數加減）、E6（小數應用題）
- G3（解方程基礎）

這8個分類覆蓋了大約40%的考試分數，且全部純文字，無需圖片。

---

## Phase 1：題目系統 + 學生練習

### 功能要求

**老師端（管理員）**
- 上傳題目（支援文字和圖片）
- 選擇題型（選擇題 / 填充 / 計算題）
- 指定分類、年級、難度
- 管理題目庫（啟用 / 停用）

**學生端**
- 登入後選擇練習（按分類或隨機）
- 手機介面：一頁一題
- 選擇題：四個選項按鈕
- 填充題：數字鍵盤輸入
- 即時回饋：答對顯示綠色 ✓，答錯顯示紅色 ✗ 並顯示正確答案
- 完成練習後顯示總結（答對幾題、錯了哪類型）
- 系統自動記錄錯題到錯題庫

**錯題重練流程**
- 主頁顯示「待改善題型」提示（例如：「你有 5 題分數加減需要重練」）
- 進入重練模式，只做自己的錯題
- 同一題做對兩次後，從錯題庫移除

### UI 組件（手機優先）

```
頁面結構：
/ 首頁（學生主頁）
  - 今日練習建議
  - 錯題提醒
  - 進度概覽（按分類的正確率圓圈）

/practice 練習選擇
  - 按分類選擇
  - 隨機練習
  - 重練錯題

/practice/[sessionId]/[questionIndex] 答題頁面
  - 進度條（第幾題/共幾題）
  - 題目（文字或圖片）
  - 答案選項或輸入框
  - 提交按鈕

/results/[sessionId] 練習結果
  - 分數動畫
  - 按分類顯示錯誤
  - 「重練錯題」按鈕

/wrong-bank 錯題庫
  - 按分類列出錯題數量
  - 進入重練

/admin 管理員介面
  - 題目管理
  - 學生數據
```

---

## Phase 2：AI 生成 Variation

### 功能要求

- 當學生某類題型錯誤超過閾值（預設 3 題），系統觸發 variation 生成
- 呼叫 Claude API，根據 variation_templates 的 prompt 生成 5 至 10 條新題目
- 生成的題目存入 `generated_questions`，標記 `is_approved: false`
- 老師在後台可以 review 並 approve 這些題目
- Approved 的題目加入學生的練習隊列

### Claude API Prompt 設計原則

每個分類需要一個 variation_template，包含：

```
system: 你是香港小學數學出題老師，請生成繁體中文題目。
        題目必須符合香港小五或小六課程範圍。
        只輸出 JSON，不要任何解釋。

user: 分類：分數加減
      參考題目：1/2 + 1/3 = ___
      限制條件：分母不超過 12，答案為真分數或帶分數，不超過 3
      請生成 5 條類似但數字不同的題目。
      
      輸出格式：
      {
        "questions": [
          {
            "question_text": "...",
            "question_type": "fill_in",
            "correct_answer": "...",
            "difficulty": 1
          }
        ]
      }
```

### 老師後台（Variation Review）

```
/admin/variations
  - 列出待審核的 AI 生成題目
  - 每題可以：✓ 批准 / ✗ 拒絕 / ✏️ 修改後批准
  - 過濾器：按分類、按生成日期
  - 統計：每個分類有多少已批准 variation
```

---

## Phase 3：Past Paper 上載 + AI 識別

### 功能要求

**家長端**
- 拍照上載 past paper（支援多頁）
- 填寫資料：學校名稱、年級、考試年份、考試名稱
- 上載後看到「待審核」狀態
- 審核通過後獲得 token

**AI 處理流程**

```
1. 家長上載圖片 -> 存入 Supabase Storage
2. 呼叫 Claude Vision API 分析每頁
3. Claude 輸出 JSON：
   {
     "questions": [
       {
         "question_text": "下列哪個數不是30的因數？",
         "question_type": "multiple_choice",
         "options": ["A. 1", "B. 10", "C. 30", "D. 60"],
         "suggested_answer": "D. 60",
         "suggested_category": "因數與倍數",
         "suggested_difficulty": 1,
         "has_image": false,
         "page_number": 1
       }
     ]
   }
4. 結果存入 past_paper_uploads.ai_extracted_questions
5. 老師在後台 review，修改後批准
6. 批准的題目加入 questions 表，標記 source='past_paper'
7. 家長獲得 token：每頁 10 tokens
```

**Claude Vision Prompt**

```
system: 你是香港小學數學試卷分析助手，請識別試卷上的題目。
        只輸出 JSON，不要任何解釋或 markdown。
        
user: [圖片]
      請識別這頁試卷上的所有數學題目。
      對每道題目，提取：題目文字、題型、選項（如有）、建議答案、建議分類。
      分類必須從以下選擇：[分類列表]
      如題目包含圖形，has_image 設為 true。
      輸出格式：{ "questions": [...] }
```

**老師後台（Past Paper Review）**

```
/admin/past-papers
  - 列出所有上載記錄（按狀態過濾）
  - 點開查看：原圖 + AI 提取結果並排顯示
  - 逐題確認：修改題目文字、類型、答案、分類
  - 全部確認後點「批准」-> 題目加入庫、家長獲 token
  - 可以「拒絕」並填理由
```

---

## Phase 4：Token 系統

### Token 規則

| 行為 | Token 獲得 |
|------|-----------|
| 上載 past paper，每頁批准 | +10 tokens |
| 補習社特別活動（老師手動發放） | 可變 |

| 兌換選項 | Token 消耗 |
|---------|-----------|
| 課程折扣 $50 | 100 tokens |
| 課程折扣 $100 | 180 tokens |
| 免費試堂 1 次 | 300 tokens |

（以上數字可由老師在後台調整）

### 家長端 Token 頁面

```
/parent/tokens
  - 目前 token 餘額（大數字顯示）
  - 兌換選項卡片
  - 交易歷史記錄

/parent/upload
  - 上載 past paper 介面
  - 說明可獲得的 token 數量
  - 上載進度和狀態追蹤
```

---

## 題目類型前端對應

| question_type   | 學生看到          | 輸入方式                   |
|----------------|-----------------|--------------------------|
| multiple_choice | A/B/C/D 按鈕     | 點按選項                   |
| fill_in         | 文字輸入框        | 系統鍵盤打字                |
| fill_in_number  | 自定義數字鍵盤     | 含數字、/、又、、（4×4 格）  |
| calculation     | 答案輸入 + 提示   | 數字鍵盤（簡化版），提示草稿紙 |

實作位置：`src/app/student/practice/[sessionId]/PracticeFlow.tsx`

---

## 手機 UX 設計規範

答題頁面設計原則（參考 Duolingo）：

```
頁面佈局（由上至下）：
1. 頂部：進度條 + 退出按鈕（佔 8% 高度）
2. 中部：題目區域（佔 50% 高度）
   - 題目文字：font-size 18px，行距 1.6
   - 圖片：佔滿寬度，保持比例
3. 下部：答案區域（佔 42% 高度）
   - 選擇題：4 個大按鈕，每個高度 56px，圓角 12px
   - 填充題：大數字鍵盤，中間顯示輸入框
   - 提交按鈕：底部固定，高度 56px，主色

答題回饋：
- 答對：按鈕變綠，底部綠色橫條顯示「答對了！✓」
- 答錯：按鈕變紅，底部紅色橫條顯示「正確答案是 X」
- 停留 1.5 秒後自動進入下一題

顏色規範：
- 主色：#4A90E2（藍）
- 答對：#4CAF50（綠）
- 答錯：#F44336（紅）
- 背景：#F5F5F5（淺灰）
- 卡片背景：#FFFFFF
```

---

## 開發優先順序

### Sprint 1（2 至 3 週）：基礎骨架
- Supabase 設置（Auth + DB + Storage）
- 老師後台：上傳題目（文字題）
- 學生：登入、做題、即時回饋
- 基本錯題記錄

### Sprint 2（2 至 3 週）：核心練習功能
- 錯題庫頁面
- 重練錯題模式
- 學生進度儀表板
- 家長查看子女進度

### Sprint 3（2 至 3 週）：AI Variation
- 接入 Claude API
- Variation 生成邏輯
- 老師 Variation Review 後台

### Sprint 4（3 至 4 週）：Past Paper 系統
- 家長上載介面
- Claude Vision 分析
- 老師 Review 後台
- Token 發放邏輯

### Sprint 5（1 至 2 週）：Token 兌換
- Token 餘額顯示
- 兌換申請
- 老師審批兌換

---

## 環境變量

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=

# Google Gemini
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
TOKENS_PER_PAPER_PAGE=10
```

---

## 重要注意事項

1. **圖形題處理**：部分題目有圖形（三角形面積、梯形等），Phase 1 先用圖片 URL 存儲，Phase 3 的 OCR 需要老師人工補充圖片。

2. **答案格式**：分數答案需要統一格式（例如「5/6」或「1又5/6」），填充題需要做模糊匹配（例如「5/6」和「5 / 6」視為相同）。

3. **離線支援**：不需要，網絡連接即可。

4. **多語言**：只用繁體中文，不需要切換語言。

5. **Token 不能轉讓**：Token 綁定家長帳號，不能轉移給其他家長。

6. **題目版權**：Past paper 題目標記來源學校，僅供學習使用，不公開展示給其他學校的學生。
