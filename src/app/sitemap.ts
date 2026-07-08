import type { MetadataRoute } from 'next'
import { guidePath, unitGuides } from '@/content/unitGuides/registry'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// 只列公開（未登入可爬）頁面。單元指南由 content registry 派生 —
// 加一篇 guide 唔使掂呢個檔（docs/seo_strategy.md §4；防 regression
// 由 scripts/check_seo.mjs 把關）。
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/assessment`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/resources`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...unitGuides.map((u) => ({
      url: `${siteUrl}${guidePath(u)}`,
      lastModified: new Date(u.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
