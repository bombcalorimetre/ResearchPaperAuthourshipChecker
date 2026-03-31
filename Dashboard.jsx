import { useState } from 'react'
import ScoreGauge from './ScoreGauge'
import AlgoBreakdown from './AlgoBreakdown'
import PublishModal from './PublishModal'
import { computeAllScores } from '../utils/similarity'
import UploadZone from './UploadZone'

export default function Dashboard() {
  const [phase, setPhase]       = useState('idle')   // idle | computing | result
  const [fileInfo, setFileInfo] = useState(null)
  const [result, setResult]     = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleData = (data) => {
    setFileInfo(data)
    setPhase('computing')

    // run in next tick so React re-renders the computing state first
    setTimeout(() => {
      const res = computeAllScores(data.texts)
      setResult(res)
      setPhase('result')
    }, 80)
  }

  const reset = () => {
    setPhase('idle')
    setFileInfo(null)
    setResult(null)
    setShowModal(false)
  }

  const canPublish = result && result.meanScore < 5

  return (
    <div className="dashboard">
      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand-mark">◈</span>
          <span className="brand-name">SimCheck</span>
          <span className="brand-version">v2.0</span>
        </div>
        <div className="topbar-center">
          <span className="topbar-subtitle">JSON Similarity Dashboard</span>
        </div>
        <div className="topbar-right">
          {phase === 'result' && (
            <button className="topbar-btn" onClick={reset}>↩ New Analysis</button>
          )}
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="dash-main">

        {/* ── LEFT PANEL ── */}
        <aside className="left-panel">
          <div className="panel-card">
            <div className="panel-label">DATA SOURCE</div>

            {phase === 'idle' ? (
              <UploadZone onData={handleData} />
            ) : (
              <div className="file-summary">
                <div className="file-summary-icon">📄</div>
                <div className="file-summary-info">
                  <span className="file-name">{fileInfo?.filename}</span>
                  <span className="file-meta">
                    {fileInfo?.count} items
                    {fileInfo?.field ? ` · field: "${fileInfo.field}"` : ''}
                  </span>
                </div>
                <button className="file-reset" onClick={reset} title="Reset">✕</button>
              </div>
            )}
          </div>

          {/* Algo info cards */}
          <div className="panel-card algo-info-card">
            <div className="panel-label">ALGORITHMS</div>
            {[
              ['01', 'Cosine TF-IDF',   'Vector space model'],
              ['02', 'Jaccard Index',   'Set intersection ratio'],
              ['03', 'Levenshtein',     'Edit distance'],
              ['04', 'Dice Coefficient','Bigram overlap'],
              ['05', 'LCS Ratio',       'Common subsequence'],
            ].map(([n, name, desc]) => (
              <div key={n} className={`algo-info-row ${phase === 'result' ? 'active' : ''}`}>
                <span className="algo-num">{n}</span>
                <div>
                  <span className="algo-info-name">{name}</span>
                  <span className="algo-info-desc">{desc}</span>
                </div>
                {phase === 'result' && <span className="algo-check">✓</span>}
              </div>
            ))}
          </div>

          {/* Threshold legend */}
          <div className="panel-card legend-card">
            <div className="panel-label">SCORE LEGEND</div>
            {[
              ['< 3.0',   '#22c55e', 'Original'],
              ['3.0–5.0', '#eab308', 'Low similarity'],
              ['5.0–7.5', '#f97316', 'Moderate'],
              ['> 7.5',   '#ef4444', 'High / Duplicate'],
            ].map(([range, color, label]) => (
              <div key={range} className="legend-row">
                <span className="legend-dot" style={{ background: color }} />
                <span className="legend-range">{range}</span>
                <span className="legend-label">{label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── CENTER PANEL ── */}
        <section className="center-panel">
          {phase === 'idle' && (
            <div className="center-idle">
              <div className="idle-icon">◈</div>
              <p className="idle-title">Upload a JSON file to begin</p>
              <p className="idle-sub">The mean similarity score will appear here</p>
            </div>
          )}

          {phase === 'computing' && (
            <div className="center-idle">
              <div className="computing-ring" />
              <p className="idle-title">Running algorithms…</p>
              <p className="idle-sub">Computing 5 similarity metrics</p>
            </div>
          )}

          {phase === 'result' && result && (
            <div className="center-result">
              {/* Big score label */}
              <div className="score-headline">
                <span className="score-headline-label">MEAN SIMILARITY SCORE</span>
              </div>

              {/* Gauge */}
              <ScoreGauge score={result.meanScore} animating={false} />

              {/* Score breakdown micro bar */}
              <div className="score-bar-row">
                <span className="score-bar-0">0</span>
                <div className="score-bar-track">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${result.meanScore * 10}%`,
                      background: result.meanScore < 5 ? '#22c55e' : result.meanScore < 7.5 ? '#f97316' : '#ef4444',
                    }}
                  />
                  {/* Threshold line */}
                  <div className="score-threshold-line" style={{ left: '50%' }}>
                    <span className="threshold-tip">PUBLISH THRESHOLD</span>
                  </div>
                </div>
                <span className="score-bar-10">10</span>
              </div>

              {/* Publish / Block banner */}
              {canPublish ? (
                <div className="publish-banner ok">
                  <div className="banner-left">
                    <span className="banner-icon">✓</span>
                    <div>
                      <p className="banner-title">Cleared for Publication</p>
                      <p className="banner-sub">
                        Similarity score ({result.meanScore}/10) is below the 5.0 threshold.
                      </p>
                    </div>
                  </div>
                  <button className="publish-btn" onClick={() => setShowModal(true)}>
                    Publish →
                  </button>
                </div>
              ) : (
                <div className="publish-banner block">
                  <div className="banner-left">
                    <span className="banner-icon">✗</span>
                    <div>
                      <p className="banner-title">Publication Blocked</p>
                      <p className="banner-sub">
                        Score ({result.meanScore}/10) exceeds the 5.0 threshold.
                        Content shows significant similarity.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── RIGHT PANEL ── */}
        <aside className="right-panel">
          {phase === 'result' && result ? (
            <>
              <AlgoBreakdown results={result.individual} />
              {/* Stats mini-cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-val">{fileInfo?.count}</span>
                  <span className="stat-lbl">Items</span>
                </div>
                <div className="stat-card">
                  <span className="stat-val">
                    {((fileInfo?.count * (fileInfo?.count - 1)) / 2)}
                  </span>
                  <span className="stat-lbl">Pairs</span>
                </div>
                <div className="stat-card">
                  <span className="stat-val">5</span>
                  <span className="stat-lbl">Algorithms</span>
                </div>
                <div className="stat-card">
                  <span className="stat-val"
                    style={{ color: result.meanScore < 5 ? '#22c55e' : '#ef4444' }}>
                    {result.meanScore < 5 ? 'PASS' : 'FAIL'}
                  </span>
                  <span className="stat-lbl">Status</span>
                </div>
              </div>
            </>
          ) : (
            <div className="panel-card right-placeholder">
              <div className="panel-label">ANALYSIS OUTPUT</div>
              <p className="placeholder-text">
                Algorithm scores and breakdowns will appear here after analysis.
              </p>
              <div className="placeholder-rows">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="placeholder-row">
                    <div className="ph-line ph-short" />
                    <div className="ph-line ph-long" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

      </main>

      {/* ── Publish Modal ── */}
      {showModal && (
        <PublishModal
          score={result?.meanScore}
          filename={fileInfo?.filename}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}