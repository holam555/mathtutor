'use client'

import { useFormState, useFormStatus } from 'react-dom'
import type { AuthState } from './actions'

const initialState: AuthState = {}

function SubmitButton({ color }: { color: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ backgroundColor: color }}
      className="w-full h-14 rounded-xl text-white text-base font-semibold disabled:opacity-60 active:scale-[0.98] transition"
    >
      {pending ? '登入中…' : '登入'}
    </button>
  )
}

export default function LoginForm({
  action,
  color,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>
  color: string
}) {
  const [state, formAction] = useFormState(action, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">電郵</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 outline-none text-base"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-[#4A90E2] focus:ring-2 focus:ring-[#4A90E2]/20 outline-none text-base"
        />
      </div>
      {state.error && (
        <p className="text-sm text-[#F44336] bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      <SubmitButton color={color} />
    </form>
  )
}
