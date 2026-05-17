'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Child = { id: string; name: string; grade: number | null }

export default function UploadExamScopeForm({ linkedChildren }: { linkedChildren: Child[] }) {
  const router = useRouter()
  const [studentId, setStudentId] = useState(linkedChildren[0]?.id ?? '')
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ units: { unit_number: number; name: string }[] } | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? [])
    setFiles(list.slice(0, 10))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId) {
      setError('請選擇子女')
      return
    }
    if (files.length === 0) {
      setError('請上載至少一張相片')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('student_id', studentId)
    if (examName) formData.append('exam_name', examName)
    if (examDate) formData.append('exam_date', examDate)
    for (const f of files) formData.append('images', f)

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

      {/* Image upload */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          考試範圍相片（最多 10 張）
        </p>
        <p className="text-xs text-gray-500 mb-2 leading-5">
          可以混合上載：
          <br />
          · 學校嘅考試通告 / 範圍紙
          <br />
          · 課本目錄頁（喺要考嘅課題旁邊用筆剔起 ✓ 或螢光筆 highlight）
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1D9E75]/10 file:text-[#1D9E75] file:font-medium"
        />
        {files.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            已選擇 {files.length} 張相
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-14 rounded-2xl bg-[#1D9E75] text-white text-base font-bold disabled:opacity-60 active:scale-[0.98] transition shadow-md"
      >
        {submitting ? 'AI 識別中… 約 10 秒' : '上載並識別範圍'}
      </button>
    </form>
  )
}
