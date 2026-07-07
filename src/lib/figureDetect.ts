/**
 * CV figure detection + question-anchor detection + geometric binding for
 * past-paper pages. Zero AI — connected-component analysis only.
 *
 * TypeScript port of scripts/extract_figures/detect.js (the Path A CLI is
 * the reference implementation — algorithm changes there must be mirrored
 * here). Rationale + failure history: docs/figure_extraction_diagnosis.md.
 *
 * Used by Path B (parent past-paper uploads): the API route runs this per
 * page, candidates are shown to the parent for confirm/adjust, and only
 * the confirmed boxes are cropped and persisted.
 */
import sharp from 'sharp'

export type Box = { x: number; y: number; w: number; h: number }

export type FigureCandidate = {
  fid: string
  box: Box
  band: number | null
  fullyInsideBand: boolean
  sharedAbove?: boolean
  pinkRatio: number
  composite?: boolean
  members?: string[]
}

export type DetectResult = {
  width: number
  height: number
  anchors: { aid: string; box: Box }[]
  figures: FigureCandidate[]
}

type CC = {
  id: number
  minX: number; minY: number; maxX: number; maxY: number
  n: number; pinkN: number
}

type Region = {
  minX: number; minY: number; maxX: number; maxY: number
  n: number; pinkN: number; thick: number
}

export async function detectFigures(
  input: Buffer,
  opts: { threshold?: number; photoNormalise?: boolean } = {}
): Promise<DetectResult> {
  const INK_THRESHOLD = opts.threshold ?? 180

  let pipeline = sharp(input).flatten({ background: '#ffffff' })
  // Parent photos have shadows/glare; contrast-stretching pushes paper
  // back towards white so the fixed ink threshold keeps working.
  if (opts.photoNormalise) pipeline = pipeline.normalise()
  const { data: rgb, info } = await pipeline.raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, CH = info.channels

  // ── binarize ──────────────────────────────────────────────────────────
  const ink = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const r = rgb[i * CH], g = rgb[i * CH + 1], b = rgb[i * CH + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    if (gray < INK_THRESHOLD) ink[i] = 1
  }

  // ── page-frame removal (outer 5% margins only) ───────────────────────
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
  const comps: CC[] = []
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
      const r = rgb[p * CH], g = rgb[p * CH + 1]
      if (r > 150 && g < 120 && r - g > 60) pinkN++
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

  const cw = (c: CC) => c.maxX - c.minX + 1
  const chh = (c: CC) => c.maxY - c.minY + 1

  // ── interior vertical rule (question-number column), skew-tolerant ───
  const rulePieces = new Set<number>()
  let numColRight: number | null = null
  for (const c of comps) {
    if (cw(c) <= 14 && chh(c) >= H * 0.25) {
      rulePieces.add(c.id)
      if ((c.minX + c.maxX) / 2 < W * 0.4)
        numColRight = Math.max(numColRight ?? 0, c.maxX)
    }
  }

  // ── anchor profile A: circled/boxed question numbers ─────────────────
  function ccStats(c: CC) {
    const w = cw(c), h = chh(c)
    const cx0 = c.minX + w * 0.3, cx1 = c.minX + w * 0.7
    const cy0 = c.minY + h * 0.3, cy1 = c.minY + h * 0.7
    const ccx = (c.minX + c.maxX) / 2, ccy = (c.minY + c.maxY) / 2
    const rIns = Math.min(w, h) / 2 * 1.06
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
    return {
      centralRatio: central / c.n, meanGray: graySum / c.n,
      meanSat: satSum / c.n, cornerRatio: corner / c.n,
    }
  }

  type Anchor = { id: number | string; minX: number; minY: number; maxX: number; maxY: number; members?: number[] }

  const ringAnchors: Anchor[] = comps
    .filter(c => {
      const w = cw(c), h = chh(c)
      const cx = (c.minX + c.maxX) / 2
      return w >= 9 && w <= 48 && h >= 9 && h <= 48 &&
        Math.abs(w - h) <= Math.max(w, h) * 0.45 &&
        cx <= W * 0.10 && c.n >= 14
    })
    .filter(c => {
      const s = ccStats(c)
      const centralMax = cw(c) <= 20 ? 0.45 : 0.30
      const ring = s.centralRatio < centralMax && s.meanGray < 140 &&
                   s.meanSat < 60 && s.cornerRatio < 0.05
      const mergedBadge = s.centralRatio < 0.2 && cw(c) >= 26 && cw(c) <= 40
      return ring || mergedBadge
    })
    .sort((a, b) => a.minY - b.minY)

  let bands: Anchor[] = []
  for (const a of ringAnchors) {
    if (bands.length && a.minY - bands[bands.length - 1].minY < 30) continue
    bands.push(a)
  }

  // ── anchor profile B: plain numbers ("31.") left of the rule ─────────
  const colRight = numColRight ?? W * 0.08
  const colCCs = comps.filter(c => {
    const w = cw(c), h = chh(c)
    return c.maxX < colRight && h >= 8 && h <= 45 && w >= 3 && w <= 45 && c.n >= 12
  }).sort((a, b) => a.minY - b.minY)
  const numClusters: Anchor[] = []
  for (const c of colCCs) {
    const last = numClusters[numClusters.length - 1]
    if (last && c.minY - last.maxY < 18) {
      last.minX = Math.min(last.minX, c.minX); last.minY = Math.min(last.minY, c.minY)
      last.maxX = Math.max(last.maxX, c.maxX); last.maxY = Math.max(last.maxY, c.maxY)
      last.members!.push(c.id)
    } else {
      numClusters.push({ id: `num${numClusters.length}`, minX: c.minX, minY: c.minY,
        maxX: c.maxX, maxY: c.maxY, members: [c.id] })
    }
  }
  const numberAnchors = numClusters.filter(cl =>
    cl.members!.length >= 1 && cl.members!.length <= 5 &&
    (cl.maxX - cl.minX) <= 90 && (cl.maxY - cl.minY) <= 50)
  if (numberAnchors.length > bands.length) bands = numberAnchors

  // ── figure seeds ──────────────────────────────────────────────────────
  const isAnchor = new Set(bands.map(a => a.id))
  const inNumCol = (c: CC) => numColRight != null && c.maxX < numColRight
  const isBorder = (c: CC) => {
    if (chh(c) > H * 0.85 || cw(c) > W * 0.85) return true
    const touchesEdge = c.minX < W * 0.02 || c.maxX > W * 0.98 ||
                        c.minY < H * 0.02 || c.maxY > H * 0.98
    const long = chh(c) > H * 0.3 || cw(c) > W * 0.3
    const sparse = c.n / (cw(c) * chh(c)) < 0.08
    return touchesEdge && long && sparse
  }
  let regions: Region[] = comps
    .filter(c => !isAnchor.has(c.id) && !inNumCol(c) && !isBorder(c) &&
                 !rulePieces.has(c.id) && Math.max(cw(c), chh(c)) >= 50)
    .map(c => ({ minX: c.minX, minY: c.minY, maxX: c.maxX, maxY: c.maxY,
                 n: c.n, pinkN: c.pinkN, thick: Math.min(cw(c), chh(c)) }))

  // ── tinted-fill seeds (light colored panels) ─────────────────────────
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
    if (n >= 4000 && w >= 80 && h >= 50 && n / (w * h) > 0.3 &&
        !(w > W * 0.95 && h > H * 0.95)) {
      regions.push({ minX, minY, maxX, maxY, n, pinkN: 0, thick: Math.min(w, h) })
    }
  }

  // ── merge nearby regions ──────────────────────────────────────────────
  const GAP = 14
  let mergedFlag = true
  while (mergedFlag) {
    mergedFlag = false
    outer: for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const a = regions[i], b = regions[j]
        if (a.minX - GAP <= b.maxX && b.minX - GAP <= a.maxX &&
            a.minY - GAP <= b.maxY && b.minY - GAP <= a.maxY) {
          a.minX = Math.min(a.minX, b.minX); a.minY = Math.min(a.minY, b.minY)
          a.maxX = Math.max(a.maxX, b.maxX); a.maxY = Math.max(a.maxY, b.maxY)
          a.n += b.n; a.pinkN += b.pinkN; a.thick = Math.max(a.thick, b.thick)
          regions.splice(j, 1); mergedFlag = true; break outer
        }
      }
    }
  }

  // ── attach small CCs against FROZEN bboxes (no text chaining) ────────
  const ATTACH_GAP = 28
  const absorbed = new Set<number>()
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
        absorbed.add(c.id)
        break
      }
    }
  }

  // clip at the number-column boundary
  if (numColRight != null) {
    for (const r of regions) r.minX = Math.max(r.minX, numColRight + 3)
    regions = regions.filter(r => r.maxX > r.minX)
  }

  // ── junk filters ──────────────────────────────────────────────────────
  regions = regions.filter(r => {
    const w = r.maxX - r.minX + 1, h = r.maxY - r.minY + 1
    if (w * h < 2500) return false
    if (w > W * 0.95 && h > H * 0.95) return false
    const pinkRatio = r.pinkN / r.n
    if (h < 55 && w / h > 5) return false
    if (pinkRatio > 0.18 && h < 70) return false
    if (r.thick < Math.max(42, W * 0.05)) return false
    return true
  })

  // ── chart halo: absorb titles + axis labels around dense big regions ─
  for (const r of regions) {
    const area = (r.maxX - r.minX + 1) * (r.maxY - r.minY + 1)
    if (area < W * H * 0.12) continue
    if (r.n / area < 0.06) {
      let tintN = 0, sampled = 0
      for (let y = r.minY; y <= r.maxY; y += 2) for (let x = r.minX; x <= r.maxX; x += 2) {
        sampled++
        if (tint[y * W + x]) tintN++
      }
      if (tintN / sampled < 0.15) continue
    }
    const fz = { minX: r.minX, minY: r.minY, maxX: r.maxX, maxY: r.maxY }
    const SIDE = W * 0.06, BELOW = W * 0.035
    for (const c of comps) {
      if (absorbed.has(c.id) || inNumCol(c) || isBorder(c) ||
          rulePieces.has(c.id) || Math.max(cw(c), chh(c)) >= W * 0.06) continue
      const gapLeft = fz.minX - c.maxX
      const gapRight = c.minX - fz.maxX
      const gapAbove = fz.minY - c.maxY
      const gapBelow = c.minY - fz.maxY
      if (gapLeft <= SIDE && gapRight <= SIDE &&
          gapAbove <= SIDE && gapBelow <= BELOW) {
        r.minX = Math.min(r.minX, c.minX); r.minY = Math.min(r.minY, c.minY)
        r.maxX = Math.max(r.maxX, c.maxX); r.maxY = Math.max(r.maxY, c.maxY)
        absorbed.add(c.id)
      }
    }
  }

  // absorbed CCs can't be question starts
  bands = bands.filter(a => a.members
    ? !a.members.some(id => absorbed.has(id))
    : !absorbed.has(a.id as number))

  // ── geometric binding ─────────────────────────────────────────────────
  const bandRanges = bands.map((a, i) => ({
    idx: i + 1, top: a.minY - 8,
    bottom: i + 1 < bands.length ? bands[i + 1].minY - 8 : H,
  }))
  const figures: FigureCandidate[] = regions
    .sort((a, b) => a.minY - b.minY || a.minX - b.minX)
    .map((r, i) => {
      const cy = (r.minY + r.maxY) / 2
      let band = bandRanges.find(b => cy >= b.top && cy < b.bottom)
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
  const byBand = new Map<number, FigureCandidate[]>()
  for (const f of figures) {
    if (f.band == null) continue
    if (!byBand.has(f.band)) byBand.set(f.band, [])
    byBand.get(f.band)!.push(f)
  }
  byBand.forEach((members, band) => {
    if (members.length < 2) return
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
  })

  return {
    width: W, height: H,
    anchors: bands.map((a, i) => ({
      aid: `A${i + 1}`,
      box: { x: a.minX, y: a.minY, w: a.maxX - a.minX + 1, h: a.maxY - a.minY + 1 },
    })),
    figures,
  }
}

/**
 * Default crop pick for a band — same deterministic rule as the Path A
 * contact sheet: 1 candidate → itself; ≥3 → composite; 2 → composite when
 * horizontally close (one assembly), else the larger one.
 */
export function pickDefaultCrop(
  result: DetectResult, band: number
): FigureCandidate | null {
  const singles = result.figures.filter(f => f.band === band && !f.composite)
  const composite = result.figures.find(f => f.band === band && f.composite) ?? null
  if (singles.length === 0) return null
  if (singles.length === 1) return singles[0]
  if (singles.length >= 3) return composite
  const [a, b] = singles.slice().sort((x, y) => x.box.x - y.box.x)
  const gap = b.box.x - (a.box.x + a.box.w)
  if (gap < result.width * 0.2) return composite
  return singles.reduce((m, f) => f.box.w * f.box.h > m.box.w * m.box.h ? f : m)
}
