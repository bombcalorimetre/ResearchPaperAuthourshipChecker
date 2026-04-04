import { useEffect, useRef, useState } from 'react'

const SIZE      = 280
const STROKE    = 22
const R         = (SIZE - STROKE) / 2
const CIRC      = 2 * Math.PI * R
const ARC_FRAC  = 240 / 360                     // 240° arc, 120° gap at bottom
const GAP_OFF   = (1 - ARC_FRAC) / 2
const ROTATION  = 90 + (1 - ARC_FRAC) * 180    // gap centred at bottom

function scoreColor(s) {
  if (s >= 8.0) return '#ef4444'
  if (s >= 6.0) return '#f97316'
  if (s >= 3.0) return '#eab308'
  return '#22c55e'
}

function scoreLabel(s) {
  if (s >= 8.0) return { text: 'VERY HIGH SIMILARITY',  sub: 'Content is heavily duplicated' }
  if (s >= 6.0) return { text: 'MODERATE SIMILARITY',   sub: 'Significant overlap detected' }
  if (s >= 3.0) return { text: 'LOW SIMILARITY',        sub: 'Minor similarities found' }
  return              { text: 'ORIGINAL CONTENT',       sub: 'Content appears sufficiently unique' }
}

export default function ScoreGauge({ score }) {
  const [displayed, setDisplayed] = useState(0)
  const [fill, setFill]           = useState(0)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const target   = score
    const duration = 1600
    startRef.current = null
    cancelAnimationFrame(rafRef.current)

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed  = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)   // ease-out cubic
      setDisplayed(parseFloat((eased * target).toFixed(2)))
      setFill(eased * (target / 10))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [score])

  const color      = scoreColor(score)
  const { text: statusText, sub: statusSub } = scoreLabel(score)
  const dashArr    = CIRC * ARC_FRAC
  const filledLen  = dashArr * fill

  return (
    <div className="gauge-wrap">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={STROKE}
          strokeDasharray={`${dashArr} ${CIRC - dashArr}`}
          strokeDashoffset={-CIRC * GAP_OFF}
          strokeLinecap="round"
          transform={`rotate(${ROTATION} ${SIZE / 2} ${SIZE / 2})`}
        />
        {/* Fill */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${filledLen} ${CIRC - filledLen}`}
          strokeDashoffset={-CIRC * GAP_OFF}
          strokeLinecap="round"
          transform={`rotate(${ROTATION} ${SIZE / 2} ${SIZE / 2})`}
          style={{ filter: `drop-shadow(0 0 10px ${color}88)`, transition: 'stroke 0.4s ease' }}
        />
        {/* Score number */}
        <text
          x={SIZE / 2} y={SIZE / 2 - 12}
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="'Bebas Neue', sans-serif"
          fontSize="72"
          fill={color}
          style={{ transition: 'fill 0.4s ease' }}
        >
          {displayed.toFixed(1)}
        </text>
        {/* /10 label */}
        <text
          x={SIZE / 2} y={SIZE / 2 + 36}
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="12"
          fill="rgba(255,255,255,0.3)"
          letterSpacing="3"
        >
          OUT OF 10
        </text>
      </svg>

      <div className="gauge-status">
        <span className="gauge-status-text" style={{ color }}>{statusText}</span>
        <span className="gauge-status-sub">{statusSub}</span>
      </div>
    </div>
  )
}