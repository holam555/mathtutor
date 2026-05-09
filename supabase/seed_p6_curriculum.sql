-- P6 curriculum: brand new from P6 Ax Question.pdf (all 13 units).
-- Each unit has 1 placeholder topic for the assessment_questions FK.
-- Idempotent: clears existing P6 rows then re-inserts.

BEGIN;

DELETE FROM curriculum_topics WHERE unit_id IN (SELECT id FROM curriculum_units WHERE grade = 6);
DELETE FROM curriculum_units WHERE grade = 6;

WITH ins AS (
  INSERT INTO curriculum_units (grade, semester, unit_number, name, textbook_ref, display_order)
  VALUES
    (6, 'A', 1, '小數除法', 'P6 單元 1 小數除法', 1),
    (6, 'A', 2, '百分數的認識', 'P6 單元 2 百分數的認識', 2),
    (6, 'A', 3, '數型', 'P6 單元 3 數型', 3),
    (6, 'A', 4, '圓的認識', 'P6 單元 4 圓的認識', 4),
    (6, 'A', 5, '軸對稱和旋轉對稱圖形', 'P6 單元 5 軸對稱和旋轉對稱圖形', 5),
    (6, 'A', 6, '容量和體積', 'P6 單元 6 容量和體積', 6),
    (6, 'A', 7, '圓周的計算', 'P6 單元 7 圓周的計算', 7),
    (6, 'A', 8, '折線圖', 'P6 單元 8 折線圖', 8),
    (6, 'B', 9, '百分數應用', 'P6 單元 9 百分數應用', 9),
    (6, 'B', 10, '簡易方程 (三)', 'P6 單元 10 簡易方程 (三)', 10),
    (6, 'B', 11, '截面與圓面積', 'P6 單元 11 截面與圓面積', 11),
    (6, 'B', 12, '速率與行程圖', 'P6 單元 12 速率與行程圖', 12),
    (6, 'B', 13, '圓形圖', 'P6 單元 13 圓形圖', 13)
  RETURNING id, unit_number
)
INSERT INTO curriculum_topics (unit_id, lesson_number, name, display_order)
SELECT ins.id, t.lesson_number, t.name, 1
FROM ins JOIN (VALUES
  (1, 1, '小數除法'),
  (2, 2, '百分數的認識'),
  (3, 3, '數型'),
  (4, 4, '圓的認識'),
  (5, 5, '軸對稱和旋轉對稱圖形'),
  (6, 6, '容量和體積'),
  (7, 7, '圓周的計算'),
  (8, 8, '折線圖'),
  (9, 9, '百分數應用'),
  (10, 10, '簡易方程 (三)'),
  (11, 11, '截面與圓面積'),
  (12, 12, '速率與行程圖'),
  (13, 13, '圓形圖')
) AS t(unit_number, lesson_number, name) ON ins.unit_number = t.unit_number;

COMMIT;

-- Sanity: SELECT count(*) FROM curriculum_units WHERE grade=6;  -- expect 13