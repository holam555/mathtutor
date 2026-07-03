'use client'

import { useLang } from '@/lib/i18n/LanguageProvider'

export function LanguageToggle() {
  const { lang, setLang } = useLang()

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className="fixed top-3 right-3 z-50 bg-white/95 backdrop-blur border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:shadow-md active:scale-[0.97] transition"
      aria-label="Toggle language / 切換語言"
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  )
}
