import type { Metadata } from 'next'
import Link from 'next/link'
import { guidePath, unitGuides } from '@/content/unitGuides/registry'

export const metadata: Metadata = {
  title: '小學數學單元學習指南 — 免費資源',
  description:
    '霖楓學苑免費小學數學學習指南：按香港小三至小六課程逐個單元講解概念、例題和常見錯誤，並提供免費學前評估診斷強弱項。',
  keywords: ['小學數學', '學習指南', '免費資源', '呈分試 數學', '香港小學課程'],
  alternates: { canonical: '/resources' },
}

export default function ResourcesIndexPage() {
  const grades = [3, 4, 5, 6].filter((g) => unitGuides.some((u) => u.grade === g))

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-600">首頁</Link>
        {' › '}
        <span className="text-gray-600">學習資源</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">小學數學單元學習指南</h1>
        <p className="text-gray-500 mt-2 leading-relaxed">
          按香港小學課程逐個單元講解：概念、步驟、例題、小朋友最常犯的錯誤。
          全部免費，由霖楓學苑教師團隊編寫。
        </p>
      </header>

      {grades.map((g) => (
        <section key={g} className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3">小{['', '一', '二', '三', '四', '五', '六'][g]}（P{g}）</h2>
          <ul className="space-y-2">
            {unitGuides
              .filter((u) => u.grade === g)
              .sort((a, b) => a.unitNumber - b.unitNumber)
              .map((u) => (
                <li key={u.slug}>
                  <Link
                    href={guidePath(u)}
                    className="block bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-[#1D9E75]/40 transition"
                  >
                    <span className="font-semibold text-gray-800">
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

      <div className="mt-6 bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-2xl p-6 text-center">
        <p className="font-semibold text-gray-800">唔肯定小朋友邊個單元最弱？</p>
        <Link
          href="/assessment"
          className="mt-3 inline-block px-8 py-3 bg-[#1D9E75] text-white rounded-2xl text-sm font-semibold"
        >
          做一次免費學前評估
        </Link>
      </div>
    </main>
  )
}
