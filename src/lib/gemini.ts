import { GoogleGenAI } from '@google/genai'

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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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
