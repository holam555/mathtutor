import { GoogleGenAI } from '@google/genai'
import type { AssessmentAnswer, ModuleResult, ReportData, Rating } from '@/types/assessment'

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

// ── Gemini report generation ───────────────────────────────────────────────

async function generateModuleComment(
  ai: GoogleGenAI,
  studentName: string,
  gradeLabel: string,
  module: Omit<ModuleResult, 'comment'>
): Promise<string> {
  const pct = module.total > 0 ? Math.round((module.correct / module.total) * 100) : 0
  const wrongStr = module.wrongCategoryCodes.length > 0
    ? module.wrongCategoryCodes.join('、')
    : '沒有特別薄弱的知識點'

  const prompt = `你是香港小學數學補習老師，正在為家長撰寫學前評估報告。
學生：${studentName}，年級：${gradeLabel}
模塊：${module.name}（共${module.total}題，答對${module.correct}題，正確率${pct}%）
評級：${module.rating}（${RATING_LABELS[module.rating]}）
答錯的題目類別代號：${wrongStr}

請用繁體中文寫2段診斷評語（共約120字）。
風格要求：
- 親切、客觀，不批評學生
- 第一段：指出具體知識點強弱，描述觀察到的學習狀況
- 第二段：給出針對性建議
- 不要輸出標題或分點，直接寫段落
- 不要提及評級字母（S/A/B/C）`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.7 },
  })

  return (response.text ?? '').trim()
}

async function generateOverallSummary(
  ai: GoogleGenAI,
  studentName: string,
  gradeLabel: string,
  moduleResults: Omit<ModuleResult, 'comment'>[]
): Promise<{ summary: string; nextSteps: string[] }> {
  const modulesSummary = moduleResults
    .map((m) => `${m.name} ${m.rating}（${m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0}%）`)
    .join('、')

  const totalCorrect = moduleResults.reduce((s, m) => s + m.correct, 0)
  const totalQ = moduleResults.reduce((s, m) => s + m.total, 0)

  const prompt = `你是香港小學數學補習老師，正在總結學生的學前評估。
學生：${studentName}，年級：${gradeLabel}
整體正確率：${totalCorrect}/${totalQ}
各模塊表現：${modulesSummary}

請輸出JSON，包含：
1. "summary"：一段鼓勵性整體評語（約100字），客觀指出整體強弱，末尾鼓勵家長帶孩子來試堂
2. "nextSteps"：4個學習目標的字串陣列，分別針對「學習習慣」、「專注力」、「主動性」、「基礎功底」，每項約25字

只輸出JSON，不要markdown：
{"summary": "...", "nextSteps": ["...", "...", "...", "..."]}`

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
      summary: parsed.summary ?? '',
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    }
  } catch {
    return {
      summary: `${studentName}完成了本次學前評估，整體表現${totalCorrect >= totalQ * 0.7 ? '不錯' : '有進步空間'}。建議預約試堂，讓老師為孩子制定個人化學習計劃。`,
      nextSteps: [
        '學習習慣：養成每天溫習的習慣，及時鞏固所學知識。',
        '專注力：做題時保持專注，避免粗心大意。',
        '主動性：遇到不懂的地方主動發問，勇於嘗試。',
        '基礎功底：針對薄弱知識點做定向練習，穩固數學根基。',
      ],
    }
  }
}

export async function generateAssessmentReport(
  studentName: string,
  gradeLabel: string,
  moduleResults: Omit<ModuleResult, 'comment'>[],
  answers: AssessmentAnswer[]
): Promise<ReportData> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  // Generate all module comments and overall summary in parallel
  const [moduleComments, overall] = await Promise.all([
    Promise.all(
      moduleResults.map((m) => generateModuleComment(ai, studentName, gradeLabel, m))
    ),
    generateOverallSummary(ai, studentName, gradeLabel, moduleResults),
  ])

  const modules: ModuleResult[] = moduleResults.map((m, i) => ({
    ...m,
    comment: moduleComments[i],
  }))

  return {
    modules,
    totalCorrect: answers.filter((a) => a.is_correct).length,
    totalQuestions: answers.length,
    overallSummary: overall.summary,
    nextSteps: overall.nextSteps,
    generatedAt: new Date().toISOString(),
  }
}
