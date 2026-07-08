import type { Metadata } from 'next'
import Link from 'next/link'
import { guidePath, unitGuides } from '@/content/unitGuides/registry'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'

export const metadata: Metadata = {
  title: '小學數學單元學習指南 — 免費資源',
  description:
    '霖楓學苑免費小學數學學習指南：按香港小三至小六課程逐個單元講解概念、例題和常見錯誤，並提供免費學前評估診斷強弱項。',
  keywords: ['小學數學', '學習指南', '免費資源', '呈分試 數學', '香港小學課程'],
  alternates: { canonical: '/resources' },
}

export default function ResourcesIndexPage() {
  const lang = getLang()
  const grades = [3, 4, 5, 6].filter((g) => unitGuides.some((u) => u.grade === g))

  return (
    <main className="min-h-screen paper-grid text-gray-800 dark:text-gray-200">
      <div className="max-w-2xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#1F4D36] dark:hover:text-gray-100 transition">{translate('首頁', lang)}</Link>
        {' › '}
        <span className="text-gray-600 dark:text-gray-300">{translate('學習資源', lang)}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F4D36] dark:text-white">{translate('小學數學單元學習指南', lang)}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          {translate('按香港小學課程逐個單元講解：概念、步驟、例題、小朋友最常犯的錯誤。全部免費，由霖楓學苑教師團隊編寫。', lang)}
        </p>
      </header>

      {lang === 'en' && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#E8792F]/30 bg-[#E8792F]/5 px-5 py-4 text-sm">
          <span aria-hidden className="text-lg leading-none">🌐</span>
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-[#1F4D36] dark:text-gray-100">English version coming soon.</span>{' '}
            The study guides below are currently written in Traditional Chinese.
          </p>
        </div>
      )}

      {grades.map((g) => (
        <section key={g} className="mb-8">
          <h2 className="text-lg font-bold text-[#1F4D36] dark:text-gray-100 mb-3">
            {lang === 'en' ? `Primary ${g} (P${g})` : `小${['', '一', '二', '三', '四', '五', '六'][g]}（P${g}）`}
          </h2>
          <ul className="space-y-2">
            {unitGuides
              .filter((u) => u.grade === g)
              .sort((a, b) => a.unitNumber - b.unitNumber)
              .map((u) => (
                <li key={u.slug}>
                  <Link
                    href={guidePath(u)}
                    className="block bg-white dark:bg-white/[0.06] ring-1 ring-gray-900/5 dark:ring-white/10 border-0 rounded-2xl px-5 py-4 hover:ring-[#E8792F]/50 transition"
                  >
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      U{u.unitNumber} {u.slug}
                    </span>
                    <span className="block text-sm text-gray-400 mt-0.5 line-clamp-2">
                      {u.description}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <div className="mt-6 bg-[#1D9E75]/5 dark:bg-[#1D9E75]/15 border border-[#1D9E75]/20 dark:border-[#1D9E75]/30 rounded-2xl p-6 text-center">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{translate('唔肯定小朋友邊個單元最弱？', lang)}</p>
        <Link
          href="/assessment"
          className="mt-3 inline-block px-8 py-3 bg-[#E8792F] hover:bg-[#D96820] text-white rounded-2xl text-sm font-semibold transition"
        >
          {translate('做一次免費學前評估', lang)}
        </Link>
      </div>
      </div>
    </main>
  )
}
