'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Child = { id: string; name: string; grade: number | null }
type Unit = { id: string; grade: number; unit_number: number; name: string; semester: 'A' | 'B' }

const GRADE_LABEL: Record<number, string> = { 3: '三', 4: '四', 5: '五', 6: '六' }
const SEMESTER_LABEL: Record<string, string> = { A: '上學期', B: '下學期' }

export default function ExamScopePickerForm({
  linkedChildren,
  allUnits,
}: {
  linkedChildren: Child[]
  allUnits: Unit[]
}) {
  const router = useRouter()
  const [studentId, setStudentId] = useState(linkedChildren[0]?.id ?? '')
  const [examName, setExamName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<'form' | 'done'>('form')

  const selectedChild = linkedChildren.find((c) => c.id === studentId)
  const gradeUnits = allUnits.filter((u) => u.grade === selectedChild?.grade)

  // Group by semester
  const bySemester = gradeUnits.reduce<Record<string, Unit[]>>((acc, u) => {
    const key = u.semester
    if (!acc[key]) acc[key] = []
    acc[key].push(u)
    return acc
  }, {})

  function toggleUnit(id: string) {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleChildChange(id: string) {
    setStudentId(id)
    setSelectedUnitIds(new Set())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId) { setError('請選擇子女'); return }
    if (selectedUnitIds.size === 0) { setError('請最少選擇一個考試單元'); return }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/parent/exam-scope/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          unit_ids: Array.from(selectedUnitIds),
          exam_name: examName || null,
          exam_date: examDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '提交失敗，請稍後再試')
      } else {
        setStage('done')
      }
    } catch {
      setError('網絡錯誤，請重試')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmedUnits = gradeUnits.filter((u) => selectedUnitIds.has(u.id))

  // ── Done screen ──────────────────────────────────────────────────────────
  if (stage === 'done') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-5xl mb-3">✅</p>
          <h2 className="font-bold text-gray-800 text-lg mb-1">模擬考試範圍已設定</h2>
          <p className="text-sm text-gray-500 mb-4">
            {selectedChild?.name ?? '學生'} · {confirmedUnits.length} 個單元
          </p>
          <ul className="text-sm text-gray-600 space-y-1 text-left inline-block">
            {confirmedUnits.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <span className="text-[#1D9E75] font-bold">✓</span>
                單元 {u.unit_number}：{u.name}
              </li>
            ))}
          </ul>
        </div>

        {/* What happens next */}
        <div className="bg-[#F7FBF9] border border-[#1D9E75]/20 rounded-2xl p-5">
          <p className="text-sm font-semibold text-[#1D9E75] mb-3">📝 接下來會點？</p>
          <ol className="text-xs text-gray-700 space-y-2 leading-relaxed list-none">
            <li>
              <strong className="text-gray-800">1.</strong> {selectedChild?.name ?? '學生'} 嘅主頁
              會出現「模擬考試試卷」卡片。
            </li>
            <li>
              <strong className="text-gray-800">2.</strong> 點入去後可以先下載
              <strong> 長答題 PDF</strong>，列印或喺 iPad 上書寫。
            </li>
            <li>
              <strong className="text-gray-800">3.</strong> 按「開始作答」即開始 <strong>50 分鐘</strong>
              計時，喺 App 內做 <strong>多項選擇題</strong> 同 <strong>短答題</strong>。
            </li>
            <li>
              <strong className="text-gray-800">4.</strong> 做完 App 部分會見到 AI 評語，
              然後按「繼續計時」開始做長答題。
            </li>
            <li>
              <strong className="text-gray-800">5.</strong> 完成後請喺家長中心拍照上載
              <strong> 長答題答卷</strong>，AI 會自動辨識手寫內容交畀老師批改。
            </li>
          </ol>
        </div>

        <button
          onClick={() => router.push(`/parent/child/${studentId}?tab=sprint`)}
          className="w-full h-14 rounded-2xl bg-[#1D9E75] text-white text-base font-bold active:scale-[0.98] transition shadow-md"
        >
          查看模擬考試詳情
        </button>
        <button
          onClick={() => router.push('/parent')}
          className="w-full h-12 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-semibold active:scale-[0.98] transition"
        >
          返回家長中心
        </button>
      </div>
    )
  }

  // ── Picker form ──────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Child selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">選擇子女</p>
        <div className="space-y-2">
          {linkedChildren.map((c) => (
            <label
              key={c.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                studentId === c.id ? 'border-[#1D9E75] bg-[#1D9E75]/5' : 'border-gray-100'
              }`}
            >
              <input
                type="radio"
                name="student_id"
                value={c.id}
                checked={studentId === c.id}
                onChange={() => handleChildChange(c.id)}
                className="accent-[#1D9E75]"
              />
              <div>
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">小{GRADE_LABEL[c.grade ?? 0] ?? '—'}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Optional metadata */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            考試名稱（選填）
          </label>
          <input
            type="text"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="例如：第二次段考"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            考試日期（選填）
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75]"
          />
        </div>
      </div>

      {/* Unit picker */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            選擇考試單元
          </p>
          {selectedUnitIds.size > 0 && (
            <p className="text-xs text-[#1D9E75] font-medium">
              已選 {selectedUnitIds.size} 個
            </p>
          )}
        </div>

        {gradeUnits.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            找不到該年級的課程單元，請聯絡老師
          </p>
        ) : (
          <div className="space-y-4">
            {(['A', 'B'] as const).map((sem) => {
              const semUnits = bySemester[sem]
              if (!semUnits?.length) return null
              return (
                <div key={sem}>
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    {SEMESTER_LABEL[sem]}
                  </p>
                  <div className="space-y-1">
                    {semUnits.map((u) => {
                      const checked = selectedUnitIds.has(u.id)
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            checked
                              ? 'border-[#1D9E75] bg-[#1D9E75]/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleUnit(u.id)}
                            className="accent-[#1D9E75] w-4 h-4 shrink-0"
                          />
                          <span className="text-xs text-gray-400 shrink-0 w-6">
                            {u.unit_number}
                          </span>
                          <span className="text-sm text-gray-800">{u.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || selectedUnitIds.size === 0}
        className="w-full h-14 rounded-2xl bg-[#1D9E75] text-white text-base font-bold disabled:opacity-60 active:scale-[0.98] transition shadow-md"
      >
        {submitting ? '儲存中…' : `確認考試範圍（${selectedUnitIds.size} 個單元）`}
      </button>
    </form>
  )
}
