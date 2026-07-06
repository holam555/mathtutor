#!/usr/bin/env node
/**
 * Contact sheet + DB preview generator (Phase 2 building block).
 *
 * Inputs:
 *   --candidates <out/<name>/candidates.json>   from detect.js
 *   --questions  <questions.json>               transcription per band
 *                (array of {band, source_question, question_text,
 *                 question_type, options?, correct_answer, difficulty_tier,
 *                 image_alt_text, group?, flags?: string[]})
 *   --title      <string>                       page title
 *   --out        <file.html>
 *
 * The figure↔question binding comes ONLY from detect.js band assignment.
 * This tool adds the deterministic default-crop rule and renders what the
 * assessment_questions / long_questions rows would look like, with every
 * crop embedded for eyeball confirmation before anything touches a DB.
 *
 * Default-crop rule per band (no human judgment involved):
 *   0 candidates  → no image
 *   1 candidate   → that crop            (confidence AUTO if fully inside band)
 *   ≥3 candidates → composite            (pictorial question; confidence REVIEW)
 *   2 candidates  → composite when the horizontal gap between them is
 *                   < 20% of page width (one assembly, e.g. beaker→box),
 *                   otherwise the larger candidate (side figure + junk)
 *                   (confidence REVIEW either way)
 */
const fs = require('fs')
const path = require('path')

function arg(name, req) {
  const i = process.argv.indexOf('--' + name)
  if (i < 0 || !process.argv[i + 1]) {
    if (req) { console.error(`missing --${name}`); process.exit(1) }
    return null
  }
  return process.argv[i + 1]
}

const candPath = arg('candidates', true)
const qPath = arg('questions', true)
const outPath = arg('out', true)
const title = arg('title') || 'Figure extraction preview'

const cand = JSON.parse(fs.readFileSync(candPath, 'utf8'))
const questions = JSON.parse(fs.readFileSync(qPath, 'utf8'))
const cropDir = path.dirname(candPath)

function b64img(p) {
  if (!fs.existsSync(p)) return null
  const ext = path.extname(p).slice(1).toLowerCase()
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
  return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`
}

// ── default-crop rule ──────────────────────────────────────────────────
function pickCrop(band) {
  const singles = cand.figures.filter(f => f.band === band && !f.composite)
  const composite = cand.figures.find(f => f.band === band && f.composite)
  if (singles.length === 0) return { pick: null, confidence: 'NO_IMAGE', singles, composite }
  if (singles.length === 1) {
    return { pick: singles[0],
      confidence: singles[0].fullyInsideBand ? 'AUTO' : 'REVIEW', singles, composite }
  }
  if (singles.length >= 3) return { pick: composite, confidence: 'REVIEW', singles, composite }
  // exactly 2
  const [a, b] = singles.slice().sort((x, y) => x.box.x - y.box.x)
  const gap = b.box.x - (a.box.x + a.box.w)
  if (gap < cand.width * 0.2) return { pick: composite, confidence: 'REVIEW', singles, composite }
  const larger = singles.reduce((m, f) => f.box.w * f.box.h > m.box.w * m.box.h ? f : m)
  return { pick: larger, confidence: 'REVIEW', singles, composite }
}

const CONF_STYLE = {
  AUTO: 'background:#e6f7ee;color:#1D9E75;border:1px solid #1D9E75',
  REVIEW: 'background:#fdf3e3;color:#B96F10;border:1px solid #EF9F27',
  NO_IMAGE: 'background:#f3f4f6;color:#666;border:1px solid #ccc',
}

const rows = questions.map(q => {
  const { pick, confidence, singles, composite } = pickCrop(q.band)
  const cropB64 = pick ? b64img(path.join(cropDir, `crop_${pick.fid}.png`)) : null
  const anchor = cand.anchors[q.band - 1]
  const alts = cand.figures.filter(f => f.band === q.band && f !== pick)
  const altHtml = alts.map(f => {
    const src = b64img(path.join(cropDir, `crop_${f.fid}.png`))
    return src ? `<div class="alt"><img src="${src}"/><span>${f.fid}${f.composite ? ' (composite)' : ''}</span></div>` : ''
  }).join('')
  const flags = (q.flags || []).map(f => `<li>⚠️ ${f}</li>`).join('')
  const opts = q.options ? `<tr><td>options</td><td>${JSON.stringify(q.options)}</td></tr>` : ''
  return `
  <section class="q">
    <header>
      <b>${q.source_question}</b>
      <span class="conf" style="${CONF_STYLE[confidence]}">${confidence}</span>
      <span class="prov">binding: band ${q.band} · anchor ${anchor ? anchor.aid : '?'} @y=${anchor ? anchor.box.y : '?'} · pick ${pick ? pick.fid : '—'}${pick && pick.composite ? ` = union(${pick.members.join(',')})` : ''} · rule: ${singles.length} candidate(s)</span>
    </header>
    <div class="cols">
      <div class="dbrow">
        <table>
          <tr><td>question_text</td><td>${q.question_text}</td></tr>
          <tr><td>question_type</td><td>${q.question_type}</td></tr>
          ${opts}
          <tr><td>correct_answer</td><td>${q.correct_answer}</td></tr>
          <tr><td>difficulty_tier</td><td>${q.difficulty_tier}</td></tr>
          <tr><td>source_question</td><td>${q.source_question}</td></tr>
          <tr><td>image_url</td><td>${pick ? `local:crop_${pick.fid}.png` : 'NULL'}</td></tr>
          <tr><td>image_alt_text</td><td>${q.image_alt_text || 'NULL'}</td></tr>
          ${q.group ? `<tr><td>group_id</td><td>${q.group}（共用圖）</td></tr>` : ''}
        </table>
        ${flags ? `<ul class="flags">${flags}</ul>` : ''}
      </div>
      <div class="imgcol">
        ${cropB64 ? `<img class="main" src="${cropB64}"/>` : '<p class="noimg">（無圖）</p>'}
        ${altHtml ? `<details><summary>其他 candidates（${alts.length}）</summary><div class="alts">${altHtml}</div></details>` : ''}
      </div>
    </div>
  </section>`
}).join('\n')

const annotated = b64img(path.join(cropDir, 'annotated.png'))
const html = `<!doctype html><meta charset="utf-8"><title>${title}</title>
<style>
body{font-family:-apple-system,'PingFang TC',sans-serif;max-width:1100px;margin:24px auto;padding:0 16px;color:#222}
h1{font-size:20px} .note{color:#666;font-size:13px}
.q{border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin:18px 0}
.q header{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.conf{font-size:12px;padding:2px 10px;border-radius:99px;font-weight:600}
.prov{font-size:11px;color:#888}
.cols{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
.dbrow{flex:1 1 420px}
.dbrow table{border-collapse:collapse;width:100%;font-size:13px}
.dbrow td{border:1px solid #eee;padding:5px 8px;vertical-align:top}
.dbrow td:first-child{color:#888;white-space:nowrap;width:120px;font-family:ui-monospace,monospace;font-size:12px}
.imgcol{flex:1 1 320px} .imgcol img.main{max-width:100%;border:1px solid #ddd;border-radius:8px}
.alts{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.alt img{max-height:110px;border:1px solid #eee;border-radius:6px;display:block}
.alt span{font-size:11px;color:#999}
.flags{margin:10px 0 0;padding-left:18px;font-size:13px;color:#B96F10}
details summary{font-size:12px;color:#4A90E2;cursor:pointer;margin-top:8px}
.annotated img{max-width:100%;border:1px solid #ddd;border-radius:8px}
</style>
<h1>${title}</h1>
<p class="note">Binding 全部嚟自 detect.js 幾何計算（band assignment）；default crop 由規則揀（見 contact_sheet.js 頭注釋）。
AUTO = band 內唯一 candidate；REVIEW = 多 candidate / composite，入庫前請肉眼確認。</p>
${rows}
<details class="annotated"><summary>成頁 annotated overlay（binding 證據）</summary>${annotated ? `<img src="${annotated}"/>` : ''}</details>
`
fs.writeFileSync(outPath, html)
console.log(`wrote ${outPath} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(1)} MB)`)
