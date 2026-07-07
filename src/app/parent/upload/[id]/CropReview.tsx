'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLang } from '@/lib/i18n/LanguageProvider'
import type { ExtractedQuestion } from '@/lib/gemini'
import type { Box, FigureCandidate } from '@/lib/figureDetect'

type CvPage = {
  page: number
  width: number
  height: number
  anchors: { aid: string; box: Box }[]
  figures: FigureCandidate[]
}

type Choice = { box: Box | null; label: string }

/**
 * Parent-facing crop confirmation. Boxes come from CV detection
 * (figureDetect.ts) — the parent's job is a yes/adjust/none decision per
 * 圖題. Manual adjustment is a draggable/resizable rectangle over the page
 * (pointer events: works with fingers). Nothing is cropped until submit.
 */
export default function CropReview({
  uploadId,
  reviewStatus,
  cropsConfirmed,
  pageUrls,
  questions,
  cvFigures,
}: {
  uploadId: string
  reviewStatus: string
  cropsConfirmed: boolean
  pageUrls: string[]
  questions: ExtractedQuestion[]
  cvFigures: CvPage[]
}) {
  const { t, lang } = useLang()

  // questions that involve a figure, keyed by their index in the array
  const figureQs = useMemo(
    () => questions.map((q, i) => ({ q, i })).filter(({ q }) => q.has_image),
    [questions]
  )

  const [choices, setChoices] = useState<Record<number, Choice>>(() => {
    const init: Record<number, Choice> = {}
    for (const { q, i } of figureQs) {
      init[i] = q.suggested_box
        ? { box: q.suggested_box, label: 'AI 建議' }
        : { box: null, label: '無圖' }
    }
    return init
  })
  const [editing, setEditing] = useState<number | null>(null)
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'done' | 'error'>(
    cropsConfirmed ? 'done' : 'idle'
  )
  const [errorMsg, setErrorMsg] = useState('')

  const locked = reviewStatus !== 'pending'

  async function submit() {
    setSubmitState('saving')
    try {
      const res = await fetch('/api/past-paper/confirm-crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          crops: figureQs.map(({ i }) => ({ index: i, box: choices[i]?.box ?? null })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? '儲存失敗')
        setSubmitState('error')
        return
      }
      setSubmitState('done')
    } catch {
      setErrorMsg('網絡錯誤，請重試')
      setSubmitState('error')
    }
  }

  if (figureQs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
        <p className="text-gray-600 text-sm">{t('這份試卷沒有圖形題，無需確認圖片')}</p>
        <a href="/parent" className="mt-4 inline-block text-sm text-[#4A90E2] underline">
          {t('返回主頁')}
        </a>
      </div>
    )
  }

  if (submitState === 'done') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-700">{t('圖片已確認，等待老師審核')}</p>
        <a href="/parent" className="mt-4 inline-block text-sm text-[#4A90E2] underline">
          {t('返回主頁')}
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-bold text-gray-800">{t('確認題目圖片')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {lang === 'en'
            ? `${figureQs.length} question(s) come with a figure. Check each box — adjust or remove if wrong.`
            : `有 ${figureQs.length} 條題目附有圖形。請逐題檢查框選位置，唔啱可以調整或者剔走。`}
        </p>
      </header>

      {locked && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
          {t('此上載已完成審核，不能再修改')}
        </p>
      )}

      {figureQs.map(({ q, i }) => {
        const pageIdx = (q.page_number ?? 1) - 1
        const cv = cvFigures[pageIdx]
        const choice = choices[i]
        return (
          <section key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm text-gray-800">
              <span className="inline-block text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 mr-2">
                P{pageIdx + 1}
              </span>
              {q.question_text}
            </p>

            {choice?.box ? (
              <CropPreview
                pageUrl={pageUrls[pageIdx]}
                pageW={cv?.width || 0}
                box={choice.box}
                label={choice.label}
              />
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-4 text-center">
                {t('未有圖片（提交後此題不帶圖）')}
              </p>
            )}

            {!locked && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEditing(i)}
                  className="px-3 py-2 text-xs rounded-xl border border-[#4A90E2] text-[#4A90E2] font-medium active:scale-95 transition"
                >
                  ✂️ {t(choice?.box ? '調整框選' : '手動框選')}
                </button>
                {(cv?.figures ?? []).filter((f) => !f.composite).slice(0, 4).map((f) => (
                  <button
                    key={f.fid}
                    onClick={() => setChoices((prev) => ({ ...prev, [i]: { box: f.box, label: f.fid } }))}
                    className={`px-3 py-2 text-xs rounded-xl border font-medium active:scale-95 transition ${
                      choice?.label === f.fid
                        ? 'border-[#1D9E75] text-[#1D9E75] bg-[#1D9E75]/5'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {t('候選')} {f.fid}
                  </button>
                ))}
                <button
                  onClick={() => setChoices((prev) => ({ ...prev, [i]: { box: null, label: '無圖' } }))}
                  className={`px-3 py-2 text-xs rounded-xl border font-medium active:scale-95 transition ${
                    choice?.box === null ? 'border-gray-500 text-gray-700 bg-gray-100' : 'border-gray-200 text-gray-400'
                  }`}
                >
                  {t('無圖')}
                </button>
              </div>
            )}
          </section>
        )
      })}

      {submitState === 'error' && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{errorMsg}</p>
      )}

      {!locked && (
        <button
          onClick={submit}
          disabled={submitState === 'saving'}
          className="w-full h-12 bg-[#4A90E2] text-white rounded-2xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition"
        >
          {submitState === 'saving' ? t('儲存中…') : t('確認全部圖片')}
        </button>
      )}

      {editing != null && (
        <BoxEditor
          pageUrl={pageUrls[(questions[editing].page_number ?? 1) - 1]}
          pageW={cvFigures[(questions[editing].page_number ?? 1) - 1]?.width || 0}
          pageH={cvFigures[(questions[editing].page_number ?? 1) - 1]?.height || 0}
          initial={choices[editing]?.box ?? null}
          onCancel={() => setEditing(null)}
          onSave={(box) => {
            setChoices((prev) => ({ ...prev, [editing]: { box, label: '手動' } }))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

/** Cropped preview rendered client-side from the signed page image. */
function CropPreview({ pageUrl, pageW, box, label }: {
  pageUrl: string; pageW: number; box: Box; label: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !pageUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // stored boxes are in original-page coords; if the signed image is
      // the original this is 1:1, but scale defensively via naturalWidth
      const s = pageW > 0 ? img.naturalWidth / pageW : 1
      const w = Math.max(1, Math.round(box.w * s))
      const h = Math.max(1, Math.round(box.h * s))
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')?.drawImage(img, box.x * s, box.y * s, w, h, 0, 0, w, h)
    }
    img.src = pageUrl
  }, [pageUrl, pageW, box])
  return (
    <figure className="space-y-1">
      <canvas ref={canvasRef} className="max-w-full max-h-56 border border-gray-200 rounded-xl" />
      <figcaption className="text-[11px] text-gray-400">{label}</figcaption>
    </figure>
  )
}

/** Full-screen box editor — drag inside to move, corners to resize, empty
 *  space to draw a new box. Pointer events cover mouse and touch. */
function BoxEditor({ pageUrl, pageW, pageH, initial, onSave, onCancel }: {
  pageUrl: string; pageW: number; pageH: number
  initial: Box | null
  onSave: (box: Box) => void
  onCancel: () => void
}) {
  const { t } = useLang()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(false)
  const boxRef = useRef<Box>(initial ?? { x: 40, y: 40, w: 300, h: 200 })
  const dragRef = useRef<{ mode: string; sx: number; sy: number; b0: Box } | null>(null)
  const scaleRef = useRef(1)
  const dimsRef = useRef({ w: pageW, h: pageH })

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      // fall back to the actual image dimensions when CV failed (w=0)
      if (!dimsRef.current.w) dimsRef.current = { w: img.naturalWidth, h: img.naturalHeight }
      const c = canvasRef.current
      if (!c) return
      const maxW = Math.min(window.innerWidth * 0.94, 1000)
      const maxH = window.innerHeight * 0.7
      scaleRef.current = Math.min(maxW / dimsRef.current.w, maxH / dimsRef.current.h, 1)
      c.width = Math.round(dimsRef.current.w * scaleRef.current)
      c.height = Math.round(dimsRef.current.h * scaleRef.current)
      setReady(true)
      draw()
    }
    img.src = pageUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageUrl])

  function draw() {
    const c = canvasRef.current, img = imgRef.current
    if (!c || !img) return
    const g = c.getContext('2d')
    if (!g) return
    g.drawImage(img, 0, 0, c.width, c.height)
    const s = scaleRef.current
    const b = boxRef.current
    const bx = b.x * s, by = b.y * s, bw = b.w * s, bh = b.h * s
    g.fillStyle = 'rgba(0,0,0,.4)'
    g.fillRect(0, 0, c.width, by)
    g.fillRect(0, by + bh, c.width, c.height - by - bh)
    g.fillRect(0, by, bx, bh)
    g.fillRect(bx + bw, by, c.width - bx - bw, bh)
    g.strokeStyle = '#ee2222'
    g.lineWidth = 2
    g.strokeRect(bx, by, bw, bh)
    g.fillStyle = '#ee2222'
    for (const [hx, hy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) {
      g.beginPath(); g.arc(hx, hy, 8, 0, 7); g.fill()
    }
  }

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function onDown(e: React.PointerEvent) {
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    const { x: mx, y: my } = pos(e)
    const s = scaleRef.current, b = boxRef.current
    const bx = b.x * s, by = b.y * s, bw = b.w * s, bh = b.h * s
    const corners: Array<[string, number, number]> = [
      ['nw', bx, by], ['ne', bx + bw, by], ['sw', bx, by + bh], ['se', bx + bw, by + bh],
    ]
    for (const [mode, cx2, cy2] of corners) {
      if (Math.hypot(mx - cx2, my - cy2) < 16) {
        dragRef.current = { mode, sx: mx, sy: my, b0: { ...b } }
        return
      }
    }
    if (mx > bx && mx < bx + bw && my > by && my < by + bh) {
      dragRef.current = { mode: 'move', sx: mx, sy: my, b0: { ...b } }
    } else {
      boxRef.current = { x: mx / s, y: my / s, w: 10, h: 10 }
      dragRef.current = { mode: 'se', sx: mx, sy: my, b0: { ...boxRef.current } }
    }
  }

  function onMove(e: React.PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    e.preventDefault()
    const { x: mx, y: my } = pos(e)
    const s = scaleRef.current
    const dx = (mx - drag.sx) / s, dy = (my - drag.sy) / s
    const b0 = drag.b0
    let { x, y, w, h } = b0
    if (drag.mode === 'move') { x = b0.x + dx; y = b0.y + dy }
    if (drag.mode === 'se') { w = b0.w + dx; h = b0.h + dy }
    if (drag.mode === 'nw') { x = b0.x + dx; y = b0.y + dy; w = b0.w - dx; h = b0.h - dy }
    if (drag.mode === 'ne') { y = b0.y + dy; w = b0.w + dx; h = b0.h - dy }
    if (drag.mode === 'sw') { x = b0.x + dx; w = b0.w - dx; h = b0.h + dy }
    if (w < 10) w = 10
    if (h < 10) h = 10
    const { w: PW, h: PH } = dimsRef.current
    x = Math.max(0, Math.min(x, PW - w))
    y = Math.max(0, Math.min(y, PH - h))
    boxRef.current = { x, y, w, h }
    draw()
  }

  function onUp() {
    dragRef.current = null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2">
      <div className="bg-white rounded-2xl p-3 max-w-full max-h-full overflow-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold">✂️ {t('框選題目圖片')}</span>
          <span className="text-[11px] text-gray-400">{t('拖入面移動．拖四角改大小')}</span>
          <span className="flex-1" />
          <button
            onClick={() => onSave({
              x: Math.round(boxRef.current.x), y: Math.round(boxRef.current.y),
              w: Math.round(boxRef.current.w), h: Math.round(boxRef.current.h),
            })}
            disabled={!ready}
            className="px-4 py-2 text-xs rounded-xl bg-[#1D9E75] text-white font-medium disabled:opacity-50"
          >
            ✓ {t('確定')}
          </button>
          <button onClick={onCancel} className="px-4 py-2 text-xs rounded-xl bg-gray-100 text-gray-600">
            {t('取消')}
          </button>
        </div>
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          className="touch-none rounded-xl border border-gray-200 cursor-crosshair"
        />
      </div>
    </div>
  )
}
