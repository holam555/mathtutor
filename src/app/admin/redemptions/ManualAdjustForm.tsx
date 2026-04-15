'use client'

import { useState, useTransition } from 'react'
import { manualAdjustTokens } from './actions'

type Student = { id: string; name: string; token_balance: number }

export default function ManualAdjustForm({ students }: { students: Student[] }) {
  const [isPending, startTransition] = useTransition()
  const [studentId, setStudentId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

  const selected = students.find((s) => s.id === studentId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseInt(amount)
    if (!studentId || isNaN(amt) || amt === 0) return
    setResult(null)
    startTransition(async () => {
      const res = await manualAdjustTokens(studentId, amt, note)
      setResult(res)
      if (res.success) {
        setAmount('')
        setNote('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <h3 className="font-semibold text-gray-800">手動調整 Token 餘額</h3>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">選擇學生</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:border-[#4A90E2] outline-none"
        >
          <option value="">選擇學生…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}（目前 {s.token_balance ?? 0} Tokens）
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            金額（正數增加，負數扣減）
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="例如：50 或 -20"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#4A90E2] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">備注（可選）</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：特別活動獎勵"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#4A90E2] outline-none"
          />
        </div>
      </div>

      {selected && amount && !isNaN(parseInt(amount)) && (
        <p className="text-xs text-gray-500">
          調整後餘額：
          <strong className={(selected.token_balance ?? 0) + parseInt(amount) < 0 ? 'text-red-500' : 'text-gray-800'}>
            {(selected.token_balance ?? 0) + parseInt(amount)} Tokens
          </strong>
        </p>
      )}

      {result?.error && <p className="text-xs text-red-500">{result.error}</p>}
      {result?.success && <p className="text-xs text-green-600">✓ 已調整</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-10 bg-[#4A90E2] text-white rounded-xl text-sm font-medium disabled:opacity-50"
      >
        {isPending ? '…' : '確認調整'}
      </button>
    </form>
  )
}
