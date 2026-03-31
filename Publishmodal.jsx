import { useEffect, useRef, useState } from 'react'

function AlgoRow({ algo, delay }) {
  const [width, setWidth] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => setWidth(algo.raw * 100), delay)
    return () => clearTimeout(timerRef.current)
  }, [algo.raw, delay])

  const pct = (algo.raw * 100).toFixed(1)
  const barColor =
    algo.raw >= 0.75 ? '#ef4444'
    : algo.raw >= 0.5 ? '#f97316'
    : algo.raw >= 0.3 ? '#eab308'
    : '#22c55e'

  return (
    <div className="algo-row">
      <div className="algo-row-header">
        <span className="algo-label">{algo.label}</span>
        <span className="algo-pct" style={{ color: barColor }}>{pct}%</span>
      </div>
      <p className="algo-desc">{algo.desc}</p>
      <div className="algo-track">
        <div
          className="algo-fill"
          style={{
            width: `${width}%`,
            background: barColor,
            boxShadow: `0 0 8px ${barColor}55`,
            transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
    </div>
  )
}

export default function AlgoBreakdown({ results }) {
  return (
    <div className="algo-breakdown">
      <h3 className="breakdown-title">
        <span className="breakdown-dot" />
        Algorithm Breakdown
      </h3>
      <div className="algo-list">
        {results.map((r, i) => (
          <AlgoRow key={r.key} algo={r} delay={200 + i * 120} />
        ))}
      </div>
      <div className="breakdown-note">
        Mean score is computed as the unweighted average of all 5 algorithm scores.
      </div>
    </div>
  )
}