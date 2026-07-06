#!/usr/bin/env node
/**
 * Seed SQL generator — the ONLY step that produces DB-bound output, and it
 * only consumes what a human explicitly ticked in the contact sheet.
 *
 * Usage:
 *   node scripts/extract_figures/gen_seed.js \
 *     --out-dir <folder>/_extract_out --selection selection.json \
 *     --grade 6 --source-paper p6_myschool_2026 [--sql seed.sql]
 *
 * Reads per-page questions.json (transcription) + selection.json (ticked
 * crop per question). Emits:
 *   seed SQL          idempotent via source_paper + source_question,
 *                     topic looked up by grade + unit_number (+ lesson),
 *                     image_url = local: placeholder
 *   upload_manifest.json   local crop file → suggested storage path,
 *                     for scripts/upload_lq_images.ts
 *
 * Validation (hard errors, SQL not written):
 *   - fill_in_number answers must be pure number / decimal / fraction /
 *     space-form mixed number (1 5/8). Anything with Chinese units or
 *     other text MUST be multiple_choice (user policy 2026-07-06).
 *   - C6 mobile chars: fill_in_number answer can't contain : > < = %
 *   - multiple_choice needs 4 distinct "A. …"–"D. …" options and
 *     correct_answer must be one of them
 *   - unit_number required (topic mapping)
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const arg = (name, req) => {
  const i = process.argv.indexOf('--' + name)
  if (i < 0 || !process.argv[i + 1]) {
    if (req) { console.error(`missing --${name}`); process.exit(1) }
    return null
  }
  return process.argv[i + 1]
}

const OUT_DIR = arg('out-dir', true)
const selection = JSON.parse(fs.readFileSync(arg('selection', true), 'utf8'))
const GRADE = parseInt(arg('grade', true))
const SOURCE_PAPER = arg('source-paper', true)
const SQL_PATH = arg('sql') || path.join(OUT_DIR, `seed_${SOURCE_PAPER}.sql`)

const index = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'index.json'), 'utf8'))

const NUMERIC = /^\d+(\.\d+)?$|^\d+\/\d+$|^\d+ \d+\/\d+$/
const MOBILE_BAD = /[:><=%]/
const esc = s => String(s).replace(/'/g, "''")

const errors = []
const rows = []
const manifest = []
const groupIds = new Map()

for (const pg of index) {
  const dir = path.join(OUT_DIR, pg.name)
  const questions = JSON.parse(fs.readFileSync(path.join(dir, 'questions.json'), 'utf8'))
    .filter(q => q.question_text)
  for (const q of questions) {
    const key = `${pg.name}#${q.source_question || 'band' + q.band}`
    if (!(key in selection)) continue // not reviewed → not seeded
    const fid = selection[key]
    const id = `${pg.image} ${q.source_question || 'band' + q.band}`

    if (!q.source_question) errors.push(`${id}: source_question 空`)
    if (!q.unit_number) errors.push(`${id}: unit_number 空（topic mapping 需要）`)
    if (!['basic', 'enhancement', 'advanced'].includes(q.difficulty_tier))
      errors.push(`${id}: difficulty_tier 無效 (${q.difficulty_tier})`)

    if (q.question_type === 'fill_in_number') {
      if (MOBILE_BAD.test(q.correct_answer))
        errors.push(`${id}: C6 — 答案 "${q.correct_answer}" 含手機鍵盤冇嘅字元`)
      if (!NUMERIC.test(q.correct_answer))
        errors.push(`${id}: 答案 "${q.correct_answer}" 唔係純數字/分數 → 必須轉 multiple_choice（政策 2026-07-06）`)
    } else if (q.question_type === 'multiple_choice') {
      const opts = q.options || []
      if (opts.length !== 4 || !opts.every((o, i) => o.startsWith('ABCD'[i] + '. ')))
        errors.push(`${id}: MC 需要 4 個 "A. …"–"D. …" options`)
      if (!opts.includes(q.correct_answer))
        errors.push(`${id}: correct_answer 唔喺 options 入面`)
      if (new Set(opts.map(o => o.slice(3))).size !== opts.length)
        errors.push(`${id}: options 有重複`)
    } else {
      errors.push(`${id}: question_type "${q.question_type}" 唔接受（只可 fill_in_number / multiple_choice）`)
    }

    let groupId = null
    if (q.group) {
      if (!groupIds.has(q.group)) groupIds.set(q.group, { id: crypto.randomUUID(), n: 0 })
      const g = groupIds.get(q.group)
      g.n += 1
      groupId = g.id
      q._subOrder = g.n
    }

    let imageUrl = null
    if (fid) {
      const cropFile = path.join(dir, `crop_${fid}.png`)
      if (!fs.existsSync(cropFile)) {
        errors.push(`${id}: 揀咗 ${fid} 但 crop 檔案唔存在`)
      } else {
        const storagePath = `question-images/${SOURCE_PAPER}_${q.source_question}.png`
        imageUrl = `local:${path.relative(OUT_DIR, cropFile)}`
        manifest.push({ placeholder: imageUrl, file: cropFile, storage_path: storagePath })
      }
    }
    rows.push({ ...q, _imageUrl: imageUrl, _groupId: groupId })
  }
}

if (!rows.length) { console.error('selection 冇對應到任何已 transcribe 嘅題目'); process.exit(1) }
if (errors.length) {
  console.error(`\n✗ ${errors.length} 個 validation 錯誤 — SQL 未生成：\n` + errors.map(e => '  - ' + e).join('\n'))
  process.exit(1)
}

const topicSubquery = q => q.lesson_number
  ? `(SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = ${GRADE} AND u.unit_number = ${q.unit_number} AND t.lesson_number = ${q.lesson_number} LIMIT 1)`
  : `(SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = ${GRADE} AND u.unit_number = ${q.unit_number} ORDER BY t.lesson_number LIMIT 1)`

const values = rows.map(q => `  (
    ${topicSubquery(q)},
    '${esc(q.question_text)}',
    '${q.question_type}',
    ${q.options ? `'${esc(JSON.stringify(q.options))}'::jsonb` : 'NULL'},
    '${esc(q.correct_answer)}',
    '${q.difficulty_tier}',
    ${q._groupId ? `'${q._groupId}'` : 'NULL'}, ${q._subOrder || 1},
    '${esc(SOURCE_PAPER)}', '${esc(q.source_question)}',
    ${q._imageUrl ? `'${esc(q._imageUrl)}'` : 'NULL'},
    ${q.image_alt_text ? `'${esc(q.image_alt_text)}'` : 'NULL'},
    true
  )`).join(',\n')

const sql = `-- Seed: ${SOURCE_PAPER} — generated by scripts/extract_figures/gen_seed.js
-- ${rows.length} questions, ${manifest.length} with images (local: placeholders).
-- Apply in Supabase SQL Editor. Idempotent via source_paper + source_question.
-- After applying: npx tsx scripts/upload_lq_images.ts (see upload_manifest.json)

BEGIN;

DELETE FROM assessment_questions
WHERE source_paper = '${esc(SOURCE_PAPER)}'
  AND source_question IN (${rows.map(q => `'${esc(q.source_question)}'`).join(', ')});

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer,
   difficulty_tier, group_id, sub_order, source_paper, source_question,
   image_url, image_alt_text, is_active)
VALUES
${values};

COMMIT;
`
fs.writeFileSync(SQL_PATH, sql)
fs.writeFileSync(path.join(OUT_DIR, 'upload_manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`✓ ${rows.length} 題 → ${SQL_PATH}`)
console.log(`✓ ${manifest.length} 張圖 → ${path.join(OUT_DIR, 'upload_manifest.json')}`)
console.log('下一步：1) 檢查 SQL  2) Supabase SQL Editor apply  3) 跑 question-bank-check skill  4) 上載圖片再 UPDATE image_url')
