'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type State =
  | { status: 'idle' }
  | { status: 'uploading'; progress: string }
  | { status: 'done' }
  | { status: 'error'; message: string }

// Single bundled uploader for the parent: pick 1–N images (typically 1 or 2
// phone photos) that cover ALL long questions on the paper. Photos go to
// the `mock-exam-lq` Storage bucket; the API mirrors the paths into every
// per-LQ submission row so the existing teacher review UI keeps working.
export default function LqUploadForm({
  paperId,
  existingPageUrls,
}: {
  paperId: string
  // Signed URLs of pages already uploaded (so the parent sees previous
  // submissions and can decide to re-upload).
  existingPageUrls: string[]
}) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>(
    existingPageUrls.length > 0 ? { status: 'done' } : { status: 'idle' }
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
      const next = [...prev, ...picked].slice(0, 10)
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
    setState({ status: 'uploading', progress: `上載 ${files.length} 張圖片中…` })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setState({ status: 'error', message: '未登入' })
      return
    }

    const paths: string[] = []
    try {
      const stamp = Date.now()
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const ext =
          f.type === 'image/png' ? 'png' :
          f.type === 'image/webp' ? 'webp' :
          f.type === 'image/heic' ? 'heic' :
          'jpg'
        // Path scheme: <userId>/<paperId>/page-<i>-<timestamp>.<ext>
        // No long_question_id segment — these are paper-level pages.
        const path = `${user.id}/${paperId}/page-${i + 1}-${stamp}.${ext}`
        const { error } = await supabase.storage
          .from('mock-exam-lq')
          .upload(path, f, { contentType: f.type, upsert: true })
        if (error) throw error
        paths.push(path)
      }

      setState({ status: 'uploading', progress: '儲存中…' })

      const res = await fetch(`/api/mock-exam/${paperId}/submit-lq-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_paths: paths }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setState({ status: 'error', message: data.error ?? '提交失敗，請重試' })
        return
      }

      setState({ status: 'done' })
      // Refresh so the parent sees the "已上載" state from server data
      router.refresh()
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
      {/* Existing already-uploaded pages */}
      {done && existingPageUrls.length > 0 && files.length === 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-green-700 mb-2">
            ✓ 已上載 {existingPageUrls.length} 張答卷
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {existingPageUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`答卷第 ${i + 1} 頁`}
                  className="h-24 w-auto rounded-lg border"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* New file previews */}
      {previews.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">即將上載（{previews.length} 張）</p>
          <div className="flex gap-2 overflow-x-auto">
            {previews.map((src, i) => (
              <div key={i} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-24 w-auto rounded-lg border" />
                <button
                  onClick={() => remove(i)}
                  type="button"
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gray-700 text-white text-xs"
                  aria-label="移除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File picker — visible until upload completes successfully */}
      {(state.status === 'idle' || state.status === 'error' || (done && files.length > 0)) && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleChange}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#4A90E2]/10 file:text-[#4A90E2] mb-3"
          />
          <p className="text-xs text-gray-400 mb-3">
            可揀多張圖片 · 最多 10 張 · 一張相包含多題都 OK
          </p>
        </>
      )}

      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          type="button"
          className="w-full h-12 rounded-xl bg-[#4A90E2] text-white text-base font-semibold disabled:opacity-60 transition"
        >
          {uploading ? state.progress : `上載 ${files.length} 張答卷`}
        </button>
      )}

      {done && files.length === 0 && (
        <button
          onClick={() => {
            setState({ status: 'idle' })
            inputRef.current?.click()
          }}
          type="button"
          className="mt-2 text-sm text-[#4A90E2] underline"
        >
          重新上載 / 補充頁數
        </button>
      )}

      {state.status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">
          {state.message}
        </p>
      )}
    </div>
  )
}
