interface ProgressCircleProps {
  pct: number   // 0–100
  size?: number
  strokeWidth?: number
}

export default function ProgressCircle({
  pct,
  size = 52,
  strokeWidth = 5,
}: ProgressCircleProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const filled = circ * Math.min(Math.max(pct, 0), 100) / 100

  const color =
    pct >= 80 ? '#4CAF50' : pct >= 50 ? '#4A90E2' : '#F44336'

  return (
    <svg width={size} height={size} aria-label={`${pct}%`}>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Percentage text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="600"
        fill={color}
      >
        {pct}%
      </text>
    </svg>
  )
}
