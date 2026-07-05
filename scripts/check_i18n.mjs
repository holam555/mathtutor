#!/usr/bin/env node
/**
 * i18n consistency checker for the EN/中 toggle (src/lib/i18n/).
 *
 * Checks (hard failures, exit 1):
 *   1. dict.ts has no duplicate keys (later keys silently win in JS).
 *   2. Every `t('...')` / `translate('...')` Chinese string literal in
 *      src/ has a matching dict.ts entry — a missing key doesn't crash
 *      (the fallback returns Chinese) but silently breaks EN mode.
 *
 * Report (informational, never fails):
 *   3. Files containing Chinese JSX text NOT wrapped in t()/translate(),
 *      so future work can see what chrome is still untranslated.
 *
 * Conventions this enforces are documented in docs/i18n_conventions.md.
 *
 * Usage: node scripts/check_i18n.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DICT_PATH = 'src/lib/i18n/dict.ts'
const SRC_DIRS = ['src/app', 'src/components']

// Files where raw Chinese is INTENTIONAL — do not report them:
const SKIP_UNWRAPPED = [
  // Printable exam sheets: real exam papers for HK students, stay Chinese.
  'src/components/ExamPaperSheet.tsx',
  // 又-notation parsing for mixed numbers — content logic, not chrome.
  'src/components/FractionDisplay.tsx',
]

const CJK = /[一-鿿]/

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return walk(p)
    return p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : []
  })
}

// ── 1. Duplicate dict keys ──────────────────────────────────────────────
const dictSrc = readFileSync(DICT_PATH, 'utf8')
const keyRe = /^\s*'((?:[^'\\]|\\.)*)':/gm
const dictKeys = []
for (const m of dictSrc.matchAll(keyRe)) dictKeys.push(m[1].replace(/\\'/g, "'"))
const seen = new Set()
const dups = dictKeys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)))
const dictSet = new Set(dictKeys)

// ── 2. Every t()/translate() literal exists in dict ────────────────────
// Matches: t('中文...') / translate('中文...') / translate('中文...', lang)
const callRe = /\b(?:t|translate)\(\s*'((?:[^'\\]|\\.)*)'\s*[,)]/g
const missing = [] // { file, key }
const unwrapped = new Map() // file -> count

for (const dir of SRC_DIRS) {
  for (const file of walk(dir)) {
    const src = readFileSync(file, 'utf8')

    for (const m of src.matchAll(callRe)) {
      const key = m[1].replace(/\\'/g, "'")
      if (CJK.test(key) && !dictSet.has(key)) missing.push({ file, key })
    }

    if (SKIP_UNWRAPPED.includes(file)) continue
    let count = 0
    for (const rawLine of src.split('\n')) {
      const line = rawLine.trim()
      if (!CJK.test(line)) continue
      if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue
      // Wrapped, or intentional bilingual ternary/template with lang check
      if (/\b(?:t|translate)\(/.test(line)) continue
      if (/lang === '(en|zh)'/.test(line)) continue
      // Label maps whose values get wrapped at render time
      if (/^(\d+|\w+|'[^']*'|label|text|title|key):\s*'/.test(line)) continue
      count++
    }
    if (count > 0) unwrapped.set(file, count)
  }
}

// ── Output ──────────────────────────────────────────────────────────────
let failed = false

if (dups.length) {
  failed = true
  console.error(`✗ Duplicate dict keys (${dups.length}):`)
  for (const k of dups) console.error(`    '${k}'`)
} else {
  console.log(`✓ dict.ts: ${dictKeys.length} keys, no duplicates`)
}

if (missing.length) {
  failed = true
  console.error(`✗ t()/translate() keys missing from dict.ts (${missing.length}) — EN mode silently shows Chinese:`)
  for (const { file, key } of missing) console.error(`    ${file}: '${key}'`)
} else {
  console.log('✓ every t()/translate() literal has a dict entry')
}

if (unwrapped.size) {
  console.log(`\nℹ Unwrapped Chinese text (informational — likely untranslated chrome or intentional zh-branches):`)
  const sorted = [...unwrapped.entries()].sort((a, b) => b[1] - a[1])
  for (const [file, count] of sorted) console.log(`    ${String(count).padStart(3)}  ${file}`)
}

process.exit(failed ? 1 : 0)
