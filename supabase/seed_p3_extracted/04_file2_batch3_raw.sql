-- File 2 batch 3 (下學期) raw SQL from sub-agent
-- WARNING: Agent used wrong schema (p3_questions, lesson_id) — DO NOT run as-is.
-- This is preserved as a source for the conversion script.
-- 8 papers covered (1 dupe skipped: C055=B078): A176, A191, B078, B090, B105, B116, C031, plus A176/A191/B116 etc text questions.

-- ===== L7 加減混合括號 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(7,'264 + 307 - 182 = ?','fill_in_number',NULL,'389','basic','A176-協和小學-長沙灣-P3-1314下'),
(7,'345 - 723 + 416 = ?','fill_in_number',NULL,'38','basic','A176-協和小學-長沙灣-P3-1314下'),
(7,'432 - (142 + 96) = ?','fill_in_number',NULL,'194','basic','A176-協和小學-長沙灣-P3-1314下'),
(7,'(500 - 450) × 3 = ?','fill_in_number',NULL,'150','basic','A176-協和小學-長沙灣-P3-1314下'),
(7,'45 + (17 + 13) = ?','fill_in_number',NULL,'75','basic','B105-五旬節于良發小學-P3-1213下'),
(7,'30 - (43 - 28) = ?','fill_in_number',NULL,'15','basic','B105-五旬節于良發小學-P3-1213下'),
(7,'239 - 164 + 294 = ?','fill_in_number',NULL,'369','basic','B105-五旬節于良發小學-P3-1213下'),
(7,'1988 + 2107 - 1682 = ?','fill_in_number',NULL,'2413','basic','B105-五旬節于良發小學-P3-1213下'),
(7,'38 + 26 × 8 = ?','fill_in_number',NULL,'246','basic','B105-五旬節于良發小學-P3-1213下'),
(7,'77 - (30 - 18) = ?','multiple_choice','["A. 75","B. 65","C. 55","D. 45"]','B. 65','basic','A191-寶血小學-P3-1314下'),
(7,'30 × 8 + 24 = ?','multiple_choice','["A. 216","B. 240","C. 246","D. 264"]','D. 264','basic','A191-寶血小學-P3-1314下'),
(7,'48 - 8 × 5 = ?','multiple_choice','["A. 200","B. 40","C. 8","D. 48"]','C. 8','basic','A191-寶血小學-P3-1314下'),
(7,'593 - (48 + 26) = ?','fill_in_number',NULL,'519','basic','A191-寶血小學-P3-1314下'),
(7,'(674 - 451) × 4 = ?','fill_in_number',NULL,'892','basic','A191-寶血小學-P3-1314下'),
(7,'628 + 23 × 2 = ?','fill_in_number',NULL,'674','basic','A191-寶血小學-P3-1314下'),
(7,'9 × 70 - 30 = ?','fill_in_number',NULL,'600','basic','A191-寶血小學-P3-1314下'),
(7,'2324 + 2385 + 1217 = ?','fill_in_number',NULL,'5926','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(7,'40 + 56 ÷ 8 = ?','fill_in_number',NULL,'47','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(7,'100 - (30 - 4 × 7) = ?','fill_in_number',NULL,'98','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(7,'38 + 97 × 2 = ?','fill_in_number',NULL,'232','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(7,'57 + (27 - 12) = ?','fill_in_number',NULL,'72','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(7,'23 - 5 × 6 + 27 = ?','fill_in_number',NULL,'20','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(7,'(5 + 2) × 15 = ?','fill_in_number',NULL,'105','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(7,'14 ÷ 8 × 4 = ?','fill_in_number',NULL,'7','basic','B090-聖保羅男女附屬小學-P3-1617下'),
(7,'2392 - (926 + 689) = ?','fill_in_number',NULL,'777','basic','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(7,'2019 + (2047 - 1997) = ?','fill_in_number',NULL,'2069','basic','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(7,'以下哪一項算式是不正確的？','multiple_choice','["A. (9 + 4) - 11 = 9 + 4 - 11","B. 11 + (9 - 4) = 11 + 9 - 4","C. 15 - (8 + 6) = 15 - 8 + 6","D. (8 - 6) + 15 = 8 - 6 + 15"]','C. 15 - (8 + 6) = 15 - 8 + 6','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(7,'99 - 38 × 2 約是多少？（估算）','multiple_choice','["A. 120","B. 122","C. 20","D. 40"]','C. 20','enhancement','B105-五旬節于良發小學-P3-1213下'),
(7,'下列哪一道算式最適合估計 61 × 3 - 159？','multiple_choice','["A. 70 × 3 - 160","B. 70 × 3 - 150","C. 60 × 3 - 160","D. 60 × 3 - 150"]','C. 60 × 3 - 160','enhancement','A191-寶血小學-P3-1314下'),
(7,'《射雕英雄傳》這本書共有 898 頁，妹妹每天看 26 頁，一星期後未看的還有多少頁？','calculation',NULL,'716','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L8 兩步加減逆向 / 找未知數 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(8,'756 ÷ ? = 7，求 ? 的值。','fill_in_number',NULL,'108','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(8,'1994 - ★ = 72，求 ★ 的值。','fill_in_number',NULL,'1922','basic','A176-協和小學-長沙灣-P3-1314下'),
(8,'? ÷ 4 = 240…2，求 ? 的值。','fill_in_number',NULL,'962','enhancement','B105-五旬節于良發小學-P3-1213下'),
(8,'? × 6 + 4 = 70，求 ? 的值。','fill_in_number',NULL,'11','enhancement','B105-五旬節于良發小學-P3-1213下'),
(8,'☺ - 2648 = 1112，求 ☺ 的值。','fill_in_number',NULL,'3760','basic','B090-聖保羅男女附屬小學-P3-1617下'),
(8,'(♠ + 17) × 10 = 200，求 ♠ 的值。','fill_in_number',NULL,'3','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(8,'2599 + ( ? ) + 3120 = 6743，求括號中的數值。','fill_in_number',NULL,'1024','enhancement','A191-寶血小學-P3-1314下'),
(8,'7230 - 3946 = ?','fill_in_number',NULL,'3284','basic','A191-寶血小學-P3-1314下'),
(8,'5689 - ( ? ) + 4361 + 2024 = 6385，求括號中的數值。','fill_in_number',NULL,'5689','advanced','A191-寶血小學-P3-1314下'),
(8,'在下列算式適當的地方加上括號，使算式成立：501 - 22 + 28 = 451。','fill_in',NULL,'501 - (22 + 28) = 451','enhancement','B105-五旬節于良發小學-P3-1213下'),
(8,'7899 ○ (1997 ○ 456) = 6358，○ 中應填上 + 或 - ，使算式成立。','fill_in',NULL,'7899 - (1997 - 456) = 6358','advanced','B105-五旬節于良發小學-P3-1213下'),
(8,'92 □ (46 □ 10) = 36，□ 中加入 + 、- 或 × ，使其成為合理的算式。','fill_in',NULL,'92 - (46 + 10) = 36','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(8,'40 □ 10 □ 2 = 20，□ 中加入 + 、- 或 × ，使其成為合理的算式。','fill_in',NULL,'40 - 10 × 2 = 20','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(8,'參加交流團的學生人數每年增加，上年比前年增加 491 人，今年又比昨年增加 1248 人，今年有 4706 人，前年參加交流團的學生人數有多少人？','fill_in_number',NULL,'2967','advanced','B105-五旬節于良發小學-P3-1213下'),
(8,'電器店的平板電腦現正特價，每台售 2988 元，比原價便宜 400 元。一台平板電腦原價售多少元？','calculation',NULL,'3388','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(8,'皓深原有 4368 元儲蓄，用了 480 元買一部遊戲機後，媽媽再給他 500 元。皓深現有儲蓄多少元？','calculation',NULL,'4388','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次');

-- ===== L21 三位數除以一位數 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(21,'80 ÷ 6 = ?（餘數寫成「商…餘」）','fill_in',NULL,'13…2','basic','A176-協和小學-長沙灣-P3-1314下'),
(21,'123 × 5 = ?','fill_in_number',NULL,'615','basic','A176-協和小學-長沙灣-P3-1314下'),
(21,'516 ÷ 4 = ?','fill_in_number',NULL,'129','basic','A176-協和小學-長沙灣-P3-1314下'),
(21,'247 ÷ 2 = ?（餘數寫成「商…餘」）','fill_in',NULL,'123…1','basic','B105-五旬節于良發小學-P3-1213下'),
(21,'428 ÷ 4 = ?','fill_in_number',NULL,'107','basic','A191-寶血小學-P3-1314下'),
(21,'229 ÷ 7 = ?（餘數寫成「商…餘」）','fill_in',NULL,'32…5','basic','A191-寶血小學-P3-1314下'),
(21,'728 ÷ 7 = ?','fill_in_number',NULL,'104','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(21,'390 ÷ 15 = ?','fill_in_number',NULL,'26','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(21,'396 ÷ 3 = ?','fill_in_number',NULL,'132','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(21,'287 ÷ 5 = ?（餘數寫成「商…餘」）','fill_in',NULL,'57…2','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(21,'738 ÷ 6 = ?','fill_in_number',NULL,'123','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(21,'54 和 6 的商是多少？','fill_in_number',NULL,'9','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(21,'下列哪一道除式的商與 42 ÷ 4 相同？','multiple_choice','["A. 4 ÷ 42","B. 63 ÷ 6","C. 59 ÷ 5","D. 34 ÷ 4"]','B. 63 ÷ 6','enhancement','B105-五旬節于良發小學-P3-1213下'),
(21,'649 ÷ 6 = ?','multiple_choice','["A. 108","B. 108…1","C. 18","D. 18…1"]','B. 108…1','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(21,'波板糖 104 塊，平均放在 8 個紙盒內。每個紙盒內有波板糖多少塊？','calculation',NULL,'13','basic','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L22 商中間/末尾零除法 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(22,'506 × 7 = ?','fill_in_number',NULL,'3542','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(22,'25 × 9 × 4 = ?','fill_in_number',NULL,'900','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(22,'160 ÷ ? 的計算結果商為 160…1，被除數是？','fill_in_number',NULL,'321','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(22,'5995 + 1005 = ?','fill_in_number',NULL,'7000','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(22,'6000 - 597 = ?','fill_in_number',NULL,'5403','basic','C031-聖公會青衣主恩小學-P3-1617下');

-- ===== L11 一位數乘三位數 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(11,'書枱每張 201 元，賣出 3 張書枱，共得多少元？','calculation',NULL,'603','basic','A191-寶血小學-P3-1314下'),
(11,'寶寶學校一樓有六個課室，平均每個課室有學生 25 人，一樓共有學生多少人？','calculation',NULL,'150','basic','A191-寶血小學-P3-1314下'),
(11,'海寶公園入場券每張 268 元，現買 5 張，須付多少元？','calculation',NULL,'1340','basic','A191-寶血小學-P3-1314下'),
(11,'家希每天看書 120 頁，她兩星期共看書多少頁？','calculation',NULL,'1680','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(11,'每個西餅盒可放一打西餅，7 個西餅盒可放西餅多少件？','calculation',NULL,'84','basic','A176-協和小學-長沙灣-P3-1314下'),
(11,'5 名老師帶領一群學生遠足，學生被分成 5 組，每組有 46 名學生。這次遠足共有老師和學生多少名？','calculation',NULL,'235','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(11,'三年級共有五班，每班有 27 人，加上 9 位老師，參加旅行的共有多少人？','calculation',NULL,'144','enhancement','B105-五旬節于良發小學-P3-1213下'),
(11,'蘋果汁 1 瓶有 355mL，橙汁 1 瓶有 750mL，現有蘋果汁 5 瓶，橙汁 1 瓶，共有果汁多少 mL？','calculation',NULL,'2525','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(11,'圓珠筆每枝 13 元，小芬想買 6 枝，但她只得 60 元，她還欠多少元？','calculation',NULL,'18','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(11,'紀念扣有 213 個，每 30 個一盒，如要把餘下的紀念扣裝成一盒，要增加紀念扣多少個？','calculation',NULL,'17','advanced','B090-聖保羅男女附屬小學-P3-1617下'),
(11,'快樂士多三天賣出曲奇餅：第一天 45 盒，第二天 0 盒，第三天 60 盒。平均每天售出曲奇餅多少盒？','fill_in_number',NULL,'35','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(11,'承上題（第三天賣出 60 盒，每盒 16 元）：第三天售出曲奇餅的收入是多少元？','fill_in_number',NULL,'960','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(11,'慧文焗了曲奇餅 264 塊，每 15 塊裝成一袋，最多可裝成多少袋？','calculation',NULL,'17','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(11,'每罐曲奇餅有 48 塊，每箱曲奇餅有 8 罐，兩箱曲奇餅共有多少塊？','fill_in_number',NULL,'768','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(11,'德華有 232 元，潮偉有 309 元。兩人想合資購買一部價值 712 元的數碼相機，尚欠多少元？','calculation',NULL,'171','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(11,'列車上有乘客 3456 人，到達下一個站後，有 299 人上車，432 人下車。列車上現有乘客多少人？','calculation',NULL,'3323','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(11,'妹妹原有 1540 元，媽媽又給她 960 元，妹妹現有多少元？','fill_in_number',NULL,'2500','basic','A191-寶血小學-P3-1314下');

-- ===== L12 倍數關係乘法應用 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(12,'《星星動物園》的成人門票售 210 元，是兒童門票的 3 倍，買 2 張兒童門票須付多少元？','calculation',NULL,'140','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(12,'一條公路共有兩段。第一段長 831 米，第二段的長度是第一段的 2 倍。這條公路長多少米？','calculation',NULL,'2493','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L4 三數連加應用題 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(4,'店鋪 A 賣出汽水 1234 罐，比店鋪 B 多賣出 457 罐。兩間店鋪共賣出汽水多少罐？','calculation',NULL,'2011','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(4,'湖邊有 156 隻白鶴，灰鶴的數目比白鶴多 322 隻，兩種鶴共有多少隻？','calculation',NULL,'634','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(4,'橙有 1250 個，比梨多 250 個，共有水果多少個？','calculation',NULL,'2250','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(4,'小食店有蒸餾水 240 枝，可樂比蒸餾水多 325 枝，共有飲品多少枝？','calculation',NULL,'805','enhancement','A191-寶血小學-P3-1314下'),
(4,'開心樂園昨天有遊客 4618 人，今天比昨天少 572 人，這兩天共有遊客多少人？','calculation',NULL,'8664','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(4,'點心專門店今天售出蝦餃 1200 籠，比燒賣多 400 籠，叉燒包比燒賣少 200 籠，點心專門店今天售出叉燒包多少籠？','fill_in_number',NULL,'600','advanced','C031-聖公會青衣主恩小學-P3-1617下'),
(4,'玩具批發公司有遙控車 5000 架，今天和昨天分別售出了 1234 架，這兩天共售出遙控車多少架？','fill_in_number',NULL,'2468','enhancement','C031-聖公會青衣主恩小學-P3-1617下');

-- ===== L5 三位數減法直式 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(5,'2017 + 2083 = ?','fill_in_number',NULL,'4100','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(5,'4243 - 1559 = ?','fill_in_number',NULL,'2684','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(5,'圖書館有圖書 8899 本，借出了 5018 本，收回了 1122 本。圖書館現有圖書多少本？','calculation',NULL,'5003','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L6 隔位退位減法 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(6,'翠絲在計算「1542 + 283」時，不小心把 1542 寫成 4521。翠絲所求得的答案與原來答案相差多少？','calculation',NULL,'2979','advanced','A176-協和小學-長沙灣-P3-1314下'),
(6,'小明有 1500 元，買 2 件 138 元的玩具熊，應找回多少元？','calculation',NULL,'1224','enhancement','A176-協和小學-長沙灣-P3-1314下');

-- ===== L23 進一/去尾應用題 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(23,'店員把 187 個橙平均分成 5 箱，再把餘下的橙放進最後的一箱，最後的一箱有橙多少個？','calculation',NULL,'39','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(23,'一籠叉燒包有 3 個，433 個叉燒包最多可裝成多少籠？','calculation',NULL,'144','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(23,'每包橡皮糖有 9 粒，現有橡皮糖 459 粒，可包裝成多少包？','calculation',NULL,'51','basic','A191-寶血小學-P3-1314下'),
(23,'果園有橙 941 個，每 6 個裝成一袋，最多可裝成多少袋？','calculation',NULL,'156','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(23,'小玲做了 125 塊曲奇餅後，每 8 個裝成一袋，如果要把全部曲奇餅包裝好，最少要有袋多少個？','calculation',NULL,'16','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(23,'回收中心共收到 807 個空的鋁罐，工人把鋁罐平均分成 4 袋後，把餘下的鋁罐放入其中一袋，這一袋共有鋁罐多少個？','calculation',NULL,'204','enhancement','B105-五旬節于良發小學-P3-1213下'),
(23,'茶葉 144 公斤，每 5 公斤裝成一袋發售，餘下的茶葉和一袋相差多少公斤？','calculation',NULL,'1','enhancement','B105-五旬節于良發小學-P3-1213下'),
(23,'現有巧克力 50 粒，平均分給 3 兄弟後，把餘下的巧克力都給了哥哥，哥哥共分得巧克力多少粒？','fill_in_number',NULL,'18','enhancement','C031-聖公會青衣主恩小學-P3-1617下');

-- ===== L24 分數意義等分 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(24,'寫出一個數值是 1 的分數。（用 a/b 格式表示）','fill_in',NULL,'2/2','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(24,'( ? )/100 = 1，求 ? 的值。','fill_in_number',NULL,'100','basic','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L25 分數整體部分 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(25,'8 的 1/2 是多少？','fill_in_number',NULL,'4','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(25,'9 的 1/3 是多少？','fill_in_number',NULL,'3','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(25,'18 的 5/6 是多少？','fill_in_number',NULL,'15','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(25,'24 的 2/3 是多少？','fill_in_number',NULL,'16','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(25,'龜池裏原有龜 9 隻，有些爬上了岸邊休息，佔全部龜的 2/3。仍留在龜池裏的龜有多少隻？','fill_in_number',NULL,'3','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- (Group: 魚缸 fish-tank chained sub-questions)
-- (25, B116) Group sub: 5/3 fish tank chained — handled separately as group
-- ===== L26 同分母同分子比較 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(26,'把 5/6, 3/7, 5/7 由大至小排列起來。','fill_in',NULL,'5/6 > 5/7 > 3/7','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(26,'5/10 > ( ? )/( ? ) > 5/13，在橫線上填上適當的分數，使式子成立。','fill_in',NULL,'5/11','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(26,'以下哪個分數的數值最大？','multiple_choice','["A. 1/4","B. 2/2","C. 7/8","D. 5/7"]','B. 2/2','basic','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(26,'按指示排列下列分數大小（由大至小）：3/9, 3/7, 2/9。','fill_in',NULL,'3/7 > 3/9 > 2/9','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(26,'比較下列分數的大小，把最大的分數填上：2/5, 3/5, 3/6。','fill_in',NULL,'3/5','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L27 分數綜合應用 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(27,'喜愛吃芒果的人數是喜愛吃蘋果的人數的 1/3，已知喜愛吃蘋果的人數是 30 人，求喜愛吃芒果的人數。','fill_in_number',NULL,'10','enhancement','B090-聖保羅男女附屬小學-P3-1617下');

-- ===== L31 升毫升量杯刻度 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(31,'3 升 99 毫升即多少毫升？','fill_in_number',NULL,'3099','basic','B090-聖保羅男女附屬小學-P3-1617下'),
(31,'8 升的水，可注滿 2 個大小相同的花瓶。每個花瓶的容量是多少升？','fill_in_number',NULL,'4','basic','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(31,'盛滿水的水瓶可注滿 2 個杯或 10 個湯匙，1 個杯可注滿幾個湯匙？','fill_in_number',NULL,'5','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(31,'量杯內的水（500mL）可注滿 4 個容量相同的杯，每個杯的容量是多少 mL？','fill_in_number',NULL,'125','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L32 容量倒入倒出應用 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(32,'每罐粟米淨重 320 克，三罐粟米平均倒入 5 個杯內，每杯有粟米多少克？','calculation',NULL,'192','enhancement','B090-聖保羅男女附屬小學-P3-1617下');

-- ===== L33 經過時間 60進制 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(33,'仁正由下午 10 時睡覺，上午 7 時起牀，他共睡了多少小時？','fill_in_number',NULL,'9','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(33,'道路工程進行了 9 星期和 4 天，即共進行了多少天？','fill_in_number',NULL,'67','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(33,'從 A 地到 B 地共需 2 天和 9 小時，即合共幾小時？','fill_in_number',NULL,'57','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(33,'沛嘉每天游泳 50 分鐘和跑步 30 分鐘，7 天後她共運動多少分鐘？','fill_in_number',NULL,'560','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(33,'老師在 20:23 開始批改作業，在 21:35 完成批改。她批改作業共用了多少小時多少分鐘？','fill_in',NULL,'1小時12分鐘','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(33,'《時事知多少》的播放時間 12:45 p.m. - 1:35 p.m.，共多少分鐘？','fill_in_number',NULL,'50','basic','B090-聖保羅男女附屬小學-P3-1617下'),
(33,'小明在下午 10 時 10 分 10 秒睡覺，在上午 6 時 20 分 15 秒起床。小明共睡了多少小時多少分鐘多少秒？','fill_in',NULL,'8小時10分鐘5秒','enhancement','A191-寶血小學-P3-1314下'),
(33,'小恩上舞蹈班開始時間 4:10 a.m.，結束時間 5:05 a.m.，小恩上舞蹈班共用了多少小時多少分鐘多少秒？','fill_in',NULL,'0小時55分鐘0秒','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(33,'昨天美芬於 16:07 吃完茶點，她吃茶點共用了 17 分鐘，她開始吃茶點的時間是？（答案：__午__時__分）','fill_in',NULL,'下午3時50分','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(33,'英語話劇於下午 1 時 20 分開始演出，50 分鐘後結束，英語話劇何時結束？（答案：__午__時__分）','fill_in',NULL,'下午2時10分','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(33,'飛機原定抵達時間 20:43，飛機抵達時間 22:12。飛機抵達機場的時間比原定的遲了多少小時多少分鐘？','fill_in',NULL,'1小時29分鐘','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(33,'承上題（原定抵達時間 20:43）：飛機原定在下午幾時幾分抵達機場？（答案：__午__時__分）','fill_in',NULL,'下午8時43分','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(33,'音樂會結束時間 21:45，媽媽在音樂會結束後用了 1 小時 15 分鐘回到家中，那時是？（答案：__午__時__分）','fill_in',NULL,'下午11時0分','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L34 行程表閱讀 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(34,'香港國際機場航機資料表：倫敦 07:00、北京 16:15、東京 17:00、巴黎 21:00、大阪 21:20。最後一班由香港飛往外地的航班的目的地是哪裏？','fill_in',NULL,'大阪','basic','A191-寶血小學-P3-1314下'),
(34,'香港國際機場航機資料：倫敦 07:00、北京 16:15、東京 17:00、巴黎 21:00、大阪 21:20。以上資料中，有多少航班在下午起飛？','fill_in_number',NULL,'4','basic','A191-寶血小學-P3-1314下'),
(34,'香港國際機場航機資料：倫敦 07:00、北京 16:15、東京 17:00、巴黎 21:00、大阪 21:20。飛往巴黎與飛往北京的航班起飛時間相差多少？（答案：__小時__分鐘）','fill_in',NULL,'4小時45分鐘','enhancement','A191-寶血小學-P3-1314下'),
(34,'香港國際機場航機資料：倫敦 07:00、北京 16:15、東京 17:00、巴黎 21:00、大阪 21:20。飛往大阪的航班在甚麼時候起飛？（答案：__午__時__分）','fill_in',NULL,'下午9時20分','basic','A191-寶血小學-P3-1314下'),
(34,'機場大堂離港班機時間表：CC267 韓國 13:50、BS623 韓國 17:35、RT388 加拿大 18:04、VL323 韓國 18:15。現在是下午兩時正，陳小姐希望今天內前往韓國，她可以乘坐哪班航班？（寫出航班編號，多個用 , 分隔）','fill_in',NULL,'BS623, VL323','enhancement','B105-五旬節于良發小學-P3-1213下'),
(34,'志明在下午 5 時 46 分到達荃灣碼頭，他最快可乘搭哪一個時間的渡輪前往珀麗灣？（渡輪荃灣→珀麗灣時間表：17:20, 17:40, 18:00, 18:20）','multiple_choice','["A. 17:20","B. 17:40","C. 18:00","D. 18:20"]','C. 18:00','enhancement','C031-聖公會青衣主恩小學-P3-1617下');

-- ===== L35 香港貨幣計算 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(35,'蛋撻每件售 12 元 8 角，慧文買 9 件，共付幾元幾角？（答案：a元b角）','fill_in',NULL,'115元2角','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(35,'媽媽買了 5 盒牛奶，付了 38 元，即一盒牛奶售幾元幾角？','fill_in',NULL,'7元6角','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(35,'草莓味布丁每杯售 23 元 8 角，子江買了半打草莓味布丁，他共付的款項是多少？','fill_in',NULL,'142元8角','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(35,'小明買巧克力 3 盒和餅乾 1 包，共需付幾元幾角？（巧克力每盒 28 元 2 角，餅乾每包 16 元 5 角）','fill_in',NULL,'101元1角','enhancement','A191-寶血小學-P3-1314下'),
(35,'小強買巧克力 2 盒和餅乾 2 包，共需付幾元幾角？（巧克力每盒 28 元 2 角，餅乾每包 16 元 5 角）','fill_in',NULL,'89元4角','enhancement','A191-寶血小學-P3-1314下'),
(35,'文具店大減價，哥哥買了 6 本筆記簿，共付了 111 元，平均每本筆記簿的售價是多少？','calculation',NULL,'18元5角','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(35,'兩輛玩具車售價 71 元，一輛玩具車的價值是多少？','calculation',NULL,'35元5角','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(35,'梳打餅每盒原價 22 元，現每盒減價 3 元出售。小傑買了半打，需付多少元？','calculation',NULL,'114','enhancement','A191-寶血小學-P3-1314下'),
(35,'小明購買圖書 2 本和筆盒 1 個，共需付多少元？（圖書 $88，筆盒 $40）','fill_in_number',NULL,'216','enhancement','A191-寶血小學-P3-1314下'),
(35,'媽媽購買皮鞋 1 對比購買筆盒 3 個貴多少元？（皮鞋 $280，筆盒 $40）','fill_in_number',NULL,'160','enhancement','A191-寶血小學-P3-1314下'),
(35,'媽媽買了籃球鞋和舞蹈鞋各 2 對，應付多少元？（籃球鞋一對 $518，舞蹈鞋一對 $23）','calculation',NULL,'1082','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(35,'爸爸買了拖鞋和涼鞋各 3 對，買涼鞋比買拖鞋多付多少元？（拖鞋一對 $10，涼鞋一對 $54）','calculation',NULL,'132','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L36 找續湊幣應用 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(36,'鉛筆每枝售 5 元。買鉛筆 2 枝，付 29 元，應找回多少元？','fill_in_number',NULL,'19','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(36,'倩祺的媽媽付 1100 元和一張價值 500 元的現金券買一台 1529 元的洗衣機，應找回多少元？','calculation',NULL,'71','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(36,'妹妹想買 4 隻成語故事光碟（每隻售 38 元，買三送一），但她只有 100 元，她還欠多少元？','calculation',NULL,'14','advanced','B105-五旬節于良發小學-P3-1213下'),
(36,'爸爸有 100 元，最多可買記事本多少本？（記事本 $8）','fill_in_number',NULL,'12','basic','A191-寶血小學-P3-1314下'),
(36,'英文字典每本售 187 元，寓言每本售 112 元。張先生想買一本寓言，他只有 50 元，他還欠多少元？','calculation',NULL,'62','enhancement','B090-聖保羅男女附屬小學-P3-1617下'),
(36,'爸爸的銀行戶口有 7086 元，提取了現金 5354 元後，又存入支票 3344 元。爸爸的銀行戶口還餘多少元？','calculation',NULL,'5076','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L13 長度單位換算 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(13,'一張八達通長約 90 ＿（填上適當量度單位）','multiple_choice','["A. mm","B. cm","C. m","D. km"]','A. mm','basic','A176-協和小學-長沙灣-P3-1314下'),
(13,'一輛巴士高約 430 ＿（填上適當量度單位）','multiple_choice','["A. mm","B. cm","C. m","D. km"]','B. cm','basic','A176-協和小學-長沙灣-P3-1314下'),
(13,'橡皮擦約長 30 ＿（填上適當量度單位）','multiple_choice','["A. mm","B. cm","C. m","D. km"]','A. mm','basic','A191-寶血小學-P3-1314下'),
(13,'學生手冊的長度約 175 ＿（填上適當長度單位）','multiple_choice','["A. mm","B. cm","C. m","D. km"]','A. mm','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(13,'港鐵南港島綫長約 7 ＿（填上適當長度單位）','multiple_choice','["A. mm","B. cm","C. m","D. km"]','D. km','basic','C031-聖公會青衣主恩小學-P3-1617下'),
(13,'機場跑道長約 4 ＿（填上適當的單位）','multiple_choice','["A. mm","B. cm","C. m","D. km"]','D. km','basic','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(13,'美美家中的電冰箱的容量約為 350 ＿（填上適當的單位）','multiple_choice','["A. mL","B. L","C. g","D. kg"]','B. L','basic','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(13,'明明帶回學校的水壺容量約 500 ＿（填上適當的單位）','multiple_choice','["A. mL","B. L","C. g","D. kg"]','A. mL','basic','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(13,'獅子山隧道的全長約 1420 ＿（填上適當的長度單位）','multiple_choice','["A. mm","B. cm","C. m","D. km"]','C. m','basic','B105-五旬節于良發小學-P3-1213下'),
(13,'小明完成 400 米跑步需約 2 ＿（選出適當的時間單位）','multiple_choice','["A. 秒","B. 分鐘","C. 小時","D. 天"]','B. 分鐘','basic','A191-寶血小學-P3-1314下');

-- ===== L14 長度量度應用 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(14,'妹妹身高 104 厘米，比姊姊矮 8 厘米，哥哥身高 139 厘米，哥哥比姊姊高多少厘米？','calculation',NULL,'27','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次'),
(14,'小明身高 129 厘米，小東身高 154 厘米，小東的身高比小明的高多少厘米？','fill_in_number',NULL,'25','basic','A191-寶血小學-P3-1314下'),
(14,'一棵豆苗原來高 4 厘米，兩天後長高了 32 毫米，長高後的豆苗高多少毫米？','fill_in_number',NULL,'72','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(14,'小文把一條繩子每 220 毫米剪成一段，剪出 4 段後餘下 117 毫米，這條繩子原來長多少毫米？','calculation',NULL,'997','enhancement','B090-聖保羅男女附屬小學-P3-1617下');

-- ===== L18 重量綜合應用 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(18,'秀雯有餅乾 127 塊，志安的餅乾比她少 56 塊，二人共有餅乾多少塊？','fill_in_number',NULL,'198','enhancement','A176-協和小學-長沙灣-P3-1314下');

-- ===== L16 24小時報時制 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(16,'以下哪一個時間屬於「下午」的時間？','multiple_choice','["A. 00:00","B. 01:59","C. 23:59","D. 12:00"]','C. 23:59','basic','A191-寶血小學-P3-1314下'),
(16,'用 24 小時報時制寫出小明在下午 10 時 10 分 10 秒睡覺的時間。','fill_in',NULL,'22:10:10','basic','A191-寶血小學-P3-1314下'),
(16,'10:47 a.m. 用 24 小時報時制表示是？','fill_in',NULL,'10:47','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(16,'20:16 用 12 小時報時制表示是？（答案：__午__時__分）','fill_in',NULL,'下午8時16分','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(16,'下列哪一個 24 小時報時制的電子鐘顯示的時間是上午 12 時 50 分？','multiple_choice','["A. 12:50 a.m.","B. 12:50","C. 12:50 p.m.","D. 00:50"]','D. 00:50','enhancement','B105-五旬節于良發小學-P3-1213下'),
(16,'用 24 小時報時制寫出《排球比賽》的開始播放時間（1:40 p.m.）。','fill_in',NULL,'13:40','basic','B090-聖保羅男女附屬小學-P3-1617下'),
(16,'明天學校旅行的集合時間是上午八時二十五分，用 24 小時報時制表示是？','fill_in',NULL,'08:25','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(16,'三年級同學在上午 10 時 47 分到達目的地，用 12 小時報時制電子鐘表示是？','fill_in',NULL,'10:47 a.m.','basic','B105-五旬節于良發小學-P3-1213下'),
(16,'小明在上午 12 時 30 分回到家，下列哪個電子鐘顯示了小明回到家的時間？','multiple_choice','["A. 12:30 p.m.","B. 00:30","C. 00:30 a.m.","D. 24:30"]','C. 00:30 a.m.','enhancement','B116-聖公會聖雅各小學-P3-1819下-第2次');

-- ===== L1 五位數認識 / L2 五位數位值 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(1,'27030 讀作？（用中文）','fill_in',NULL,'二萬七千零三十','basic','A191-寶血小學-P3-1314下'),
(1,'用中國數字寫出 71007 的讀法。','fill_in',NULL,'七萬一千零七','basic','B090-聖保羅男女附屬小學-P3-1617下'),
(2,'下列入場人數由多至少排列：第一天 34078，第二天 34087，第三天 34708。','fill_in',NULL,'34708 > 34087 > 34078','enhancement','C031-聖公會青衣主恩小學-P3-1617下'),
(2,'寫出一個比 29487 大，又比 30554 小的單數。','fill_in',NULL,'29489','enhancement','C031-聖公會青衣主恩小學-P3-1617下');

-- ===== L9 一位數乘兩位數 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(9,'24 × 3 = ?','fill_in_number',NULL,'72','basic','A191-寶血小學-P3-1314下'),
(9,'裝修工人每天工作 8 小時的薪金是 656 元，他每小時可得薪金多少元？','calculation',NULL,'82','basic','B078-將軍澳天主教小學-P3-1415下-第2次'),
(9,'一包手工紙有 105 張，王老師有手工紙 9 包。他把 132 張分給學生後，還有手工紙多少張？','fill_in_number',NULL,'813','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(9,'弟弟一星期共跑步 210 分鐘，平均每天跑步多少分鐘？','fill_in_number',NULL,'30','basic','A176-協和小學-長沙灣-P3-1314下'),
(9,'婷峰把 120 元平均分給表妹和 4 個表哥。表妹可分得多少元？','multiple_choice','["A. 20 元","B. 24 元","C. 30 元","D. 480 元"]','B. 24 元','enhancement','A176-協和小學-長沙灣-P3-1314下'),
(9,'每客海鮮意粉售 45 元，每個薄餅售 88 元。買一客海鮮意粉和 3 個薄餅需付多少元？','calculation',NULL,'309','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次'),
(9,'故事書共有 92 頁，淳僑每天看 5 頁，她共需多少天才把故事書看完？','fill_in_number',NULL,'19','enhancement','B078-將軍澳天主教小學-P3-1415下-第2次');

-- ===== L15 月曆/日期 =====
INSERT INTO p3_questions (lesson_id, question_text, question_type, options, correct_answer, difficulty_tier, source_paper) VALUES
(15,'某年二月有 29 天，這年是閏年，全年共有多少天？','fill_in_number',NULL,'366','basic','A176-協和小學-長沙灣-P3-1314下'),
(15,'希恩一家參加了南京五天旅行團，他們在 3 月 31 日出發，他們將會在何月何日返港？（3 月有 31 天；答案：__月__日）','fill_in',NULL,'4月4日','enhancement','B105-五旬節于良發小學-P3-1213下');
