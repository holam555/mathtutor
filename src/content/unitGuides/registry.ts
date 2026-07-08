import type { ComponentType } from 'react'
import { p4U2CommonMultiplesFactors } from './p4-u2-common-multiples-factors'
import { p5U2FractionAddSub } from './p5-u2-fraction-add-sub'
import { p5U7PolygonArea } from './p5-u7-polygon-area'
import { p5U14FractionDivision } from './p5-u14-fraction-division'
import { p6U7Circumference } from './p6-u7-circumference'
import { p6U9PercentageApplications } from './p6-u9-percentage-applications'
import { p6U12Speed } from './p6-u12-speed'

/**
 * Public 單元指南 registry — the single source of truth for the
 * /resources content surface (docs/seo_strategy.md §4, biggest growth
 * lever). The dynamic route, the /resources index, sitemap.ts and
 * scripts/check_seo.mjs all derive from this list, so adding an entry
 * here is the ONLY step needed to publish a new guide.
 *
 * Authoring rules live in .claude/skills/seo-content-page/SKILL.md
 * (answer-first, <h2> questions, FAQPage schema, 800-1500 字, E-E-A-T).
 * Every guide is reviewed by the tutor before merge — content quality is
 * a human gate, not CI.
 */
export type UnitGuide = {
  /** URL segment after /resources/p<grade>/ — Chinese is fine (zh SERP) */
  slug: string
  grade: 3 | 4 | 5 | 6
  /** curriculum_units.unit_number this guide covers */
  unitNumber: number
  /** SEO title, 55-60 全形字 max — pattern: 年級＋單元＋價值承諾 */
  title: string
  /** meta description, 150-160 字 */
  description: string
  keywords: string[]
  /** last content revision, shown on page (E-E-A-T freshness signal) */
  updated: string
  /** FAQ entries — rendered on page AND emitted as FAQPage JSON-LD */
  faq: { q: string; a: string }[]
  /** the guide body (server component, no client JS) */
  Component: ComponentType
}

// Array order = landing page「免費學習指南」featured order (first 4).
// /resources sorts by grade + unitNumber itself, so ordering here is
// purely editorial — keep a P5/P6 mix up front (highest 呈分試 intent).
export const unitGuides: UnitGuide[] = [
  p5U2FractionAddSub,
  p6U9PercentageApplications,
  p5U14FractionDivision,
  p6U12Speed,
  p4U2CommonMultiplesFactors,
  p5U7PolygonArea,
  p6U7Circumference,
]

export function findGuide(grade: string, slug: string): UnitGuide | undefined {
  const g = parseInt(grade.replace(/^p/i, ''), 10)
  return unitGuides.find(
    (u) => u.grade === g && decodeURIComponent(slug) === u.slug
  )
}

export function guidePath(u: UnitGuide): string {
  return `/resources/p${u.grade}/${encodeURIComponent(u.slug)}`
}
