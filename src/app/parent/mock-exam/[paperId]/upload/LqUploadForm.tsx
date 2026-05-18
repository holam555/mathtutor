'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type State =
  | { status: 'idle' }
  | { status: 'uploading'; progress: string }
  | { status: 'done'; transcript: string | null }
  | { status: 'error'; message: string }

export default function LqUploadForm({
  paperId,
  longQuestionId,
  index,
  questionText,
  totalMarks,
  existingImageCount,
  existingTranscript,
}: {
  paperId: string
  longQuestionId: string
  index: number
  questionText: string
  totalMarks: number
  existingImageCount: number
  existingTranscript: string | null
}) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>(
    existingTranscript || existingImageCount > 0
      ? { status: 'done', transcript: existingTranscript }
      : { status: 'idle' }
  )

  function readPreviews(arr: File[]) {
    Promise.all(
      arr.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader()
            r.onload = (e) => resolve(e.target?.result as string)
            r.readAsDataURL(f)
          })
      )
    ).then(setPreviews)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    if (!picked.length) return
    setFiles((prev) => {
      const next = [...prev, ...picked].slice(0, 4)
      readPreviews(next)
      return next
    })
    e.target.value = ''
  }

  function remove(idx: number) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      readPreviews(next)
      return next
    })
  }

  async function handleUpload() {
    if (!files.length) return
    setState({ status: 'uploading', progress: '上載圖片中…' })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setState({ status: 'error', message: '未登入' })
      return
    }

    const paths: string[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg'
        const path = `${user.id}/${paperId}/${longQuestionId}/${Date.now()}-${i}.${ext}`
        const { error } = await supabase.storage
          .from('mock-exam-lq')
          .upload(path, f, { contentType: f.type, upsert: true })
        if (error) throw error
        paths.push(path)
      }

      setState({ status: 'uploading', progress: 'AI 辨識手寫答案中…' })

      const res = await fetch(`/api/mock-exam/${paperId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ long_question_id: longQuestionId, image_paths: paths }),
      })
      const data = await res.json()
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? '辨識失敗' })
        return
      }
      setState({ status: 'done', transcript: data.ai_extracted_answer ?? null })
    } catch (e) {
      setState({
        status: 'error',
        message: e instanceof Error ? e.message : '上載失敗',
      })
    }
  }

  const uploading = state.status === 'uploading'
  const done = state.status === 'done'

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-bold text-sm">{index}.</span>
        <span className="text-xs text-gray-400">（{totalMarks} 分）</span>
        {done && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            ✓ 已上載
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{questionText}</p>

      {previews.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {previews.map((src, i) => (
            <div key={i} className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-20 w-auto rounded-lg border" />
              <button
                onClick={() => remove(i)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-700 text-white text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {!done && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#4A90E2]/10 file:text-[#4A90E2] mb-3"
          />
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full h-11 rounded-xl bg-[#4A90E2] text-white text-sm font-semibold disabled:opacity-60 transition"
          >
            {uploading ? state.progress : `上載並辨識（${files.length} 張）`}
          </button>
        </>
      )}

      {done && state.transcript && (
        <div className="mt-3 bg-amber-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-800 mb-1">AI 辨識結果</p>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">{state.transcript}</p>
        </div>
      )}

      {done && (
        <button
          onClick={() => {
            setFiles([])
            setPreviews([])
            setState({ status: 'idle' })
          }}
          className="mt-2 text-xs text-gray-500 underline"
        >
          重新上載
        </button>
      )}

      {state.status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{state.message}</p>
      )}
    </div>
  )
}
