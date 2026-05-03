-- Sprint 8 seed: P3 課程大綱 (大單元 + 小單元)
-- Source: 【天花板級別】香港小學三年級全學年40堂課程終極教研大綱
-- 17 大單元 + 32 小單元 (excludes 7 review/special lessons: L10/L19/L20 in 3A; L30/L37/L38/L39/L40 in 3B)
--
-- Run AFTER 0014_p3_curriculum_assessment.sql migration.
-- Idempotent: clears P3 rows then re-inserts.

BEGIN;

DELETE FROM curriculum_topics
  WHERE unit_id IN (SELECT id FROM curriculum_units WHERE grade = 3);
DELETE FROM curriculum_units WHERE grade = 3;

-- ============================================================================
-- 3A 上學期 (9 大單元, 17 小單元)
-- ============================================================================

WITH ins AS (
  INSERT INTO curriculum_units (grade, semester, unit_number, name, textbook_ref, display_order)
  VALUES
    (3, 'A', 1, '五位數',          '3A 單元 1 五位數',          1),
    (3, 'A', 2, '加法',            '3A 單元 2 加法',            2),
    (3, 'A', 3, '減法',            '3A 單元 3 減法',            3),
    (3, 'A', 4, '加減混合計算',     '3A 單元 4 加減混合計算',     4),
    (3, 'A', 5, '乘法（一）',       '3A 單元 5 乘法（一）',       5),
    (3, 'A', 6, '乘法（二）',       '3A 單元 6 乘法（二）',       6),
    (3, 'A', 7, '毫米和公里',       '3A 單元 7 毫米和公里',       7),
    (3, 'A', 8, '時間（一）',       '3A 單元 8 時間（一）',       8),
    (3, 'A', 9, '重量',            '3A 單元 9 重量',            9)
  RETURNING id, unit_number
)
INSERT INTO curriculum_topics (unit_id, lesson_number, name, display_order)
SELECT ins.id, t.lesson_number, t.name, t.display_order
FROM ins
JOIN (VALUES
  -- 單元 1 五位數
  (1, 1,  '五位數的認識與規範讀寫',           1),
  (1, 2,  '五位數的位值、大小比較與排列',     2),
  -- 單元 2 加法
  (2, 3,  '三位數加法直式與連續進位',         1),
  (2, 4,  '三數連加與加法綜合應用題',         2),
  -- 單元 3 減法
  (3, 5,  '三位數減法直式與連續退位',         1),
  (3, 6,  '隔位退位減法（世紀難點）專項突破', 2),
  -- 單元 4 加減混合計算
  (4, 7,  '加減混合運算與括號的運用',         1),
  (4, 8,  '兩步加減逆向文字題專項突破',       2),
  -- 單元 5 乘法（一）
  (5, 9,  '一位數乘兩位數直式與進位規則',     1),
  -- 單元 6 乘法（二）
  (6, 11, '一位數乘三位數直式與連續進位',     1),
  (6, 12, '倍數關係與乘法綜合應用題',         2),
  -- 單元 7 毫米和公里
  (7, 13, '毫米、公里與長度單位全體系換算',   1),
  (7, 14, '長度量度與長度綜合應用題',         2),
  -- 單元 8 時間（一）
  (8, 15, '時分秒認識與鐘面時間精準讀取',     1),
  (8, 16, '24小時報時制與AM/PM互化專項',      2),
  -- 單元 9 重量
  (9, 17, '克、公斤認識與秤的刻度解碼',       1),
  (9, 18, '重量綜合應用題（淨重/毛重）專項',  2)
) AS t(unit_number, lesson_number, name, display_order)
ON ins.unit_number = t.unit_number;

-- ============================================================================
-- 3B 下學期 (8 大單元, 15 小單元)
-- 大單元 unit_number continues from 10 to keep them distinct from 3A
-- (3A used 1-9; 3B uses 10-17)
-- display_order continues 10-17 across the whole grade
-- ============================================================================

WITH ins AS (
  INSERT INTO curriculum_units (grade, semester, unit_number, name, textbook_ref, display_order)
  VALUES
    (3, 'B', 10, '除法（二）',                '3B 單元 1 除法（二）',                10),
    (3, 'B', 11, '分數的初步認識（一）',       '3B 單元 2 分數的初步認識（一）',       11),
    (3, 'B', 12, '分數的初步認識（二）',       '3B 單元 3 分數的初步認識（二）',       12),
    (3, 'B', 13, '角的認識',                  '3B 單元 4 角的認識',                  13),
    (3, 'B', 14, '三角形',                    '3B 單元 5 三角形',                    14),
    (3, 'B', 15, '容量',                      '3B 單元 6 容量',                      15),
    (3, 'B', 16, '時間與行程表',              '3B 單元 7 時間與行程表',              16),
    (3, 'B', 17, '香港的貨幣',                '3B 單元 8 香港的貨幣',                17)
  RETURNING id, unit_number
)
INSERT INTO curriculum_topics (unit_id, lesson_number, name, display_order)
SELECT ins.id, t.lesson_number, t.name, t.display_order
FROM ins
JOIN (VALUES
  -- 單元 1 除法（二）
  (10, 21, '三位數除以一位數基礎直式',         1),
  (10, 22, '商中間/末尾有零的除法專項突破',    2),
  (10, 23, '除法進一法/去尾法應用題專項',      3),
  -- 單元 2 分數的初步認識（一）
  (11, 24, '分數的意義與等分概念',             1),
  (11, 25, '分數的整體與部分關係',             2),
  -- 單元 3 分數的初步認識（二）
  (12, 26, '同分母/同分子分數大小比較',         1),
  (12, 27, '分數綜合應用題專項突破',           2),
  -- 單元 4 角的認識
  (13, 28, '角的認識與分類',                   1),
  -- 單元 5 三角形
  (14, 29, '三角形的分類與特徵',               1),
  -- 單元 6 容量
  (15, 31, '升、毫升認識與量杯刻度解碼',       1),
  (15, 32, '容量綜合應用題（倒入倒出）專項',   2),
  -- 單元 7 時間與行程表
  (16, 33, '經過時間計算與60進制加減',         1),
  (16, 34, '行程表閱讀與時間綜合應用',         2),
  -- 單元 8 香港的貨幣
  (17, 35, '香港的貨幣認識與款項計算',         1),
  (17, 36, '找續與湊幣專項應用題',             2)
) AS t(unit_number, lesson_number, name, display_order)
ON ins.unit_number = t.unit_number;

COMMIT;

-- Sanity checks
-- SELECT count(*) AS units FROM curriculum_units WHERE grade = 3;       -- expect 17
-- SELECT count(*) AS topics FROM curriculum_topics
--   WHERE unit_id IN (SELECT id FROM curriculum_units WHERE grade = 3); -- expect 32
