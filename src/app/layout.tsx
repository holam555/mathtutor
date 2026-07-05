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

export const metadata: Metadata = {
  title: {
    default: '霖楓學苑數學升分平台',
    template: '%s | 霖楓學苑數學升分平台',
  },
  description: '霖楓學苑 — 香港小學數學練習與升分平台',
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
      <body className="antialiased bg-[#F5F5F5] text-gray-900 min-h-screen">
        <LanguageProvider initialLang={lang}>
          <LanguageToggle />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
