'use client'

import { useLang } from '@/lib/i18n/LanguageProvider'

export function LanguageToggle() {
  const { lang, setLang } = useLang()

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-white border border-gray-300 rounded-full px-3.5 py-1 text-sm font-semibold text-gray-700 shadow-md hover:shadow-lg active:scale-[0.97] transition"
      aria-label="Toggle language / 切換語言"
    >
      <span>🌐</span>
      <span className={lang === 'zh' ? 'text-[#1D9E75]' : 'text-gray-300'}>中文</span>
      <span className="text-gray-300">/</span>
      <span className={lang === 'en' ? 'text-[#1D9E75]' : 'text-gray-300'}>EN</span>
    </button>
  )
}
