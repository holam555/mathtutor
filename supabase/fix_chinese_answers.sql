-- fix_chinese_answers.sql
-- Fixes all questions whose correct_answer contains Chinese characters.
--
-- CAT A: 元/角 multi-blank  → comma format "元,角" (e.g. "89,4")
-- CAT B: Division remainder  → comma format "商,餘數"  (e.g. "74,4")
-- CAT C: Time duration       → comma format "小時,分鐘" (e.g. "1,12")
-- CAT D: Time of day (下午X時Y分) → multiple_choice
-- CAT E: Reading big numbers in Chinese → multiple_choice
-- CAT F: Unit name fill-in   → multiple_choice
-- CAT G: Other Chinese text  → multiple_choice
--
-- All matches are by question_text LIKE patterns.
-- Run AFTER all seed files have been inserted.

BEGIN;

-- ════════════════════════════════════════════════════════════
-- CAT A: 元/角 → "元,角" comma format
-- ════════════════════════════════════════════════════════════

-- Hint text to append for 元/角 questions (if not already present)
-- We normalise old "(答案：a元b角)" / "(答案：__元__角)" style hints.

UPDATE assessment_questions SET
  correct_answer = '89,4',
  question_text = replace(replace(question_text,
    '（答案：a元b角）', ''), '幾元幾角？', '幾元幾角？（答案格式：元,角，例：89,4）')
WHERE question_text LIKE '%小強買巧克力 2 盒和餅乾 2 包%';

UPDATE assessment_questions SET
  correct_answer = '115,2',
  question_text = replace(question_text, '（答案：a元b角）', '（答案格式：元,角，例：89,4）')
WHERE question_text LIKE '%蛋撻每件售 12 元 8 角%慧文買 9 件%';

UPDATE assessment_questions SET
  correct_answer = '7,6',
  question_text = question_text || '（答案格式：元,角，例：7,6）'
WHERE question_text LIKE '%媽媽買了 5 盒牛奶，付了 38 元%';

UPDATE assessment_questions SET
  correct_answer = '142,8',
  question_text = question_text || '（答案格式：元,角，例：89,4）'
WHERE question_text LIKE '%草莓味布丁每杯售 23 元 8 角%半打%';

UPDATE assessment_questions SET
  correct_answer = '101,1',
  question_text = replace(replace(question_text,
    '共需付幾元幾角？', '共需付幾元幾角？（答案格式：元,角，例：89,4）'),
    '（答案格式：元,角，例：89,4）（答案格式：元,角，例：89,4）', '（答案格式：元,角，例：89,4）')
WHERE question_text LIKE '%小明買巧克力 3 盒和餅乾 1 包%';

UPDATE assessment_questions SET
  correct_answer = '62,0',
  question_text = replace(question_text, '（答案：__元__角）', '（答案格式：元,角，例：62,0）')
WHERE question_text LIKE '%湯匙每枝 9 元 5 角%媽媽付 100 元%';

UPDATE assessment_questions SET
  correct_answer = '215,6',
  question_text = replace(question_text, '___ 元 ___ 角', '___,___ （元,角格式，例：215,6）')
WHERE question_text LIKE '%53元 9角 × 4%';

UPDATE assessment_questions SET
  correct_answer = '32,4',
  question_text = replace(question_text, '___ 元 ___ 角', '___,___ （元,角格式，例：32,4）')
WHERE question_text LIKE '%162 元 ÷ 5%';

UPDATE assessment_questions SET
  correct_answer = '96,8',
  question_text = replace(question_text, '___ 元 ___ 角', '___,___ （元,角格式，例：96,8）')
WHERE question_text LIKE '%70 元 + 6 元 7 角 × 4%';

UPDATE assessment_questions SET
  correct_answer = '13,6',
  question_text = question_text || '（答案格式：元,角，例：13,6）'
WHERE question_text LIKE '%原子筆一枝售 3 元 2 角，間尺一把售 10 元 4 角%';

UPDATE assessment_questions SET
  correct_answer = '206,8',
  question_text = question_text || '（答案格式：元,角，例：206,8）'
WHERE question_text LIKE '%英文字典一本售 312 元 6 角%中文字典%';

UPDATE assessment_questions SET
  correct_answer = '257,7',
  question_text = replace(question_text, '___ 元 ___ 角', '___,___ （元,角格式，例：257,7）')
WHERE question_text LIKE '%85元9角 × 3%';

UPDATE assessment_questions SET
  correct_answer = '24,6',
  question_text = replace(question_text, '___ 元 ___ 角', '___,___ （元,角格式，例：24,6）')
WHERE question_text LIKE '%98元4角 ÷ 4%';

UPDATE assessment_questions SET
  correct_answer = '18,5',
  question_text = question_text || '（答案格式：元,角，例：18,5）'
WHERE question_text LIKE '%文具店大減價%6 本筆記簿%111 元%';

UPDATE assessment_questions SET
  correct_answer = '35,5',
  question_text = question_text || '（答案格式：元,角，例：35,5）'
WHERE question_text LIKE '%兩輛玩具車售價 71 元%';

-- ════════════════════════════════════════════════════════════
-- CAT B: Division remainder → "商,餘數" comma format
-- ════════════════════════════════════════════════════════════

UPDATE assessment_questions SET
  correct_answer = '107,2',
  question_text = replace(replace(question_text,
    '（格式：商餘N，例如 107餘2）', '（答案格式：商,餘數，例：107,2）'),
    '（格式：商餘N）', '（答案格式：商,餘數，例：107,2）')
WHERE question_text LIKE '%751 ÷ 7%';

UPDATE assessment_questions SET
  correct_answer = '13,2',
  question_text = replace(replace(question_text,
    '（餘數寫成「商…餘」）', '（答案格式：商,餘數，例：13,2）'),
    '（餘數寫成「商餘N」）', '（答案格式：商,餘數，例：13,2）')
WHERE question_text LIKE '%80 ÷ 6%';

UPDATE assessment_questions SET
  correct_answer = '123,1',
  question_text = replace(replace(question_text,
    '（餘數寫成「商…餘」）', '（答案格式：商,餘數，例：123,1）'),
    '（餘數寫成「商餘N」）', '（答案格式：商,餘數，例：123,1）')
WHERE question_text LIKE '%247 ÷ 2%';

UPDATE assessment_questions SET
  correct_answer = '32,5',
  question_text = replace(replace(question_text,
    '（餘數寫成「商…餘」）', '（答案格式：商,餘數，例：32,5）'),
    '（餘數寫成「商餘N」）', '（答案格式：商,餘數，例：32,5）')
WHERE question_text LIKE '%229 ÷ 7%';

UPDATE assessment_questions SET
  correct_answer = '57,2',
  question_text = replace(replace(question_text,
    '（餘數寫成「商…餘」）', '（答案格式：商,餘數，例：57,2）'),
    '（餘數寫成「商餘N」）', '（答案格式：商,餘數，例：57,2）')
WHERE question_text LIKE '%287 ÷ 5%';

UPDATE assessment_questions SET
  correct_answer = '74,4',
  question_text = replace(question_text, '（格式：商餘N）', '（答案格式：商,餘數，例：74,4）')
WHERE question_text LIKE '%374 ÷ 5%';

UPDATE assessment_questions SET
  correct_answer = '8,4',
  question_text = replace(replace(question_text,
    '（餘數寫成「商餘N」）', '（答案格式：商,餘數，例：8,4）'),
    '（格式：商餘N）', '（答案格式：商,餘數，例：8,4）')
WHERE question_text LIKE '%44 ÷ 5%';

UPDATE assessment_questions SET
  correct_answer = '14,5',
  question_text = replace(question_text, '（格式：商餘N）', '（答案格式：商,餘數，例：14,5）')
WHERE question_text LIKE '%89 ÷ 6%';

UPDATE assessment_questions SET
  correct_answer = '102,2',
  question_text = replace(question_text, '（格式：商餘N）', '（答案格式：商,餘數，例：102,2）')
WHERE question_text LIKE '%706 ÷ 7%' OR question_text LIKE '%716 ÷ 7%';

UPDATE assessment_questions SET
  correct_answer = '8,1',
  question_text = replace(question_text, '（格式：商餘N）', '（答案格式：商,餘數，例：8,1）')
WHERE question_text LIKE '%33 ÷ 4%';

-- "口香糖一盒有 78 片" — complex Chinese units → multiple_choice
UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 15包餘3片","B. 14包餘8片","C. 16包餘2片","D. 15包餘8片"]'::jsonb,
  correct_answer = 'A. 15包餘3片'
WHERE question_text LIKE '%口香糖一盒有 78 片%每 5 片裝成一包%';

-- ════════════════════════════════════════════════════════════
-- CAT C: Time duration → "小時,分鐘" comma format
-- ════════════════════════════════════════════════════════════

UPDATE assessment_questions SET
  correct_answer = '1,27',
  question_text = replace(question_text, '（格式：__小時__分）', '（答案格式：小時,分鐘，例：1,27）')
WHERE question_text LIKE '%SQ710%JL513%早多少小時多少分鐘%';

UPDATE assessment_questions SET
  correct_answer = '1,12',
  question_text = question_text || '（答案格式：小時,分鐘，例：1,12）'
WHERE question_text LIKE '%20:23 開始批改作業%21:35%';

UPDATE assessment_questions SET
  correct_answer = '1,29',
  question_text = question_text || '（答案格式：小時,分鐘，例：1,29）'
WHERE question_text LIKE '%飛機原定抵達時間 20:43%飛機抵達時間 22:12%';

UPDATE assessment_questions SET
  correct_answer = '0,47',
  question_text = replace(question_text, '（格式：__小時__分鐘）', '（答案格式：小時,分鐘，例：0,47）')
WHERE question_text LIKE '%陳先生乘飛機由香港到南京%13:15%14:02%';

UPDATE assessment_questions SET
  correct_answer = '8,45',
  question_text = replace(question_text, '（答案請以「X小時Y分鐘」格式）', '（答案格式：小時,分鐘，例：8,45）')
WHERE question_text LIKE '%珍妮 22:35 開始睡覺%07:20 起床%';

UPDATE assessment_questions SET
  correct_answer = '4,45',
  question_text = question_text || '（答案格式：小時,分鐘，例：4,45）'
WHERE question_text LIKE '%香港國際機場航機資料%4小時45分鐘%'
   OR question_text LIKE '%倫敦 07:00%北京 16:15%東京 17:00%巴黎 21:00%大阪 21:20%' AND question_text LIKE '%多少小時%';

-- 3-part time (小時/分鐘/秒) → multiple_choice (too complex for comma format)
UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 8小時10分鐘5秒","B. 7小時10分鐘5秒","C. 8小時9分鐘5秒","D. 8小時10分鐘"]'::jsonb,
  correct_answer = 'A. 8小時10分鐘5秒'
WHERE question_text LIKE '%小明在下午 10 時 10 分 10 秒睡覺%上午 6 時 20 分 15 秒起床%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 0小時55分鐘","B. 55分鐘","C. 1小時5分鐘","D. 45分鐘"]'::jsonb,
  correct_answer = 'A. 0小時55分鐘'
WHERE question_text LIKE '%小恩上舞蹈班開始時間 4:10 a.m.%5:05 a.m.%';

-- ════════════════════════════════════════════════════════════
-- CAT D: Time of day (下午/上午X時Y分) → multiple_choice
-- ════════════════════════════════════════════════════════════

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 下午7時5分","B. 下午8時5分","C. 下午9時5分","D. 下午8時35分"]'::jsonb,
  correct_answer = 'B. 下午8時5分'
WHERE question_text LIKE '%噴射船原定於 18:30%1 小時 35 分鐘%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 下午3時50分","B. 下午4時7分","C. 下午3時40分","D. 下午4時24分"]'::jsonb,
  correct_answer = 'A. 下午3時50分'
WHERE question_text LIKE '%昨天美芬於 16:07 吃完茶點%17 分鐘%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 下午2時10分","B. 下午2時50分","C. 下午1時10分","D. 下午2時20分"]'::jsonb,
  correct_answer = 'A. 下午2時10分'
WHERE question_text LIKE '%英語話劇於下午 1 時 20 分開始%50 分鐘後結束%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 下午11時0分","B. 下午10時0分","C. 下午11時15分","D. 下午10時30分"]'::jsonb,
  correct_answer = 'A. 下午11時0分'
WHERE question_text LIKE '%音樂會結束時間 21:45%1 小時 15 分鐘%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 上午2時48分","B. 下午2時18分","C. 下午2時48分","D. 下午3時48分"]'::jsonb,
  correct_answer = 'C. 下午2時48分'
WHERE question_text LIKE '%BA003%14:48%上/下午__時__分%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 下午9時0分","B. 下午10時20分","C. 下午9時2分","D. 下午9時20分"]'::jsonb,
  correct_answer = 'D. 下午9時20分'
WHERE question_text LIKE '%飛往大阪的航班在甚麼時候起飛%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 下午4時30分","B. 下午5時30分20秒","C. 下午4時30分20秒","D. 下午4時20分20秒"]'::jsonb,
  correct_answer = 'C. 下午4時30分20秒'
WHERE question_text LIKE '%小輝由下午2時開始練習%2小時30分20秒%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 7時28分","B. 8時38分","C. 7時48分","D. 7時38分"]'::jsonb,
  correct_answer = 'D. 7時38分'
WHERE question_text LIKE '%媽媽在上午6時28分開始做飯%1小時10分%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 下午8時5分","B. 下午8時43分","C. 下午9時43分","D. 下午7時43分"]'::jsonb,
  correct_answer = 'B. 下午8時43分'
WHERE question_text LIKE '%承上題（原定抵達時間 20:43）%下午幾時幾分抵達%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 下午8時5分","B. 上午8時5分","C. 下午9時20分","D. 下午8時20分"]'::jsonb,
  correct_answer = 'C. 下午9時20分'
WHERE question_text LIKE '%大阪 21:20%下午幾時幾分%';

-- ════════════════════════════════════════════════════════════
-- CAT E: Reading big numbers in Chinese → multiple_choice
-- ════════════════════════════════════════════════════════════

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 二萬七千零三十","B. 二萬七千三十","C. 七萬二千零三十","D. 二萬零七千零三十"]'::jsonb,
  correct_answer = 'A. 二萬七千零三十'
WHERE question_text LIKE '%27030 讀作%中文%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 九萬二千四十五","B. 九萬兩千四十五","C. 九萬二千零四十五","D. 九萬零二千零四十五"]'::jsonb,
  correct_answer = 'C. 九萬二千零四十五'
WHERE question_text LIKE '%用中文寫出 92045%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 一萬四千一百","B. 一萬四千零一百","C. 十四千一百","D. 一萬零四千一百"]'::jsonb,
  correct_answer = 'A. 一萬四千一百'
WHERE question_text LIKE '%樂樂旅行社%14100%中國數字%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 七萬零一千零七","B. 七萬一千七","C. 七萬一千零七","D. 七萬一千零七十"]'::jsonb,
  correct_answer = 'C. 七萬一千零七'
WHERE question_text LIKE '%用中文寫出 71007%' OR question_text LIKE '%用中國數字寫出 71007%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 一萬四千一百","B. 一萬四千零一百","C. 一萬三千零八十","D. 一萬零四千一百"]'::jsonb,
  correct_answer = 'A. 一萬四千一百'
WHERE question_text LIKE '%澳洲旅行社價目%樂樂旅行社%中國數字%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 四分之六","B. 六分之一","C. 六分之四","D. 四分之一"]'::jsonb,
  correct_answer = 'C. 六分之四'
WHERE question_text LIKE '%4/6 讀作%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 一萬三千零八十","B. 一萬四千五百六十四","C. 一萬四千一百","D. 一萬四千一百零"]'::jsonb,
  correct_answer = 'A. 一萬三千零八十'
WHERE question_text LIKE '%大大旅行社$13080%中國數字%';

-- ════════════════════════════════════════════════════════════
-- CAT F: Unit name fill-in → multiple_choice
-- ════════════════════════════════════════════════════════════

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 毫米","B. 厘米","C. 米","D. 公里"]'::jsonb,
  correct_answer = 'A. 毫米'
WHERE question_text LIKE '%一個髮夾的長 55%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 升","B. 公升","C. 毫升","D. 克"]'::jsonb,
  correct_answer = 'C. 毫升'
WHERE question_text LIKE '%洗手一次需用水 20%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 毫米","B. 厘米","C. 米","D. 公里"]'::jsonb,
  correct_answer = 'C. 米'
WHERE question_text LIKE '%游泳池長 50%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 毫克","B. 公斤","C. 公噸","D. 克"]'::jsonb,
  correct_answer = 'D. 克'
WHERE question_text LIKE '%一個橙的重 250%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 公里","B. 米","C. 厘米","D. 毫米"]'::jsonb,
  correct_answer = 'D. 毫米'
WHERE question_text LIKE '%記錄牙籤的厚度%' OR question_text LIKE '%一片光碟的厚度%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 毫米","B. 厘米","C. 公里","D. 毫米"]'::jsonb,
  correct_answer = 'C. 公里'
WHERE question_text LIKE '%筲箕灣和太古港鐵站%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 克","B. 公斤","C. 公噸","D. 毫克"]'::jsonb,
  correct_answer = 'B. 公斤'
WHERE question_text LIKE '%一包米約重 3%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 公里","B. 米","C. 厘米","D. 毫米"]'::jsonb,
  correct_answer = 'D. 毫米'
WHERE question_text LIKE '%數學課本的厚度%最合適%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 毫米","B. 厘米","C. 米","D. 公里"]'::jsonb,
  correct_answer = 'D. 公里'
WHERE question_text LIKE '%學校和旅行地點的距離%最合適%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 毫米","B. 厘米","C. 米","D. 公里"]'::jsonb,
  correct_answer = 'A. 毫米'
WHERE question_text LIKE '%五元硬幣約厚 3%';

-- ════════════════════════════════════════════════════════════
-- CAT G: Other Chinese text answers → multiple_choice
-- ════════════════════════════════════════════════════════════

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 大大旅行社","B. 心心旅行社","C. 樂樂旅行社","D. 三間一樣貴"]'::jsonb,
  correct_answer = 'B. 心心旅行社'
WHERE question_text LIKE '%哪一間旅行社的收費最貴%$13080%$14564%';

UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 倫敦","B. 北京","C. 巴黎","D. 大阪"]'::jsonb,
  correct_answer = 'D. 大阪'
WHERE question_text LIKE '%最後一班由香港飛往外地的航班的目的地%';

-- 位值 (place value) fill-in: "6" 的位值 → MC
UPDATE assessment_questions SET
  question_type = 'multiple_choice',
  options = '["A. 萬","B. 千","C. 百","D. 十"]'::jsonb,
  correct_answer = 'B. 千'
WHERE question_text LIKE '%46950%「6」的位值%';

-- ════════════════════════════════════════════════════════════
-- Also fix normalise: strip spaces around commas
-- (handled in answerUtils.ts – no SQL needed)
-- ════════════════════════════════════════════════════════════

COMMIT;
