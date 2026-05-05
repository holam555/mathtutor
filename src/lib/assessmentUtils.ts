import { GoogleGenAI } from '@google/genai'
import { generateContentWithFallback } from './gemini'
import type {
  AssessmentAnswer,
  ModuleResult,
  ReportData,
  Rating,
  StrongArea,
  WeakArea,
  DifficultyTier,
  TopicMastery,
  UnitMastery,
} from '@/types/assessment'
import { TIER_MARKS } from '@/types/assessment'

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

// ── P3 group-aware scoring ────────────────────────────────────────────────

// Group sub-questions sharing the same group_id together. Each group counts
// as one quota slot. Tier marks (basic 3 / enhancement 5 / advanced 10) are
// split equally among sub-questions; a sub-question correct ⇒ earns its share.
type GroupedScore = { earned: number; possible: number; correctSubs: number; totalSubs: number; tier: DifficultyTier }

function groupAnswers(answers: AssessmentAnswer[]): Map<string, AssessmentAnswer[]> {
  const m = new Map<string, AssessmentAnswer[]>()
  for (const a of answers) {
    const key = a.group_id ?? `solo:${a.question_id}`
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(a)
  }
  for (const [, list] of Array.from(m.entries())) {
    list.sort((a: AssessmentAnswer, b: AssessmentAnswer) => (a.sub_order ?? 1) - (b.sub_order ?? 1))
  }
  return m
}

function scoreGroup(members: AssessmentAnswer[]): GroupedScore {
  const tier = (members[0].difficulty_tier ?? 'basic') as DifficultyTier
  const tierMarks = TIER_MARKS[tier]
  const N = members.length
  const perSub = tierMarks / N
  let earned = 0
  let correctSubs = 0
  for (const m of members) {
    if (m.is_correct) {
      earned += perSub
      correctSubs += 1
    }
  }
  return { earned, possible: tierMarks, correctSubs, totalSubs: N, tier }
}

export function computeTotalScore(answers: AssessmentAnswer[]): { earned: number; possible: number; pct: number } {
  if (answers.length === 0) return { earned: 0, possible: 0, pct: 0 }
  // Detect if any answer has a tier (P3 mode). If none have tier, fall back
  // to plain correct/total ratio (legacy P5/P6 mode).
  const hasTier = answers.some((a) => a.difficulty_tier)
  if (!hasTier) {
    const correct = answers.filter((a) => a.is_correct).length
    const total = answers.length
    return { earned: correct, possible: total, pct: total > 0 ? Math.round((correct / total) * 100) : 0 }
  }

  const groups = groupAnswers(answers)
  let earned = 0
  let possible = 0
  for (const [, members] of Array.from(groups.entries())) {
    const s = scoreGroup(members)
    earned += s.earned
    possible += s.possible
  }
  const pct = possible > 0 ? Math.round((earned / possible) * 100) : 0
  return {
    earned: Math.round(earned * 10) / 10,
    possible: Math.round(possible * 10) / 10,
    pct,
  }
}

// Build per-大單元 mastery (always shown if answers carry unit_id).
export function buildUnitMastery(answers: AssessmentAnswer[]): UnitMastery[] {
  const byUnit = new Map<string, AssessmentAnswer[]>()
  for (const a of answers) {
    if (!a.unit_id) continue
    if (!byUnit.has(a.unit_id)) byUnit.set(a.unit_id, [])
    byUnit.get(a.unit_id)!.push(a)
  }
  return Array.from(byUnit.entries()).map(([unitId, list]) => {
    const score = computeTotalScore(list)
    return {
      unit_id: unitId,
      unit_name: list[0].unit_name ?? '',
      textbook_ref: '',
      correct_marks: score.earned,
      total_marks: score.possible,
      pct: score.pct,
      rating: getModuleRating(score.earned, score.possible),
    } satisfies UnitMastery
  })
}

// Build per-小單元 mastery (only when parent drilled down to topics).
export function buildTopicMastery(answers: AssessmentAnswer[]): TopicMastery[] {
  const byTopic = new Map<string, AssessmentAnswer[]>()
  for (const a of answers) {
    if (!a.topic_id) continue
    if (!byTopic.has(a.topic_id)) byTopic.set(a.topic_id, [])
    byTopic.get(a.topic_id)!.push(a)
  }
  return Array.from(byTopic.entries()).map(([topicId, list]) => {
    const score = computeTotalScore(list)
    return {
      topic_id: topicId,
      topic_name: list[0].topic_name ?? '',
      unit_id: list[0].unit_id ?? '',
      unit_name: list[0].unit_name ?? '',
      correct_marks: score.earned,
      total_marks: score.possible,
      pct: score.pct,
      rating: getModuleRating(score.earned, score.possible),
    } satisfies TopicMastery
  })
}

// Build module results from P3 unit/topic-tagged answers. The "module" name
// is the unit name (or topic name if drilled down). Used by Gemini prompt and
// the report's strong/weak areas. Counts here use sub-question level (not
// group-level) so accuracy-based rating reflects how many sub-Qs were correct.
export function buildModuleResultsFromP3Answers(
  answers: AssessmentAnswer[],
  drillDownToTopic: boolean,
): Omit<ModuleResult, 'comment'>[] {
  const moduleMap = new Map<string, AssessmentAnswer[]>()
  for (const a of answers) {
    const moduleName = drillDownToTopic ? (a.topic_name ?? a.unit_name ?? '其他') : (a.unit_name ?? '其他')
    if (!moduleMap.has(moduleName)) moduleMap.set(moduleName, [])
    moduleMap.get(moduleName)!.push(a)
  }
  return Array.from(moduleMap.entries()).map(([name, list]) => ({
    name,
    correct: list.filter((a) => a.is_correct).length,
    total: list.length,
    rating: getModuleRating(
      list.filter((a) => a.is_correct).length,
      list.length,
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

// Optional curriculum context: per-module teaching methods extracted from P3 大綱.
// Keys are module names (unit_name or topic_name). Values are short method names
// like "公分母先行法", "進位「滿十進位搬家故事」", "斷尺必殺技公式" etc.
export type CurriculumMethods = Record<string, string[]>

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
  curriculumMethods: CurriculumMethods = {},
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

  // Build curriculum methods reference for weak modules
  const methodsCtx = weakWithPriority
    .map(({ module: m }) => {
      const methods = curriculumMethods[m.name] ?? []
      if (methods.length === 0) return null
      return `- ${m.name}：${methods.map((mt) => `「${mt}」`).join('、')}`
    })
    .filter(Boolean)
    .join('\n')

  const prompt = `你是香港霖楓學苑補習社的資深數學老師，正在為小學生${studentName}（${gradeLabel}）撰寫學前評估診斷報告。
整體得分：${score}分（${band}）

===表現良好的範疇（S/A評級）===
${strongStr}

===需要加強的範疇（B/C評級，含答錯示例）===
${weakStr}

${methodsCtx ? `===霖楓學苑針對以下弱項範疇的專屬教學方法（請只用呢啲方法名做 solutions.title）===\n${methodsCtx}\n` : ''}
⚠️ 核心要求（違反任何一條視為失敗輸出）：
1. errorTypes：每條只描述錯誤類型本身，要簡短具體（4 至 12 字），不可引用題目文字、學生答案、或正確答案。例如：「垂直線辨識錯誤」「同分母加減未化簡」「進位忘記加 1」「角度估算偏大」。禁止使用「計算出錯」「理解不足」等空泛描述，也禁止寫「如題目『...』」。
2. rootCause：必須點名具體知識點（如「帶分數加減中借位」「梯形面積公式中上下底順序」），並說明${studentName}「已掌握X，但Y環節出現缺口」。
3. solutions：${methodsCtx ? '優先使用上方「霖楓學苑專屬教學方法」中提供的方法名稱作為 title。如果無對應方法，再自擬四至六字方法名。' : '每個方法名稱必須是針對此題型的專業四至六字名稱（如「公分母先行法」「借位圖解訓練」「梯形分解法」）。'} detail 須包含一個具體操作步驟或計算示例（40至60字）。
4. learningPlan的action：必須包含①每天/每週題量、②對應哪個solution方法名稱、③幾週內達到什麼具體目標（如「正確率提升至80%」）。
5. observation（強項）：必須引用上方提供的至少一道實際答對題目。

請嚴格按照以下JSON格式輸出，不要包含markdown code block：

{
  "overallSummary": "2至3句整體評語，提及${studentName}的具體得分、最突出的強項範疇名稱和最需要提升的範疇名稱，語氣親切鼓勵。",
  "strongAreas": [
    {
      "title": "帶emoji的具體技能名稱（比模塊名更具體，格式：emoji空格技能，如「🎯 分數比較大小」「🧮 HCF/LCM計算」「📐 三角形面積逆向求底」）",
      "observation": "兩至三句觀察。第一句：引用實際答對題目（例如「學生能正確解答『1/3 + 1/4 = ?』，得出7/12」）。第二句：說明這代表掌握了什麼具體概念（例如「這顯示學生已熟練掌握異分母通分步驟，能準確找出最小公倍數並完成加減」）。",
      "tip": "具體維持建議，必須包含頻率（每天/每週）和題量（X題），例如「建議每週練習2至3題異分母加減，保持通分的運算速度。」"
    }
  ],
  "weakAreas": [
    {
      "name": "範疇名稱（與輸入完全一致）",
      "priority": "最高優先|高優先|中優先（與輸入完全一致）",
      "errorTypes": [
        "錯誤類型一（4 至 12 字短語，例：垂直線辨識錯誤）",
        "錯誤類型二（4 至 12 字短語，例：分數通分未化簡）"
      ],
      "rootCause": "40至60字。格式：「${studentName}已能[已掌握的具體操作]，但在[具體知識點名稱]上出現缺口。當[遇到什麼具體題型情況]時，[會出現什麼具體計算問題]，導致[後果]。」",
      "solutions": [
        {
          "title": "「[四至六字方法名]」訓練",
          "detail": "說明具體訓練步驟，並包含一個對應此弱項題型的操作示例（40至60字）。"
        },
        {
          "title": "「[四至六字方法名]」練習",
          "detail": "同上要求，針對第二個錯誤模式的訓練方法（40至60字）。"
        },
        {
          "title": "「[四至六字方法名]」鞏固",
          "detail": "同上要求，側重建立系統化檢查習慣（40至60字）。"
        }
      ]
    }
  ],
  "learningPlan": [
    {
      "priority": "第一優先",
      "area": "最需要加強的範疇名稱",
      "action": "每天X題，配合「[solution方法名稱]」訓練，目標X週內正確率達X%"
    },
    {
      "priority": "第二優先",
      "area": "第二需要加強的範疇名稱",
      "action": "每週X題，使用「[solution方法名稱]」練習，X個月內熟練掌握"
    },
    {
      "priority": "第三優先",
      "area": "第三需要加強的範疇名稱（如弱項不足三個則填強項範疇）",
      "action": "每週X題，鞏固[具體技能]，保持穩定水平"
    },
    {
      "priority": "持續練習",
      "area": "最強範疇的名稱",
      "action": "每週X題，保持強項不倒退，可嘗試難度提升的題型"
    }
  ]
}

如無強項或無弱項，對應陣列返回 []。禁止在JSON中使用任何markdown格式。`

  // No template fallback here — if Gemini can't produce a real report,
  // we propagate the error so the API route can return AI_UNAVAILABLE
  // and let the user retry. A templated report would silently downgrade
  // the experience for paying parents.
  const response = await generateContentWithFallback(ai, {
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  })
  const text = (response.text ?? '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: {
    strongAreas?: unknown
    weakAreas?: unknown
    overallSummary?: unknown
    learningPlan?: unknown
  }
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`)
  }

  return {
    strongAreas: Array.isArray(parsed.strongAreas) ? parsed.strongAreas : [],
    weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
    overallSummary: typeof parsed.overallSummary === 'string' ? parsed.overallSummary : '',
    learningPlan: Array.isArray(parsed.learningPlan) ? parsed.learningPlan : [],
  }
}

// ── Main report generation ────────────────────────────────────────────────

export async function generateAssessmentReport(
  studentName: string,
  gradeLabel: string,
  moduleResults: Omit<ModuleResult, 'comment'>[],
  answers: AssessmentAnswer[],
  curriculumMethods: CurriculumMethods = {},
): Promise<ReportData> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const totalCorrect = answers.filter((a) => a.is_correct).length
  const totalQuestions = answers.length
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  // Use a single neutral 「AI 建議」 label regardless of score; description varies.
  const band = 'AI 建議'
  let bandDescription: string
  if (score >= 85) {
    bandDescription = '數學基礎扎實，各範疇表現優異，具備升讀高年級的能力'
  } else if (score >= 65) {
    bandDescription = '整體掌握良好，部分範疇需要加強，有一定的提升空間'
  } else {
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
    curriculumMethods,
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
