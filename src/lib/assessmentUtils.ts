import { GoogleGenAI } from '@google/genai'
import type {
  AssessmentAnswer,
  ModuleResult,
  ReportData,
  Rating,
  StrongArea,
  WeakArea,
} from '@/types/assessment'

export type { AssessmentAnswer, ModuleResult, ReportData, Rating }

// ── Module configuration ───────────────────────────────────────────────────

export type ModuleConfig = {
  name: string
  categoryCodes: string[]
  questionCount: number
}

export const MODULE_CONFIG: Record<string, ModuleConfig[]> = {
  '5上': [
    { name: '數與運算', categoryCodes: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'], questionCount: 4 },
    { name: '分數', categoryCodes: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'], questionCount: 5 },
    { name: '量度與幾何', categoryCodes: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'], questionCount: 4 },
    { name: '應用題', categoryCodes: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'], questionCount: 2 },
  ],
  '5下': [
    { name: '數與運算', categoryCodes: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'], questionCount: 3 },
    { name: '分數與分數除法', categoryCodes: ['B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'F1', 'F2', 'F3'], questionCount: 4 },
    { name: '小數', categoryCodes: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'], questionCount: 4 },
    { name: '代數', categoryCodes: ['G1', 'G2', 'G3', 'G4'], questionCount: 3 },
    { name: '立體圖形', categoryCodes: ['H1', 'H2', 'H3', 'H4'], questionCount: 2 },
    { name: '量度與幾何', categoryCodes: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'], questionCount: 2 },
  ],
}

export function getModuleConfig(grade: number, semester: string): ModuleConfig[] | null {
  return MODULE_CONFIG[`${grade}${semester}`] ?? null
}

// ── Rating ─────────────────────────────────────────────────────────────────

export function getModuleRating(correct: number, total: number): Rating {
  if (total === 0) return 'C'
  const accuracy = correct / total
  if (accuracy >= 0.9) return 'S'
  if (accuracy >= 0.75) return 'A'
  if (accuracy >= 0.5) return 'B'
  return 'C'
}

export const RATING_LABELS: Record<Rating, string> = {
  S: '優秀',
  A: '良好',
  B: '尚可',
  C: '需加強',
}

export const RATING_COLORS: Record<Rating, { bg: string; text: string; border: string }> = {
  S: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' },
  A: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  B: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  C: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
}

// ── Build module results from raw answers ─────────────────────────────────

// Legacy: used when answers have category_code populated (DB-sourced questions)
export function buildModuleResults(
  answers: AssessmentAnswer[],
  modules: ModuleConfig[]
): Omit<ModuleResult, 'comment'>[] {
  return modules.map((mod) => {
    const moduleAnswers = answers.filter((a) => mod.categoryCodes.includes(a.category_code))
    const correct = moduleAnswers.filter((a) => a.is_correct).length
    const total = moduleAnswers.length
    const wrongCategoryCodes = Array.from(new Set(
      moduleAnswers.filter((a) => !a.is_correct).map((a) => a.category_code)
    ))
    return {
      name: mod.name,
      correct,
      total,
      rating: getModuleRating(correct, total),
      wrongCategoryCodes,
    }
  })
}

// Groups answers by module_name (used for hardcoded assessment papers)
export function buildModuleResultsByName(
  answers: AssessmentAnswer[]
): Omit<ModuleResult, 'comment'>[] {
  const moduleMap = new Map<string, AssessmentAnswer[]>()
  for (const a of answers) {
    if (!moduleMap.has(a.module_name)) moduleMap.set(a.module_name, [])
    moduleMap.get(a.module_name)!.push(a)
  }
  return Array.from(moduleMap.entries()).map(([name, moduleAnswers]) => ({
    name,
    correct: moduleAnswers.filter((a) => a.is_correct).length,
    total: moduleAnswers.length,
    rating: getModuleRating(
      moduleAnswers.filter((a) => a.is_correct).length,
      moduleAnswers.length
    ),
    wrongCategoryCodes: [],
  }))
}

// ── Priority assignment ────────────────────────────────────────────────────

function assignPriorities(
  weakModules: Omit<ModuleResult, 'comment'>[]
): { module: Omit<ModuleResult, 'comment'>; priority: WeakArea['priority'] }[] {
  // Sort worst first (lowest accuracy)
  const sorted = [...weakModules].sort((a, b) => {
    const pctA = a.total > 0 ? a.correct / a.total : 0
    const pctB = b.total > 0 ? b.correct / b.total : 0
    return pctA - pctB
  })

  const cCount = sorted.filter((m) => m.rating === 'C').length

  return sorted.map((m, i) => {
    let priority: WeakArea['priority']
    if (m.rating === 'C') {
      priority = '最高優先'
    } else if (i === cCount) {
      priority = '高優先'
    } else {
      priority = '中優先'
    }
    return { module: m, priority }
  })
}

type WrongPair = { question: string; studentAnswer: string; correctAnswer: string }
type CorrectPair = { question: string; correctAnswer: string }

// ── Gemini: rich report sections ──────────────────────────────────────────

async function generateRichReport(
  ai: GoogleGenAI,
  studentName: string,
  gradeLabel: string,
  strongModules: Omit<ModuleResult, 'comment'>[],
  weakWithPriority: { module: Omit<ModuleResult, 'comment'>; priority: WeakArea['priority'] }[],
  moduleWrongAnswers: Map<string, WrongPair[]>,
  moduleCorrectExamples: Map<string, CorrectPair[]>,
  score: number,
  band: string,
): Promise<{
  strongAreas: StrongArea[]
  weakAreas: WeakArea[]
  overallSummary: string
  learningPlan: ReportData['learningPlan']
}> {
  const strongStr = strongModules.length > 0
    ? strongModules.map((m) => {
        const pct = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0
        const examples = moduleCorrectExamples.get(m.name) ?? []
        const exStr = examples.slice(0, 3).map((e) => `「${e.question}」（答：${e.correctAnswer}）`).join('；')
        return `- ${m.name}：${m.correct}/${m.total}（${pct}%）評級${RATING_LABELS[m.rating]}\n  答對題目例子：${exStr || '（無詳細記錄）'}`
      }).join('\n')
    : '無'

  const weakStr = weakWithPriority.length > 0
    ? weakWithPriority.map(({ module: m, priority }) => {
        const pct = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0
        const pairs = moduleWrongAnswers.get(m.name) ?? []
        const examplesStr = pairs.slice(0, 3).map((w) =>
          `「${w.question}」（學生答：${w.studentAnswer}，正確：${w.correctAnswer}）`
        ).join('\n  ')
        return `- ${m.name}：${m.correct}/${m.total}（${pct}%）評級${RATING_LABELS[m.rating]}，優先級：${priority}\n  答錯示例：\n  ${examplesStr || '無'}`
      }).join('\n\n')
    : '無'

  const prompt = `你是香港霖楓學苑補習社的資深數學老師，正在為小學生${studentName}（${gradeLabel}）撰寫學前評估診斷報告。
整體得分：${score}分（${band}）

===表現良好的範疇（S/A評級）===
${strongStr}

===需要加強的範疇（B/C評級，含答錯示例）===
${weakStr}

請嚴格按照以下JSON格式輸出，不要包含markdown code block。每個欄位的內容必須參考上方提供的實際答題數據，不可泛泛而談：

{
  "overallSummary": "2至3句整體評語，提及${studentName}的具體得分、最突出的強項範疇和最需要提升的範疇，語氣親切鼓勵。",
  "strongAreas": [
    {
      "title": "帶emoji的具體技能名稱。格式：emoji + 技能（例如「🎯 分數比較理解」「🧮 整數計算準確率高」「📐 面積公式應用」「📊 圖表數據理解」），emoji要與技能相關，技能名稱要比模塊名稱更具體",
      "observation": "兩至三句具體觀察，必須：①引用上方提供的實際答對題目作例子；②說明這顯示學生掌握了什麼具體概念。參考格式：「學生能正確[描述技能]，包括[引用實際題目例子]。這顯示學生對[具體概念]有良好理解，能[具體能力]。」",
      "tip": "建議：這個能力要繼續保持，[具體維持方法，必須包含頻率如每天/每週和題量如2-3題]。"
    }
  ],
  "weakAreas": [
    {
      "name": "範疇名稱（與輸入一致）",
      "priority": "最高優先|高優先|中優先（與輸入一致）",
      "errorTypes": [
        "根據上方答錯示例歸納的具體錯誤，必須在括號內引用實際錯誤例子（格式：錯誤描述（如 具體題目的具體錯誤寫法）），例如「小數點位移方向錯誤（如 2.5 × 3 = 7.5寫成0.75）」",
        "第二個具體錯誤類型（同樣必須有括號例子）"
      ],
      "rootCause": "概念層面根本原因（40至60字）。必須說明學生「懂什麼但缺了哪個環節」。格式：「學生[已掌握的部分]，但[具體知識缺口]。當[遇到什麼情況]時，[會出現什麼問題]。」",
      "solutions": [
        {
          "title": "「[具體方法名稱]」訓練",
          "detail": "以「我們的[X系統/X訓練]中有一套「[方法名稱]」」開頭，說明訓練方式（40至60字），如有需要可加一個具體計算例子。例如：「我們的計算系統中有一套「元角轉換法」，訓練學生將小數乘法轉換為元角分運算，確保小數點位置正確。例如 2.5 × 3 = 2元5角 × 3 = 6元15角 = 7.5元。」"
        },
        {
          "title": "「[具體方法名稱]」練習",
          "detail": "同上格式，另一個針對此弱項的訓練方法（40至60字）"
        },
        {
          "title": "「[具體方法名稱]」應用",
          "detail": "同上格式，第三個訓練方法，側重建立習慣或系統化練習（40至60字）"
        }
      ]
    }
  ],
  "learningPlan": [
    {
      "priority": "第一優先",
      "area": "最需要加強的範疇名稱",
      "action": "每天X題，重點訓練[方法名稱]，目標X週內掌握"
    },
    {
      "priority": "第二優先",
      "area": "第二需要加強的範疇名稱",
      "action": "每週X題，練習[具體方法]，目標X個月內熟練"
    },
    {
      "priority": "第三優先",
      "area": "第三需要加強的範疇名稱（如無則用強項）",
      "action": "具體行動，包含頻率和目標"
    },
    {
      "priority": "持續練習",
      "area": "最強的範疇名稱",
      "action": "每週X題，保持強項不倒退"
    }
  ]
}

重要規定：
- strongAreas必須引用實際答對題目，不可憑空捏造例子
- weakAreas錯誤類型必須根據提供的答錯示例，引用實際錯誤數字/寫法
- 所有solutions的方法名稱必須是專業的「四至六字方法名」，體現霖楓學苑的專業性
- learningPlan每條都必須有頻率（每天/每週X題）和時間目標
- 如無強項或無弱項，對應陣列返回 []`

  let text = ''
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    })
    text = (response.text ?? '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  } catch (apiErr) {
    console.error('Gemini API call failed:', apiErr)
  }

  try {
    const parsed = JSON.parse(text)
    return {
      strongAreas: Array.isArray(parsed.strongAreas) ? parsed.strongAreas : [],
      weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
      overallSummary: parsed.overallSummary ?? '',
      learningPlan: Array.isArray(parsed.learningPlan) ? parsed.learningPlan : [],
    }
  } catch {
    return {
      strongAreas: strongModules.map((m) => ({
        title: m.name,
        observation: `${studentName}在${m.name}範疇表現良好，正確率達${m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0}%，掌握了核心概念。`,
        tip: '建議每週保持練習，鞏固已掌握的知識。',
      })),
      weakAreas: weakWithPriority.map(({ module: m, priority }) => ({
        name: m.name,
        priority,
        errorTypes: ['計算準確度有待提升', '概念理解需要加強'],
        rootCause: '基礎概念需要鞏固，建議針對性練習以提升掌握程度。',
        solutions: [
          { title: '基礎概念鞏固', detail: '從基礎題目開始，逐步建立對核心概念的理解。' },
          { title: '定時重複操練', detail: '每天練習同類題型，透過重複加深印象和熟練度。' },
          { title: '錯題針對分析', detail: '仔細分析每道錯題的原因，找出規律避免重複犯錯。' },
        ],
      })),
      overallSummary: `${studentName}完成了本次學前評估，整體得分${score}分（${band}）。各範疇表現有強有弱，建議針對薄弱範疇進行系統性練習。歡迎預約免費試堂，讓我們的老師為孩子制定個人化學習計劃。`,
      learningPlan: [
        ...weakWithPriority.slice(0, 3).map(({ module: m }, i) => ({
          priority: ['第一優先', '第二優先', '第三優先'][i],
          area: m.name,
          action: '針對薄弱知識點進行系統練習，每週至少3次',
        })),
        ...(strongModules.length > 0 ? [{
          priority: '持續練習',
          area: strongModules[0].name,
          action: '保持現有水平，定期複習鞏固',
        }] : []),
      ],
    }
  }
}

// ── Main report generation ────────────────────────────────────────────────

export async function generateAssessmentReport(
  studentName: string,
  gradeLabel: string,
  moduleResults: Omit<ModuleResult, 'comment'>[],
  answers: AssessmentAnswer[]
): Promise<ReportData> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const totalCorrect = answers.filter((a) => a.is_correct).length
  const totalQuestions = answers.length
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  let band: string
  let bandDescription: string
  if (score >= 85) {
    band = 'Band 1'
    bandDescription = '數學基礎扎實，各範疇表現優異，具備升讀高年級的能力'
  } else if (score >= 65) {
    band = 'Band 2'
    bandDescription = '整體掌握良好，部分範疇需要加強，有一定的提升空間'
  } else {
    band = 'Band 3'
    bandDescription = '基礎知識需要加強，建議針對重點範疇進行系統性練習'
  }

  const strongModules = moduleResults.filter((m) => m.rating === 'S' || m.rating === 'A')
  const weakModules = moduleResults.filter((m) => m.rating === 'B' || m.rating === 'C')
  const weakWithPriority = assignPriorities(weakModules)

  // Build wrong and correct answer context per module
  const moduleWrongAnswers = new Map<string, WrongPair[]>()
  const moduleCorrectExamples = new Map<string, CorrectPair[]>()
  for (const a of answers) {
    if (!a.is_correct) {
      if (!moduleWrongAnswers.has(a.module_name)) moduleWrongAnswers.set(a.module_name, [])
      moduleWrongAnswers.get(a.module_name)!.push({
        question: a.question_text,
        studentAnswer: a.student_answer,
        correctAnswer: a.correct_answer,
      })
    } else {
      if (!moduleCorrectExamples.has(a.module_name)) moduleCorrectExamples.set(a.module_name, [])
      moduleCorrectExamples.get(a.module_name)!.push({
        question: a.question_text,
        correctAnswer: a.correct_answer,
      })
    }
  }

  const richReport = await generateRichReport(
    ai, studentName, gradeLabel,
    strongModules, weakWithPriority,
    moduleWrongAnswers, moduleCorrectExamples,
    score, band,
  )

  const modules: ModuleResult[] = moduleResults.map((m) => ({ ...m, comment: '' }))

  return {
    modules,
    totalCorrect,
    totalQuestions,
    score,
    band,
    bandDescription,
    strongAreas: richReport.strongAreas,
    weakAreas: richReport.weakAreas,
    overallSummary: richReport.overallSummary,
    learningPlan: richReport.learningPlan,
    generatedAt: new Date().toISOString(),
  }
}
