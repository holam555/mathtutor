import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// AI 搜尋爬蟲 — 明確放行，否則唔會被 ChatGPT / Claude / Perplexity 引用。
const aiCrawlers = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
]

// Gated / 私隱 / 非內容路徑 — 唔畀任何爬蟲索引。
// /assessment/report 係個人評估報告（帶 sessionId），唔係公開內容。
const disallow = ['/admin', '/student', '/parent', '/api', '/login', '/signup', '/assessment/report']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
