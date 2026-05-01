// Hardcoded assessment questions from real exam papers, organized by grade + enrollment month.
// module_name drives Gemini report grouping (replaces DB category codes for assessments).

export type HardcodedQuestion = {
  question_text: string
  question_type: 'multiple_choice' | 'fill_in' | 'fill_in_number'
  options?: string[]
  correct_answer: string
  module_name: string
}

export type AssessmentPaper = {
  grade: number
  month: number
  label: string
  grade_label: string
  questions: HardcodedQuestion[]
}

// ── P5 Papers ──────────────────────────────────────────────────────────────

const p5_sept: AssessmentPaper = {
  grade: 5, month: 9,
  label: 'P5 9月版',
  grade_label: '小五（9月入學）',
  questions: [
    // 小數四則運算
    {
      question_text: '3.45 + 2.78 = ?',
      question_type: 'multiple_choice',
      options: ['A. 5.23', 'B. 6.13', 'C. 6.23', 'D. 7.23'],
      correct_answer: 'C. 6.23',
      module_name: '小數四則運算',
    },
    {
      question_text: '10.5 - 3.78 = ?',
      question_type: 'multiple_choice',
      options: ['A. 6.72', 'B. 7.28', 'C. 6.27', 'D. 7.72'],
      correct_answer: 'A. 6.72',
      module_name: '小數四則運算',
    },
    {
      question_text: '2.5 × 4 = ?',
      question_type: 'multiple_choice',
      options: ['A. 10', 'B. 8.5', 'C. 2.5', 'D. 100'],
      correct_answer: 'A. 10',
      module_name: '小數四則運算',
    },
    {
      question_text: '8.4 ÷ 0.4 = ?',
      question_type: 'multiple_choice',
      options: ['A. 2.1', 'B. 21', 'C. 210', 'D. 0.21'],
      correct_answer: 'B. 21',
      module_name: '小數四則運算',
    },
    // 小數比較與換算
    {
      question_text: '下列哪個數最大？',
      question_type: 'multiple_choice',
      options: ['A. 3.45', 'B. 3.4', 'C. 3.54', 'D. 3.44'],
      correct_answer: 'C. 3.54',
      module_name: '小數比較與換算',
    },
    {
      question_text: '1.25小時 = ___ 分鐘',
      question_type: 'multiple_choice',
      options: ['A. 60', 'B. 75', 'C. 80', 'D. 125'],
      correct_answer: 'B. 75',
      module_name: '小數比較與換算',
    },
    // 小數四則運算 (fill-in)
    {
      question_text: '6.5 + 6.7 = ___',
      question_type: 'fill_in_number',
      correct_answer: '13.2',
      module_name: '小數四則運算',
    },
    {
      question_text: '9.35 - 1.8 = ___',
      question_type: 'fill_in_number',
      correct_answer: '7.55',
      module_name: '小數四則運算',
    },
    {
      question_text: '0.45 × 20 = ___',
      question_type: 'fill_in_number',
      correct_answer: '9',
      module_name: '小數四則運算',
    },
    {
      question_text: '3.6 ÷ 0.4 = ___',
      question_type: 'fill_in_number',
      correct_answer: '9',
      module_name: '小數四則運算',
    },
    // 小數比較與換算 (fill-in)
    {
      question_text: '4.1 ___ 4.09（填入 >、< 或 =）',
      question_type: 'fill_in',
      correct_answer: '>',
      module_name: '小數比較與換算',
    },
    {
      question_text: '2.5升 = ___ 毫升',
      question_type: 'fill_in_number',
      correct_answer: '2500',
      module_name: '小數比較與換算',
    },
    {
      question_text: '0.5公里 = ___ 米',
      question_type: 'fill_in_number',
      correct_answer: '500',
      module_name: '小數比較與換算',
    },
  ],
}

const p5_nov: AssessmentPaper = {
  grade: 5, month: 11,
  label: 'P5 11月版',
  grade_label: '小五（11月入學）',
  questions: [
    // 分數四則運算
    {
      question_text: '2/5 + 1/4 = ?',
      question_type: 'multiple_choice',
      options: ['A. 3/9', 'B. 13/20', 'C. 3/20', 'D. 1/5'],
      correct_answer: 'B. 13/20',
      module_name: '分數四則運算',
    },
    {
      question_text: '5/6 - 1/3 = ?',
      question_type: 'multiple_choice',
      options: ['A. 4/3', 'B. 1/2', 'C. 2/3', 'D. 4/9'],
      correct_answer: 'B. 1/2',
      module_name: '分數四則運算',
    },
    {
      question_text: '3/4 ÷ 1/2 = ?',
      question_type: 'multiple_choice',
      options: ['A. 3/8', 'B. 3/2', 'C. 1/2', 'D. 2/3'],
      correct_answer: 'B. 3/2',
      module_name: '分數四則運算',
    },
    // 速率計算
    {
      question_text: '一輛汽車以時速60公里行駛3.5小時，共行了多少公里？',
      question_type: 'multiple_choice',
      options: ['A. 180公里', 'B. 210公里', 'C. 63.5公里', 'D. 200公里'],
      correct_answer: 'B. 210公里',
      module_name: '速率計算',
    },
    // 幾何面積
    {
      question_text: '三角形的底是8cm，高是5cm，面積是多少？',
      question_type: 'multiple_choice',
      options: ['A. 40cm²', 'B. 20cm²', 'C. 13cm²', 'D. 80cm²'],
      correct_answer: 'B. 20cm²',
      module_name: '幾何面積',
    },
    // 速率計算
    {
      question_text: '某人跑了200米，用了5秒，他的速率是每秒多少米？',
      question_type: 'multiple_choice',
      options: ['A. 40米/秒', 'B. 45米/秒', 'C. 50米/秒', 'D. 35米/秒'],
      correct_answer: 'A. 40米/秒',
      module_name: '速率計算',
    },
    // 分數四則運算 (fill-in)
    {
      question_text: '1/2 + 1/3 = ___',
      question_type: 'fill_in_number',
      correct_answer: '5/6',
      module_name: '分數四則運算',
    },
    {
      question_text: '1/4 + 3/8 = ___',
      question_type: 'fill_in_number',
      correct_answer: '5/8',
      module_name: '分數四則運算',
    },
    {
      question_text: '7/10 - 2/5 = ___',
      question_type: 'fill_in_number',
      correct_answer: '3/10',
      module_name: '分數四則運算',
    },
    {
      question_text: '一個班有120人，其中4/5的學生完成了作業，完成作業的有多少人？',
      question_type: 'fill_in_number',
      correct_answer: '96',
      module_name: '分數四則運算',
    },
    // 幾何面積 (fill-in)
    {
      question_text: '三角形的底是20cm，高是18cm，面積是___cm²',
      question_type: 'fill_in_number',
      correct_answer: '180',
      module_name: '幾何面積',
    },
    // 分數比較
    {
      question_text: '2/3 ___ 3/4（填入 >、< 或 =）',
      question_type: 'fill_in',
      correct_answer: '<',
      module_name: '分數比較',
    },
  ],
}

const p5_jan: AssessmentPaper = {
  grade: 5, month: 1,
  label: 'P5 1月版',
  grade_label: '小五（1月入學）',
  questions: [
    // 小數與比較
    {
      question_text: '3.45和3.450哪個較大？',
      question_type: 'multiple_choice',
      options: ['A. 3.45較大', 'B. 3.450較大', 'C. 一樣大', 'D. 無法比較'],
      correct_answer: 'C. 一樣大',
      module_name: '小數與比較',
    },
    // 速率計算
    {
      question_text: '一輛汽車以時速60公里行駛2.5小時，共行了多少公里？',
      question_type: 'multiple_choice',
      options: ['A. 62.5公里', 'B. 120公里', 'C. 150公里', 'D. 160公里'],
      correct_answer: 'C. 150公里',
      module_name: '速率計算',
    },
    // 幾何面積
    {
      question_text: '三角形面積的計算公式是？',
      question_type: 'multiple_choice',
      options: ['A. 底 × 高', 'B. 底 × 高 ÷ 2', 'C. 底 + 高', 'D. 底 × 高 × 2'],
      correct_answer: 'B. 底 × 高 ÷ 2',
      module_name: '幾何面積',
    },
    {
      question_text: '長方形長8cm、寬5cm，面積是多少？',
      question_type: 'multiple_choice',
      options: ['A. 26cm²', 'B. 26cm', 'C. 40cm²', 'D. 80cm²'],
      correct_answer: 'C. 40cm²',
      module_name: '幾何面積',
    },
    // 速率計算
    {
      question_text: '行程時間的計算公式是？',
      question_type: 'multiple_choice',
      options: ['A. 距離 × 速率', 'B. 距離 ÷ 速率', 'C. 速率 ÷ 距離', 'D. 速率 × 距離'],
      correct_answer: 'B. 距離 ÷ 速率',
      module_name: '速率計算',
    },
    // 小數與比較
    {
      question_text: '2.5 ÷ 0.05 = ?',
      question_type: 'multiple_choice',
      options: ['A. 5', 'B. 50', 'C. 500', 'D. 0.05'],
      correct_answer: 'B. 50',
      module_name: '小數與比較',
    },
    // 速率計算 (fill-in)
    {
      question_text: '一輛汽車時速60公里，行駛4小時，共行了___公里',
      question_type: 'fill_in_number',
      correct_answer: '240',
      module_name: '速率計算',
    },
    {
      question_text: '120公里的路程，以時速5公里行走，需要___小時',
      question_type: 'fill_in_number',
      correct_answer: '24',
      module_name: '速率計算',
    },
    // 幾何面積 (fill-in)
    {
      question_text: '正方形面積25cm²，它的邊長是___cm',
      question_type: 'fill_in_number',
      correct_answer: '5',
      module_name: '幾何面積',
    },
    // 小數與比較 (fill-in)
    {
      question_text: '4.5 - 2.5 = ___',
      question_type: 'fill_in_number',
      correct_answer: '2',
      module_name: '小數與比較',
    },
    {
      question_text: '一輛汽車時速60公里，行駛0.5小時，走了___公里',
      question_type: 'fill_in_number',
      correct_answer: '30',
      module_name: '速率計算',
    },
    {
      question_text: '某人以每分鐘3米的速率步行，走135米需要___分鐘',
      question_type: 'fill_in_number',
      correct_answer: '45',
      module_name: '速率計算',
    },
  ],
}

const p5_mar: AssessmentPaper = {
  grade: 5, month: 3,
  label: 'P5 3月版',
  grade_label: '小五（3月入學）',
  questions: [
    // 百分比計算
    {
      question_text: '$500加20%是多少？',
      question_type: 'multiple_choice',
      options: ['A. $520', 'B. $600', 'C. $550', 'D. $620'],
      correct_answer: 'B. $600',
      module_name: '百分比計算',
    },
    // 立體體積
    {
      question_text: '5³ = ?',
      question_type: 'multiple_choice',
      options: ['A. 15', 'B. 125', 'C. 50', 'D. 555'],
      correct_answer: 'B. 125',
      module_name: '立體體積',
    },
    // 平均數計算
    {
      question_text: '四次測驗的分數分別是80、90、85、85，平均分是多少？',
      question_type: 'multiple_choice',
      options: ['A. 85分', 'B. 84分', 'C. 86分', 'D. 87分'],
      correct_answer: 'A. 85分',
      module_name: '平均數計算',
    },
    // 百分比計算
    {
      question_text: '某商品打八折後售價$320，原價是多少？',
      question_type: 'multiple_choice',
      options: ['A. $400', 'B. $360', 'C. $380', 'D. $420'],
      correct_answer: 'A. $400',
      module_name: '百分比計算',
    },
    // 立體體積
    {
      question_text: '長方體長10cm、寬8cm、高5cm，體積是多少？',
      question_type: 'multiple_choice',
      options: ['A. 400cm³', 'B. 300cm³', 'C. 450cm³', 'D. 500cm³'],
      correct_answer: 'A. 400cm³',
      module_name: '立體體積',
    },
    // 圓形圖解讀
    {
      question_text: '一班40人，其中35%喜歡數學，有多少人喜歡數學？',
      question_type: 'multiple_choice',
      options: ['A. 14人', 'B. 16人', 'C. 12人', 'D. 18人'],
      correct_answer: 'A. 14人',
      module_name: '圓形圖解讀',
    },
    // 百分比計算 (fill-in)
    {
      question_text: '$100加20%是$___',
      question_type: 'fill_in_number',
      correct_answer: '120',
      module_name: '百分比計算',
    },
    // 立體體積 (fill-in)
    {
      question_text: '6³ = ___',
      question_type: 'fill_in_number',
      correct_answer: '216',
      module_name: '立體體積',
    },
    // 平均數計算 (fill-in)
    {
      question_text: '兩次測驗的分數分別是80分和95分，平均分是___分',
      question_type: 'fill_in_number',
      correct_answer: '87.5',
      module_name: '平均數計算',
    },
    // 立體體積 (fill-in)
    {
      question_text: '長方體長9cm、寬7cm、高4cm，體積是___cm³',
      question_type: 'fill_in_number',
      correct_answer: '252',
      module_name: '立體體積',
    },
    {
      question_text: '正方形邊長20cm，面積是___cm²',
      question_type: 'fill_in_number',
      correct_answer: '400',
      module_name: '立體體積',
    },
    // 圓形圖解讀 (fill-in)
    {
      question_text: '一班40人，其中60%的學生喜歡運動，有___人喜歡運動',
      question_type: 'fill_in_number',
      correct_answer: '24',
      module_name: '圓形圖解讀',
    },
  ],
}

const p5_may: AssessmentPaper = {
  grade: 5, month: 5,
  label: 'P5 5月版',
  grade_label: '小五（5月入學）',
  questions: [
    // 折扣應用
    {
      question_text: '某商品原價$600，打七折再減$50，現價是多少？',
      question_type: 'multiple_choice',
      options: ['A. $370', 'B. $350', 'C. $400', 'D. $420'],
      correct_answer: 'A. $370',
      module_name: '折扣應用',
    },
    // 比與比例
    {
      question_text: '3 : 5 = x : 40，x = ?',
      question_type: 'multiple_choice',
      options: ['A. 18', 'B. 24', 'C. 30', 'D. 15'],
      correct_answer: 'B. 24',
      module_name: '比與比例',
    },
    // 體積與容量
    {
      question_text: '一個水壺容量1500mL，每杯250mL，可以倒多少杯？',
      question_type: 'multiple_choice',
      options: ['A. 5杯', 'B. 6杯', 'C. 7杯', 'D. 8杯'],
      correct_answer: 'B. 6杯',
      module_name: '體積與容量',
    },
    // 折扣應用
    {
      question_text: '成本$200，售價$250，利潤率是多少？',
      question_type: 'multiple_choice',
      options: ['A. 20%', 'B. 25%', 'C. 50%', 'D. 80%'],
      correct_answer: 'B. 25%',
      module_name: '折扣應用',
    },
    // 一元一次方程
    {
      question_text: '2x + 8 = 24，x = ?',
      question_type: 'multiple_choice',
      options: ['A. 4', 'B. 8', 'C. 16', 'D. 6'],
      correct_answer: 'B. 8',
      module_name: '一元一次方程',
    },
    // 體積與容量
    {
      question_text: '一個長方形水缸長80cm、寬50cm、高40cm，容量是多少升？',
      question_type: 'multiple_choice',
      options: ['A. 160升', 'B. 16升', 'C. 1600升', 'D. 0.16升'],
      correct_answer: 'A. 160升',
      module_name: '體積與容量',
    },
    // 折扣應用 (fill-in)
    {
      question_text: '原價$900，打八折，售價$___',
      question_type: 'fill_in_number',
      correct_answer: '720',
      module_name: '折扣應用',
    },
    // 比與比例 (fill-in)
    {
      question_text: 'a : b = 4 : 5，a = 20，b = ___',
      question_type: 'fill_in_number',
      correct_answer: '25',
      module_name: '比與比例',
    },
    // 一元一次方程 (fill-in)
    {
      question_text: 'x - 15 = 20，x = ___',
      question_type: 'fill_in_number',
      correct_answer: '35',
      module_name: '一元一次方程',
    },
    {
      question_text: '5x - 2 = 63，x = ___',
      question_type: 'fill_in_number',
      correct_answer: '13',
      module_name: '一元一次方程',
    },
    // 體積與容量 (fill-in)
    {
      question_text: '長方形水缸長80cm、寬50cm、高18cm，容量是___cm³',
      question_type: 'fill_in_number',
      correct_answer: '72000',
      module_name: '體積與容量',
    },
    {
      question_text: '一個圓柱形容器底面積500cm²、高7cm，容積是___cm³',
      question_type: 'fill_in_number',
      correct_answer: '3500',
      module_name: '體積與容量',
    },
  ],
}

// ── P6 Papers ──────────────────────────────────────────────────────────────

const p6_sept: AssessmentPaper = {
  grade: 6, month: 9,
  label: 'P6 9月版',
  grade_label: '小六（9月入學）',
  questions: [
    // 分數運算
    {
      question_text: '3/4 + 5/6 = ?',
      question_type: 'multiple_choice',
      options: ['A. 8/10', 'B. 1又7/12', 'C. 8/12', 'D. 2'],
      correct_answer: 'B. 1又7/12',
      module_name: '分數運算',
    },
    // 小數運算
    {
      question_text: '2.5 × 1.2 = ?',
      question_type: 'multiple_choice',
      options: ['A. 3.0', 'B. 2.7', 'C. 3.5', 'D. 2.5'],
      correct_answer: 'A. 3.0',
      module_name: '小數運算',
    },
    // 速率計算
    {
      question_text: '一輛汽車時速80公里，行駛2.5小時，共行了多少公里？',
      question_type: 'multiple_choice',
      options: ['A. 160公里', 'B. 180公里', 'C. 200公里', 'D. 220公里'],
      correct_answer: 'C. 200公里',
      module_name: '速率計算',
    },
    // 解方程
    {
      question_text: 'x + 15 = 40，x = ?',
      question_type: 'multiple_choice',
      options: ['A. 55', 'B. 25', 'C. 15', 'D. 40'],
      correct_answer: 'B. 25',
      module_name: '解方程',
    },
    // 體積計算
    {
      question_text: '長方體體積的計算公式是？',
      question_type: 'multiple_choice',
      options: ['A. 長 + 寬 + 高', 'B. 長 × 寬 × 高', 'C. 長 × 寬', 'D. (長 + 寬) × 2'],
      correct_answer: 'B. 長 × 寬 × 高',
      module_name: '體積計算',
    },
    // 分數比較
    {
      question_text: '3/5和5/8比較，哪個較大？',
      question_type: 'multiple_choice',
      options: ['A. 3/5', 'B. 5/8', 'C. 相同', 'D. 無法比較'],
      correct_answer: 'B. 5/8',
      module_name: '分數比較',
    },
    // 分數運算 (fill-in)
    {
      question_text: '1/3 × 1/3 = ___',
      question_type: 'fill_in_number',
      correct_answer: '1/9',
      module_name: '分數運算',
    },
    // 小數運算 (fill-in)
    {
      question_text: '4.5 × 2.4 = ___',
      question_type: 'fill_in_number',
      correct_answer: '10.8',
      module_name: '小數運算',
    },
    // 速率計算 (fill-in)
    {
      question_text: '一個班有80人，其中60%完成了功課，完成功課的有___人',
      question_type: 'fill_in_number',
      correct_answer: '48',
      module_name: '速率計算',
    },
    // 體積計算 (fill-in)
    {
      question_text: '正方體邊長2cm，體積是___cm³',
      question_type: 'fill_in_number',
      correct_answer: '8',
      module_name: '體積計算',
    },
    {
      question_text: '某容器容量___升，等於120000毫升',
      question_type: 'fill_in_number',
      correct_answer: '120',
      module_name: '體積計算',
    },
    // 分數比較 (fill-in)
    {
      question_text: '3 ÷ 2 = ___（用小數表示）',
      question_type: 'fill_in_number',
      correct_answer: '1.5',
      module_name: '分數比較',
    },
  ],
}

const p6_nov: AssessmentPaper = {
  grade: 6, month: 11,
  label: 'P6 11月版',
  grade_label: '小六（11月入學）',
  questions: [
    // 圓形周界與面積（π = 3.14）
    {
      question_text: '圓形半徑7cm，周界是多少？（π = 3.14）',
      question_type: 'multiple_choice',
      options: ['A. 21.98cm', 'B. 43.96cm', 'C. 49cm', 'D. 22cm'],
      correct_answer: 'B. 43.96cm',
      module_name: '圓形周界與面積',
    },
    {
      question_text: '圓形半徑5cm，面積是多少？（π = 3.14）',
      question_type: 'multiple_choice',
      options: ['A. 31.4cm²', 'B. 78.5cm²', 'C. 15.7cm²', 'D. 25cm²'],
      correct_answer: 'B. 78.5cm²',
      module_name: '圓形周界與面積',
    },
    // 扇形面積
    {
      question_text: '扇形圓心角90°、半徑8cm，面積是多少？（π = 3.14）',
      question_type: 'multiple_choice',
      options: ['A. 50.24cm²', 'B. 75.36cm²', 'C. 25.12cm²', 'D. 200.96cm²'],
      correct_answer: 'A. 50.24cm²',
      module_name: '扇形面積',
    },
    // 百分比計算
    {
      question_text: '$500打八折，售價是多少？',
      question_type: 'multiple_choice',
      options: ['A. $400', 'B. $450', 'C. $420', 'D. $480'],
      correct_answer: 'A. $400',
      module_name: '百分比計算',
    },
    {
      question_text: '$200漲到$250，漲幅百分比是多少？',
      question_type: 'multiple_choice',
      options: ['A. 20%', 'B. 25%', 'C. 50%', 'D. 80%'],
      correct_answer: 'B. 25%',
      module_name: '百分比計算',
    },
    // 線性方程
    {
      question_text: '3x + 15 = 45，x = ?',
      question_type: 'multiple_choice',
      options: ['A. 5', 'B. 10', 'C. 15', 'D. 20'],
      correct_answer: 'B. 10',
      module_name: '線性方程',
    },
    // 圓形周界與面積 (fill-in)
    {
      question_text: '圓形直徑14cm，周界是___cm（π = 3.14）',
      question_type: 'fill_in_number',
      correct_answer: '43.96',
      module_name: '圓形周界與面積',
    },
    {
      question_text: '圓形半徑10cm，面積是___cm²（π = 3.14）',
      question_type: 'fill_in_number',
      correct_answer: '314',
      module_name: '圓形周界與面積',
    },
    // 扇形面積 (fill-in)
    {
      question_text: '扇形圓心角270°、半徑6cm，面積是___cm²（π = 3.14）',
      question_type: 'fill_in_number',
      correct_answer: '84.78',
      module_name: '扇形面積',
    },
    // 百分比計算 (fill-in)
    {
      question_text: '某物品九折後售價$540，原價是$___',
      question_type: 'fill_in_number',
      correct_answer: '600',
      module_name: '百分比計算',
    },
    // 線性方程 (fill-in)
    {
      question_text: '2x - 3 = 19，x = ___',
      question_type: 'fill_in_number',
      correct_answer: '11',
      module_name: '線性方程',
    },
    {
      question_text: '某數的80%是320，該數是___',
      question_type: 'fill_in_number',
      correct_answer: '400',
      module_name: '百分比計算',
    },
  ],
}

const p6_jan: AssessmentPaper = {
  grade: 6, month: 1,
  label: 'P6 1月版',
  grade_label: '小六（1月入學）',
  questions: [
    // 圓形與扇形
    {
      question_text: '圓形直徑10cm，半徑是多少？',
      question_type: 'multiple_choice',
      options: ['A. 20cm', 'B. 5cm', 'C. 10cm', 'D. 3.14cm'],
      correct_answer: 'B. 5cm',
      module_name: '圓形與扇形',
    },
    {
      question_text: '圓形半徑7cm，周長是多少？（π = 3.14）',
      question_type: 'multiple_choice',
      options: ['A. 21.98cm', 'B. 43.96cm', 'C. 14cm', 'D. 49cm'],
      correct_answer: 'B. 43.96cm',
      module_name: '圓形與扇形',
    },
    {
      question_text: '扇形圓心角90°佔整個圓形的幾分之幾？',
      question_type: 'multiple_choice',
      options: ['A. 1/2', 'B. 1/3', 'C. 1/4', 'D. 1/6'],
      correct_answer: 'C. 1/4',
      module_name: '圓形與扇形',
    },
    // 百分數應用
    {
      question_text: '$200打八折，售價是多少？',
      question_type: 'multiple_choice',
      options: ['A. HK$160', 'B. HK$180', 'C. HK$240', 'D. HK$220'],
      correct_answer: 'A. HK$160',
      module_name: '百分數應用',
    },
    // 行程問題
    {
      question_text: '甲以相同速率往返同一路程，去程用了2小時，回程用了多少時間？',
      question_type: 'multiple_choice',
      options: ['A. 4小時', 'B. 2小時', 'C. 1小時', 'D. 3小時'],
      correct_answer: 'B. 2小時',
      module_name: '行程問題',
    },
    // 複雜方程
    {
      question_text: '(x + 3) × 5 = 40，x = ?',
      question_type: 'multiple_choice',
      options: ['A. 5', 'B. 8', 'C. 3', 'D. 7'],
      correct_answer: 'A. 5',
      module_name: '複雜方程',
    },
    // 圓形與扇形 (fill-in)
    {
      question_text: '圓形直徑8cm，周長是___cm（π = 3.14）',
      question_type: 'fill_in_number',
      correct_answer: '25.12',
      module_name: '圓形與扇形',
    },
    {
      question_text: '圓形半徑3cm，面積是___cm²（π = 3.14）',
      question_type: 'fill_in_number',
      correct_answer: '28.26',
      module_name: '圓形與扇形',
    },
    {
      question_text: '一個圓形分成3等份，每份佔圓形的___（用分數表示）',
      question_type: 'fill_in_number',
      correct_answer: '1/3',
      module_name: '圓形與扇形',
    },
    // 行程問題 (fill-in)
    {
      question_text: '長方體長15cm、寬7cm、高3cm，體積是___cm³',
      question_type: 'fill_in_number',
      correct_answer: '315',
      module_name: '行程問題',
    },
    {
      question_text: '長方形長25cm、寬3cm，面積是___cm²',
      question_type: 'fill_in_number',
      correct_answer: '75',
      module_name: '行程問題',
    },
    // 複雜方程 (fill-in)
    {
      question_text: '3x - 12 = 6，x = ___',
      question_type: 'fill_in_number',
      correct_answer: '6',
      module_name: '複雜方程',
    },
  ],
}

const p6_mar: AssessmentPaper = {
  grade: 6, month: 3,
  label: 'P6 3月版',
  grade_label: '小六（3月入學）',
  questions: [
    // 單複利息
    {
      question_text: '本金$2000，年利率20%，一年的單利息是多少？',
      question_type: 'multiple_choice',
      options: ['A. $2400', 'B. $400', 'C. $4000', 'D. $200'],
      correct_answer: 'B. $400',
      module_name: '單複利息',
    },
    {
      question_text: '本金$5000，年複利率3%，2年後的本利和是多少？',
      question_type: 'multiple_choice',
      options: ['A. $5300', 'B. $5304.5', 'C. $5600', 'D. $5150'],
      correct_answer: 'B. $5304.5',
      module_name: '單複利息',
    },
    // 棱柱體積/表面積
    {
      question_text: '長方體長8cm、寬5cm、高4cm，表面積是多少？',
      question_type: 'multiple_choice',
      options: ['A. 160cm²', 'B. 184cm²', 'C. 200cm²', 'D. 120cm²'],
      correct_answer: 'B. 184cm²',
      module_name: '棱柱體積與表面積',
    },
    // 概率計算
    {
      question_text: '擲一枚硬幣3次，恰好2次出現正面的概率是多少？',
      question_type: 'multiple_choice',
      options: ['A. 1/4', 'B. 3/8', 'C. 1/2', 'D. 1/8'],
      correct_answer: 'B. 3/8',
      module_name: '概率計算',
    },
    // 比例分配
    {
      question_text: 'a : b = 3 : 5，a = 15，b = ?',
      question_type: 'multiple_choice',
      options: ['A. 20', 'B. 25', 'C. 30', 'D. 35'],
      correct_answer: 'B. 25',
      module_name: '比例分配',
    },
    {
      question_text: '$600按3 : 7分配，較大的一份是多少？',
      question_type: 'multiple_choice',
      options: ['A. $180', 'B. $210', 'C. $420', 'D. $360'],
      correct_answer: 'C. $420',
      module_name: '比例分配',
    },
    // 單複利息 (fill-in)
    {
      question_text: '本金$___，年利率20%，一年的單利息是$480',
      question_type: 'fill_in_number',
      correct_answer: '2400',
      module_name: '單複利息',
    },
    // 棱柱體積與表面積 (fill-in)
    {
      question_text: '正三棱柱底面積20cm²、高6cm，體積是___cm³',
      question_type: 'fill_in_number',
      correct_answer: '120',
      module_name: '棱柱體積與表面積',
    },
    {
      question_text: '長方體長6cm、寬5cm、高4cm，表面積是___cm²',
      question_type: 'fill_in_number',
      correct_answer: '148',
      module_name: '棱柱體積與表面積',
    },
    // 概率計算 (fill-in)
    {
      question_text: '已知某事件發生的概率是3/8，則該事件不發生的概率是___',
      question_type: 'fill_in_number',
      correct_answer: '5/8',
      module_name: '概率計算',
    },
    {
      question_text: '某數的3/8是6，該數是___',
      question_type: 'fill_in_number',
      correct_answer: '16',
      module_name: '概率計算',
    },
    // 比例分配 (fill-in)
    {
      question_text: '$2000按3 : 2分配，較大份額是$___',
      question_type: 'fill_in_number',
      correct_answer: '1200',
      module_name: '比例分配',
    },
  ],
}

const p6_may: AssessmentPaper = {
  grade: 6, month: 5,
  label: 'P6 5月版（TSA）',
  grade_label: '小六（5月入學）',
  questions: [
    // 速率/距離/時間
    {
      question_text: '一輛飛機時速800公里，飛行3.25小時，共飛了多少公里？',
      question_type: 'multiple_choice',
      options: ['A. 803.25公里', 'B. 2400公里', 'C. 2600公里', 'D. 800公里'],
      correct_answer: 'C. 2600公里',
      module_name: '速率與行程',
    },
    {
      question_text: '甲乙兩人從同一地點出發，方向相反步行，甲速率每小時3公里，乙速率每小時7公里，30分鐘後相距多少公里？',
      question_type: 'multiple_choice',
      options: ['A. 5公里', 'B. 6公里', 'C. 2公里', 'D. 4公里'],
      correct_answer: 'A. 5公里',
      module_name: '速率與行程',
    },
    // 幾何面積
    {
      question_text: '正方形的對角線長10cm，面積是多少？',
      question_type: 'multiple_choice',
      options: ['A. 100cm²', 'B. 50cm²', 'C. 25cm²', 'D. 40cm²'],
      correct_answer: 'B. 50cm²',
      module_name: '幾何面積',
    },
    {
      question_text: '火車長300m，隧道長900m，火車速率每秒40m，穿過隧道需要多少秒？',
      question_type: 'multiple_choice',
      options: ['A. 22.5秒', 'B. 45秒', 'C. 30秒', 'D. 15秒'],
      correct_answer: 'C. 30秒',
      module_name: '速率與行程',
    },
    // 代數應用題
    {
      question_text: '下列哪個算式是方程？',
      question_type: 'multiple_choice',
      options: ['A. 3x + 12 = 5x - 6', 'B. 3 + 5 = 8', 'C. 2x > 5', 'D. 3x'],
      correct_answer: 'A. 3x + 12 = 5x - 6',
      module_name: '代數應用題',
    },
    // 幾何面積
    {
      question_text: '等腰三角形的頂角是40°，兩個底角各是多少度？',
      question_type: 'multiple_choice',
      options: ['A. 40°', 'B. 60°', 'C. 50°', 'D. 70°'],
      correct_answer: 'D. 70°',
      module_name: '幾何面積',
    },
    // 速率與行程 (fill-in)
    {
      question_text: '某人步行1小時走了3.2公里，他的速率是每小時___公里',
      question_type: 'fill_in_number',
      correct_answer: '3.2',
      module_name: '速率與行程',
    },
    // 幾何面積 (fill-in)
    {
      question_text: '長方形長8cm、寬5cm，面積是___cm²',
      question_type: 'fill_in_number',
      correct_answer: '40',
      module_name: '幾何面積',
    },
    // 代數應用題 (fill-in)
    {
      question_text: '方程：3x = 25，x = ___（用分數表示）',
      question_type: 'fill_in_number',
      correct_answer: '25/3',
      module_name: '代數應用題',
    },
    {
      question_text: '方程：2x + 8 = 16，x = ___',
      question_type: 'fill_in_number',
      correct_answer: '4',
      module_name: '代數應用題',
    },
    // 概率統計 (fill-in)
    {
      question_text: '從一副52張牌中隨機取一張，取到面值小於5（即A、2、3、4）的概率是___',
      question_type: 'fill_in_number',
      correct_answer: '4/13',
      module_name: '概率統計',
    },
    {
      question_text: '方程：3x - 4 = 2，x = ___',
      question_type: 'fill_in_number',
      correct_answer: '2',
      module_name: '代數應用題',
    },
  ],
}

// ── Registry ───────────────────────────────────────────────────────────────

export const ASSESSMENT_PAPERS: AssessmentPaper[] = [
  p5_sept, p5_nov, p5_jan, p5_mar, p5_may,
  p6_sept, p6_nov, p6_jan, p6_mar, p6_may,
]

export function getAssessmentPaper(grade: number, month: number): AssessmentPaper | undefined {
  return ASSESSMENT_PAPERS.find((p) => p.grade === grade && p.month === month)
}
