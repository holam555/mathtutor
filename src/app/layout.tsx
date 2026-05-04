import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '霖楓學院數學升分平台',
    template: '%s | 霖楓學院數學升分平台',
  },
  description: '霖楓學院 — 香港小學數學練習與升分平台',
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
