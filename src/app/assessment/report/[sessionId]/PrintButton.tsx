'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity print:hidden"
      style={{ backgroundColor: '#1D9E75' }}
    >
      <span>📄</span>
      <span>下載 PDF</span>
    </button>
  )
}
