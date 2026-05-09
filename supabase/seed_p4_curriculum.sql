-- P4 curriculum: brand new from New assessment question and answer/P4 Ax Question.pdf
-- 17 大單元 (unit-level assessment only — no 小單元 drill-down)
-- Each unit gets 1 placeholder topic so the assessment_questions FK works.
-- Idempotent: clears existing P4 rows then re-inserts.

BEGIN;

DELETE FROM curriculum_topics WHERE unit_id IN (SELECT id FROM curriculum_units WHERE grade = 4);
DELETE FROM curriculum_units WHERE grade = 4;

WITH ins AS (
  INSERT INTO curriculum_units (grade, semester, unit_number, name, textbook_ref, display_order)
  VALUES
    (4, '上A', 1, '倍數和因數', 'P4 單元 1 倍數和因數', 1),
    (4, '上A', 2, '公倍數和公因數', 'P4 單元 2 公倍數和公因數', 2),
    (4, '上A', 3, '乘法', 'P4 單元 3 乘法', 3),
    (4, '上A', 4, '除法', 'P4 單元 4 除法', 4),
    (4, '上A', 5, '四則混合運算', 'P4 單元 5 四則混合運算', 5),
    (4, '上B', 7, '平行與垂直', 'P4 單元 7 平行與垂直', 7),
    (4, '上B', 8, '四邊形', 'P4 單元 8 四邊形', 8),
    (4, '上B', 9, '周界', 'P4 單元 9 周界', 9),
    (4, '下A', 10, '分數的認識（一）', 'P4 單元 10 分數的認識（一）', 10),
    (4, '下A', 11, '擴分與約分', 'P4 單元 11 擴分與約分', 11),
    (4, '下A', 12, '同分母分數加減法', 'P4 單元 12 同分母分數加減法', 12),
    (4, '下A', 13, '小數的認識', 'P4 單元 13 小數的認識', 13),
    (4, '下A', 14, '圖形的拼砌與分割', 'P4 單元 14 圖形的拼砌與分割', 14),
    (4, '下B', 15, '對稱圖形', 'P4 單元 15 對稱圖形', 15),
    (4, '下B', 16, '正方形和長方形面積', 'P4 單元 16 正方形和長方形面積', 16),
    (4, '下B', 17, '棒形圖（一）單式棒形圖', 'P4 單元 17 棒形圖（一）單式棒形圖', 17),
    (4, '下B', 18, '棒形圖（二）複式棒形圖', 'P4 單元 18 棒形圖（二）複式棒形圖', 18)
  RETURNING id, unit_number
)
INSERT INTO curriculum_topics (unit_id, lesson_number, name, display_order)
SELECT ins.id, t.lesson_number, t.name, 1
FROM ins JOIN (VALUES
  (1, 1, '倍數和因數'),
  (2, 2, '公倍數和公因數'),
  (3, 3, '乘法'),
  (4, 4, '除法'),
  (5, 5, '四則混合運算'),
  (7, 7, '平行與垂直'),
  (8, 8, '四邊形'),
  (9, 9, '周界'),
  (10, 10, '分數的認識（一）'),
  (11, 11, '擴分與約分'),
  (12, 12, '同分母分數加減法'),
  (13, 13, '小數的認識'),
  (14, 14, '圖形的拼砌與分割'),
  (15, 15, '對稱圖形'),
  (16, 16, '正方形和長方形面積'),
  (17, 17, '棒形圖（一）單式棒形圖'),
  (18, 18, '棒形圖（二）複式棒形圖')
) AS t(unit_number, lesson_number, name) ON ins.unit_number = t.unit_number;

COMMIT;

-- Sanity: SELECT count(*) FROM curriculum_units WHERE grade=4;  -- expect 17
-- Sanity: SELECT count(*) FROM curriculum_topics t JOIN curriculum_units u ON u.id=t.unit_id WHERE u.grade=4;  -- expect 17