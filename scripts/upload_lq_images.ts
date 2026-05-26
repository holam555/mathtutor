#!/usr/bin/env tsx
/**
 * upload_lq_images.ts — one-shot uploader for LQ seed image placeholders.
 *
 * Context: the LQ seed workflow leaves `image_url = 'local:_lq_input/...'`
 * for any long_questions row that needs a diagram. Those files live on the
 * maintainer's machine under `_lq_input:/` (note: the on-disk folder has a
 * literal colon — the colon is dropped in the seed-side path). The mock-paper
 * print view can't render those until the files are uploaded to Supabase
 * Storage and the rows are updated to point at the storage path.
 *
 * What this script does:
 *   1. Scans supabase/seed_*lq*.sql for every distinct 'local:…' image_url.
 *   2. Resolves each one to an on-disk file (tries both `_lq_input/` and
 *      `_lq_input:/` because the seed path drops the colon).
 *   3. Uploads each file to `past-papers/long-question-images/<sanitised>`
 *      via the Supabase service-role key.
 *   4. Writes `supabase/update_lq_image_urls.sql` with one UPDATE per row
 *      mapping the `local:` placeholder to the new storage path. Run that
 *      file in the Supabase SQL Editor afterwards.
 *
 * Usage:
 *   npx tsx scripts/upload_lq_images.ts                # uses cwd as repo root
 *   npx tsx scripts/upload_lq_images.ts --root ../path # override repo root
 *   npx tsx scripts/upload_lq_images.ts --dry          # plan only, no upload
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY.
 */

import { createClient } from '@supabase/supabase-js'
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import * as path from 'node:path'
import * as dotenv from 'dotenv'

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry') || args.has('-n')

function readArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

// --root        repo containing supabase/seed_*lq*.sql and (usually) .env.local
// --media-root  repo containing _lq_input:/ on disk. Defaults to --root.
//               Useful when running from a worktree whose seeds branch has the
//               LQ seeds, but the gitignored _lq_input:/ folder lives in the
//               primary checkout.
const rootArg = readArg('--root')
const mediaArg = readArg('--media-root')
const repoRoot = rootArg ? path.resolve(rootArg) : process.cwd()
const mediaRoot = mediaArg ? path.resolve(mediaArg) : repoRoot

dotenv.config({ path: path.join(repoRoot, '.env.local') })
dotenv.config({ path: path.join(repoRoot, '.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env. ' +
      'Put them in .env.local at the repo root.'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

const BUCKET = 'past-papers'
const STORAGE_PREFIX = 'long-question-images'
const SEED_GLOB = /^seed_.*lq.*\.sql$/i

/** Scan SQL seeds and pull every distinct 'local:…' image_url value. */
async function collectLocalPaths(): Promise<Set<string>> {
  const seedDir = path.join(repoRoot, 'supabase')
  const entries = await readdir(seedDir)
  const seeds = entries.filter((f) => SEED_GLOB.test(f))
  const found = new Set<string>()
  for (const f of seeds) {
    const text = await readFile(path.join(seedDir, f), 'utf8')
    // Match SQL single-quoted strings starting with local:
    // (no escaped quotes in our seed values, so the simple form is safe)
    const re = /'local:([^']+)'/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      found.add(`local:${m[1]}`)
    }
  }
  return found
}

/**
 * Map a `local:_lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.45.15.png`
 * value to an actual on-disk path. The on-disk folder is `_lq_input:` (with
 * a colon), so we try both spellings.
 */
function resolveDiskPath(localUrl: string): string | null {
  const rel = localUrl.replace(/^local:/, '') // e.g. _lq_input/p4/p4b images/Screenshot...
  // Try both roots (in case user passed --media-root) and both spellings of
  // the input folder (_lq_input/ in the seed value vs _lq_input:/ on disk).
  const roots = mediaRoot !== repoRoot ? [mediaRoot, repoRoot] : [repoRoot]
  const variants = (r: string) => [
    path.join(r, rel),
    path.join(r, rel.replace(/^_lq_input(?!:)/, '_lq_input:')),
  ]
  for (const r of roots) {
    for (const c of variants(r)) {
      if (existsSync(c)) return c
    }
  }
  return null
}

/**
 * Turn a disk path into a stable Storage object key:
 *   _lq_input/p4/p4b images/Screenshot 2026-05-24 at 22.45.15.png
 *   → long-question-images/p4/p4b-images-Screenshot-2026-05-24-at-22-45-15.png
 * Keeping the grade folder (p3/p4/p5/p6) makes the bucket browseable.
 */
function storageKeyFor(localUrl: string): string {
  const rel = localUrl.replace(/^local:_lq_input\/?/, '')
  const parts = rel.split('/').filter(Boolean)
  // First segment is grade folder (p3/p4/p5/p6); rest is collapsed.
  const grade = parts.shift() ?? 'misc'
  const safeRest = parts
    .join('/')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._\-/]/g, '_')
  return `${STORAGE_PREFIX}/${grade}/${safeRest}`
}

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  return 'application/octet-stream'
}

type Outcome =
  | { kind: 'uploaded'; localUrl: string; storageKey: string; bytes: number }
  | { kind: 'already'; localUrl: string; storageKey: string }
  | { kind: 'missing'; localUrl: string; reason: string }
  | { kind: 'error'; localUrl: string; reason: string }

async function uploadOne(localUrl: string): Promise<Outcome> {
  const diskPath = resolveDiskPath(localUrl)
  if (!diskPath) {
    return { kind: 'missing', localUrl, reason: 'file not found on disk' }
  }
  const storageKey = storageKeyFor(localUrl)

  // Skip if the object already exists in the bucket (cheap HEAD via list)
  const folder = storageKey.split('/').slice(0, -1).join('/')
  const filename = storageKey.split('/').pop()!
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 1000 })
  if (existing?.some((e) => e.name === filename)) {
    return { kind: 'already', localUrl, storageKey }
  }

  if (dryRun) {
    return { kind: 'uploaded', localUrl, storageKey, bytes: 0 }
  }

  const buffer = await readFile(diskPath)
  const { error } = await supabase.storage.from(BUCKET).upload(storageKey, buffer, {
    contentType: contentTypeFor(diskPath),
    upsert: false,
  })
  if (error) {
    return { kind: 'error', localUrl, reason: error.message }
  }
  const info = await stat(diskPath)
  return { kind: 'uploaded', localUrl, storageKey, bytes: info.size }
}

async function main() {
  console.log(`▶ Repo root  (seeds + env): ${repoRoot}`)
  console.log(`▶ Media root (_lq_input/): ${mediaRoot}`)
  console.log(`▶ ${dryRun ? 'DRY RUN — no uploads' : 'Live mode — will upload'}`)

  const locals = await collectLocalPaths()
  console.log(`▶ Found ${locals.size} distinct local: paths across LQ seeds`)
  if (locals.size === 0) {
    console.log('Nothing to do.')
    return
  }

  const outcomes: Outcome[] = []
  const localList = Array.from(locals)
  for (let i = 0; i < localList.length; i++) {
    const localUrl = localList[i]
    process.stdout.write(`[${i + 1}/${localList.length}] ${localUrl.slice(0, 80)}… `)
    const o = await uploadOne(localUrl)
    outcomes.push(o)
    console.log(o.kind)
  }

  const updates = outcomes.filter(
    (o): o is Extract<Outcome, { kind: 'uploaded' | 'already' }> =>
      o.kind === 'uploaded' || o.kind === 'already'
  )
  const missing = outcomes.filter((o) => o.kind === 'missing')
  const errors = outcomes.filter((o) => o.kind === 'error')

  console.log('')
  console.log(`✓ uploaded:   ${outcomes.filter((o) => o.kind === 'uploaded').length}`)
  console.log(`• already:    ${outcomes.filter((o) => o.kind === 'already').length}`)
  console.log(`✗ missing:    ${missing.length}`)
  console.log(`✗ errored:    ${errors.length}`)

  if (missing.length) {
    console.log('\n--- MISSING (file not on disk) ---')
    for (const m of missing) console.log('  ' + m.localUrl)
  }
  if (errors.length) {
    console.log('\n--- ERRORED ---')
    for (const e of errors) console.log('  ' + e.localUrl + ' → ' + (e as { reason: string }).reason)
  }

  // Generate UPDATE SQL even in dry-run, so the user can preview.
  const sqlLines: string[] = []
  sqlLines.push('-- update_lq_image_urls.sql')
  sqlLines.push("-- Generated by scripts/upload_lq_images.ts")
  sqlLines.push(`-- ${new Date().toISOString()}`)
  sqlLines.push('-- Replaces local:_lq_input/... placeholders with Supabase Storage paths.')
  sqlLines.push('-- Apply once in the Supabase SQL Editor after the uploads complete.')
  sqlLines.push('')
  sqlLines.push('BEGIN;')
  sqlLines.push('')
  for (const u of updates) {
    const safeLocal = u.localUrl.replace(/'/g, "''")
    const safeKey = u.storageKey.replace(/'/g, "''")
    sqlLines.push(
      `UPDATE long_questions SET image_url = '${safeKey}' WHERE image_url = '${safeLocal}';`
    )
  }
  sqlLines.push('')
  sqlLines.push('COMMIT;')

  const outFile = path.join(repoRoot, 'supabase', 'update_lq_image_urls.sql')
  await writeFile(outFile, sqlLines.join('\n') + '\n', 'utf8')
  console.log(`\n📄 Wrote ${outFile} (${updates.length} UPDATE statements)`)
  console.log('   Apply this in Supabase SQL Editor when the upload looks right.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
