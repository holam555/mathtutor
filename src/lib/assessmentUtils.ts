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

// ── Gemini: per-module diagnostic comment ─────────────────────────────────

async function generateModuleComment(
  ai: GoogleGenAI,
  studentName: string,
  gradeLabel: string,
  module: Omit<ModuleResult, 'comment'>
): Promise<string> {
  const pct = module.total > 0 ? Math.round((module.correct / module.total) * 100) : 0

  const prompt = `你是香港升分秘笈補習社的資深數學老師，為家長撰寫學前評估報告。
學生：${studentName}，年級：${gradeLabel}
範疇：${module.name}（共${module.total}題，答對${module.correct}題，正確率${pct}%，評級${RATING_LABELS[module.rating]}）

請用繁體中文寫兩段診斷評語（共約100字）：
第一段：具體描述學生在此範疇的表現及知識掌握情況
第二段：給出針對性的學習建議

要求：
- 親切客觀，不批評學生
- 不提及評級字母（S/A/B/C）
- 直接寫段落，不加標題或分點符號`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.7 },
  })

  return (response.text ?? '').trim()
}

// ── Gemini: rich report sections ──────────────────────────────────────────

async function generateRichReport(
  ai: GoogleGenAI,
  studentName: string,
  gradeLabel: string,
  strongModules: Omit<ModuleResult, 'comment'>[],
  weakWithPriority: { module: Omit<ModuleResult, 'comment'>; priority: WeakArea['priority'] }[],
  moduleWrongAnswers: Map<string, string[]>,
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
        return `- ${m.name}：${m.correct}/${m.total}（${pct}%）評級${RATING_LABELS[m.rating]}`
      }).join('\n')
    : '無'

  const weakStr = weakWithPriority.length > 0
    ? weakWithPriority.map(({ module: m, priority }) => {
        const pct = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0
        const wrongs = moduleWrongAnswers.get(m.name) ?? []
        return `- ${m.name}：${m.correct}/${m.total}（${pct}%）評級${RATING_LABELS[m.rating]}，優先級：${priority}\n  答錯題目示例：${wrongs.slice(0, 2).join('；') || '無'}`
      }).join('\n')
    : '無'

  const prompt = `你是香港升分秘笈補習社的資深數學老師，正在為小學生${studentName}（${gradeLabel}）撰寫學前評估診斷報告。
整體得分：${score}分（${band}）

表現良好的範疇：
${strongStr}

需要加強的範疇：
${weakStr}

請用繁體中文輸出以下JSON，不要包含markdown code block：
{
  "overallSummary": "整體評語，約120字，先肯定整體表現，點出強項，再指出需改善的地方，最後溫馨邀請家長預約免費試堂",
  "strongAreas": [
    {
      "title": "具體強項名稱（比模塊更具體，如「帶分數加減」而非只說「分數」）",
      "observation": "兩句具體觀察，說明學生在此範疇展現了什麼能力和理解",
      "tip": "一句維持建議，告訴家長如何保持此強項"
    }
  ],
  "weakAreas": [
    {
      "name": "範疇名稱",
      "priority": "最高優先|高優先|中優先",
      "errorTypes": ["錯誤類型一（約8至12字）", "錯誤類型二（約8至12字）"],
      "rootCause": "根本原因分析（約30字，從學習角度解釋為何出現這些錯誤）",
      "solutions": [
        { "title": "方法名稱（4至6字）", "detail": "具體做法說明（約30字）" },
        { "title": "方法名稱（4至6字）", "detail": "具體做法說明（約30字）" },
        { "title": "方法名稱（4至6字）", "detail": "具體做法說明（約30字）" }
      ]
    }
  ],
  "learningPlan": [
    { "priority": "第一優先", "area": "範疇名稱", "action": "具體學習行動（約20字）" },
    { "priority": "第二優先", "area": "範疇名稱", "action": "具體學習行動（約20字）" },
    { "priority": "第三優先", "area": "範疇名稱", "action": "具體學習行動（約20字）" },
    { "priority": "持續練習", "area": "強項範疇名稱", "action": "維持強項的方法（約20字）" }
  ]
}

注意事項：
- strongAreas：每個S/A評級範疇各生成一個條目
- weakAreas：按優先順序排列（最高優先在前），保留輸入資料指定的優先級
- 如果沒有強項或弱項，對應陣列返回空 []
- learningPlan：弱項優先，強項持續練習在後（最多4個條目）
- 語氣專業友善，像在跟家長面談一樣`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  })

  const text = (response.text ?? '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

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

  // Build wrong question text context per module
  const moduleWrongAnswers = new Map<string, string[]>()
  for (const a of answers) {
    if (!a.is_correct) {
      if (!moduleWrongAnswers.has(a.module_name)) moduleWrongAnswers.set(a.module_name, [])
      moduleWrongAnswers.get(a.module_name)!.push(a.question_text)
    }
  }

  // Run module comments and rich report sections in parallel
  const [moduleComments, richReport] = await Promise.all([
    Promise.all(moduleResults.map((m) => generateModuleComment(ai, studentName, gradeLabel, m))),
    generateRichReport(ai, studentName, gradeLabel, strongModules, weakWithPriority, moduleWrongAnswers, score, band),
  ])

  const modules: ModuleResult[] = moduleResults.map((m, i) => ({
    ...m,
    comment: moduleComments[i],
  }))

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
