'use client'

export default function PrintButton({ label = '列印練習卷' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 px-5 py-2.5 bg-[#1D9E75] text-white text-sm font-semibold rounded-xl hover:bg-[#178a65] active:scale-[0.98] transition"
    >
      🖨 {label}
    </button>
  )
}
