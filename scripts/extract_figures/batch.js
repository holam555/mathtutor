#!/usr/bin/env node
/**
 * Batch runner — run detect.js over every page image in a folder and
 * build one combined contact sheet for review.
 *
 * Usage:
 *   node scripts/extract_figures/batch.js <folder-or-pdf> [--out <dir>] [--title <t>]
 *
 * PDF input: pages are rendered to PNG at 150 dpi via pdftoppm (poppler,
 * `brew install poppler`) into <out>/_pages/ and processed from there.
 *
 * Outputs under --out (default: <folder>/_extract_out):
 *   <page>/candidates.json, crops, annotated.png    per page (from detect.js)
 *   <page>/questions.json                           transcription STUB if absent
 *   index.json                                      all pages summary
 *   contact_sheet.html                              combined review sheet
 *
 * Path A workflow (no external API):
 *   1. run batch.js               → stubs + sheet with crops only
 *   2. Claude fills in each questions.json (transcription per band)
 *   3. re-run batch.js            → sheet now shows DB-row previews
 *   4. human ticks crops in the sheet → Export selection → selection.json
 *   5. node gen_seed.js …         → seed SQL + upload manifest
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { renderSheet } = require('./contact_sheet')

const args = process.argv.slice(2)
let input = args[0]
if (!input || !fs.existsSync(input)) {
  console.error('usage: node batch.js <folder-or-pdf> [--out <dir>] [--title <t>]')
  process.exit(1)
}
const flag = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null }
const isPdf = /\.pdf$/i.test(input)
const OUT = flag('out') ||
  (isPdf ? input.replace(/\.pdf$/i, '') + '_extract_out' : path.join(input, '_extract_out'))
const TITLE = flag('title') || path.basename(input)

let folder = input
if (isPdf) {
  folder = path.join(OUT, '_pages')
  fs.mkdirSync(folder, { recursive: true })
  try {
    execFileSync('pdftoppm', ['-png', '-r', '150', input, path.join(folder, 'page')])
  } catch (e) {
    console.error('pdftoppm failed — install poppler: brew install poppler')
    process.exit(1)
  }
  console.log(`PDF → ${fs.readdirSync(folder).length} page PNGs (150 dpi) in ${folder}`)
}

const exts = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const images = fs.readdirSync(folder)
  .filter(f => exts.has(path.extname(f).toLowerCase()))
  .sort()
if (!images.length) { console.error('no page images found in ' + folder); process.exit(1) }

const pages = []
for (const img of images) {
  const imgPath = path.join(folder, img)
  execFileSync('node', [path.join(__dirname, 'detect.js'), imgPath, '--out', OUT],
    { stdio: ['ignore', 'ignore', 'inherit'] })
  const name = img.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_')
  const pageDir = path.join(OUT, name)
  const cand = JSON.parse(fs.readFileSync(path.join(pageDir, 'candidates.json'), 'utf8'))

  // transcription stub: one entry per detected band, for Claude to fill
  const qPath = path.join(pageDir, 'questions.json')
  if (!fs.existsSync(qPath)) {
    const stub = cand.anchors.map((a, i) => ({
      band: i + 1,
      source_question: '',
      question_text: '',
      question_type: 'fill_in_number | multiple_choice',
      options: null,
      correct_answer: '',
      difficulty_tier: 'basic | enhancement | advanced',
      unit_number: null,
      lesson_number: null,
      image_alt_text: '',
      flags: [],
    }))
    fs.writeFileSync(qPath, JSON.stringify(stub, null, 2))
  }
  const questions = JSON.parse(fs.readFileSync(qPath, 'utf8'))
  const filled = questions.filter(q => q.question_text)
  pages.push({ image: img, name, dir: pageDir, cand, questions: filled })
  console.log(`${img}: ${cand.anchors.length} anchors, ${cand.figures.length} candidates, ${filled.length} transcribed`)
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(
  pages.map(p => ({ image: p.image, name: p.name })), null, 2))

fs.writeFileSync(path.join(OUT, 'contact_sheet.html'), renderSheet(TITLE, pages))
console.log(`\nwrote ${path.join(OUT, 'contact_sheet.html')}`)
console.log(pages.some(p => !p.questions.length)
  ? 'NOTE: some pages have empty questions.json stubs — fill them in and re-run for DB-row previews.'
  : 'All pages transcribed — review the sheet, tick crops, Export selection, then run gen_seed.js.')
