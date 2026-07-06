#!/usr/bin/env node
/**
 * Contact sheet + DB preview renderer.
 *
 * As a module: renderSheet(title, pages) — used by batch.js.
 * As a CLI (single page):
 *   node contact_sheet.js --candidates <candidates.json> --questions <q.json>
 *                         [--title <t>] --out <file.html>
 *
 * The figure↔question binding comes ONLY from detect.js band assignment.
 * This renderer adds the deterministic default-crop rule, DB-row preview,
 * and radio selection per question. "Export selection" downloads a
 * selection.json consumed by gen_seed.js — nothing reaches a DB without
 * that explicit human tick.
 *
 * Default-crop rule per band (no human judgment involved):
 *   0 candidates  → no image
 *   1 candidate   → that crop            (AUTO if fully inside band)
 *   ≥3 candidates → composite            (pictorial question; REVIEW)
 *   2 candidates  → composite when the horizontal gap between them is
 *                   < 20% of page width (one assembly, e.g. beaker→box),
 *                   otherwise the larger candidate (REVIEW either way)
 */
const fs = require('fs')
const path = require('path')

function b64img(p) {
  if (!fs.existsSync(p)) return null
  const ext = path.extname(p).slice(1).toLowerCase()
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
  return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`
}

function pickCrop(cand, band) {
  const singles = cand.figures.filter(f => f.band === band && !f.composite)
  const composite = cand.figures.find(f => f.band === band && f.composite)
  if (singles.length === 0) return { pick: null, confidence: 'NO_IMAGE', singles, composite }
  if (singles.length === 1) {
    return { pick: singles[0],
      confidence: singles[0].fullyInsideBand ? 'AUTO' : 'REVIEW', singles, composite }
  }
  if (singles.length >= 3) return { pick: composite, confidence: 'REVIEW', singles, composite }
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

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')

function renderQuestion(page, q) {
  const cand = page.cand
  const { pick, confidence, singles } = pickCrop(cand, q.band)
  const anchor = cand.anchors[q.band - 1]
  const key = `${page.name}#${q.source_question || 'band' + q.band}`
  const bandFigs = cand.figures.filter(f => f.band === q.band)
  const choiceHtml = bandFigs.map(f => {
    const src = b64img(path.join(page.dir, `crop_${f.fid}.png`))
    if (!src) return ''
    const checked = pick && f.fid === pick.fid ? 'checked' : ''
    return `<label class="choice"><input type="radio" name="${esc(key)}" value="${f.fid}" ${checked}/>
      <img src="${src}"/><span>${f.fid}${f.composite ? ' (composite)' : ''}${f.sharedAbove ? ' [題組共用?]' : ''}</span></label>`
  }).join('') +
    `<label class="choice noimg-choice"><input type="radio" name="${esc(key)}" value="" ${pick ? '' : 'checked'}/><span>無圖</span></label>`
  const flags = (q.flags || []).map(f => `<li>⚠️ ${esc(f)}</li>`).join('')
  const opts = q.options ? `<tr><td>options</td><td>${esc(JSON.stringify(q.options))}</td></tr>` : ''
  const topic = q.unit_number
    ? `<tr><td>topic</td><td>U${q.unit_number}${q.lesson_number ? ` L${q.lesson_number}` : ''}</td></tr>` : ''
  return `
  <section class="q">
    <header>
      <b>${esc(q.source_question || '(band ' + q.band + ')')}</b>
      <span class="conf" style="${CONF_STYLE[confidence]}">${confidence}</span>
      <span class="prov">${esc(page.image)} · band ${q.band} · anchor ${anchor ? anchor.aid : '?'}@y=${anchor ? anchor.box.y : '?'} · default ${pick ? pick.fid : '無圖'}${pick && pick.composite ? ` = union(${pick.members.join(',')})` : ''} · ${singles.length} candidate(s)</span>
    </header>
    <div class="cols">
      <div class="dbrow"><table>
        <tr><td>question_text</td><td>${esc(q.question_text) || '<i>（未transcribe）</i>'}</td></tr>
        <tr><td>question_type</td><td>${esc(q.question_type)}</td></tr>
        ${opts}
        <tr><td>correct_answer</td><td>${esc(q.correct_answer)}</td></tr>
        <tr><td>difficulty_tier</td><td>${esc(q.difficulty_tier)}</td></tr>
        ${topic}
        <tr><td>image_alt_text</td><td>${esc(q.image_alt_text) || 'NULL'}</td></tr>
        ${q.group ? `<tr><td>group_id</td><td>${esc(q.group)}（共用圖）</td></tr>` : ''}
      </table>
      ${flags ? `<ul class="flags">${flags}</ul>` : ''}</div>
      <div class="imgcol"><div class="choices">${choiceHtml}</div></div>
    </div>
  </section>`
}

function renderPageCropsOnly(page) {
  // no transcription yet — show bindings so the reviewer sees progress
  const items = page.cand.figures.map(f => {
    const src = b64img(path.join(page.dir, `crop_${f.fid}.png`))
    return src ? `<div class="alt"><img src="${src}"/><span>${f.fid} → band ${f.band ?? '?'}</span></div>` : ''
  }).join('')
  return `<section class="q pending"><header><b>${esc(page.image)}</b>
    <span class="prov">${page.cand.anchors.length} anchors — questions.json 未填，暫時只顯示 crops</span></header>
    <div class="alts">${items}</div></section>`
}

function renderSheet(title, pages) {
  const body = pages.map(page =>
    `<h2>${esc(page.image)}</h2>` +
    (page.questions.length
      ? page.questions.map(q => renderQuestion(page, q)).join('\n')
      : renderPageCropsOnly(page)) +
    `<details class="annotated"><summary>annotated page（binding 證據）</summary>
      <img src="${b64img(path.join(page.dir, 'annotated.png')) || ''}"/></details>`
  ).join('\n')

  return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title>
<style>
body{font-family:-apple-system,'PingFang TC',sans-serif;max-width:1150px;margin:24px auto;padding:0 16px;color:#222}
h1{font-size:20px} h2{font-size:15px;color:#555;margin-top:32px} .note{color:#666;font-size:13px}
.q{border:1px solid #e5e7eb;border-radius:14px;padding:16px;margin:14px 0}
.q.pending{background:#fafafa}
.q header{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.conf{font-size:12px;padding:2px 10px;border-radius:99px;font-weight:600}
.prov{font-size:11px;color:#888}
.cols{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
.dbrow{flex:1 1 420px}
.dbrow table{border-collapse:collapse;width:100%;font-size:13px}
.dbrow td{border:1px solid #eee;padding:5px 8px;vertical-align:top}
.dbrow td:first-child{color:#888;white-space:nowrap;width:110px;font-family:ui-monospace,monospace;font-size:12px}
.imgcol{flex:1 1 340px}
.choices{display:flex;flex-direction:column;gap:8px}
.choice{display:flex;gap:8px;align-items:flex-start;border:1px solid #eee;border-radius:8px;padding:6px;cursor:pointer}
.choice:has(input:checked){border-color:#1D9E75;background:#f2fbf7}
.choice img{max-width:280px;max-height:170px;object-fit:contain}
.choice span{font-size:11px;color:#777}
.alts{display:flex;gap:10px;flex-wrap:wrap}
.alt img{max-height:130px;border:1px solid #eee;border-radius:6px;display:block}
.alt span{font-size:11px;color:#999}
.flags{margin:10px 0 0;padding-left:18px;font-size:13px;color:#B96F10}
details summary{font-size:12px;color:#4A90E2;cursor:pointer;margin-top:8px}
.annotated img{max-width:100%;border:1px solid #ddd;border-radius:8px}
#exportbar{position:sticky;top:0;background:#fff;border-bottom:1px solid #eee;padding:10px 0;z-index:9}
#exportbar button{background:#1D9E75;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-size:14px;cursor:pointer}
</style>
<div id="exportbar"><button onclick="exportSelection()">⬇︎ Export selection.json</button>
<span class="note">剔好每題嘅 crop（或「無圖」）→ Export → 攞住 selection.json 行 gen_seed.js</span></div>
<h1>${esc(title)}</h1>
<p class="note">Binding 全部嚟自 detect.js 幾何計算；default 揀 crop 係規則（見 contact_sheet.js 注釋）。
AUTO = band 內唯一 candidate；REVIEW = 多 candidate/composite — 入庫前逐題肉眼確認。</p>
${body}
<script>
function exportSelection(){
  const sel = {}
  document.querySelectorAll('input[type=radio]:checked').forEach(r => { sel[r.name] = r.value || null })
  const blob = new Blob([JSON.stringify(sel, null, 2)], {type: 'application/json'})
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = 'selection.json'; a.click()
}
</script>`
}

module.exports = { renderSheet, pickCrop }

// ── CLI (single page) ──────────────────────────────────────────────────
if (require.main === module) {
  const arg = (name, req) => {
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
  const questions = JSON.parse(fs.readFileSync(qPath, 'utf8')).filter(q => q.question_text)
  const page = {
    image: path.basename(cand.image || candPath),
    name: path.basename(path.dirname(candPath)),
    dir: path.dirname(candPath),
    cand, questions,
  }
  fs.writeFileSync(outPath, renderSheet(title, [page]))
  console.log(`wrote ${outPath} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(1)} MB)`)
}
