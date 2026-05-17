import { GoogleGenAI } from '@google/genai'

// ── Resilient generateContent wrapper ──────────────────────────────────────
// Gemini occasionally returns 503 UNAVAILABLE during demand spikes.
// Strategy (Vercel Hobby, 10s limit): 1 attempt on primary model, if a
// transient error is returned (~200ms) try once on the lite fallback, then
// give up so the caller can surface a retry button. No inter-attempt delays.
const PRIMARY_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODELS = ['gemini-2.5-flash-lite'] as const
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])

type GenerateContentArgs = Parameters<GoogleGenAI['models']['generateContent']>[0]
type GenerateContentResult = Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>

export async function generateContentWithFallback(
  ai: GoogleGenAI,
  args: Omit<GenerateContentArgs, 'model'>,
  primaryModel: string = PRIMARY_MODEL,
): Promise<GenerateContentResult> {
  const models = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)]
  let lastErr: unknown

  for (const model of models) {
    try {
      return await ai.models.generateContent({ ...args, model })
    } catch (err) {
      lastErr = err
      const status = (err as { status?: number })?.status
      const transient = status == null || RETRYABLE_STATUSES.has(status)
      if (transient) {
        console.warn(`Gemini ${model} transient error (status=${status}); trying next model`)
      } else {
        console.warn(`Gemini ${model} non-transient error (status=${status}); trying next model`)
      }
    }
  }
  throw lastErr
}

// ── Past-paper extraction ──────────────────────────────────────────────────

const CATEGORY_LIST = `
A1因數識別 A2倍數識別 A3最大公因數HCF A4最小公倍數LCM A5第N個公倍數 A6大數運算與數位識別
B1等值分數填充 B2分數大小比較 B3分數大小排列 B4真分數加減 B5帶分數加減同分母 B6帶分數加減異分母
B7整數減帶分數 B8三個分數混合加減 B9分數乘法 B10分數估算
C1整數應用題買賣找錢 C2整數應用題分組餘數 C3整數應用題儲蓄計劃 C4分數應用題日常加減
C5分數應用題乘法求部分 C6帶分數應用題價錢 C7數學規律題
D1量度單位填充 D2面積長方形正方形 D3面積平行四邊形 D4面積三角形正向 D5面積三角形逆向
D6面積梯形 D7周界長方形 D8周界組合圖形 D9容量換算
E1小數加減 E2小數乘法 E3小數乘法規律 E4小數位值識別 E5取近似值 E6小數應用題加減 E7小數應用題乘除
F1整數除以分數 F2帶分數除以分數 F3分數除法應用題
G1代數式表示 G2方程識別 G3解方程基礎 G4方程應用題
H1立體圖形識別 H2立體圖形屬性 H3立體體積長方體 H4柱體體積
I1假分數與帶分數互化 I2旋轉對稱識別 I3容量換算進階 I4時間計算行程`

export type ExtractedQuestion = {
  question_text: string
  question_type: 'multiple_choice' | 'fill_in' | 'calculation'
  options?: string[] | null
  suggested_answer: string
  suggested_category_code: string
  has_image: boolean
  page_number: number
}

export async function extractQuestionsFromImages(
  images: { data: string; mimeType: string }[],
  context: { school?: string; grade?: number; examType?: string }
): Promise<ExtractedQuestion[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const contextStr = [
    context.school && `學校：${context.school}`,
    context.grade && `年級：小${context.grade === 5 ? '五' : '六'}`,
    context.examType && `考試類型：${context.examType}`,
  ]
    .filter(Boolean)
    .join('，')

  const prompt = `你是香港小學數學試卷分析助手。${contextStr ? `試卷資料：${contextStr}。` : ''}
請識別圖片中所有數學題目，只輸出JSON，不要任何解釋或markdown。

分類代號（從以下選最合適的一個）：${CATEGORY_LIST}

輸出格式：
{
  "questions": [
    {
      "question_text": "題目完整文字（繁體中文）",
      "question_type": "multiple_choice 或 fill_in 或 calculation",
      "options": ["A. 選項1", "B. 選項2", "C. 選項3", "D. 選項4"],
      "suggested_answer": "正確答案",
      "suggested_category_code": "A1",
      "has_image": false,
      "page_number": 1
    }
  ]
}

注意：options 只在 multiple_choice 時填寫，其他設為 null。has_image 設為 true 如果題目需要看圖才能作答。page_number 對應圖片順序（第一張為1）。答案必須正確。`

  const parts = [
    ...images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.data },
    })),
    { text: prompt },
  ]

  const response = await generateContentWithFallback(ai, {
    contents: [{ role: 'user', parts }],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  const text = response.text ?? ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: { questions?: ExtractedQuestion[] }
  try {
    parsed = JSON.parse(clean)
  } catch {
    throw new Error(`Gemini 返回了無效的 JSON：${clean.slice(0, 200)}`)
  }

  return (parsed.questions ?? []).filter(
    (q): q is ExtractedQuestion =>
      typeof q.question_text === 'string' &&
      typeof q.suggested_answer === 'string' &&
      ['multiple_choice', 'fill_in', 'calculation'].includes(q.question_type)
  )
}

// ── Exam-scope → curriculum_units matching ────────────────────────────────
//
// Parent uploads photo(s) of the school's 考試範圍 sheet. Gemini Vision is
// told which unit/topic ids are valid (pulled live from the DB for the
// child's grade) and must only return ids from that authoritative list —
// never invent new units or use its own curriculum knowledge.

export type ScopeUnitCandidate = {
  unit_id: string
  unit_number: number
  name: string
  semester?: 'A' | 'B'
}

export type ScopeTopicCandidate = {
  topic_id: string
  lesson_number: number
  name: string
  unit_id: string
}

export type ScopeMatchResult = {
  matched_unit_ids: string[]
  matched_topic_ids: string[]
  notes?: string
}

export async function matchScopeToUnits(
  images: { data: string; mimeType: string }[],
  grade: number,
  units: ScopeUnitCandidate[],
  topics: ScopeTopicCandidate[] = []
): Promise<ScopeMatchResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const gradeLabel = ['', '', '', '小三', '小四', '小五', '小六'][grade] ?? `小${grade}`

  const unitsJson = JSON.stringify(
    units.map((u) => ({
      unit_id: u.unit_id,
      unit_number: u.unit_number,
      name: u.name,
      semester: u.semester,
    }))
  )

  const topicsBlock = topics.length
    ? `\n以下係${gradeLabel}嘅小單元清單（如試卷標示去到小單元層級就揀小單元 id）：\n${JSON.stringify(
        topics.map((t) => ({
          topic_id: t.topic_id,
          lesson_number: t.lesson_number,
          name: t.name,
          unit_id: t.unit_id,
        }))
      )}\n`
    : ''

  const prompt = `你係香港小學數學考試範圍分析助手。

以下係${gradeLabel}嘅完整課程大單元清單（由系統提供，係唯一可選範圍）：
${unitsJson}
${topicsBlock}
家長可能上載以下其中一種、或多種混合嘅相片：
  (A) 學校發嘅「家長通告 / 考試範圍紙」— 例如：「數學 5下A冊第3-6課，5下B冊第8-13課，及複合棒形圖」
  (B) 課本目錄頁 (目錄 / 課題列表) — 課題旁邊會有手寫剔號 ✓ 或螢光筆標示，表示嗰個課題係考試範圍
  (C) 老師派發嘅範圍清單

請逐張相片睇清楚：
  1. 對 (A)：解讀文字描述嘅「課」、「單元」、「冊」，將佢轉返做課程內容（例如「5下A冊第3-6課」=「5下A 入面 第3至6 個課題」），再對應上面清單入面嘅 unit name。
  2. 對 (B)：搵出每個有剔號 ✓ / 螢光標示 / 圈住嘅課題標題（紅綠色大字嗰啲），按課題標題嘅文字（例如「立體圖形」、「小數乘法」、「分數除法」、「體積的認識」）去對應上面清單入面 unit name 最接近嗰個。
  3. 同一個內容在不同相重複出現，唔需要重複返；merge 入同一個 unit_id。
  4. 完全唔肯定嘅唔好強行配，保留 notes 解釋。

唔好自己創造或引用清單以外嘅課程名。唔好用自己對課程嘅理解去推斷未出現嘅單元。

只輸出JSON，唔好任何解釋或markdown:
{
  "matched_unit_ids": ["<uuid>", ...],
  "matched_topic_ids": ["<uuid>", ...],
  "notes": "簡短備註（中文，可選，例如「相片入面有「立體的截面」但年級清單冇對應單元，已略過」）"
}

如果完全認唔到任何單元，返回空陣列。matched_unit_ids 入面嘅 uuid 必須完全等於上面清單入面其中一個 unit_id；matched_topic_ids 必須等於上面清單入面其中一個 topic_id。`

  const parts = [
    ...images.map((img) => ({
      inlineData: { mimeType: img.mimeType, data: img.data },
    })),
    { text: prompt },
  ]

  const response = await generateContentWithFallback(ai, {
    contents: [{ role: 'user', parts }],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  })

  const text = response.text ?? ''
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: ScopeMatchResult
  try {
    parsed = JSON.parse(clean) as ScopeMatchResult
  } catch {
    throw new Error(`Gemini 返回了無效的 JSON：${clean.slice(0, 200)}`)
  }

  const validUnitIds = new Set(units.map((u) => u.unit_id))
  const validTopicIds = new Set(topics.map((t) => t.topic_id))

  return {
    matched_unit_ids: Array.from(
      new Set((parsed.matched_unit_ids ?? []).filter((id) => validUnitIds.has(id)))
    ),
    matched_topic_ids: Array.from(
      new Set((parsed.matched_topic_ids ?? []).filter((id) => validTopicIds.has(id)))
    ),
    notes: typeof parsed.notes === 'string' ? parsed.notes : undefined,
  }
}

// ── Variation generation ───────────────────────────────────────────────────

export type GeneratedQuestion = {
  question_text: string
  question_type: 'multiple_choice' | 'fill_in' | 'calculation'
  options?: string[] | null
  correct_answer: string
  difficulty: number
}

const SYSTEM_PREFIX = `你是香港小學數學出題老師，專門為小五和小六學生出題。
規則：
1. 只輸出合法的 JSON，不要任何解釋、markdown 程式碼塊或其他文字
2. 確保答案百分之百正確
3. 題目符合香港課程範圍
4. 繁體中文
`

export async function generateVariations(
  templatePrompt: string,
  count: number = 5
): Promise<GeneratedQuestion[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const prompt = `${SYSTEM_PREFIX}\n${templatePrompt}\n\n請生成 ${count} 條題目。直接輸出JSON，不要\`\`\`json標記。`

  const response = await generateContentWithFallback(ai, {
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  })

  const text = response.text ?? ''

  // Strip any markdown fences just in case
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: { questions?: GeneratedQuestion[] }
  try {
    parsed = JSON.parse(clean)
  } catch {
    throw new Error(`Gemini 返回了無效的 JSON：${clean.slice(0, 200)}`)
  }

  const questions = parsed.questions ?? []
  if (!Array.isArray(questions)) {
    throw new Error('Gemini 返回格式錯誤：questions 不是陣列')
  }

  return questions.filter(
    (q): q is GeneratedQuestion =>
      typeof q.question_text === 'string' &&
      typeof q.correct_answer === 'string' &&
      ['multiple_choice', 'fill_in', 'calculation'].includes(q.question_type)
  )
}
