'use client'

import { useState } from 'react'
import { computeAccuracy, type CategoryStat } from '@/lib/statsUtils'
import ProgressCircle from '@/components/ProgressCircle'

type StudentStats = {
  student_id: string
  student_name: string
  grade: number | null
  session_count: number
  total_answers: number
  correct_answers: number
  wrong_unresolved: number
}

export default function StudentDetailModal({
  student,
  categoryStats,
}: {
  student: StudentStats
  categoryStats: CategoryStat[]
}) {
  const [open, setOpen] = useState(false)
  const accuracy = computeAccuracy(student.correct_answers, student.total_answers)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-[#4A90E2] font-medium"
      >
        詳情
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold">{student.student_name}</h2>
                <p className="text-sm text-gray-500">
                  小{student.grade === 5 ? '五' : student.grade === 6 ? '六' : '—'}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            {/* Overall stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#4A90E2]">{student.session_count}</p>
                <p className="text-xs text-gray-500 mt-0.5">練習次數</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-[#4A90E2]">{student.total_answers}</p>
                <p className="text-xs text-gray-500 mt-0.5">答題數量</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center">
                <ProgressCircle pct={accuracy} size={44} />
                <p className="text-xs text-gray-500 mt-0.5">正確率</p>
              </div>
            </div>

            {student.wrong_unresolved > 0 && (
              <div className="bg-red-50 rounded-xl p-3 mb-4 text-sm text-red-700">
                待重練錯題：{student.wrong_unresolved} 題
              </div>
            )}

            {/* Category breakdown */}
            {categoryStats.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  各題型正確率（30天）
                </p>
                <div className="space-y-3">
                  {categoryStats.map((cat) => (
                    <div key={cat.category_id} className="flex items-center gap-3">
                      <ProgressCircle pct={cat.accuracy} size={40} strokeWidth={4} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {cat.category_code} {cat.category_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {cat.correct_count}/{cat.total_attempts} 題答對
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {categoryStats.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">暫無答題記錄</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
