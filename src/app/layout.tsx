import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { getLang } from '@/lib/i18n/getLang'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'
import { LanguageToggle } from '@/components/LanguageToggle'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '霖楓學苑數學升分平台｜香港小學數學練習・免費學前評估',
    template: '%s | 霖楓學苑數學升分平台',
  },
  description:
    '霖楓學苑 — 香港小三至小六數學練習與升分平台。免費學前評估找出弱項、錯題追蹤、智能出題、past paper 分析，助小學生數學升分。',
  keywords: [
    '小學數學練習',
    '香港數學補習',
    '網上數學練習',
    '呈分試數學',
    '數學 past paper',
    '免費數學評估',
    '小三數學',
    '小四數學',
    '小五數學',
    '小六數學',
    '霖楓學苑',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'zh_HK',
    siteName: '霖楓學苑數學升分平台',
    title: '霖楓學苑數學升分平台｜香港小學數學練習・免費學前評估',
    description:
      '香港小三至小六數學練習與升分平台。免費學前評估找出弱項、錯題追蹤、智能出題、past paper 分析。',
    url: siteUrl,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '霖楓學苑數學升分平台' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '霖楓學苑數學升分平台｜香港小學數學練習',
    description: '免費學前評估、錯題追蹤、智能出題，助香港小學生數學升分。',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
}

// Sitewide 結構化資料 — Google 同 AI 引擎都靠 JSON-LD parse。詳見 docs/seo_strategy.md §3.5
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': `${siteUrl}/#organization`,
      name: '霖楓學苑',
      alternateName: 'LF Academy',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      description: '香港小學（小三至小六）數學練習與升分平台，提供免費學前評估、錯題追蹤與智能出題。',
      areaServed: { '@type': 'Place', name: '香港 Hong Kong' },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: '霖楓學苑數學升分平台',
      inLanguage: 'zh-Hant',
      publisher: { '@id': `${siteUrl}/#organization` },
    },
  ],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const lang = getLang()

  return (
    <html lang="zh-Hant" className={nunito.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased bg-[#F5F5F5] text-gray-900 min-h-screen">
        <LanguageProvider initialLang={lang}>
          <LanguageToggle />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
