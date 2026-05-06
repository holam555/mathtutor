-- P5 課程大綱 (大單元 + 小單元)
-- Source: 【天花板級別】香港小學五年級全學年40堂課程終極教研大綱（呈分試專用）
-- 19 大單元 + 35 小單元 (excludes 5 review/special lessons: L10/L20 in 5A; L30/L39/L40 in 5B)
--
-- Run AFTER 0014_p3_curriculum_assessment.sql migration (schema is grade-aware).
-- Idempotent: clears P5 rows then re-inserts.

BEGIN;

DELETE FROM curriculum_topics
  WHERE unit_id IN (SELECT id FROM curriculum_units WHERE grade = 5);
DELETE FROM curriculum_units WHERE grade = 5;

-- ============================================================================
-- 5A 上學期 (9 大單元, 18 小單元)
-- display_order 1-9 for units; topic display_order 1-N within each unit
-- ============================================================================

WITH ins AS (
  INSERT INTO curriculum_units (grade, semester, unit_number, name, textbook_ref, display_order)
  VALUES
    (5, 'A', 1, '多位數',                '5A 單元 1 多位數',                1),
    (5, 'A', 2, '異分母分數加法和減法',  '5A 單元 2 異分母分數加法和減法',  2),
    (5, 'A', 3, '分數乘法',              '5A 單元 3 分數乘法',              3),
    (5, 'A', 4, '代數符號',              '5A 單元 4 代數符號',              4),
    (5, 'A', 5, '簡易方程（一）',        '5A 單元 5 簡易方程（一）',        5),
    (5, 'A', 6, '方向',                  '5A 單元 6 方向',                  6),
    (5, 'A', 7, '多邊形的面積',          '5A 單元 7 多邊形的面積',          7),
    (5, 'A', 8, '體積的認識',            '5A 單元 8 體積的認識',            8),
    (5, 'A', 9, '複合棒形圖',            '5A 單元 9 複合棒形圖',            9)
  RETURNING id, unit_number
)
INSERT INTO curriculum_topics (unit_id, lesson_number, name, display_order)
SELECT ins.id, t.lesson_number, t.name, t.display_order
FROM ins
JOIN (VALUES
  -- 單元 1 多位數
  (1, 1,  '多位數的認識：數位與讀寫',                          1),
  (1, 2,  '多位數的四捨五入與估算',                            2),
  -- 單元 2 異分母分數加法和減法
  (2, 3,  '異分母分數加減法：通分基礎',                        1),
  (2, 4,  '異分母分數加減法：基礎計算',                        2),
  (2, 5,  '異分母分數加減法：帶分數與連續退位減法',            3),
  -- 單元 3 分數乘法
  (3, 6,  '分數乘法：整數乘分數',                              1),
  (3, 7,  '分數乘法：分數乘分數與交叉約簡',                    2),
  (3, 8,  '分數乘法：帶分數乘法與綜合應用',                    3),
  -- 單元 4 代數符號
  (4, 9,  '代數符號：用字母表示數',                            1),
  (4, 11, '代數符號：用字母表示數量關係與化簡',                2),
  -- 單元 5 簡易方程（一）
  (5, 12, '簡易方程（一）：方程的意義與一步加減法方程',        1),
  (5, 13, '簡易方程（一）：一步乘除法方程與應用題',            2),
  -- 單元 6 方向
  (6, 14, '方向：八方位與相對方向',                            1),
  -- 單元 7 多邊形的面積
  (7, 15, '多邊形的面積：平行四邊形與三角形面積',              1),
  (7, 16, '多邊形的面積：梯形與組合圖形面積',                  2),
  -- 單元 8 體積的認識
  (8, 17, '體積的認識：體積單位與正方體/長方體體積',           1),
  (8, 18, '體積的認識：立體圖形積木點算與體積變化',            2),
  -- 單元 9 複合棒形圖
  (9, 19, '複合棒形圖',                                        1)
) AS t(unit_number, lesson_number, name, display_order)
ON ins.unit_number = t.unit_number;

-- ============================================================================
-- 5B 下學期 (10 大單元, 17 小單元)
-- 大單元 unit_number continues from 10 to keep them distinct from 5A
-- (5A used 1-9; 5B uses 10-19)
-- display_order continues 10-19 for units; 18-35 for topics
-- ============================================================================

WITH ins AS (
  INSERT INTO curriculum_units (grade, semester, unit_number, name, textbook_ref, display_order)
  VALUES
    (5, 'B', 10, '小數加法和減法',                 '5B 單元 1 小數加法和減法',                 10),
    (5, 'B', 11, '小數乘法',                       '5B 單元 2 小數乘法',                       11),
    (5, 'B', 12, '小數除法',                       '5B 單元 3 小數除法',                       12),
    (5, 'B', 13, '小數和分數的互化',               '5B 單元 4 小數和分數的互化',               13),
    (5, 'B', 14, '分數除法',                       '5B 單元 5 分數除法',                       14),
    (5, 'B', 15, '百分數',                         '5B 單元 6 百分數',                         15),
    (5, 'B', 16, '圓的初步認識',                   '5B 單元 7 圓的初步認識',                   16),
    (5, 'B', 17, '長方體和正方體的體積',           '5B 單元 8 長方體和正方體的體積',           17),
    (5, 'B', 18, '平均數',                         '5B 單元 9 平均數',                         18),
    (5, 'B', 19, '折線圖',                         '5B 單元 10 折線圖',                        19)
  RETURNING id, unit_number
)
INSERT INTO curriculum_topics (unit_id, lesson_number, name, display_order)
SELECT ins.id, t.lesson_number, t.name, t.display_order
FROM ins
JOIN (VALUES
  -- 單元 1 小數加法和減法
  (10, 21, '小數加法和減法：基礎計算',                          1),
  (10, 22, '小數加法和減法：簡便計算與應用題',                  2),
  -- 單元 2 小數乘法
  (11, 23, '小數乘法：基礎計算',                                1),
  (11, 24, '小數乘法：積的近似值與簡便計算',                    2),
  -- 單元 3 小數除法
  (12, 25, '小數除法：除數是整數的小數除法',                    1),
  (12, 26, '小數除法：除數是小數的小數除法',                    2),
  -- 單元 4 小數和分數的互化
  (13, 27, '小數和分數的互化',                                  1),
  -- 單元 5 分數除法
  (14, 28, '分數除法：基礎計算',                                1),
  (14, 29, '分數除法：帶分數除法與混合運算',                    2),
  (14, 31, '分數除法：應用題專項突破',                          3),
  -- 單元 6 百分數
  (15, 32, '百分數：百分數的認識與分數、小數互化',              1),
  (15, 33, '百分數：應用題專項突破',                            2),
  -- 單元 7 圓的初步認識
  (16, 34, '圓的初步認識',                                      1),
  -- 單元 8 長方體和正方體的體積
  (17, 35, '立體圖形：長方體和正方體的表面積',                  1),
  (17, 36, '立體圖形：長方體和正方體的體積與容積',              2),
  -- 單元 9 平均數
  (18, 37, '平均數',                                            1),
  -- 單元 10 折線圖
  (19, 38, '統計圖：折線圖',                                    1)
) AS t(unit_number, lesson_number, name, display_order)
ON ins.unit_number = t.unit_number;

COMMIT;

-- Sanity checks
-- SELECT count(*) AS units FROM curriculum_units WHERE grade = 5;       -- expect 19
-- SELECT count(*) AS topics FROM curriculum_topics
--   WHERE unit_id IN (SELECT id FROM curriculum_units WHERE grade = 5); -- expect 35 (lessons 1-9, 11-19, 21-29, 31-38)
