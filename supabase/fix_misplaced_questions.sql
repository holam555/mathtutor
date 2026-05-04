-- fix_misplaced_questions.sql
-- Moves 24 misassigned questions to their correct topic_id.
-- Run in Supabase SQL Editor.

BEGIN;

-- ── Unit 3 (減法) → Unit 2 加法 ──────────────────────────────────────────
-- These are pure addition questions incorrectly filed under 減法.
-- Target topic: 三位數加法直式與連續進位  (Unit 2)

UPDATE assessment_questions
SET topic_id = 'b1968a0f-e9c4-4347-85a6-466ee4a75b13'
WHERE id IN (
  '04e63870-0476-44ba-b8fe-f10cd16da6c5', -- 2017 + 2083 = ?
  'adb82220-4419-4382-ba30-504635a994f2', -- 2581 + 1010 = ?
  'c5c8025e-da6e-488c-ae90-6933dfcdc1ef'  -- 473 + ___ = 621（加法填充）
);

-- ── Unit 4 (加減混合) → Unit 10 除法 基礎直式 ────────────────────────────
-- Pure division inverse equations with no addition/subtraction component.
-- Target topic: 三位數除以一位數基礎直式  (Unit 10)

UPDATE assessment_questions
SET topic_id = 'c4c1a8d6-46b4-48e3-b7d6-3f78d2c56e50'
WHERE id IN (
  '3ecde61a-86bb-42ad-8476-51ba7ca8ae93', -- 756 ÷ ? = 7
  '90e5a8c8-acc9-44c9-a421-9f552fd1874e', -- ? ÷ 4 = 240…2
  '176e9fcd-303e-4f92-8b19-1b8fb9e031de', -- ♥ ÷ 13 = 7
  'b1509289-2d7f-45df-8b2c-2be7e22bcb17'  -- A ÷ 5 = 115
);

-- ── Unit 4 (加減混合) → Unit 5 乘法（一）────────────────────────────────
-- Pure multiplication inverse, no addition/subtraction.
-- Target topic: 一位數乘兩位數直式與進位規則  (Unit 5)

UPDATE assessment_questions
SET topic_id = 'aba9aeb7-eb22-4c4d-9303-5ca73b2103ad'
WHERE id IN (
  '5e49af42-4d5e-457d-b866-1d0ec9be0040'  -- ？×3=27
);

-- ── Unit 5 (乘法一) → Unit 10 除法 基礎直式 ─────────────────────────────
-- Division word problems filed under multiplication unit.
-- Target topic: 三位數除以一位數基礎直式  (Unit 10)

UPDATE assessment_questions
SET topic_id = 'c4c1a8d6-46b4-48e3-b7d6-3f78d2c56e50'
WHERE id IN (
  'ff895042-12cf-4d6e-aefc-c3165a84a4b8', -- 裝修工人薪金 656元 ÷ 8小時
  'd6421ae6-0f04-4d9c-a6f9-260774b310f4', -- 弟弟一星期 210分鐘 ÷ 7天
  '7578c417-deeb-40d9-9a86-b0609416faab'  -- 120元平均分給表妹和4個表哥
);

-- ── Unit 5 (乘法一) → Unit 10 除法 進一法/去尾法 ────────────────────────
-- "幾天看完" requires ceiling division (進一法).
-- Target topic: 除法進一法/去尾法應用題專項  (Unit 10)

UPDATE assessment_questions
SET topic_id = 'ac69e3ca-ff8c-486b-8e43-75998880ab0c'
WHERE id IN (
  'c65d043b-fa91-40a7-922d-76077f1a590f'  -- 故事書92頁，每天看5頁，幾天看完（92÷5=18…2→19天）
);

-- ── Unit 6 (乘法二) → Unit 10 除法 基礎直式 ─────────────────────────────
-- Division word problems filed under multiplication unit.
-- Target topic: 三位數除以一位數基礎直式  (Unit 10)

UPDATE assessment_questions
SET topic_id = 'c4c1a8d6-46b4-48e3-b7d6-3f78d2c56e50'
WHERE id IN (
  'cdf6a4b7-3589-4f84-844a-4e141745349a', -- 影印機64份÷8，需時多少分鐘
  '509ef41f-125a-4144-80e4-1845d04202b2'  -- 快樂士多3天賣曲奇，平均每天售多少盒
);

-- ── Unit 6 (乘法二) → Unit 10 除法 進一法/去尾法 ─────────────────────────
-- 去尾法 and 進一法 division application problems.
-- Target topic: 除法進一法/去尾法應用題專項  (Unit 10)

UPDATE assessment_questions
SET topic_id = 'ac69e3ca-ff8c-486b-8e43-75998880ab0c'
WHERE id IN (
  'ef31605c-2890-43e7-a001-038e6dad7ff6', -- 264塊曲奇每15塊裝袋，最多裝多少袋（去尾法）
  '5f80f5f2-325b-4ceb-834a-07f19c930e0c'  -- 通山車每次坐8人，59人最少進行多少次（進一法）
);

-- ── Unit 9 (重量) → Unit 4 加減混合 逆向文字題 ───────────────────────────
-- Biscuit question has zero weight context; it is a 2-step add/subtract WP.
-- Target topic: 兩步加減逆向文字題專項突破  (Unit 4)

UPDATE assessment_questions
SET topic_id = '020ca548-52f6-4899-834c-093f584bc588'
WHERE id IN (
  '8c60e114-0d0b-4915-8ed2-11f5496cb27c'  -- 秀雯有餅乾127塊，志安比她少56塊，共有多少塊
);

-- ── Unit 10 "商中間有零" topic → Unit 6 乘法（二）────────────────────────
-- Pure multiplication placed in a division topic.
-- Target topic: 一位數乘三位數直式與連續進位  (Unit 6)

UPDATE assessment_questions
SET topic_id = '177017c1-465f-4f2b-824f-6bad966b0cb8'
WHERE id IN (
  '9e3c0ade-cdbd-4b07-abc8-7e78c42d2d9f', -- 506 × 7 = ?
  '9357b261-47d9-4de6-8145-6be8b22fbca3', -- 25 × 9 × 4 = ?
  'a6a2e377-1b93-41e8-9d2c-bbb37157511a'  -- 123 × 5 = ? (was in Unit 10 basic topic)
);

-- ── Unit 10 "商中間有零" topic → Unit 2 加法 ─────────────────────────────
-- Target topic: 三位數加法直式與連續進位  (Unit 2)

UPDATE assessment_questions
SET topic_id = 'b1968a0f-e9c4-4347-85a6-466ee4a75b13'
WHERE id IN (
  '9c780efd-d926-44cb-bb49-dafc7bcc8cc9'  -- 5995 + 1005 = ?
);

-- ── Unit 10 "商中間有零" topic → Unit 3 隔位退位減法 ─────────────────────
-- 6000 - 597 is a borrow-across-zeros subtraction, not a division problem.
-- Target topic: 隔位退位減法（世紀難點）專項突破  (Unit 3)

UPDATE assessment_questions
SET topic_id = '127188b7-34aa-470b-be42-19eb4d6d1c2d'
WHERE id IN (
  '112c1e5d-e7eb-4488-98c4-9d7333afdaaf'  -- 6000 - 597 = ?
);

-- ── Unit 15 (容量) → Unit 9 重量綜合應用題 ───────────────────────────────
-- 克/grams question with no capacity context.
-- Target topic: 重量綜合應用題（淨重/毛重）專項  (Unit 9)

UPDATE assessment_questions
SET topic_id = 'c4d62b62-eb78-4c90-8811-469454e1fda4'
WHERE id IN (
  'd7701432-20b9-448e-8116-b37498cca8b5'  -- 每罐粟米淨重320克，三罐倒入5杯，每杯多少克
);

-- ── Unit 17 (貨幣) → Unit 10 除法 基礎直式 ───────────────────────────────
-- Simple ÷2 question with no currency context.
-- Target topic: 三位數除以一位數基礎直式  (Unit 10)

UPDATE assessment_questions
SET topic_id = 'c4c1a8d6-46b4-48e3-b7d6-3f78d2c56e50'
WHERE id IN (
  'd661c42f-3c71-4078-8327-ad4054f897b2'  -- 一箱筆芯12包，半箱筆芯有多少包（÷2）
);

-- ── Unit 17 (貨幣) → Unit 5 乘法（一）───────────────────────────────────
-- Simple × question with no currency context.
-- Target topic: 一位數乘兩位數直式與進位規則  (Unit 5)

UPDATE assessment_questions
SET topic_id = 'aba9aeb7-eb22-4c4d-9303-5ca73b2103ad'
WHERE id IN (
  'fb5fafae-d037-46cd-a3ee-a74a3870408b'  -- 餐廳訂購牛奶8箱每箱6瓶，共多少瓶（8×6）
);

COMMIT;
