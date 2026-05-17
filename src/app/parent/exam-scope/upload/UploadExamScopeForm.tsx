'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Child = { id: string; name: string; grade: number | null }

const MAX_TOTAL = 5

export default function UploadExamScopeForm({ linkedChildren }: { linkedChildren: Child[] }) {
  const router = useRouter()
  const [studentId, setStudentId] = useState(linkedChildren[0]?.id ?? '')
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [noticeFiles, setNoticeFiles] = useState<File[]>([])
  const [textbookFiles, setTextbookFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ units: { unit_number: number; name: string }[] } | null>(null)

  const totalCount = noticeFiles.length + textbookFiles.length
  const remaining = Math.max(0, MAX_TOTAL - totalCount)

  function handleNoticeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? [])
    const cap = MAX_TOTAL - textbookFiles.length
    setNoticeFiles(list.slice(0, cap))
  }
  function handleTextbookChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? [])
    const cap = MAX_TOTAL - noticeFiles.length
    setTextbookFiles(list.slice(0, cap))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId) {
      setError('請選擇子女')
      return
    }
    if (noticeFiles.length === 0) {
      setError('請上載最少 1 張學校通告相片')
      return
    }
    if (textbookFiles.length === 0) {
      setError('請上載最少 1 張課本目錄相片')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('student_id', studentId)
    if (examName) formData.append('exam_name', examName)
    if (examDate) formData.append('exam_date', examDate)
    for (const f of noticeFiles) formData.append('notice_images', f)
    for (const f of textbookFiles) formData.append('textbook_images', f)

    try {
      const res = await fetch('/api/parent/exam-scope/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '上載失敗，請稍後再試')
      } else {
        setSuccess({ units: data.matched_units ?? [] })
        setTimeout(() => router.push('/parent'), 2500)
      }
    } catch {
      setError('網絡錯誤，請重試')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-4xl mb-3">✅</p>
        <p className="font-semibold text-gray-800 mb-2">
          已識別 {success.units.length} 個考試單元
        </p>
        <ul className="text-sm text-gray-600 space-y-1 mb-4 text-left inline-block">
          {success.units.map((u) => (
            <li key={u.unit_number}>
              · 單元 {u.unit_number}：{u.name}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400">小朋友主頁將會見到「考試衝刺練習」</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pick child */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          選擇子女
        </p>
        <div className="space-y-2">
          {linkedChildren.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                studentId === c.id
                  ? 'border-[#1D9E75] bg-[#1D9E75]/5'
                  : 'border-gray-100'
              }`}
            >
              <input
                type="radio"
                name="student_id"
                value={c.id}
                checked={studentId === c.id}
                onChange={() => setStudentId(c.id)}
                className="accent-[#1D9E75]"
              />
              <div>
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">
                  小{c.grade === 3 ? '三' : c.grade === 4 ? '四' : c.grade === 5 ? '五' : c.grade === 6 ? '六' : '—'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Optional metadata */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            考試名稱（可選）
          </label>
          <input
            type="text"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="例如：期末考"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            考試日期（可選）
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
          />
        </div>
      </div>

      {/* Notice upload */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 mb-1">
          1️⃣ 學校通告
        </p>
        <p className="text-xs text-gray-500 mb-3 leading-5">
          影低學校嘅家長通告/考試時間表（會寫明數學科考嘅冊數同課題編號）。
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleNoticeChange}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1D9E75]/10 file:text-[#1D9E75] file:font-medium"
        />
        {noticeFiles.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            已選擇 {noticeFiles.length} 張
          </p>
        )}
      </div>

      {/* Textbook TOC upload */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 mb-1">
          2️⃣ 課本目錄
        </p>
        <p className="text-xs text-gray-500 mb-3 leading-5">
          影低數學課本目錄頁（有課題編號 + 標題嗰啲），AI 會對返學校通告嘅課題編號。
          唔需要喺課本上面剔嘢。
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleTextbookChange}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1D9E75]/10 file:text-[#1D9E75] file:font-medium"
        />
        {textbookFiles.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            已選擇 {textbookFiles.length} 張
          </p>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">
        兩組合計最多 {MAX_TOTAL} 張 · 剩 {remaining} 張可以加
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-14 rounded-2xl bg-[#1D9E75] text-white text-base font-bold disabled:opacity-60 active:scale-[0.98] transition shadow-md"
      >
        {submitting ? 'AI 識別中… 約 10–20 秒' : '上載並識別範圍'}
      </button>
    </form>
  )
}
