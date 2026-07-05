'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LanguageProvider'
import type { SignupState } from './actions'

const initialState: SignupState = {}

function SubmitButton({ color }: { color: string }) {
  const { pending } = useFormStatus()
  const { t } = useLang()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ backgroundColor: color }}
      className="w-full h-14 rounded-xl text-white text-base font-semibold disabled:opacity-60 active:scale-[0.98] transition"
    >
      {pending ? t('註冊中…') : t('建立帳戶')}
    </button>
  )
}

export default function SignupForm({
  role,
  action,
  color,
}: {
  role: 'student' | 'parent'
  action: (prev: SignupState, formData: FormData) => Promise<SignupState>
  color: string
}) {
  const [state, formAction] = useFormState(action, initialState)
  const { t, lang } = useLang()

  if (state.confirmEmail) {
    return (
      <div className="text-center py-4">
        <p className="text-4xl mb-3">📬</p>
        <p className="font-semibold text-gray-800 mb-1">{t('請確認你的電郵')}</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          {t('我們已發送確認連結到你的電郵，點擊連結後即可登入。')}
        </p>
        <Link
          href={`/login/${role}`}
          className="mt-5 inline-block text-sm font-semibold underline"
          style={{ color }}
        >
          {t('前往登入')}
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t(role === 'student' ? '學生姓名' : '家長姓名')}
        </label>
        <input
          name="name"
          type="text"
          required
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300/30 outline-none text-base"
        />
      </div>

      {role === 'student' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('年級')}</label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 4, 5, 6].map((g) => (
              <label
                key={g}
                className="flex items-center justify-center h-11 rounded-xl border border-gray-300 cursor-pointer text-sm font-medium text-gray-600 transition has-[:checked]:text-white"
                style={{}}
              >
                <input type="radio" name="grade" value={g} required className="peer sr-only" />
                <span
                  className="flex items-center justify-center w-full h-full rounded-xl peer-checked:hidden"
                >
                  {lang === 'en' ? `P${g}` : `小${['', '', '', '三', '四', '五', '六'][g]}`}
                </span>
                <span
                  className="hidden peer-checked:flex items-center justify-center w-full h-full rounded-xl text-white font-semibold"
                  style={{ backgroundColor: color }}
                >
                  {lang === 'en' ? `P${g}` : `小${['', '', '', '三', '四', '五', '六'][g]}`}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {role === 'parent' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('聯絡電話（選填）')}
          </label>
          <input
            name="phone"
            type="tel"
            className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300/30 outline-none text-base"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('電郵')}</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300/30 outline-none text-base"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('密碼')}</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300/30 outline-none text-base"
        />
        <p className="text-xs text-gray-400 mt-1">{t('最少 6 個字元')}</p>
      </div>

      {state.error && (
        <p className="text-sm text-[#F44336] bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <SubmitButton color={color} />

      <p className="text-center text-sm text-gray-500">
        {t('已有帳戶？')}{' '}
        <Link href={`/login/${role}`} className="font-semibold underline" style={{ color }}>
          {t('登入')}
        </Link>
      </p>
    </form>
  )
}
