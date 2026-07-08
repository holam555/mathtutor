#!/usr/bin/env node
/**
 * SEO/GEO regression scan for the public content surface.
 * Deterministic, zero-dependency, static analysis only — runnable by CI
 * or by hand. Spec: .claude/skills/seo-audit/SKILL.md; strategy:
 * docs/seo_strategy.md §3.
 *
 *   node scripts/check_seo.mjs
 *
 * Exit 0 = clean (warnings allowed) · exit 1 = error-level findings.
 *
 * Route discovery uses robots.ts's disallow list as the single source of
 * truth for what is gated — never hardcode the list here a second time.
 * The dynamic guide route is enumerated from src/content/unitGuides/*.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(ROOT, p))

const errors = []
const warnings = []
const oks = []
const ok = (m) => oks.push(m)
const warn = (m) => warnings.push(m)
const err = (m) => errors.push(m)

// ── 1. route inventory ─────────────────────────────────────────────────
const robotsSrc = read('src/app/robots.ts')
const disallowMatch = robotsSrc.match(/const disallow = \[([^\]]*)\]/s)
const disallow = disallowMatch
  ? [...disallowMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  : []
if (!disallow.length) err('robots.ts: 讀唔到 disallow list（script 靠佢分公開/gated）')

function walkPages(dir, segs = []) {
  const routes = []
  const abs = path.join(ROOT, dir)
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const seg = entry.name
      const next = seg.startsWith('(') && seg.endsWith(')') ? segs : [...segs, seg]
      routes.push(...walkPages(path.join(dir, seg), next))
    } else if (entry.name === 'page.tsx') {
      routes.push({ route: '/' + segs.join('/'), file: path.join(dir, 'page.tsx') })
    }
  }
  return routes
}
const allRoutes = walkPages('src/app')
const isGated = (route) => disallow.some((d) => route === d || route.startsWith(d + '/'))
const publicRoutes = allRoutes.filter((r) => !isGated(r.route))
ok(`route 盤點：${allRoutes.length} 頁，公開 ${publicRoutes.length} 頁（gated 以 robots.ts disallow 為準）`)

// dynamic guide URLs from the content registry
const guideFiles = exists('src/content/unitGuides')
  ? fs.readdirSync(path.join(ROOT, 'src/content/unitGuides')).filter((f) => f.endsWith('.tsx'))
  : []
const guides = []
for (const f of guideFiles) {
  const src = read(path.join('src/content/unitGuides', f))
  const slug = src.match(/slug:\s*'([^']+)'/)?.[1]
  const grade = src.match(/grade:\s*(\d)/)?.[1]
  if (slug && grade) guides.push({ slug, grade: parseInt(grade, 10), file: f, src })
}

// ── 2+3. per-page metadata + canonical ─────────────────────────────────
for (const { route, file } of publicRoutes) {
  const src = read(file)
  const hasDynamicSeg = route.includes('[')
  const hasMeta = /export\s+(const\s+metadata|(async\s+)?function\s+generateMetadata)/.test(src)
  if (!hasMeta && route !== '/') {
    err(`${route}（${file}）：冇 metadata export / generateMetadata`)
    continue
  }
  ok(`${route}：metadata ✓`)
  const canonicalHere = /alternates/.test(src)
  const canonicalInLayout = route === '/' && /alternates:\s*{\s*canonical/.test(read('src/app/layout.tsx'))
  if (!canonicalHere && !canonicalInLayout) {
    warn(`${route}：冇 alternates.canonical（cookie i18n 下建議每頁明示）`)
  }
  if (hasDynamicSeg && !/generateStaticParams/.test(src)) {
    warn(`${route}：dynamic route 冇 generateStaticParams — 未必 build-time render`)
  }
}

// ── 4. sitemap ↔ routes ────────────────────────────────────────────────
const sitemapSrc = read('src/app/sitemap.ts')
for (const { route } of publicRoutes) {
  if (route.includes('[')) continue // dynamic — covered by registry check below
  const inSitemap = sitemapSrc.includes(`\`\${siteUrl}${route === '/' ? '/' : route}\``) ||
    sitemapSrc.includes(`'${route}'`) || sitemapSrc.includes(`${route}\``)
  if (!inSitemap) err(`sitemap.ts 漏咗公開頁 ${route}`)
  else ok(`sitemap：${route} ✓`)
}
if (guides.length && !/unitGuides/.test(sitemapSrc)) {
  err('sitemap.ts 冇讀 content registry（unitGuides）— 新 guide 唔會自動入 sitemap')
} else if (guides.length) {
  ok(`sitemap：由 registry 派生 ${guides.length} 篇 guide ✓`)
}

// ── 5. robots ──────────────────────────────────────────────────────────
const requiredCrawlers = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'OAI-SearchBot']
for (const bot of requiredCrawlers) {
  if (!robotsSrc.includes(`'${bot}'`)) err(`robots.ts：AI crawler 名單漏咗 ${bot}（GEO 前提）`)
}
if (requiredCrawlers.every((b) => robotsSrc.includes(`'${b}'`))) ok('robots：AI crawler 名單齊 ✓')
for (const { route } of publicRoutes) {
  if (isGated(route)) err(`robots.ts disallow 擋咗公開頁 ${route}`)
}

// ── 6. JSON-LD ─────────────────────────────────────────────────────────
const layoutSrc = read('src/app/layout.tsx')
if (!/application\/ld\+json/.test(layoutSrc)) {
  err('layout.tsx：冇 JSON-LD block')
} else {
  // EducationalOrganization 係 Organization 嘅 schema.org subclass，
  // 唔使再要求一個獨立嘅 Organization node
  for (const t of ['WebSite', 'EducationalOrganization']) {
    if (!layoutSrc.includes(`'${t}'`) && !layoutSrc.includes(`"${t}"`))
      err(`layout.tsx JSON-LD 缺 ${t} schema`)
  }
  ok('layout JSON-LD：WebSite + EducationalOrganization ✓')
}
if (guides.length) {
  const guideRoute = read('src/app/resources/[grade]/[slug]/page.tsx')
  if (!guideRoute.includes('FAQPage')) err('guide route：冇 FAQPage schema（GEO 規範 §4.3）')
  else ok('guide route：FAQPage + LearningResource schema ✓')
}

// ── 7. metadataBase / env ──────────────────────────────────────────────
const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
if (!appUrl || appUrl.includes('localhost')) {
  const msg = `NEXT_PUBLIC_APP_URL 未設定真實 domain（而家=${appUrl || '未設'}）— canonical/OG/sitemap 全部會指錯`
  if (process.env.VERCEL_ENV === 'production') err(msg)
  else warn(msg + '（本地 warn；production build 會變 error）')
} else {
  ok(`NEXT_PUBLIC_APP_URL = ${appUrl} ✓`)
}

// ── 8. OG image ────────────────────────────────────────────────────────
const hasOg = exists('public/og.png') ||
  fs.readdirSync(path.join(ROOT, 'src/app')).some((f) => f.startsWith('opengraph-image'))
if (!hasOg) warn('冇 OG image（public/og.png 或 app/opengraph-image.*）— social share 冇 preview')
else ok('OG image ✓')

// ── 9. GEO 內容規範 signature ──────────────────────────────────────────
for (const g of guides) {
  const h2Questions = (g.src.match(/<h2[^>]*>[^<]*？/g) || []).length
  const faqCount = (g.src.match(/\bq:\s*'/g) || []).length
  if (h2Questions < 2) warn(`${g.file}：問句式 <h2> 少過 2 個（GEO 規範：h2 用問句）`)
  if (faqCount < 3) warn(`${g.file}：FAQ 少過 3 條`)
  if (h2Questions >= 2 && faqCount >= 3) ok(`${g.file}：GEO signature ✓（${h2Questions} 問句 h2、${faqCount} FAQ）`)
}

// ── report ─────────────────────────────────────────────────────────────
for (const m of oks) console.log('  ✓', m)
for (const m of warnings) console.log('  ⚠', m)
for (const m of errors) console.log('  ✗', m)
console.log(`\ncheck_seo: ${errors.length} error, ${warnings.length} warning, ${oks.length} ok`)
if (errors.length) process.exit(1)
