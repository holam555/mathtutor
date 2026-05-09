-- P6 curriculum: brand new from New assessment question and answer/P6 Ax Question.pdf
-- 7 大單元 (unit-level assessment only — no 小單元 drill-down)
-- Each unit gets 1 placeholder topic so the assessment_questions FK works.
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
    (6, 'A', 7, '圓周的計算', 'P6 單元 7 圓周的計算', 7)
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
  (7, 7, '圓周的計算')
) AS t(unit_number, lesson_number, name) ON ins.unit_number = t.unit_number;

COMMIT;

-- Sanity: SELECT count(*) FROM curriculum_units WHERE grade=6;  -- expect 7
-- Sanity: SELECT count(*) FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id WHERE u.grade=6;  -- expect 7