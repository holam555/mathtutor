'use client'

import { useRef, useState } from 'react'
import { useLang } from '@/lib/i18n/LanguageProvider'

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: string }
  | { status: 'success'; extracted: number }
  | { status: 'error'; message: string }

export default function UploadForm() {
  const { t, lang } = useLang()
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  // Accumulated files and their data-URL previews
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function readPreviews(files: File[]) {
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (ev) => resolve(ev.target?.result as string)
            reader.readAsDataURL(f)
          })
      )
    ).then(setPreviews)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? [])
    if (!newFiles.length) return

    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles].slice(0, 10)
      readPreviews(combined)
      return combined
    })

    // Reset input so the same file can be re-selected, and so the
    // input value doesn't confuse FormData (we submit from state).
    e.target.value = ''
  }

  function removeFile(idx: number) {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      readPreviews(next)
      return next
    })
  }

  function reset() {
    setState({ status: 'idle' })
    setSelectedFiles([])
    setPreviews([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFiles.length) {
      setState({ status: 'error', message: '請選擇至少一張圖片' })
      return
    }

    setState({ status: 'uploading', progress: '上傳圖片中…' })

    const form = e.currentTarget
    const formData = new FormData(form)
    // Remove the (empty) file input entry; submit accumulated files instead
    formData.delete('images')
    selectedFiles.forEach((f) => formData.append('images', f))

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
        <p className="font-semibold text-green-700">{t('上載成功！')}</p>
        <p className="text-sm text-green-600 mt-1">
          {lang === 'en' ? (
            <>AI extracted <strong>{state.extracted}</strong> questions — pending teacher review before joining the bank.</>
          ) : (
            <>AI 共提取了 <strong>{state.extracted}</strong> 條題目，等待老師審核後加入題庫。</>
          )}
        </p>
        <div className="flex gap-3 mt-5 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#4A90E2] text-white rounded-xl text-sm font-medium"
          >
            {t('再上載一份')}
          </button>
          <a
            href="/parent"
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
          >
            {t('返回主頁')}
          </a>
        </div>
      </div>
    )
  }

  const isLoading = state.status === 'uploading'
  const canAddMore = selectedFiles.length < 10

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('試卷圖片')}{' '}
          <span className="text-gray-400 font-normal">
            （{selectedFiles.length > 0
              ? lang === 'en'
                ? `${selectedFiles.length} / 10 pages selected`
                : `已選 ${selectedFiles.length} / 10 頁`
              : t('最多10頁')}）
          </span>
        </label>

        {/* Hidden file input — reset after each pick so files accumulate in state */}
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

        {/* Drop zone — only show if under the limit */}
        {canAddMore && (
          <label
            htmlFor="image-input"
            className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#4A90E2] transition bg-gray-50"
          >
            <span className="text-2xl mb-1">📷</span>
            <span className="text-sm text-gray-500">
              {t(selectedFiles.length === 0 ? '點擊選擇圖片' : '繼續添加圖片')}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">{t('支援 JPG、PNG、WEBP')}</span>
          </label>
        )}

        {/* Previews with individual remove buttons */}
        {previews.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {previews.map((src, i) => (
              <div key={i} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`第${i + 1}頁`}
                  className="h-24 w-auto rounded-xl object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center leading-none hover:bg-red-500 transition"
                  aria-label={`移除第${i + 1}頁`}
                >
                  ✕
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/40 text-white rounded px-1">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('學校名稱')}</label>
        <input
          name="school_name"
          type="text"
          placeholder={t('例如：香港小學')}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#4A90E2] outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('年級')}</label>
          <select
            name="grade"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:border-[#4A90E2] outline-none"
          >
            <option value="">{t('選擇年級')}</option>
            <option value="3">{t('小三')}</option>
            <option value="4">{t('小四')}</option>
            <option value="5">{t('小五')}</option>
            <option value="6">{t('小六')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('考試年份')}</label>
          <input
            name="exam_year"
            type="number"
            placeholder={t('例如：2024')}
            min="2010"
            max="2030"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#4A90E2] outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('考試類型')}</label>
        <input
          name="exam_type"
          type="text"
          placeholder={t('例如：第一段考、期末考')}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#4A90E2] outline-none"
        />
      </div>

      {state.status === 'error' && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isLoading || selectedFiles.length === 0}
        className="w-full h-12 bg-[#4A90E2] text-white rounded-2xl font-medium text-sm disabled:opacity-60 active:scale-[0.98] transition"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {state.progress}
          </span>
        ) : lang === 'en' ? (
          `Upload & Analyze (${selectedFiles.length} pages)`
        ) : (
          `上載並分析（${selectedFiles.length} 頁）`
        )}
      </button>
    </form>
  )
}
