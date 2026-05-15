'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { RATING_COLORS, RATING_LABELS } from '@/lib/assessmentUtils'
import type { ReportData, Rating, AssessmentAnswer, UnitMastery } from '@/types/assessment'

export type AssessmentRow = {
  id: string
  student_name: string
  school_name: string | null
  grade: number
  grade_level: string
  parent_phone: string | null
  parent_email: string | null
  created_at: string
  report_data: ReportData | null
  answers: AssessmentAnswer[] | null
}

function exportCSV(sessions: AssessmentRow[]) {
  const headers = [
    '日期', '學生姓名', '年級', '學校', '電話', '電郵',
    '總分', '答對題數', '總題數', '正確率%',
    '診斷等級', '強項', '弱項',
  ]

  const rows = sessions.map((s) => {
    const answers = s.answers ?? []
    const total = answers.length
    const correct = answers.filter((a) => a.is_correct).length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const r = s.report_data
    const score = r?.score ?? pct
    const strongAreas = (r?.strongAreas ?? []).map((a) => a.title).join('；')
    const weakAreas = (r?.weakAreas ?? []).map((a) => a.name).join('；')
    const tier = r?.diagnosticTier ?? ''
    const date = new Date(s.created_at).toLocaleDateString('zh-HK')

    return [
      date,
      s.student_name,
      s.grade_level,
      s.school_name ?? '',
      s.parent_phone ?? '',
      s.parent_email ?? '',
      score,
      correct,
      total,
      pct,
      tier,
      strongAreas,
      weakAreas,
    ]
  })

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const bom = '﻿'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `assessment_sessions_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function ScoreBadge({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#1D9E75' : pct >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="text-right flex-shrink-0">
      <div className="text-xl font-bold" style={{ color }}>{pct}%</div>
    </div>
  )
}

function UnitMasteryRow({ m }: { m: UnitMastery }) {
  const color = m.pct >= 75 ? '#1D9E75' : m.pct >= 50 ? '#F59E0B' : '#EF4444'
  const rc = RATING_COLORS[m.rating as Rating]
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 truncate">{m.unit_name}</p>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${m.pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <div className="text-right flex-shrink-0 w-20">
        <span className="text-sm font-bold" style={{ color }}>{m.pct}%</span>
        <span className="text-xs text-gray-400 ml-1">{m.correct_marks}/{m.total_marks}</span>
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${rc.bg} ${rc.text} ${rc.border}`}>
        {RATING_LABELS[m.rating as Rating]}
      </span>
    </div>
  )
}

function ExpandedDetail({ s }: { s: AssessmentRow }) {
  const answers = s.answers ?? []
  const wrong = answers.filter((a) => !a.is_correct)
  const report = s.report_data

  const wrongByUnit = new Map<string, AssessmentAnswer[]>()
  for (const a of wrong) {
    const key = a.unit_name ?? a.module_name ?? '其他'
    if (!wrongByUnit.has(key)) wrongByUnit.set(key, [])
    wrongByUnit.get(key)!.push(a)
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-5">

      {/* Contact + meta row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">電話</p>
          {s.parent_phone ? (
            <a href={`tel:${s.parent_phone}`} className="text-sm font-medium text-teal-600 hover:underline">
              {s.parent_phone}
            </a>
          ) : <p className="text-sm text-gray-400">—</p>}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">電郵</p>
          {s.parent_email ? (
            <a href={`mailto:${s.parent_email}`} className="text-sm font-medium text-teal-600 hover:underline break-all">
              {s.parent_email}
            </a>
          ) : <p className="text-sm text-gray-400">—</p>}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">總分</p>
          <p className="text-sm font-bold text-gray-800">{report?.score ?? '—'} / 100</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">診斷等級</p>
          <p className="text-sm font-medium text-gray-700">{report?.diagnosticTier ?? report?.band ?? '—'}</p>
        </div>
      </div>

      {/* Unit mastery */}
      {(report?.unitMastery ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">大單元掌握度</p>
          <div className="space-y-2">
            {(report!.unitMastery!).map((m) => (
              <UnitMasteryRow key={m.unit_id} m={m} />
            ))}
          </div>
        </div>
      )}

      {/* Legacy module mastery */}
      {(report?.unitMastery ?? []).length === 0 && (report?.modules ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">各範疇掌握度</p>
          <div className="grid grid-cols-2 gap-2">
            {report!.modules.map((mod) => {
              const pct = mod.total > 0 ? Math.round((mod.correct / mod.total) * 100) : 0
              const color = pct >= 75 ? '#1D9E75' : pct >= 50 ? '#F59E0B' : '#EF4444'
              const rc = RATING_COLORS[mod.rating as Rating]
              return (
                <div key={mod.name} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <p className="text-xs text-gray-700 truncate flex-1 mr-2">{mod.name}</p>
                  <span className="text-sm font-bold flex-shrink-0 mr-2" style={{ color }}>{pct}%</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${rc.bg} ${rc.text} ${rc.border}`}>
                    {RATING_LABELS[mod.rating as Rating]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Strong / Weak areas */}
      {(report?.strongAreas ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">強項</p>
          <div className="flex flex-wrap gap-2">
            {report!.strongAreas.map((a, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg">
                ✅ {a.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {(report?.weakAreas ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">需加強範疇</p>
          <div className="space-y-1">
            {report!.weakAreas.map((a, i) => {
              const dot = a.priority === '急需加強' ? 'bg-red-500' : a.priority === '需要加強' ? 'bg-amber-500' : 'bg-blue-500'
              const text = a.priority === '急需加強' ? 'text-red-700' : a.priority === '需要加強' ? 'text-amber-700' : 'text-blue-700'
              return (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dot}`} />
                  <span className="flex-1">{a.name}</span>
                  <span className={`font-medium flex-shrink-0 ${text}`}>{a.priority}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Wrong answers */}
      {wrong.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            答錯題目（共 {wrong.length} 題）
          </p>
          <div className="space-y-3">
            {Array.from(wrongByUnit.entries()).map(([unit, qs]) => (
              <div key={unit}>
                <p className="text-xs font-semibold text-teal-600 mb-1.5">{unit}</p>
                <div className="space-y-1.5">
                  {qs.map((a, i) => (
                    <div key={i} className="bg-white rounded-lg px-3 py-2 border border-gray-100 text-xs">
                      <p className="text-gray-700 mb-1 leading-relaxed">{a.question_text}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-amber-600">
                          <span className="font-medium">答：</span>
                          <span className="line-through opacity-80">{a.student_answer || '（未答）'}</span>
                        </span>
                        <span className="text-teal-600">
                          <span className="font-medium">正確：</span>
                          <span className="font-semibold">{a.correct_answer}</span>
                        </span>
                        {a.difficulty_tier && (
                          <span className="text-gray-400">{a.difficulty_tier}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning plan */}
      {(report?.learningPlan ?? []).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">建議學習計劃</p>
          <div className="space-y-1">
            {report!.learningPlan.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="font-bold text-gray-500 w-12 flex-shrink-0">{item.priority}</span>
                <span className="text-gray-700">
                  <span className="font-semibold">{item.area}</span>
                  {item.action ? ` — ${item.action}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Link
          href={`/assessment/report/${s.id}`}
          target="_blank"
          className="text-xs text-teal-600 hover:underline font-medium"
        >
          開啟完整報告頁面 →
        </Link>
      </div>
    </div>
  )
}

function SessionCard({ s }: { s: AssessmentRow }) {
  const [expanded, setExpanded] = useState(false)

  const answers = s.answers ?? []
  const total = answers.length
  const correct = answers.filter((a) => a.is_correct).length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const report = s.report_data
  const score = report?.score ?? pct

  const date = new Date(s.created_at).toLocaleDateString('zh-HK', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })

  const weakCount = (report?.weakAreas ?? []).length
  const wrongCount = answers.filter((a) => !a.is_correct).length

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row — click to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800">{s.student_name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium">
                {s.grade_level}
              </span>
              {report?.diagnosticTier && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {report.diagnosticTier === 'advanced' ? '拔尖' : report.diagnosticTier === 'basic_mastery' ? '基礎' : '補強'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {s.school_name ?? '學校未填'} · {date}
            </p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
              {s.parent_phone && <span>📞 {s.parent_phone}</span>}
              {s.parent_email && <span>✉️ {s.parent_email}</span>}
              {wrongCount > 0 && <span className="text-amber-500">✗ 錯 {wrongCount} 題</span>}
              {weakCount > 0 && <span className="text-red-400">⚠ {weakCount} 個弱項</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <ScoreBadge pct={score} />
              <div className="text-xs text-gray-400 mt-0.5">{correct}/{total} 題</div>
            </div>
            <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        {/* Module rating chips */}
        {!expanded && (report?.modules ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(report?.unitMastery ?? report?.modules ?? []).slice(0, 6).map((mod) => {
              const name = 'unit_name' in mod ? mod.unit_name : mod.name
              const r = mod.rating as Rating
              const c = RATING_COLORS[r]
              return (
                <span key={name} className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${c.bg} ${c.text} ${c.border}`}>
                  {name.length > 8 ? name.slice(0, 8) + '…' : name} {r}
                </span>
              )
            })}
          </div>
        )}
      </button>

      {expanded && <ExpandedDetail s={s} />}
    </div>
  )
}

const GRADE_OPTIONS = ['全部年級', '小三', '小四', '小五', '小六']

export default function AdminAssessmentsClient({ sessions }: { sessions: AssessmentRow[] }) {
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('全部年級')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sessions.filter((s) => {
      const matchGrade = gradeFilter === '全部年級' || s.grade_level.startsWith(gradeFilter)
      if (!matchGrade) return false
      if (!q) return true
      return (
        s.student_name.toLowerCase().includes(q) ||
        (s.school_name ?? '').toLowerCase().includes(q) ||
        (s.parent_phone ?? '').includes(q) ||
        (s.parent_email ?? '').toLowerCase().includes(q)
      )
    })
  }, [sessions, search, gradeFilter])

  const totalLeads = sessions.length
  const thisWeek = sessions.filter((s) => {
    return Date.now() - new Date(s.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
  }).length

  const gradeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of sessions) {
      const g = s.grade_level.slice(0, 2)
      map[g] = (map[g] ?? 0) + 1
    }
    return map
  }, [sessions])

  const avgScore = useMemo(() => {
    const scored = sessions.filter((s) => s.report_data?.score != null)
    if (!scored.length) return null
    return Math.round(scored.reduce((sum, s) => sum + s.report_data!.score!, 0) / scored.length)
  }, [sessions])

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">總評估人數</p>
          <p className="text-3xl font-bold text-gray-800">{totalLeads}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">本週新增</p>
          <p className="text-3xl font-bold" style={{ color: '#1D9E75' }}>{thisWeek}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">平均總分</p>
          <p className="text-3xl font-bold text-gray-800">{avgScore ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-2">年級分佈</p>
          <div className="space-y-0.5">
            {Object.entries(gradeCounts).sort().map(([g, n]) => (
              <div key={g} className="flex justify-between text-xs">
                <span className="text-gray-600">{g}</span>
                <span className="font-semibold text-gray-800">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + filter + export */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="搜尋學生姓名、學校、電話、電郵…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
        >
          {GRADE_OPTIONS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-700"
        >
          ⬇ 匯出 CSV ({filtered.length})
        </button>
      </div>

      {/* Results count */}
      {search || gradeFilter !== '全部年級' ? (
        <p className="text-xs text-gray-400">
          顯示 {filtered.length} / {totalLeads} 筆記錄
        </p>
      ) : null}

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500">找不到符合條件的記錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <SessionCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  )
}
