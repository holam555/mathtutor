'use client'

import { useRef, useState } from 'react'

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: string }
  | { status: 'success'; extracted: number }
  | { status: 'error'; message: string }

export default function UploadForm() {
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPreviews([])
    const readers = files.slice(0, 10).map(
      (f) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (ev) => resolve(ev.target?.result as string)
          reader.readAsDataURL(f)
        })
    )
    Promise.all(readers).then(setPreviews)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const files = fileInputRef.current?.files
    if (!files?.length) {
      setState({ status: 'error', message: '請選擇至少一張圖片' })
      return
    }

    setState({ status: 'uploading', progress: '上傳圖片中…' })

    const formData = new FormData(form)
    // Replace the file input with individual entries named "images"
    formData.delete('images')
    Array.from(files).forEach((f) => formData.append('images', f))

    try {
      setState({ status: 'uploading', progress: 'AI 分析試卷中（可能需要 30–60 秒）…' })
      const res = await fetch('/api/past-paper/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? '上傳失敗' })
        return
      }
      setState({ status: 'success', extracted: data.extracted })
    } catch {
      setState({ status: 'error', message: '網絡錯誤，請重試' })
    }
  }

  if (state.status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-green-700">上載成功！</p>
        <p className="text-sm text-green-600 mt-1">
          AI 共提取了 <strong>{state.extracted}</strong> 條題目，等待老師審核後加入題庫。
        </p>
        <div className="flex gap-3 mt-5 justify-center">
          <button
            onClick={() => {
              setState({ status: 'idle' })
              setPreviews([])
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="px-5 py-2.5 bg-[#4A90E2] text-white rounded-xl text-sm font-medium"
          >
            再上載一份
          </button>
          <a
            href="/parent"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
          >
            返回主頁
          </a>
        </div>
      </div>
    )
  }

  const isLoading = state.status === 'uploading'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          試卷圖片 <span className="text-gray-400 font-normal">（最多10頁）</span>
        </label>
        <input
          ref={fileInputRef}
          name="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="image-input"
        />
        <label
          htmlFor="image-input"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#4A90E2] transition bg-gray-50"
        >
          <span className="text-2xl mb-1">📷</span>
          <span className="text-sm text-gray-500">點擊選擇圖片</span>
          <span className="text-xs text-gray-400 mt-0.5">支援 JPG、PNG、WEBP</span>
        </label>

        {previews.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`第${i + 1}頁`}
                className="h-24 w-auto rounded-xl object-cover border border-gray-200 shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">學校名稱</label>
        <input
          name="school_name"
          type="text"
          placeholder="例如：香港小學"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#4A90E2] outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">年級</label>
          <select
            name="grade"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:border-[#4A90E2] outline-none"
          >
            <option value="">選擇年級</option>
            <option value="3">小三</option>
            <option value="4">小四</option>
            <option value="5">小五</option>
            <option value="6">小六</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">考試年份</label>
          <input
            name="exam_year"
            type="number"
            placeholder="例如：2024"
            min="2010"
            max="2030"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#4A90E2] outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">考試類型</label>
        <input
          name="exam_type"
          type="text"
          placeholder="例如：第一段考、期末考"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#4A90E2] outline-none"
        />
      </div>

      {state.status === 'error' && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-[#4A90E2] text-white rounded-2xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {state.progress}
          </span>
        ) : (
          '上載並分析'
        )}
      </button>
    </form>
  )
}
