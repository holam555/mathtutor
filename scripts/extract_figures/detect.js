#!/usr/bin/env node
/**
 * Phase 1 experiment — CV figure detection + question-anchor detection +
 * geometric binding on a past-paper page image.
 *
 * Zero AI. Outputs:
 *   out/<name>/candidates.json   — anchors, figure candidates, bindings
 *   out/<name>/annotated.png     — page with overlay (F# red, A# blue, bands)
 *   out/<name>/crop_F#.png       — tight crops per figure candidate
 *
 * Usage: node detect.js <image> [--out <dir>] [--threshold 180]
 */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const imgPath = args[0]
if (!imgPath) { console.error('usage: node detect.js <image>'); process.exit(1) }
const outFlag = args.indexOf('--out')
const OUT_ROOT = outFlag >= 0 ? args[outFlag + 1] : path.join(__dirname, 'out')
const thFlag = args.indexOf('--threshold')
const INK_THRESHOLD = thFlag >= 0 ? parseInt(args[thFlag + 1]) : 180

const name = path.basename(imgPath).replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_')
const OUT = path.join(OUT_ROOT, name)
fs.mkdirSync(OUT, { recursive: true })

async function main() {
  const img = sharp(imgPath).flatten({ background: '#ffffff' })
  const { data: rgb, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, CH = info.channels

  // ── binarize ──────────────────────────────────────────────────────────
  const ink = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const r = rgb[i * CH], g = rgb[i * CH + 1], b = rgb[i * CH + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    if (gray < INK_THRESHOLD) ink[i] = 1
  }

  // ── connected components (8-conn, iterative BFS) ─────────────────────
  const label = new Int32Array(W * H).fill(-1)
  const comps = [] // {id, minX, minY, maxX, maxY, n, pinkN}
  const stack = new Int32Array(W * H)
  for (let start = 0; start < W * H; start++) {
    if (!ink[start] || label[start] !== -1) continue
    const id = comps.length
    let sp = 0
    stack[sp++] = start
    label[start] = id
    let minX = W, minY = H, maxX = 0, maxY = 0, n = 0, pinkN = 0
    while (sp > 0) {
      const p = stack[--sp]
      const px = p % W, py = (p / W) | 0
      n++
      if (px < minX) minX = px
      if (px > maxX) maxX = px
      if (py < minY) minY = py
      if (py > maxY) maxY = py
      const r = rgb[p * CH], g = rgb[p * CH + 1], b = rgb[p * CH + 2]
      if (r > 150 && g < 120 && r - g > 60) pinkN++ // magenta/pink ink
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = px + dx, ny = py + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        const q = ny * W + nx
        if (ink[q] && label[q] === -1) { label[q] = id; stack[sp++] = q }
      }
    }
    comps.push({ id, minX, minY, maxX, maxY, n, pinkN })
  }

  const cw = c => c.maxX - c.minX + 1
  const chh = c => c.maxY - c.minY + 1

  // ── anchor detection: circled question numbers near left margin ──────
  // square-ish CC, 14-48px, centre within left 9% of page.
  // Distinguish a number-circle (hollow ring, dark ink) from lightbulb
  // icons / colored badges (solid or tinted) via ring-ness + darkness.
  function ccStats(c) {
    // ink pixels of THIS component inside the central 40% of its bbox,
    // mean gray + saturation, and radial spread of ink around the centroid
    // (a circle outline has near-constant radius → radialCV ≈ 0.05-0.2;
    //  hollow-looking CJK glyphs have strokes at many radii → ≥0.3)
    const w = cw(c), h = chh(c)
    const cx0 = c.minX + w * 0.3, cx1 = c.minX + w * 0.7
    const cy0 = c.minY + h * 0.3, cy1 = c.minY + h * 0.7
    const ccx = (c.minX + c.maxX) / 2, ccy = (c.minY + c.maxY) / 2
    const rIns = Math.min(w, h) / 2 * 1.06 // inscribed radius + AA margin
    let central = 0, graySum = 0, satSum = 0, corner = 0
    for (let y = c.minY; y <= c.maxY; y++) for (let x = c.minX; x <= c.maxX; x++) {
      const p = y * W + x
      if (label[p] !== c.id) continue
      const r = rgb[p * CH], g = rgb[p * CH + 1], b = rgb[p * CH + 2]
      graySum += 0.299 * r + 0.587 * g + 0.114 * b
      satSum += Math.max(r, g, b) - Math.min(r, g, b)
      if (Math.hypot(x - ccx, y - ccy) > rIns) corner++
      if (x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1) central++
    }
    // circle in a square bbox leaves the 4 corners empty; CJK glyph
    // strokes reach into them
    return { centralRatio: central / c.n, meanGray: graySum / c.n,
             meanSat: satSum / c.n, cornerRatio: corner / c.n }
  }

  const anchorCandidates = comps.filter(c => {
    const w = cw(c), h = chh(c)
    const cx = (c.minX + c.maxX) / 2
    return w >= 12 && w <= 48 && h >= 12 && h <= 48 &&
      Math.abs(w - h) <= Math.max(w, h) * 0.45 &&
      cx <= W * 0.10 && c.n >= 22
  })
  const anchors = anchorCandidates.filter(c => {
    const s = ccStats(c)
    if (process.env.DEBUG) console.error(`cand y=${c.minY} x=${c.minX} ${cw(c)}x${chh(c)} n=${c.n} central=${s.centralRatio.toFixed(2)} gray=${s.meanGray.toFixed(0)} sat=${s.meanSat.toFixed(0)} corner=${s.cornerRatio.toFixed(2)}`)
    // (a) dark circular outline — bbox corners empty (circle geometry),
    //     dark stroke (lightbulb icons are mid-gray ~170), uncoloured
    //     (badges are saturated). centralRatio stays lenient because the
    //     digit often merges into the ring CC via anti-aliasing.
    const centralMax = cw(c) <= 20 ? 0.45 : 0.30
    const ring = s.centralRatio < centralMax && s.meanGray < 140 &&
                 s.meanSat < 60 && s.cornerRatio < 0.05
    // (b) ring merged with an adjacent colored badge — bigger, saturated,
    //     still hollow-centred; badge-only blobs on a line that also has a
    //     clean ring get removed by the vertical dedupe below
    const mergedBadge = s.centralRatio < 0.2 && cw(c) >= 26 && cw(c) <= 40
    return ring || mergedBadge
  }).sort((a, b) => a.minY - b.minY)

  // dedupe anchors vertically (stacked icons on the same line)
  const bands = []
  for (const a of anchors) {
    if (bands.length && a.minY - bands[bands.length - 1].minY < 30) continue
    bands.push(a)
  }

  // ── figure seeds: any large CC that's not an anchor ───────────────────
  const isAnchor = new Set(bands.map(a => a.id))
  let regions = comps
    .filter(c => !isAnchor.has(c.id) && Math.max(cw(c), chh(c)) >= 50)
    .map(c => ({ minX: c.minX, minY: c.minY, maxX: c.maxX, maxY: c.maxY,
                 n: c.n, pinkN: c.pinkN }))

  // ── tinted-fill seeds: light colored panels (tables/charts with a
  //    background fill are too light to register as ink) ────────────────
  const tint = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    if (ink[i]) continue
    const r = rgb[i * CH], g = rgb[i * CH + 1], b = rgb[i * CH + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    const sat = Math.max(r, g, b) - Math.min(r, g, b)
    if (gray < 246 && (sat > 10 || gray < 232)) tint[i] = 1
  }
  const tlabel = new Int32Array(W * H).fill(-1)
  for (let start = 0; start < W * H; start++) {
    if (!tint[start] || tlabel[start] !== -1) continue
    let sp = 0
    stack[sp++] = start
    tlabel[start] = 1
    let minX = W, minY = H, maxX = 0, maxY = 0, n = 0
    while (sp > 0) {
      const p = stack[--sp]
      const px = p % W, py = (p / W) | 0
      n++
      if (px < minX) minX = px
      if (px > maxX) maxX = px
      if (py < minY) minY = py
      if (py > maxY) maxY = py
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = px + dx, ny = py + dy
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
        const q = ny * W + nx
        if (tint[q] && tlabel[q] === -1) { tlabel[q] = 1; stack[sp++] = q }
      }
    }
    const w = maxX - minX + 1, h = maxY - minY + 1
    // solid panel: many pixels, reasonably filled, not a thin strip
    if (n >= 4000 && w >= 80 && h >= 50 && n / (w * h) > 0.3 &&
        !(w > W * 0.95 && h > H * 0.95)) {
      regions.push({ minX, minY, maxX, maxY, n, pinkN: 0 })
    }
  }

  // ── merge overlapping/nearby regions (expand by GAP, union) ──────────
  const GAP = 14
  let merged = true
  while (merged) {
    merged = false
    outer: for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const a = regions[i], b = regions[j]
        if (a.minX - GAP <= b.maxX && b.minX - GAP <= a.maxX &&
            a.minY - GAP <= b.maxY && b.minY - GAP <= a.maxY) {
          a.minX = Math.min(a.minX, b.minX); a.minY = Math.min(a.minY, b.minY)
          a.maxX = Math.max(a.maxX, b.maxX); a.maxY = Math.max(a.maxY, b.maxY)
          a.n += b.n; a.pinkN += b.pinkN
          regions.splice(j, 1); merged = true; break outer
        }
      }
    }
  }

  // ── attach small CCs (dimension labels) intersecting a region ────────
  for (const c of comps) {
    if (isAnchor.has(c.id) || Math.max(cw(c), chh(c)) >= 50) continue
    for (const r of regions) {
      if (c.minX - GAP <= r.maxX && r.minX - GAP <= c.maxX &&
          c.minY - GAP <= r.maxY && r.minY - GAP <= c.maxY) {
        r.minX = Math.min(r.minX, c.minX); r.minY = Math.min(r.minY, c.minY)
        r.maxX = Math.max(r.maxX, c.maxX); r.maxY = Math.max(r.maxY, c.maxY)
        r.n += c.n; r.pinkN += c.pinkN
        break
      }
    }
  }

  // filter tiny leftovers + full-page frames + write-in answer blanks
  // (an answer blank = underline rule + pink handwriting: wide-short strip
  //  or pink-dominated shallow region — never a real figure)
  regions = regions.filter(r => {
    const w = r.maxX - r.minX + 1, h = r.maxY - r.minY + 1
    if (w * h < 2500) return false
    if (w > W * 0.95 && h > H * 0.95) return false
    const pinkRatio = r.pinkN / r.n
    if (h < 55 && w / h > 5) return false          // bare underline strip
    if (pinkRatio > 0.35 && h < 90) return false   // pink answer on a blank
    return true
  })

  // ── geometric binding: figure centre y → band ─────────────────────────
  const bandRanges = bands.map((a, i) => ({
    idx: i + 1, top: a.minY - 8,
    bottom: i + 1 < bands.length ? bands[i + 1].minY - 8 : H,
  }))
  const figures = regions
    .sort((a, b) => a.minY - b.minY || a.minX - b.minX)
    .map((r, i) => {
      const cy = (r.minY + r.maxY) / 2
      const band = bandRanges.find(b => cy >= b.top && cy < b.bottom)
      const fullyInside = band ? r.minY >= band.top && r.maxY <= band.bottom : false
      return {
        fid: `F${i + 1}`,
        box: { x: r.minX, y: r.minY, w: r.maxX - r.minX + 1, h: r.maxY - r.minY + 1 },
        band: band ? band.idx : null,
        fullyInsideBand: fullyInside,
        pinkRatio: +(r.pinkN / r.n).toFixed(3),
      }
    })

  // ── outputs ───────────────────────────────────────────────────────────
  const result = {
    image: imgPath, width: W, height: H, threshold: INK_THRESHOLD,
    anchors: bands.map((a, i) => ({ aid: `A${i + 1}`,
      box: { x: a.minX, y: a.minY, w: cw(a), h: chh(a) } })),
    figures,
  }
  fs.writeFileSync(path.join(OUT, 'candidates.json'), JSON.stringify(result, null, 2))

  // crops (pad 6px)
  for (const f of figures) {
    const pad = 6
    const left = Math.max(0, f.box.x - pad), top = Math.max(0, f.box.y - pad)
    await sharp(imgPath).flatten({ background: '#ffffff' })
      .extract({ left, top,
        width: Math.min(W - left, f.box.w + pad * 2),
        height: Math.min(H - top, f.box.h + pad * 2) })
      .png().toFile(path.join(OUT, `crop_${f.fid}.png`))
  }

  // annotated overlay
  const svgParts = [`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`]
  for (const b of bandRanges) {
    svgParts.push(`<line x1="0" y1="${b.top}" x2="${W}" y2="${b.top}" stroke="#22aa22" stroke-width="2" stroke-dasharray="8,6"/>`)
    svgParts.push(`<text x="${W - 90}" y="${b.top + 22}" font-size="20" fill="#22aa22">band ${b.idx}</text>`)
  }
  result.anchors.forEach(a => {
    svgParts.push(`<rect x="${a.box.x - 3}" y="${a.box.y - 3}" width="${a.box.w + 6}" height="${a.box.h + 6}" fill="none" stroke="#2255ff" stroke-width="3"/>`)
    svgParts.push(`<text x="${a.box.x + a.box.w + 8}" y="${a.box.y + 16}" font-size="20" fill="#2255ff" font-weight="bold">${a.aid}</text>`)
  })
  for (const f of figures) {
    svgParts.push(`<rect x="${f.box.x - 3}" y="${f.box.y - 3}" width="${f.box.w + 6}" height="${f.box.h + 6}" fill="none" stroke="#ee2222" stroke-width="3"/>`)
    svgParts.push(`<text x="${f.box.x}" y="${Math.max(20, f.box.y - 8)}" font-size="22" fill="#ee2222" font-weight="bold">${f.fid}→band${f.band ?? '?'}${f.pinkRatio > 0.5 ? ' [pink]' : ''}</text>`)
  }
  svgParts.push('</svg>')
  await sharp(imgPath).flatten({ background: '#ffffff' })
    .composite([{ input: Buffer.from(svgParts.join('')), top: 0, left: 0 }])
    .png().toFile(path.join(OUT, 'annotated.png'))

  console.log(JSON.stringify({
    out: OUT,
    anchors: result.anchors.length,
    figures: figures.map(f => ({ fid: f.fid, band: f.band, w: f.box.w, h: f.box.h, pink: f.pinkRatio })),
  }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
