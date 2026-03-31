import { useEffect, useRef, useState } from 'react'

const SIZE = 280
const STROKE = 22
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R
// Arc covers 240° (leaving 120° gap at the bottom)
const ARC_FRAC = 240 / 360
const GAP_OFFSET = (1 - ARC_FRAC) / 2 // rotate so gap is at bottom

function scoreColor(s) {
  if (s >= 7.5) return '#ef4444'   // red  — very high similarity
  if (s >= 5)   return '#f97316'   // orange — moderate
  if (s >= 3)   return '#eab308'   // yellow
  return '#22c55e'                  // green — low similarity = publishable
}

function scoreLabel(s) {
  if (s >= 7.5) return { text: 'VERY HIGH SIMILARITY', sub: 'Content is highly duplicated' }
  if (s >= 5)   return { text: 'MODERATE SIMILARITY',  sub: 'Significant overlap detected' }
  if (s >= 3)   return { text: 'LOW SIMILARITY',       sub: 'Minor similarities found' }
  return              { text: 'ORIGINAL CONTENT',      sub: 'Content appears unique' }
}

export default function ScoreGauge({ score, animating }) {
  const [displayed, setDisplayed] = useState(0)
  const [arcFill, setArcFill]   = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (animating) return
    const target = score
    const duration = 1600
    startRef.current = null

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(parseFloat((eased * target).toFixed(2)))
      setArcFill(eased * (target / 10))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [score, animating])

  const color = scoreColor(score)
  const { text: statusText, sub: statusSub } = scoreLabel(score)

  // SVG arc math
  const dashArr  = CIRC * ARC_FRAC
  const dashOff  = CIRC * (1 - ARC_FRAC)
  const rotation = 90 + (1 - ARC_FRAC) * 180   // rotate so gap is centered at bottom

  const filledLen  = dashArr * arcFill
  const trackColor = 'rgba(255,255,255,0.07)'

  return (
    <div className="gauge-wrap">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track arc */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke={trackColor}
          strokeWidth={STROKE}
          strokeDasharray={`${dashArr} ${CIRC - dashArr}`}
          strokeDashoffset={-CIRC * GAP_OFFSET}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${SIZE / 2} ${SIZE / 2})`}
        />
        {/* Filled arc */}
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${filledLen} ${CIRC - filledLen}`}
          strokeDashoffset={-CIRC * GAP_OFFSET}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${SIZE / 2} ${SIZE / 2})`}
          style={{
            filter: `drop-shadow(0 0 10px ${color}88)`,
            transition: 'stroke 0.4s ease',
          }}
        />

        {/* Score number */}
        <text
          x={SIZE / 2} y={SIZE / 2 - 10}
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
          x={SIZE / 2} y={SIZE / 2 + 38}
          textAnchor="middle"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="13"
          fill="rgba(255,255,255,0.35)"
          letterSpacing="2"
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