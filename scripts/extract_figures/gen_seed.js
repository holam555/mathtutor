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
 * crop per question; a value can also be {box:{x,y,w,h}} from the sheet's
 * manual crop editor — the crop is cut here with sharp). Emits:
 *   seed_<paper>.sql        assessment_questions rows
 *   seed_<paper>_lq.sql     long_questions rows (only when some exist)
 *   upload_manifest.json    local crop file → suggested storage path,
 *                           for scripts/upload_lq_images.ts
 * All idempotent via source_paper + source_question.
 *
 * Routing (per question, questions.json `route` field):
 *   "aq" (default)  → assessment_questions (auto-graded, app practice)
 *   "lq"            → long_questions (verbatim model_answer, mock-paper LQ
 *                     section — student writes on paper and 核對)
 *   "both"          → one row in EACH table (列式計算題: answer-only MC/fill
 *                     for the app + full working as the LQ model answer;
 *                     user decision 2026-07-06)
 *
 * Validation (hard errors, nothing written):
 *   - fill_in_number answers must be pure number / decimal / fraction /
 *     space-form mixed number (1 5/8). Anything with Chinese units or
 *     other text MUST be multiple_choice (user policy 2026-07-06).
 *   - C6 mobile chars: fill_in_number answer can't contain : > < = %
 *   - multiple_choice needs 4 distinct "A. …"–"D. …" options and
 *     correct_answer must be one of them
 *   - unit_number required (topic mapping); route lq/both needs model_answer
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const sharp = require('sharp')

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
const LQ_SQL_PATH = SQL_PATH.replace(/\.sql$/, '_lq.sql')

const index = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'index.json'), 'utf8'))

const NUMERIC = /^\d+(\.\d+)?$|^\d+\/\d+$|^\d+ \d+\/\d+$/
const MOBILE_BAD = /[:><=%]/
const esc = s => String(s).replace(/'/g, "''")

const errors = []
const warnings = []
const aqRows = []
const lqRows = []
const manifest = []
const customCrops = [] // manual boxes from the sheet, cropped before output
const groupIds = new Map()

// resolve the ticked crop (fid string or manual {box}) → local: placeholder
function resolveImage(q, fid, dir, id) {
  if (!fid) return null
  const sq = (q.source_question || 'band' + q.band).replace(/[^\w-]/g, '_')
  const storagePath = `question-images/${SOURCE_PAPER}_${sq}.png`
  let cropFile
  if (typeof fid === 'object' && fid.box) {
    const cand = JSON.parse(fs.readFileSync(path.join(dir, 'candidates.json'), 'utf8'))
    if (!cand.image || !fs.existsSync(cand.image)) {
      errors.push(`${id}: 手動 crop 但原頁圖唔存在 (${cand.image})`)
      return null
    }
    cropFile = path.join(dir, `crop_custom_${sq}.png`)
    customCrops.push({ image: cand.image, box: fid.box, file: cropFile,
      W: cand.width, H: cand.height })
  } else {
    cropFile = path.join(dir, `crop_${fid}.png`)
    if (!fs.existsSync(cropFile)) {
      errors.push(`${id}: 揀咗 ${fid} 但 crop 檔案唔存在`)
      return null
    }
  }
  const placeholder = `local:${path.relative(OUT_DIR, cropFile)}`
  manifest.push({ placeholder, file: cropFile, storage_path: storagePath })
  return placeholder
}

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

    const route = q.route || 'aq'
    if (!['aq', 'lq', 'both'].includes(route)) {
      errors.push(`${id}: route "${route}" 無效（aq / lq / both）`)
      continue
    }
    if ((route === 'lq' || route === 'both') && !q.model_answer)
      errors.push(`${id}: route=${route} 需要 model_answer（答案紙逐字 working）`)

    const imageUrl = resolveImage(q, fid, dir, id)

    // figure↔text cross-check (caught a real mis-tick: Q29 got Q30's
    // circles). Warning not error — some pictorial questions legitimately
    // don't say 「圖」, and some 圖-mentions are about a skipped drawing.
    const mentionsFigure = /[右左上下如及附]圖|下面的圖|看圖/.test(q.question_text)
    // grouped sub-questions share the figure their (a) part introduces —
    // only the standalone case is suspicious
    if (imageUrl && !mentionsFigure && !q.group)
      warnings.push(`${id}: 有 crop 但題幹冇提「圖」— 確認唔係配錯（Q29 案例）`)
    if (!imageUrl && mentionsFigure)
      warnings.push(`${id}: 題幹提到「圖」但揀咗無圖 — 確認唔係漏咗`)

    if (route === 'lq' || route === 'both') {
      // human-marked freeform — no keyboard/MC constraints
      lqRows.push({ ...q, _imageUrl: imageUrl })
    }
    if (route === 'aq' || route === 'both') {
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
      let groupId = null, subOrder = 1
      if (q.group) {
        if (!groupIds.has(q.group)) groupIds.set(q.group, { id: crypto.randomUUID(), n: 0 })
        const g = groupIds.get(q.group)
        g.n += 1
        groupId = g.id
        subOrder = g.n
      }
      aqRows.push({ ...q, _imageUrl: imageUrl, _groupId: groupId, _subOrder: subOrder })
    }
  }
}

if (!aqRows.length && !lqRows.length) {
  console.error('selection 冇對應到任何已 transcribe 嘅題目')
  process.exit(1)
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} 個 validation 錯誤 — SQL 未生成：\n` + errors.map(e => '  - ' + e).join('\n'))
  process.exit(1)
}
if (warnings.length) {
  console.error(`\n⚠ ${warnings.length} 個 warning（SQL 照出，但請過目）：\n` + warnings.map(w => '  - ' + w).join('\n'))
}

const topicSubquery = q => q.lesson_number
  ? `(SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = ${GRADE} AND u.unit_number = ${q.unit_number} AND t.lesson_number = ${q.lesson_number} LIMIT 1)`
  : `(SELECT t.id FROM curriculum_topics t JOIN curriculum_units u ON u.id = t.unit_id
     WHERE u.grade = ${GRADE} AND u.unit_number = ${q.unit_number} ORDER BY t.lesson_number LIMIT 1)`

const header = (n, extra) => `-- Seed: ${SOURCE_PAPER} — generated by scripts/extract_figures/gen_seed.js
-- ${n} rows${extra}. Apply in Supabase SQL Editor.
-- Idempotent via source_paper + source_question.
-- After applying: upload images per upload_manifest.json, then UPDATE image_url.
`

let aqSql = null
if (aqRows.length) {
  const values = aqRows.map(q => `  (
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
  aqSql = `${header(aqRows.length, ' → assessment_questions')}
BEGIN;

DELETE FROM assessment_questions
WHERE source_paper = '${esc(SOURCE_PAPER)}'
  AND source_question IN (${aqRows.map(q => `'${esc(q.source_question)}'`).join(', ')});

INSERT INTO assessment_questions
  (topic_id, question_text, question_type, options, correct_answer,
   difficulty_tier, group_id, sub_order, source_paper, source_question,
   image_url, image_alt_text, is_active)
VALUES
${values};

COMMIT;
`
}

let lqSql = null
if (lqRows.length) {
  const values = lqRows.map(q => `  (
    ${topicSubquery(q)},
    '${esc(q.question_text)}',
    '${esc(q.model_answer)}',
    '${q.difficulty_tier}',
    ${q._imageUrl ? `'${esc(q._imageUrl)}'` : 'NULL'},
    '${esc(SOURCE_PAPER)}', '${esc(q.source_question)}',
    ${q.notes ? `'${esc(q.notes)}'` : 'NULL'},
    true
  )`).join(',\n')
  lqSql = `${header(lqRows.length, ' → long_questions（mock-paper LQ，model_answer 逐字）')}
BEGIN;

DELETE FROM long_questions
WHERE source_paper = '${esc(SOURCE_PAPER)}'
  AND source_question IN (${lqRows.map(q => `'${esc(q.source_question)}'`).join(', ')});

INSERT INTO long_questions
  (topic_id, question_text, model_answer, difficulty_tier,
   image_url, source_paper, source_question, notes, is_active)
VALUES
${values};

COMMIT;
`
}

;(async () => {
  for (const cc of customCrops) {
    const left = Math.max(0, Math.min(Math.round(cc.box.x), cc.W - 10))
    const top = Math.max(0, Math.min(Math.round(cc.box.y), cc.H - 10))
    await sharp(cc.image).flatten({ background: '#ffffff' })
      .extract({ left, top,
        width: Math.min(cc.W - left, Math.round(cc.box.w)),
        height: Math.min(cc.H - top, Math.round(cc.box.h)) })
      .png().toFile(cc.file)
  }
  if (aqSql) fs.writeFileSync(SQL_PATH, aqSql)
  if (lqSql) fs.writeFileSync(LQ_SQL_PATH, lqSql)
  fs.writeFileSync(path.join(OUT_DIR, 'upload_manifest.json'), JSON.stringify(manifest, null, 2))
  if (aqSql) console.log(`✓ ${aqRows.length} 題 (assessment_questions) → ${SQL_PATH}`)
  if (lqSql) console.log(`✓ ${lqRows.length} 題 (long_questions) → ${LQ_SQL_PATH}`)
  if (customCrops.length) console.log(`✓ ${customCrops.length} 個手動 crop 已裁`)
  console.log(`✓ ${manifest.length} 張圖 → ${path.join(OUT_DIR, 'upload_manifest.json')}`)
  console.log('下一步：1) 檢查 SQL  2) Supabase SQL Editor apply  3) 跑 question-bank-check skill  4) 上載圖片再 UPDATE image_url')
})().catch(e => { console.error(e); process.exit(1) })
