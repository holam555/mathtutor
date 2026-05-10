/**
 * Renders fraction and mixed-number strings visually.
 *
 * Handles:
 *   "1/2"       → proper fraction
 *   "2又1/2"    → mixed number
 *   "2 1/2"     → mixed number (normalised form)
 *   anything else → plain text unchanged
 *
 * Usage:
 *   <FractionDisplay value="2又1/2" />
 *   <FractionDisplay value="3/4" className="text-white text-lg" />
 */

type Props = {
  value: string
  className?: string
}

type Parsed =
  | { kind: 'mixed'; whole: string; num: string; den: string }
  | { kind: 'fraction'; num: string; den: string }
  | { kind: 'plain'; text: string }

function parse(raw: string): Parsed {
  const s = raw.replace(/又/g, ' ').trim()

  // Mixed number: "2 1/2" or "-2 1/2"
  const mixed = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return { kind: 'mixed', whole: mixed[1], num: mixed[2], den: mixed[3] }

  // Pure fraction: "1/2"
  const frac = s.match(/^(-?\d+)\/(\d+)$/)
  if (frac) return { kind: 'fraction', num: frac[1], den: frac[2] }

  return { kind: 'plain', text: raw }
}

function Frac({ num, den }: { num: string; den: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1.15,
        verticalAlign: 'middle',
        fontSize: '0.8em',
        gap: 0,
      }}
    >
      <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{num}</span>
      <span
        style={{
          borderTop: '1.5px solid currentColor',
          width: '100%',
          minWidth: '1.2em',
          display: 'block',
        }}
      />
      <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{den}</span>
    </span>
  )
}

export default function FractionDisplay({ value, className }: Props) {
  const parsed = parse(value)

  if (parsed.kind === 'plain') {
    return <span className={className}>{value}</span>
  }

  if (parsed.kind === 'fraction') {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
      >
        <Frac num={parsed.num} den={parsed.den} />
      </span>
    )
  }

  // mixed
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15em', verticalAlign: 'middle' }}
    >
      <span>{parsed.whole}</span>
      <Frac num={parsed.num} den={parsed.den} />
    </span>
  )
}

/**
 * Parses inline text that may contain fractions embedded in Chinese sentences.
 * e.g. "小明有2又1/2個蘋果" → renders the fraction visually, surrounding text as plain spans.
 *
 * Usage: <InlineMath text="答案是1/2" />
 */
const FRAC_PATTERN = /(-?\d+\s+\d+\/\d+|-?\d+又\d+\/\d+|-?\d+\/\d+)/g
const FRAC_TEST = /^(-?\d+\s+\d+\/\d+|-?\d+又\d+\/\d+|-?\d+\/\d+)$/

export function InlineMath({ text, className }: { text: string; className?: string }) {
  const parts = text.split(FRAC_PATTERN)

  return (
    <span className={className}>
      {parts.map((part, i) =>
        FRAC_TEST.test(part) ? (
          <FractionDisplay key={i} value={part} />
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

/**
 * Renders a question's text body. Recognises:
 *   - Markdown tables (lines starting with "|"). Consecutive `|`-rows
 *     become an HTML <table>. The line right after the header that
 *     looks like `| --- | --- |` (separator) is dropped.
 *   - Plain lines pass through InlineMath (which renders fractions).
 *   - Empty lines render as a small vertical gap.
 *
 * Designed for question_text where data is best presented as a table
 * (e.g. a sales chart over 6 months). Falls back to plain rendering
 * if the text has no table.
 *
 * Usage: <QuestionContent text={question.question_text} />
 */
export function QuestionContent({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n')
  type Block = { kind: 'text'; lines: string[] } | { kind: 'table'; rows: string[][] }
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trimStart().startsWith('|')) {
      // Collect consecutive table lines
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const rows = tableLines
        .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, ''))
        .map((l) => l.split('|').map((c) => c.trim()))
        // Drop separator rows like ["---", "---", ":---:"]
        .filter((cells) => !cells.every((c) => /^:?-{3,}:?$/.test(c)))
      blocks.push({ kind: 'table', rows })
    } else {
      const textLines: string[] = []
      while (i < lines.length && !lines[i].trimStart().startsWith('|')) {
        textLines.push(lines[i])
        i++
      }
      blocks.push({ kind: 'text', lines: textLines })
    }
  }

  return (
    <span className={className}>
      {blocks.map((b, bi) =>
        b.kind === 'table' ? (
          <table
            key={bi}
            className="my-2 border-collapse text-sm"
            style={{ borderCollapse: 'collapse' }}
          >
            <tbody>
              {b.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => {
                    const isHeader = ri === 0
                    const Tag = isHeader ? 'th' : 'td'
                    return (
                      <Tag
                        key={ci}
                        className={
                          'border border-gray-300 px-2 py-1 ' +
                          (isHeader ? 'bg-gray-100 font-semibold' : '')
                        }
                      >
                        <InlineMath text={cell} />
                      </Tag>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span key={bi} className="whitespace-pre-wrap">
            <InlineMath text={b.lines.join('\n')} />
          </span>
        )
      )}
    </span>
  )
}
