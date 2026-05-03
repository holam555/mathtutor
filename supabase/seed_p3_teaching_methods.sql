-- P3 Teaching Methods Seed
-- Extracted from Hong Kong P3 Math Curriculum PDF (64 pages → 61 actual pages)
-- Source: /tmp/p3_curr-01.png through /tmp/p3_curr-61.png
-- Covers 3A (Lessons 1-18, excluding L10 review) and 3B (Lessons 21-36, excluding L19, L20, L30, L37-40)
-- Sections: 維度三 CPA教學話術 + 維度四 SOP高階解題/防錯機制
-- Generated: 2026-05-02

-- ============================================================
-- 3A LESSONS (第 1–18 堂，共 17 堂)
-- ============================================================

-- Lesson 1: 認識數的位值（大數讀寫）
UPDATE curriculum_topics SET teaching_methods = '["讀數分節口訣", "數位點格法", "大數數分組讀法", "數位vs數值辨別法"]'::jsonb WHERE lesson_number = 1;

-- Lesson 2: 五位數的大小和數字排列
UPDATE curriculum_topics SET teaching_methods = '["位值比較法", "最高位比先法", "位值大小直排比較"]'::jsonb WHERE lesson_number = 2;

-- Lesson 3: 三位數加法式直式計算
UPDATE curriculum_topics SET teaching_methods = '["豎式對齊法", "同位相加口訣", "進位圓圈法", "加法算盤口訣"]'::jsonb WHERE lesson_number = 3;

-- Lesson 4: 三位數加法綜合應用題
UPDATE curriculum_topics SET teaching_methods = '["連環進位法", "豎式標記法", "逐步加法解題框架", "求未知數拆解法"]'::jsonb WHERE lesson_number = 4;

-- Lesson 5: 三位數減法直式減退位
UPDATE curriculum_topics SET teaching_methods = '["豎式退位法", "退位標色法", "直退位減法口訣", "數位對齊標記"]'::jsonb WHERE lesson_number = 5;

-- Lesson 6: 數位退位（連零退位）難點突破
UPDATE curriculum_topics SET teaching_methods = '["連環退位法", "九十法則", "有零退位標記法", "零位分解補數法"]'::jsonb WHERE lesson_number = 6;

-- Lesson 7: 加減混合計算和應用題
UPDATE curriculum_topics SET teaching_methods = '["雙豎式法", "加減混合複核法", "減法複核驗算", "逆向驗算法"]'::jsonb WHERE lesson_number = 7;

-- Lesson 8: 兩步加減法文字題解題技巧
UPDATE curriculum_topics SET teaching_methods = '["逆向解題SOP", "加減混合分拆法", "關鍵字標記法", "正向逐步解題"]'::jsonb WHERE lesson_number = 8;

-- Lesson 9: 一位數乘法直式連進（乘數1-3）
UPDATE curriculum_topics SET teaching_methods = '["乘法直式口訣", "連乘進位法", "積的估算法", "豎有有待標記貼貼"]'::jsonb WHERE lesson_number = 9;

-- Lesson 11: 一位數乘三位數直式連進
UPDATE curriculum_topics SET teaching_methods = '["連進位標記法", "逐位乘法SOP", "末尾有零處理法", "乘法豎式背靠背"]'::jsonb WHERE lesson_number = 11;

-- Lesson 12: 除數整除應用題
UPDATE curriculum_topics SET teaching_methods = '["除法試商法", "餘數處理SOP", "商的估算法", "逆向乘法驗算"]'::jsonb WHERE lesson_number = 12;

-- Lesson 13: 乘除混合計算應用題
UPDATE curriculum_topics SET teaching_methods = '["混合運算順序口訣", "先乘除後加減法則", "括號優先處理法", "逐步計算框架"]'::jsonb WHERE lesson_number = 13;

-- Lesson 14: 長度單位換算（公里、米）
UPDATE curriculum_topics SET teaching_methods = '["大單位化小單位法", "長度換算口訣", "長度比較階梯法", "單位換算直式"]'::jsonb WHERE lesson_number = 14;

-- Lesson 15: 時間認識（分鐘換算）
UPDATE curriculum_topics SET teaching_methods = '["時鐘讀法SOP", "分鐘秒換算口訣", "時間計算豎式", "時間換算階梯法"]'::jsonb WHERE lesson_number = 15;

-- Lesson 16: 24小時制與AM/PM互化
UPDATE curriculum_topics SET teaching_methods = '["AM/PM轉換法", "12/24互換口訣", "24小時制時間線", "跨午時間計算法"]'::jsonb WHERE lesson_number = 16;

-- Lesson 17: 克、公斤換算應用題
UPDATE curriculum_topics SET teaching_methods = '["公斤化克法", "空心公式", "重量換算口訣", "克公斤直式換算"]'::jsonb WHERE lesson_number = 17;

-- Lesson 18: 重量合併計算（淨重/毛重）
UPDATE curriculum_topics SET teaching_methods = '["淨重毛重辨別法", "重量合併計算框架", "重量估算法", "重量應用題SOP"]'::jsonb WHERE lesson_number = 18;

-- ============================================================
-- 3B LESSONS (第 21–36 堂，共 15 堂)
-- ============================================================

-- Lesson 21: 三位數除以二位數直式（一）
UPDATE curriculum_topics SET teaching_methods = '["除法試商SOP", "豎式試商直式", "試商調整法", "頭數大直接除法"]'::jsonb WHERE lesson_number = 21;

-- Lesson 22: 商中/除法有零等分難點突破（二）
UPDATE curriculum_topics SET teaching_methods = '["商中有零防錯法", "直接補零法", "心算試商檢驗", "豎式商零標記"]'::jsonb WHERE lesson_number = 22;

-- Lesson 23: 除法應用題（一）
UPDATE curriculum_topics SET teaching_methods = '["逆向問題解題SOP", "正向逐步解題", "餘數判斷法", "除法應用拆解法"]'::jsonb WHERE lesson_number = 23;

-- Lesson 24: 分數的意義（初步認識）
UPDATE curriculum_topics SET teaching_methods = '["分數圖像法", "整體分割教學法", "分子分母辨別口訣", "分母越大越小法則"]'::jsonb WHERE lesson_number = 24;

-- Lesson 25: 分數的部分聯繫
UPDATE curriculum_topics SET teaching_methods = '["連帶整數分數表示", "圖形分數法", "分數部分直觀教法", "個個都有一份法"]'::jsonb WHERE lesson_number = 25;

-- Lesson 26: 同分母分數大小比較（一）
UPDATE curriculum_topics SET teaching_methods = '["同分母比分子法", "分數數線比較法", "12/24換化法", "AM分數鐘面法"]'::jsonb WHERE lesson_number = 26;

-- Lesson 27: 分數的加法等分聯繫
UPDATE curriculum_topics SET teaching_methods = '["分數圖像加法", "等分段加法法則", "空心公式", "分數結合律應用"]'::jsonb WHERE lesson_number = 27;

-- Lesson 28: 角的識別分類
UPDATE curriculum_topics SET teaching_methods = '["角的三要素識別", "角度無限延長法", "動態角度教學法", "角的教數分類SOP"]'::jsonb WHERE lesson_number = 28;

-- Lesson 29: 三角形的分類與特徵
UPDATE curriculum_topics SET teaching_methods = '["第一條邊繼續法", "等邊三角形記憶法", "正直角三角形辨別法", "轉動與縮放三角形"]'::jsonb WHERE lesson_number = 29;

-- Lesson 31: 升、毫升認識與量杯容量閱讀情境
UPDATE curriculum_topics SET teaching_methods = '["量杯讀數SOP", "容量換算三步法", "逐格計算容量法", "容量升毫升口訣"]'::jsonb WHERE lesson_number = 31;

-- Lesson 32: 容量合併計算（倒出）應用題
UPDATE curriculum_topics SET teaching_methods = '["倒入倒出容量計算框架", "容量減法應用SOP", "容量應用題拆解法", "剩餘容量估算"]'::jsonb WHERE lesson_number = 32;

-- Lesson 33: 經過時間計算60進制換算（一）
UPDATE curriculum_topics SET teaching_methods = '["時間計算豎式", "60進制換算法", "時間段計算SOP", "鐘面時間計算法"]'::jsonb WHERE lesson_number = 33;

-- Lesson 34: 行程表閱讀時間解題
UPDATE curriculum_topics SET teaching_methods = '["行程表閱讀SOP", "等車時間計算法", "跨日行程跳線法", "行程表圓形標記"]'::jsonb WHERE lesson_number = 34;

-- Lesson 35: 香港常見貨幣認識的費用計算
UPDATE curriculum_topics SET teaching_methods = '["貨幣面值辨別法", "湊錢計算最簡法", "小數點找錢算法", "鈔票計算單位法"]'::jsonb WHERE lesson_number = 35;

-- Lesson 36: 找錢與湊錢情境應用題
UPDATE curriculum_topics SET teaching_methods = '["逐步湊錢減法SOP", "逐件計算最簡法", "小數點對齊找錢法", "找錢總數計算法"]'::jsonb WHERE lesson_number = 36;
