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

  // ── page-frame removal ────────────────────────────────────────────────
  // Scanned papers have a page frame near the edges (possibly skewed).
  // Erase long ink runs in the outer 5% margins only — interior lines
  // (trapezoid bases, table borders) are figure content and must survive.
  // The interior number-column rule is handled later at CC level, which
  // tolerates skew (a skewed line breaks into per-column runs that length
  // thresholds miss, but it's still one tall thin connected component).
  for (let x = 0; x < W; x++) {
    if (!(x < W * 0.05 || x > W * 0.95)) continue
    let run = 0
    for (let y = 0; y <= H; y++) {
      const on = y < H && ink[y * W + x]
      if (on) run++
      else {
        if (run >= H * 0.25) {
          for (let yy = y - run; yy < y; yy++)
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx
              if (nx >= 0 && nx < W) ink[yy * W + nx] = 0
            }
        }
        run = 0
      }
    }
  }
  for (let y = 0; y < H; y++) {
    if (!(y < H * 0.05 || y > H * 0.95)) continue
    let run = 0
    for (let x = 0; x <= W; x++) {
      const on = x < W && ink[y * W + x]
      if (on) run++
      else {
        if (run >= W * 0.25) {
          for (let xx = x - run; xx < x; xx++)
            for (let dy = -2; dy <= 2; dy++) {
              const ny = y + dy
              if (ny >= 0 && ny < H) ink[ny * W + xx] = 0
            }
        }
        run = 0
      }
    }
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

  // ── interior vertical rule (question-number column), skew-tolerant ───
  // A tall thin CC is a rule piece even when scan skew breaks the naive
  // per-column run test. Pieces are excluded from figures/attach, and the
  // rightmost piece in the left 40% of the page marks the number-column
  // boundary used by anchor profile B and crop clipping.
  const rulePieces = new Set()
  let numColRight = null
  for (const c of comps) {
    if (cw(c) <= 14 && chh(c) >= H * 0.25) {
      rulePieces.add(c.id)
      if ((c.minX + c.maxX) / 2 < W * 0.4)
        numColRight = Math.max(numColRight ?? 0, c.maxX)
    }
  }

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
    return w >= 9 && w <= 48 && h >= 9 && h <= 48 &&
      Math.abs(w - h) <= Math.max(w, h) * 0.45 &&
      cx <= W * 0.10 && c.n >= 14
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
  let bands = []
  for (const a of anchors) {
    if (bands.length && a.minY - bands[bands.length - 1].minY < 30) continue
    bands.push(a)
  }

  // ── anchor profile B: plain question numbers ("31.") in a left column ─
  // Scanned exam papers put bare numbers in a column left of a vertical
  // rule. Cluster small CCs in that column by line; each cluster is an
  // anchor. Only used when it finds MORE anchors than the ring profile
  // (workbook pages keep their ring anchors).
  const colRight = numColRight ?? W * 0.08
  const colCCs = comps.filter(c => {
    const w = cw(c), h = chh(c)
    return c.maxX < colRight && h >= 8 && h <= 45 && w >= 3 && w <= 45 &&
      c.n >= 12
  }).sort((a, b) => a.minY - b.minY)
  const numClusters = []
  for (const c of colCCs) {
    const last = numClusters[numClusters.length - 1]
    if (last && c.minY - last.maxY < 18) {
      last.minX = Math.min(last.minX, c.minX); last.minY = Math.min(last.minY, c.minY)
      last.maxX = Math.max(last.maxX, c.maxX); last.maxY = Math.max(last.maxY, c.maxY)
      last.members.push(c.id)
    } else {
      numClusters.push({ id: `num${numClusters.length}`, minX: c.minX, minY: c.minY,
        maxX: c.maxX, maxY: c.maxY, members: [c.id] })
    }
  }
  const numberAnchors = numClusters.filter(cl =>
    cl.members.length >= 1 && cl.members.length <= 5 &&
    (cl.maxX - cl.minX) <= 90 && (cl.maxY - cl.minY) <= 50)
  if (numberAnchors.length > bands.length) bands = numberAnchors

  // ── figure seeds: any large CC that's not an anchor ───────────────────
  const isAnchor = new Set(bands.map(a => a.id))
  const inNumCol = c => numColRight != null && c.maxX < numColRight
  // border/rule remnants that survived line erasure (skewed scans).
  // Full-span pieces are obvious; broken segments give themselves away by
  // hugging the outer 2% of the page while being long and extremely
  // sparse (a zigzag line fills <8% of its own bbox — real figures ≥8%)
  const isBorder = c => {
    if (chh(c) > H * 0.85 || cw(c) > W * 0.85) return true
    const touchesEdge = c.minX < W * 0.02 || c.maxX > W * 0.98 ||
                        c.minY < H * 0.02 || c.maxY > H * 0.98
    const long = chh(c) > H * 0.3 || cw(c) > W * 0.3
    const sparse = c.n / (cw(c) * chh(c)) < 0.08
    return touchesEdge && long && sparse
  }
  let regions = comps
    .filter(c => !isAnchor.has(c.id) && !inNumCol(c) && !isBorder(c) &&
                 !rulePieces.has(c.id) && Math.max(cw(c), chh(c)) >= 50)
    .map(c => {
      if (process.env.DEBUG) console.error(`seed ${c.minX},${c.minY} ${cw(c)}x${chh(c)} n=${c.n}`)
      return { minX: c.minX, minY: c.minY, maxX: c.maxX, maxY: c.maxY,
               n: c.n, pinkN: c.pinkN, thick: Math.min(cw(c), chh(c)) }
    })

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
      regions.push({ minX, minY, maxX, maxY, n, pinkN: 0, thick: Math.min(w, h) })
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
          a.n += b.n; a.pinkN += b.pinkN; a.thick = Math.max(a.thick, b.thick)
          regions.splice(j, 1); merged = true; break outer
        }
      }
    }
  }

  // ── attach small CCs (dimension labels) intersecting a region ────────
  // Intersection is tested against the FROZEN pre-attach bbox: attached
  // CCs must touch the figure itself. Growing the test bbox lets text
  // lines chain region→char→char until a whole page fuses (observed on
  // scanned pages with inline pictures).
  // ATTACH_GAP is wider than the merge GAP: dimension labels ("1.35 米")
  // sit 15-30px off the shape; the frozen-bbox test still prevents text
  // chaining because attachment never extends the tested bbox.
  const ATTACH_GAP = 28
  const frozen = regions.map(r => ({ minX: r.minX, minY: r.minY, maxX: r.maxX, maxY: r.maxY }))
  for (const c of comps) {
    if (isAnchor.has(c.id) || inNumCol(c) || isBorder(c) ||
        rulePieces.has(c.id) || Math.max(cw(c), chh(c)) >= 50) continue
    for (let ri = 0; ri < regions.length; ri++) {
      const fz = frozen[ri], r = regions[ri]
      if (c.minX - ATTACH_GAP <= fz.maxX && fz.minX - ATTACH_GAP <= c.maxX &&
          c.minY - ATTACH_GAP <= fz.maxY && fz.minY - ATTACH_GAP <= c.maxY) {
        r.minX = Math.min(r.minX, c.minX); r.minY = Math.min(r.minY, c.minY)
        r.maxX = Math.max(r.maxX, c.maxX); r.maxY = Math.max(r.maxY, c.maxY)
        r.n += c.n; r.pinkN += c.pinkN
        break
      }
    }
  }

  // clip regions at the number-column boundary so "31." never bleeds
  // into a crop
  if (numColRight != null) {
    for (const r of regions) r.minX = Math.max(r.minX, numColRight + 3)
    regions = regions.filter(r => r.maxX > r.minX)
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
    if (pinkRatio > 0.18 && h < 70) return false   // pink answer on a blank
    // text/blank blocks: every member CC is glyph-sized or a thin line
    // (bold CJK rows fuse into CCs up to ~0.045W thick). A real figure has
    // at least one member ≥5% of page width thick in BOTH axes (clock
    // ring, beaker outline, photo blob, tinted panel…)
    if (process.env.DEBUG) console.error(`region ${r.minX},${r.minY} ${w}x${h} thick=${r.thick} pink=${pinkRatio.toFixed(2)}`)
    if (r.thick < Math.max(42, W * 0.05)) return false
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
      let band = bandRanges.find(b => cy >= b.top && cy < b.bottom)
      // shared figure printed ABOVE the first question of its group
      // (chart pages: 折線圖 / 行程圖 layout) — bind to the first band and
      // tag it so the reviewer knows the whole group shares it
      let sharedAbove = false
      if (!band && bandRanges.length && cy < bandRanges[0].top) {
        band = bandRanges[0]
        sharedAbove = true
      }
      const fullyInside = band && !sharedAbove
        ? r.minY >= band.top && r.maxY <= band.bottom : false
      return {
        fid: `F${i + 1}`,
        box: { x: r.minX, y: r.minY, w: r.maxX - r.minX + 1, h: r.maxY - r.minY + 1 },
        band: band ? band.idx : null,
        fullyInsideBand: fullyInside,
        ...(sharedAbove ? { sharedAbove: true } : {}),
        pinkRatio: +(r.pinkN / r.n).toFixed(3),
      }
    })

  // ── composite candidates ──────────────────────────────────────────────
  // Pictorial questions (inline pictures as question content) produce
  // several candidates in one band. Emit the union bbox as an extra
  // candidate so the reviewer can pick "whole assembly" vs individual
  // pieces. Default pick downstream: composite when a band has ≥3
  // members, individual otherwise.
  const byBand = new Map()
  for (const f of figures) {
    if (f.band == null) continue
    if (!byBand.has(f.band)) byBand.set(f.band, [])
    byBand.get(f.band).push(f)
  }
  for (const [band, members] of byBand) {
    if (members.length < 2) continue
    const minX = Math.min(...members.map(m => m.box.x))
    const minY = Math.min(...members.map(m => m.box.y))
    const maxX = Math.max(...members.map(m => m.box.x + m.box.w))
    const maxY = Math.max(...members.map(m => m.box.y + m.box.h))
    figures.push({
      fid: `F${band}composite`,
      box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
      band, fullyInsideBand: true,
      pinkRatio: 0,
      composite: true,
      members: members.map(m => m.fid),
    })
  }

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
