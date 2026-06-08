'use client'

import { useState, useTransition } from 'react'
import { saveTopicAssignments } from './actions'

type Topic = {
  id: string
  name: string
  lesson_number: number
}

type Unit = {
  id: string
  unit_number: number
  name: string
  semester: string
  topics: Topic[]
}

export default function AssignmentTab({
  studentId,
  units,
  activeTopicIds,
}: {
  studentId: string
  units: Unit[]
  activeTopicIds: string[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(activeTopicIds))
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function toggle(topicId: string) {
    setSaved(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) {
        next.delete(topicId)
      } else {
        next.add(topicId)
      }
      return next
    })
  }

  function handleSave() {
    setErrorMsg(null)
    startTransition(async () => {
      const res = await saveTopicAssignments(studentId, Array.from(selected))
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSaved(true)
      }
    })
  }

  const semesterGroups = new Map<string, Unit[]>()
  for (const u of units) {
    const sem = u.semester === 'A' ? '上學期' : '下學期'
    if (!semesterGroups.has(sem)) semesterGroups.set(sem, [])
    semesterGroups.get(sem)!.push(u)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          勾選後，學生按「開始練習」時只會做指定小單元的題目。
          <br />
          <span className="text-xs text-gray-400">清除所有勾選等於回復自動選題。</span>
        </p>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {saved && <span className="text-xs text-[#1D9E75] font-medium">✓ 已儲存</span>}
          {errorMsg && <span className="text-xs text-red-500">{errorMsg}</span>}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="h-9 px-4 rounded-xl bg-[#4A90E2] text-white text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition"
          >
            {isPending ? '儲存中…' : `儲存（${selected.size} 個小單元）`}
          </button>
        </div>
      </div>

      {Array.from(semesterGroups.entries()).map(([sem, semUnits]) => (
        <div key={sem}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{sem}</p>
          <div className="space-y-2">
            {semUnits.map((unit) => (
              <div key={unit.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#4A90E2] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {unit.unit_number}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{unit.name}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {unit.topics.map((topic) => (
                    <label
                      key={topic.id}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(topic.id)}
                        onChange={() => toggle(topic.id)}
                        className="w-4 h-4 accent-[#4A90E2]"
                      />
                      <span className="text-xs text-gray-500 w-5 shrink-0">{topic.lesson_number}</span>
                      <span className="text-sm text-gray-700">{topic.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
