import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findGuide, guidePath, unitGuides } from '@/content/unitGuides/registry'

/**
 * Public 單元指南 page — the SEO/GEO content surface (strategy §4).
 * Fully static: every guide in the registry is rendered at build time so
 * crawlers (and AI crawlers allowed in robots.ts) always get full HTML.
 */

export function generateStaticParams() {
  return unitGuides.map((u) => ({
    grade: `p${u.grade}`,
    // Next 14 matches params in their URL-encoded form — a raw Chinese
    // slug here would 404 every request (params arrive percent-encoded)
    slug: encodeURIComponent(u.slug),
  }))
}

export const dynamicParams = false

export function generateMetadata({
  params,
}: {
  params: { grade: string; slug: string }
}): Metadata {
  const guide = findGuide(params.grade, params.slug)
  if (!guide) return {}
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: guidePath(guide) },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      locale: 'zh_HK',
    },
  }
}

export default function UnitGuidePage({
  params,
}: {
  params: { grade: string; slug: string }
}) {
  const guide = findGuide(params.grade, params.slug)
  if (!guide) notFound()

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  const learningResourceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: guide.title,
    description: guide.description,
    inLanguage: 'zh-Hant',
    educationalLevel: `小學${['', '一', '二', '三', '四', '五', '六'][guide.grade]}年級`,
    teaches: guide.slug,
    dateModified: guide.updated,
    provider: { '@type': 'EducationalOrganization', name: '霖楓學苑' },
  }

  const { Component } = guide

  return (
    <main className="min-h-screen paper-grid text-gray-800 dark:text-gray-200">
      <div className="max-w-2xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(learningResourceJsonLd) }}
      />

      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#1F4D36] dark:hover:text-gray-100 transition">首頁</Link>
        {' › '}
        <Link href="/resources" className="hover:text-[#1F4D36] dark:hover:text-gray-100 transition">學習資源</Link>
        {' › '}
        <span className="text-gray-600 dark:text-gray-300">P{guide.grade} {guide.slug}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F4D36] dark:text-white leading-snug">{guide.title}</h1>
        <p className="text-sm text-gray-400 mt-2">
          霖楓學苑教師團隊 · 更新於 {guide.updated} · 香港小學課程
        </p>
      </header>

      <Component />

      <section className="mt-10">
        <h2 className="text-xl font-bold text-[#1F4D36] dark:text-white mb-4">常見問題</h2>
        <div className="space-y-4">
          {guide.faq.map((f) => (
            <details key={f.q} className="bg-white dark:bg-white/[0.06] ring-1 ring-gray-900/5 dark:ring-white/10 rounded-xl p-4">
              <summary className="font-semibold text-gray-800 cursor-pointer">{f.q}</summary>
              <p className="text-gray-600 mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-10 bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-2xl p-6 text-center">
        <p className="font-semibold text-gray-800">想知道小朋友呢個單元掌握成點？</p>
        <p className="text-sm text-gray-500 mt-1">20 條題目自動診斷，即時出報告，完全免費</p>
        <Link
          href="/assessment"
          className="mt-4 inline-block px-8 py-3 bg-[#1D9E75] text-white rounded-2xl text-sm font-semibold"
        >
          開始免費學前評估
        </Link>
      </div>
      </div>
    </main>
  )
}
