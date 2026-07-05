'use client'

import { useState, useEffect, useRef } from 'react'
import FractionDisplay from './FractionDisplay'
import { useLang } from '@/lib/i18n/LanguageProvider'

// One keyboard for all answer types in the assessment flow.
// Modes:
//   number  — calculator pad (digits, decimal, space, backspace)
//   fraction — 3-slot fraction builder (整數 / 分子 / 分母) → inserts "a b/c" or "b/c"
//   symbol  — operators / brackets / equals / fraction slash
//   text    — native text input (Chinese/English typing via device keyboard)
//
// All modes write into a single `value` string. Submit fires when 確認 is pressed.

type Mode = 'number' | 'fraction' | 'symbol' | 'text'

type Props = {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export default function UnifiedKeyboard({ value, onChange, onSubmit, disabled }: Props) {
  const { t } = useLang()
  const [mode, setMode] = useState<Mode>('number')
  const [fracInt, setFracInt] = useState('')
  const [fracNum, setFracNum] = useState('')
  const [fracDen, setFracDen] = useState('')
  const [fracFocus, setFracFocus] = useState<'int' | 'num' | 'den'>('num')
  const textInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode === 'text' && textInputRef.current) textInputRef.current.focus()
  }, [mode])

  const append = (s: string) => { if (!disabled) onChange(value + s) }
  const backspace = () => { if (!disabled) onChange(value.slice(0, -1)) }
  const clear = () => { if (!disabled) onChange('') }

  const setFracField = (digit: string) => {
    if (digit === 'CLEAR') { setFracInt(''); setFracNum(''); setFracDen(''); return }
    if (digit === 'BS') {
      if (fracFocus === 'int') setFracInt((s) => s.slice(0, -1))
      if (fracFocus === 'num') setFracNum((s) => s.slice(0, -1))
      if (fracFocus === 'den') setFracDen((s) => s.slice(0, -1))
      return
    }
    if (fracFocus === 'int') setFracInt((s) => s + digit)
    if (fracFocus === 'num') setFracNum((s) => s + digit)
    if (fracFocus === 'den') setFracDen((s) => s + digit)
  }

  const insertFraction = () => {
    if (!fracNum || !fracDen) return  // need at least num + den
    let frac = ''
    if (fracInt) frac = `${fracInt} `
    frac += `${fracNum}/${fracDen}`
    // If main value is empty, just set it; otherwise append with space
    onChange(value ? `${value} ${frac}`.replace(/  +/g, ' ').trim() : frac)
    setFracInt(''); setFracNum(''); setFracDen('')
    setMode('number')
    setFracFocus('num')
  }

  const baseBtn = 'rounded-xl font-semibold transition-all active:scale-95 select-none'
  const numBtn = `${baseBtn} bg-white text-gray-800 border-2 border-gray-200 hover:border-teal-400`
  const symBtn = `${baseBtn} bg-white text-teal-700 border-2 border-teal-200 hover:bg-teal-50`
  const utilBtn = `${baseBtn} bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100`

  return (
    <div className="space-y-3">
      {/* ── Display ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 px-4 py-4 min-h-[64px] flex items-center justify-between gap-2">
        <div className="flex-1 text-2xl font-medium text-gray-800 break-all">
          {value
            ? <FractionDisplay value={value} />
            : <span className="text-gray-300 text-base">{t('輸入答案⋯')}</span>}
        </div>
        {value && (
          <button
            onClick={clear}
            disabled={disabled}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
          >
            {t('清除')}
          </button>
        )}
      </div>

      {/* ── Mode tabs ───────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-1.5">
        {(['number', 'fraction', 'symbol', 'text'] as Mode[]).map((m) => {
          const labels: Record<Mode, string> = {
            number: t('數字'),
            fraction: t('分數'),
            symbol: t('符號'),
            text: t('文字'),
          }
          const active = mode === m
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              disabled={disabled}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-teal-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {labels[m]}
            </button>
          )
        })}
      </div>

      {/* ── Keyboard area ──────────────────────────────────────── */}
      {mode === 'number' && (
        <div className="grid grid-cols-4 gap-2">
          {['7', '8', '9'].map((d) => (
            <button key={d} onClick={() => append(d)} disabled={disabled} className={`${numBtn} h-14 text-xl col-span-1`}>{d}</button>
          ))}
          <button onClick={backspace} disabled={disabled} className={`${utilBtn} h-14 text-xl`}>⌫</button>
          {['4', '5', '6'].map((d) => (
            <button key={d} onClick={() => append(d)} disabled={disabled} className={`${numBtn} h-14 text-xl col-span-1`}>{d}</button>
          ))}
          <button onClick={() => append(' ')} disabled={disabled} className={`${utilBtn} h-14 text-sm`}>{t('空格')}</button>
          {['1', '2', '3'].map((d) => (
            <button key={d} onClick={() => append(d)} disabled={disabled} className={`${numBtn} h-14 text-xl col-span-1`}>{d}</button>
          ))}
          <button onClick={() => append('.')} disabled={disabled} className={`${numBtn} h-14 text-xl`}>.</button>
          <button onClick={() => append('0')} disabled={disabled} className={`${numBtn} h-14 text-xl col-span-2`}>0</button>
          <button onClick={() => append('-')} disabled={disabled} className={`${numBtn} h-14 text-xl`}>−</button>
          <button onClick={() => append('/')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>/</button>
        </div>
      )}

      {mode === 'fraction' && (
        <div className="space-y-3">
          {/* Builder */}
          <div className="bg-teal-50 rounded-xl border-2 border-teal-200 p-3">
            <p className="text-xs text-teal-700 font-medium mb-2">{t('點選格仔，再按下面數字')}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setFracFocus('int')}
                className={`min-w-[60px] h-12 px-3 rounded-lg border-2 text-lg font-medium ${
                  fracFocus === 'int' ? 'border-teal-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}
              >
                {fracInt || <span className="text-gray-300 text-sm">{t('整數')}</span>}
              </button>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setFracFocus('num')}
                  className={`min-w-[50px] h-10 px-3 rounded-lg border-2 text-lg font-medium ${
                    fracFocus === 'num' ? 'border-teal-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-400'
                  }`}
                >
                  {fracNum || <span className="text-gray-300 text-sm">{t('分子')}</span>}
                </button>
                <div className="w-12 h-0.5 bg-gray-700 my-1" />
                <button
                  onClick={() => setFracFocus('den')}
                  className={`min-w-[50px] h-10 px-3 rounded-lg border-2 text-lg font-medium ${
                    fracFocus === 'den' ? 'border-teal-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-400'
                  }`}
                >
                  {fracDen || <span className="text-gray-300 text-sm">{t('分母')}</span>}
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['7', '8', '9'].map((d) => (
              <button key={d} onClick={() => setFracField(d)} disabled={disabled} className={`${numBtn} h-12 text-lg`}>{d}</button>
            ))}
            <button onClick={() => setFracField('BS')} disabled={disabled} className={`${utilBtn} h-12 text-lg`}>⌫</button>
            {['4', '5', '6'].map((d) => (
              <button key={d} onClick={() => setFracField(d)} disabled={disabled} className={`${numBtn} h-12 text-lg`}>{d}</button>
            ))}
            <button onClick={() => setFracField('CLEAR')} disabled={disabled} className={`${utilBtn} h-12 text-xs`}>{t('全清')}</button>
            {['1', '2', '3'].map((d) => (
              <button key={d} onClick={() => setFracField(d)} disabled={disabled} className={`${numBtn} h-12 text-lg`}>{d}</button>
            ))}
            <button
              onClick={insertFraction}
              disabled={disabled || !fracNum || !fracDen}
              className={`${baseBtn} h-12 text-sm bg-teal-500 text-white disabled:opacity-40`}
            >
              {t('插入')}
            </button>
            <button onClick={() => setFracField('0')} disabled={disabled} className={`${numBtn} h-12 text-lg col-span-4`}>0</button>
          </div>
        </div>
      )}

      {mode === 'symbol' && (
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => append('+')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>+</button>
          <button onClick={() => append('-')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>−</button>
          <button onClick={() => append('×')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>×</button>
          <button onClick={() => append('÷')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>÷</button>
          <button onClick={() => append('(')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>(</button>
          <button onClick={() => append(')')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>)</button>
          <button onClick={() => append('/')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>/</button>
          <button onClick={() => append('=')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>=</button>
          <button onClick={() => append('²')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>x²</button>
          <button onClick={() => append('>')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>&gt;</button>
          <button onClick={() => append('<')} disabled={disabled} className={`${symBtn} h-14 text-xl`}>&lt;</button>
          <button onClick={() => append(',')} disabled={disabled} className={`${symBtn} h-14 text-xl font-bold`}>,</button>
          <button onClick={() => append(':')} disabled={disabled} className={`${symBtn} h-14 text-xl font-bold`}>:</button>
          <button onClick={backspace} disabled={disabled} className={`${utilBtn} h-14 text-xl col-span-2`}>⌫</button>
        </div>
      )}

      {mode === 'text' && (
        <div className="space-y-2">
          <input
            ref={textInputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && value.trim() && !disabled) onSubmit() }}
            disabled={disabled}
            placeholder={t('用裝置鍵盤打字（中/英文）')}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-teal-400 disabled:bg-gray-50"
            inputMode="text"
            autoFocus
          />
          <p className="text-xs text-gray-400 text-center">
            {t('手機會自動彈出鍵盤；想用計算機按鈕請揀「數字」')}
          </p>
        </div>
      )}

      {/* ── Submit ─────────────────────────────────────────────── */}
      <button
        onClick={() => { if (value.trim() && !disabled) onSubmit() }}
        disabled={disabled || !value.trim()}
        className="w-full py-4 rounded-xl text-white font-semibold text-base disabled:opacity-40 transition-all"
        style={{ backgroundColor: '#1D9E75' }}
      >
        {t('確認')}
      </button>
    </div>
  )
}
