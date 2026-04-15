import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '數學練習',
  description: '香港小五小六數學練習平台',
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
  return (
    <html lang="zh-Hant">
      <body className="antialiased bg-[#F5F5F5] text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
