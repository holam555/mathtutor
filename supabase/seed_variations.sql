-- ============================================================
-- seed_variations.sql
-- Insert variation_templates for all 54 categories
-- Run AFTER seed.sql and 0006_variations.sql
-- ============================================================

insert into variation_templates (category_id, template_prompt, constraints)
select id, prompt, constraints from (values

-- ── A. 數字與運算 ─────────────────────────────────────────
('A1', '你是香港小五數學老師。請生成5條「因數識別」選擇題。格式：「下列哪個數不是X的因數？」，4個選項，其中一個不是因數。被測試的數在12至96之間。只輸出JSON：{"questions":[{"question_text":"...","question_type":"multiple_choice","options":["A. ...","B. ...","C. ...","D. ..."],"correct_answer":"A. ...","difficulty":1}]}',
 '被測試的數在12至96之間；答案必須正確'),

('A2', '你是香港小五數學老師。請生成5條「倍數識別」選擇題。格式：「下列哪個數是X的倍數？」，X在2至12之間，4個選項，只有一個是正確倍數，選項數字在100至1000之間。只輸出JSON：{"questions":[{"question_text":"...","question_type":"multiple_choice","options":["A. ...","B. ...","C. ...","D. ..."],"correct_answer":"A. ...","difficulty":1}]}',
 'X在2至12之間；選項在100至1000之間'),

('A3', '你是香港小五數學老師。請生成5條「最大公因數（H.C.F.）」填充題。兩個數都在8至60之間，難度1：答案2至6，難度2：答案7至20。只輸出JSON：{"questions":[{"question_text":"求＿＿和＿＿的H.C.F.","question_type":"fill_in","options":null,"correct_answer":"...","difficulty":1}]}',
 '兩個數在8至60之間'),

('A4', '你是香港小五數學老師。請生成5條「最小公倍數（L.C.M.）」填充題。兩個數在4至20之間，難度1：答案12至40，難度2：答案40至120。只輸出JSON：{"questions":[{"question_text":"求＿＿和＿＿的L.C.M.","question_type":"fill_in","options":null,"correct_answer":"...","difficulty":1}]}',
 '兩個數在4至20之間'),

('A5', '你是香港小五數學老師。請生成5條「第N個公倍數」填充題。兩個數在3至15之間，N在2至4之間，答案不超過500。只輸出JSON：{"questions":[{"question_text":"＿＿和＿＿的第＿＿個公倍數是＿＿","question_type":"fill_in","options":null,"correct_answer":"...","difficulty":2}]}',
 '兩個數在3至15之間；N在2至4之間'),

('A6', '你是香港小五數學老師。請生成5條「大數運算與數位識別」題目，混合：兩位數×兩位數乘法、數位識別選擇題、取近似值填充題。只輸出JSON：{"questions":[{"question_text":"...","question_type":"fill_in","options":null,"correct_answer":"...","difficulty":1}]}',
 '包含乘除法、數位識別、取近似值'),

-- ── B. 分數 ─────────────────────────────────────────────────
('B1', '你是香港小五數學老師。請生成5條「等值分數」填充題。格式：a/b=( )/c 或 a/b=c/( ) 或鏈式。分母不超過60。只輸出JSON：{"questions":[{"question_text":"2/3 = ( )/9","question_type":"fill_in","options":null,"correct_answer":"6","difficulty":1}]}',
 '分母不超過60'),

('B2', '你是香港小五數學老師。請生成5條「分數大小比較」填充題。填入 >、< 或 =。難度1：兩個真分數；難度2：兩個帶分數（整數部分相同需通分）。分母不超過20。只輸出JSON：{"questions":[{"question_text":"1/3 __ 1/4","question_type":"fill_in","options":null,"correct_answer":">","difficulty":1}]}',
 '分母不超過20'),

('B3', '你是香港小五數學老師。請生成5條「分數大小排列」填充題。給出3個分數（真分數或帶分數），由大至小或由小至大排列。分母不超過12。只輸出JSON：{"questions":[{"question_text":"由小至大排列：3/4、1/2、2/3","question_type":"fill_in","options":null,"correct_answer":"1/2、2/3、3/4","difficulty":2}]}',
 '分母不超過12'),

('B4', '你是香港小五數學老師。請生成5條「異分母真分數加減」填充題。兩個真分數分母不同需通分，分母在3至12之間，LCM不超過36，答案化至最簡。只輸出JSON：{"questions":[{"question_text":"1/2 + 1/3 =","question_type":"fill_in","options":null,"correct_answer":"5/6","difficulty":1}]}',
 '答案須化至最簡分數'),

('B5', '你是香港小五數學老師。請生成5條「同分母帶分數加減」填充題。兩個帶分數分母相同（5至15之間），整數部分1至9。只輸出JSON：{"questions":[{"question_text":"1又2/5 + 2又1/5 =","question_type":"fill_in","options":null,"correct_answer":"3又3/5","difficulty":1}]}',
 '分母在5至15之間'),

('B6', '你是香港小五數學老師。請生成5條「異分母帶分數加減」填充題。兩個帶分數分母不同，LCM不超過40，整數部分1至8，答案化至最簡且為正數。只輸出JSON：{"questions":[{"question_text":"2又1/2 + 1又1/3 =","question_type":"fill_in","options":null,"correct_answer":"3又5/6","difficulty":2}]}',
 'LCM不超過40；答案為正數'),

('B7', '你是香港小五數學老師。請生成5條「整數減帶分數」填充題。整數在3至10之間，帶分數整數部分小於整數，分母在3至10之間，答案為正數帶分數化至最簡。只輸出JSON：{"questions":[{"question_text":"5 - 2又1/3 =","question_type":"fill_in","options":null,"correct_answer":"2又2/3","difficulty":2}]}',
 '答案為正數'),

('B8', '你是香港小五數學老師。請生成5條「三個分數混合加減」填充題。包含2至3個不同分母（LCM不超過36），可含真分數、帶分數、整數，答案為正數化至最簡。只輸出JSON：{"questions":[{"question_text":"1/2 + 1/3 - 1/4 =","question_type":"fill_in","options":null,"correct_answer":"7/12","difficulty":3}]}',
 'LCM不超過36'),

('B9', '你是香港小五數學老師。請生成5條「分數乘法」填充題。格式：真分數×帶分數 或 帶分數×帶分數，分母不超過15，答案化至最簡。只輸出JSON：{"questions":[{"question_text":"2/3 × 1又1/2 =","question_type":"fill_in","options":null,"correct_answer":"1","difficulty":2}]}',
 '答案化至最簡'),

('B10', '你是香港小五數學老師。請生成5條「分數估算」選擇題。算式含2至3個帶分數加減，先四捨五入至最近整數估算，4個選項只有一個最接近。只輸出JSON：{"questions":[{"question_text":"估算：2又7/8 + 1又1/9 約等於","question_type":"multiple_choice","options":["A. 3","B. 4","C. 5","D. 6"],"correct_answer":"B. 4","difficulty":2}]}',
 '分母在3至18之間'),

-- ── C. 應用題 ────────────────────────────────────────────────
('C1', '你是香港小五數學老師。請生成5條「買賣找錢」列式計算應用題。涉及單價、數量、找錢，可含折扣，答案為整數，金額50至1000元，香港日常場景。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":2}]}',
 '金額在50至1000元；答案為整數'),

('C2', '你是香港小五數學老師。請生成5條「分組餘數」列式計算應用題。把若干物件平均分組，求每組數量或需要多少組，可能有餘數需進一。總數100至800，每組5至25。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":2}]}',
 '總數100至800；每組5至25'),

('C3', '你是香港小五數學老師。請生成5條「儲蓄計劃」應用題。每月/每週儲若干元，問需多少時間儲到目標金額。目標100至2000元，每期20至200元，答案為整數月/週。只輸出JSON：{"questions":[{"question_text":"...","question_type":"fill_in","options":null,"correct_answer":"...","difficulty":2}]}',
 '答案為整數'),

('C4', '你是香港小五數學老師。請生成5條「分數加減應用題」列式計算。日常場景（食物、時間、距離），帶分數加減需通分，分母不超過12，答案化至最簡，包含完整問句和單位。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":2}]}',
 '分母不超過12'),

('C5', '你是香港小五數學老師。請生成5條「分數乘法應用題」列式計算。格式：A有X個，是B的Y/Z倍，求B；或A共X頁看了Y/Z求頁數。X在50至500之間，分母不超過10。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":2}]}',
 'X在50至500之間'),

('C6', '你是香港小五數學老師。請生成5條「帶分數價錢應用題」列式計算。涉及帶分數加減乘，場景：門票、課程收費、購物，金額以帶分數表示，答案化至最簡。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":3}]}',
 '金額以帶分數表示'),

('C7', '你是香港小五數學老師。請生成5條「數學規律推理」選擇題。格式：如果▲×A=B，那麼▲×C=？。A、C、B都是整數，C是A的整數倍（2至10倍），4個選項只有一個正確。只輸出JSON：{"questions":[{"question_text":"如果▲×6=42，那麼▲×18=","question_type":"multiple_choice","options":["A. 106","B. 116","C. 126","D. 136"],"correct_answer":"C. 126","difficulty":2}]}',
 'C是A的2至10倍'),

-- ── D. 量度與幾何 ────────────────────────────────────────────
('D1', '你是香港小五數學老師。請生成8條「填上適當量度單位」填充題。給出情境和數字，填入單位（mm、cm、m、km、g、kg、mL、L、cm²、m²、分鐘、小時），情境要合理。只輸出JSON：{"questions":[{"question_text":"一支原子筆約長15＿＿","question_type":"fill_in","options":null,"correct_answer":"cm","difficulty":1}]}',
 '包含長度、重量、容量、面積、時間各1至2條'),

('D2', '你是香港小五數學老師。請生成5條「長方形/正方形面積」題目。難度1：已知長和寬求面積；難度2：已知面積求邊長或已知周界和一邊求另一邊。尺寸3至25cm。只輸出JSON：{"questions":[{"question_text":"長方形長8cm、寬5cm，面積是＿＿cm²","question_type":"fill_in","options":null,"correct_answer":"40","difficulty":1}]}',
 '尺寸在3至25cm之間'),

('D3', '你是香港小五數學老師。請生成5條「平行四邊形面積」題目。難度1：已知底和高求面積；難度2：已知面積和底求高，或已知面積和高求底。底5至30cm，高3至20cm。只輸出JSON：{"questions":[{"question_text":"平行四邊形底12cm、高8cm，面積是＿＿cm²","question_type":"fill_in","options":null,"correct_answer":"96","difficulty":1}]}',
 '公式：底×高'),

('D4', '你是香港小五數學老師。請生成5條「三角形面積（已知底和高）」填充題。公式：底×高÷2，底4至20cm，高3至16cm，答案為整數。只輸出JSON：{"questions":[{"question_text":"三角形底10cm、高6cm，面積是＿＿cm²","question_type":"fill_in","options":null,"correct_answer":"30","difficulty":1}]}',
 '答案必須為整數（底和高的積為偶數）'),

('D5', '你是香港小五數學老師。請生成5條「三角形面積（逆向）」填充題。已知面積和底求高，或已知面積和高求底。面積12至60cm²，計算結果為整數。只輸出JSON：{"questions":[{"question_text":"三角形面積24cm²，底8cm，高是＿＿cm","question_type":"fill_in","options":null,"correct_answer":"6","difficulty":2}]}',
 '計算結果為整數'),

('D6', '你是香港小五數學老師。請生成5條「梯形面積」題目。公式：（上底＋下底）×高÷2。難度1：已知三邊求面積；難度2：已知面積、高和一底求另一底。尺寸3至20cm，答案為整數。只輸出JSON：{"questions":[{"question_text":"梯形上底4cm、下底8cm、高5cm，面積是＿＿cm²","question_type":"fill_in","options":null,"correct_answer":"30","difficulty":2}]}',
 '答案為整數'),

('D7', '你是香港小五數學老師。請生成5條「長方形周界（已知周界和一邊）」填充題。周界20至100cm，已知一邊，求另一邊，答案為整數，必須寫單位。只輸出JSON：{"questions":[{"question_text":"長方形周界36cm，長9cm，寬是＿＿cm","question_type":"fill_in","options":null,"correct_answer":"9","difficulty":2}]}',
 '答案為整數'),

('D8', '你是香港小五數學老師。請生成5條「L形組合圖形周界」文字題。以文字描述L形，例如從正方形剪去小正方形，求剩下的周界，答案為整數，需寫單位。只輸出JSON：{"questions":[{"question_text":"從邊長30cm的正方形剪去邊長10cm的小正方形，剩下圖形的周界是＿＿cm","question_type":"fill_in","options":null,"correct_answer":"80","difficulty":3}]}',
 '答案為整數'),

('D9', '你是香港小五數學老師。請生成5條「容量計算」題目。涉及mL和L換算（1L=1000mL），難度1：直接換算；難度2：兩個容器合併求總容量，答案為整數mL。只輸出JSON：{"questions":[{"question_text":"2L 500mL = ＿＿mL","question_type":"fill_in","options":null,"correct_answer":"2500","difficulty":1}]}',
 '1L=1000mL'),

-- ── E. 小數 ──────────────────────────────────────────────────
('E1', '你是香港小五數學老師。請生成5條「小數加減」填充題。難度1：兩個小數加減，最多兩位小數；難度2：含括號，如A-(B+C)=?。所有數在0.01至99.99，答案不為負數。只輸出JSON：{"questions":[{"question_text":"3.45 + 2.6 =","question_type":"fill_in","options":null,"correct_answer":"6.05","difficulty":1}]}',
 '答案不為負數'),

('E2', '你是香港小五數學老師。請生成5條「小數乘法」填充題。難度1：兩個小數相乘，每個最多一位小數；難度2：三個小數連乘或其中一個兩位小數，答案保留至三位小數。只輸出JSON：{"questions":[{"question_text":"1.2 × 0.5 =","question_type":"fill_in","options":null,"correct_answer":"0.6","difficulty":1}]}',
 '答案保留至三位小數'),

('E3', '你是香港小五數學老師。請生成5條「小數乘法規律」選擇題。給出基本算式A×B，給出4個變形（改變小數點位置），問哪個結果最大或最小。只輸出JSON：{"questions":[{"question_text":"已知3.6×2.5=9，下列哪個算式的結果最大？","question_type":"multiple_choice","options":["A. 0.36×25","B. 36×0.025","C. 3.6×25","D. 0.036×250"],"correct_answer":"C. 3.6×25","difficulty":2}]}',
 '4個選項只有一個正確'),

('E4', '你是香港小五數學老師。請生成5條「小數位值識別」題目。給出含小數的數（最多三位小數），問某數字在哪個位值（十分位/百分位/千分位），或某位值的數字代表多少。只輸出JSON：{"questions":[{"question_text":"在3.456中，數字5在哪個位值？","question_type":"fill_in","options":null,"correct_answer":"百分位","difficulty":1}]}',
 '最多三位小數'),

('E5', '你是香港小五數學老師。請生成5條「取近似值」題目。難度1：小數取至一位或兩位小數；難度2：大數取至萬位或十萬位，或情境題。只輸出JSON：{"questions":[{"question_text":"3.456 取至一位小數 =","question_type":"fill_in","options":null,"correct_answer":"3.5","difficulty":1}]}',
 '使用四捨五入'),

('E6', '你是香港小五數學老師。請生成5條「小數加減應用題」列式計算。香港日常情境（長度、重量、金錢），最多兩步計算，答案保留至兩位小數，包含文字解說和單位。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":2}]}',
 '答案保留至兩位小數'),

('E7', '你是香港小五數學老師。請生成5條「小數乘除應用題」列式計算。涉及小數×整數或小數÷整數，可含「取至小數點後兩位」要求，情境：購物、量度、速度。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":2}]}',
 '可含取近似值要求'),

-- ── F. 分數除法 ──────────────────────────────────────────────
('F1', '你是香港小五數學老師。請生成5條「整數除以分數」填充題。格式：整數÷真分數 或 整數÷帶分數，整數5至50，分母不超過12，答案化至最簡。只輸出JSON：{"questions":[{"question_text":"6 ÷ 2/3 =","question_type":"fill_in","options":null,"correct_answer":"9","difficulty":2}]}',
 '整數5至50；分母不超過12'),

('F2', '你是香港小五數學老師。請生成5條「帶分數除以分數」填充題。格式：帶分數÷真分數 或 帶分數÷帶分數，分母不超過16，答案化至最簡。只輸出JSON：{"questions":[{"question_text":"2又1/2 ÷ 1/4 =","question_type":"fill_in","options":null,"correct_answer":"10","difficulty":3}]}',
 '分母不超過16'),

('F3', '你是香港小五數學老師。請生成5條「多步分數除法應用題」列式計算。情境：分配物品、包裝，涉及帶分數除法，答案可能需進位（不夠一份也算一份）。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":3}]}',
 '答案可能需進位'),

-- ── G. 代數與方程 ────────────────────────────────────────────
('G1', '你是香港小五數學老師。請生成5條「代數式」填充題。給出文字描述，用代數式表示，例如「每袋a個，10袋多1個，共有___個」答案是「10a+1」。包含加減乘除，字母只用一個。只輸出JSON：{"questions":[{"question_text":"有50元，買了5把間尺，每把m元，剩下___元","question_type":"fill_in","options":null,"correct_answer":"50-5m","difficulty":1}]}',
 '字母只用一個'),

('G2', '你是香港小五數學老師。請生成5條「方程識別」選擇題。給出4個算式，問哪個是方程（含等號和未知數）或哪個不是。選項包括純等式、含字母等式、不等式等。只輸出JSON：{"questions":[{"question_text":"下列哪個是方程？","question_type":"multiple_choice","options":["A. 2+3=5","B. x+3>5","C. 2x+1=9","D. 3×4"],"correct_answer":"C. 2x+1=9","difficulty":1}]}',
 '包括純等式、含字母等式、不等式'),

('G3', '你是香港小五數學老師。請生成5條「解方程」題目。格式：x+a=b、x-a=b、ax=b 或 x÷a=b，答案為整數或簡單分數。只輸出JSON：{"questions":[{"question_text":"解方程：x + 7 = 15","question_type":"fill_in","options":null,"correct_answer":"x = 8","difficulty":2}]}',
 '答案為整數或簡單分數'),

('G4', '你是香港小五數學老師。請生成5條「方程應用題」列式計算。要求設未知數、建立方程、解方程三步驟，情境：分配物品、費用、年齡，答案為正整數。只輸出JSON：{"questions":[{"question_text":"...","question_type":"calculation","options":null,"correct_answer":"...","difficulty":3}]}',
 '需要設未知數、建立方程、解方程'),

-- ── H. 立體圖形 ──────────────────────────────────────────────
('H1', '你是香港小五數學老師。請生成5條「立體圖形識別」題目。根據特徵描述判斷是哪種立體圖形（正方體、長方體、三角柱、三角錐、四角柱、四角錐、圓柱、圓錐、球體）。只輸出JSON：{"questions":[{"question_text":"有6個面，全部都是正方形，這是＿＿","question_type":"fill_in","options":null,"correct_answer":"正方體","difficulty":1}]}',
 '涵蓋常見立體圖形'),

('H2', '你是香港小五數學老師。請生成5條「立體圖形屬性」填充題。問某立體有多少個面/頂點/棱。涉及：正方體、長方體、三角柱、三角錐、圓柱、圓錐。只輸出JSON：{"questions":[{"question_text":"三角柱有＿＿個頂點","question_type":"fill_in","options":null,"correct_answer":"6","difficulty":1}]}',
 '涵蓋面數、頂點數、棱數'),

('H3', '你是香港小五數學老師。請生成5條「長方體/正方體體積」題目。難度1：已知三個維度求體積；難度2：已知體積和兩個維度求第三個。尺寸2至20cm，答案為整數。只輸出JSON：{"questions":[{"question_text":"長方體長5cm、寬4cm、高3cm，體積是＿＿cm³","question_type":"fill_in","options":null,"correct_answer":"60","difficulty":1}]}',
 '公式：長×寬×高；答案為整數'),

('H4', '你是香港小五數學老師。請生成5條「柱體體積（底面積×高）」題目。已知底面積和高求體積，底面積10至500，高3至30，答案為整數。只輸出JSON：{"questions":[{"question_text":"柱體底面積25cm²、高8cm，體積是＿＿cm³","question_type":"fill_in","options":null,"correct_answer":"200","difficulty":2}]}',
 '公式：體積=底面積×高'),

-- ── I. 其他 ──────────────────────────────────────────────────
('I1', '你是香港小五數學老師。請生成5條「假分數與帶分數互化」填充題。難度1：假分數化帶分數；難度2：帶分數化假分數，分母不超過20。只輸出JSON：{"questions":[{"question_text":"15/4 = ＿＿（帶分數）","question_type":"fill_in","options":null,"correct_answer":"3又3/4","difficulty":1}]}',
 '分母不超過20'),

('I2', '你是香港小五數學老師。請生成5條「旋轉對稱」選擇題（純文字版）。給出4種圖形描述，問哪個不是旋轉對稱圖形。旋轉對稱：正方形、長方形、等邊三角形、正六邊形、圓形；非：梯形、不規則三角形、直角三角形。只輸出JSON：{"questions":[{"question_text":"下列哪個圖形不是旋轉對稱圖形？","question_type":"multiple_choice","options":["A. 正方形","B. 等邊三角形","C. 梯形","D. 圓形"],"correct_answer":"C. 梯形","difficulty":1}]}',
 '純文字描述圖形'),

('I3', '你是香港小五數學老師。請生成5條「容量換算（進階）」填充題。格式：X升Y毫升=?毫升 或 ?毫升=X升Y毫升。X在1至100之間，Y在1至999之間。只輸出JSON：{"questions":[{"question_text":"3升250毫升 = ＿＿毫升","question_type":"fill_in","options":null,"correct_answer":"3250","difficulty":2}]}',
 'X在1至100；Y在1至999'),

('I4', '你是香港小五數學老師。請生成5條「時間計算（行程）」填充題。類型A：出發時間+行程時長求到達時間（24小時制）；類型B：出發和到達時間求行程時長。時間跨越上午/下午。只輸出JSON：{"questions":[{"question_text":"下午2時45分出發，乘車1小時20分鐘，到達時間是＿＿","question_type":"fill_in","options":null,"correct_answer":"下午4時05分","difficulty":2}]}',
 '24小時制；時間跨越上午下午')

) as t(code, prompt, constraints)
join question_categories qc on qc.code = t.code
on conflict (category_id) do update
  set template_prompt = excluded.template_prompt,
      constraints = excluded.constraints;
