import { useState } from 'react'
import UploadZone    from './UploadZone'
import ScoreGauge    from './ScoreGauge'
import AlgoBreakdown from './AlgoBreakdown'
import PublishModal  from './PublishModal'
import { computeAllScores } from '../utils/similarity'
import { api }              from '../utils/api'

/* ── helper: colour by score ── */
function scoreColor(s) {
  if (s >= 7.5) return '#ef4444'
  if (s >= 5.0) return '#f97316'
  if (s >= 3.0) return '#eab308'
  return '#22c55e'
}

export default function Dashboard() {
  const [phase,      setPhase]      = useState('idle')   // idle | computing | result
  const [fileInfo,   setFileInfo]   = useState(null)
  const [result,     setResult]     = useState(null)
  const [resultId,   setResultId]   = useState(null)     // from backend if available
  const [showModal,  setShowModal]  = useState(false)
  const [published,  setPublished]  = useState(false)

  /* ── receive parsed data from UploadZone ── */
  function handleData(data) {
    setFileInfo(data)
    setPhase('computing')
    setPublished(false)
    setResultId(null)

    setTimeout(async () => {
      // Always run client-side for instant feedback
      const clientResult = computeAllScores(data.texts)
      setResult(clientResult)
      setPhase('result')

      // Also send to backend to persist (best-effort)
      try {
        const resp = await api.similarity.analyze(
          null,
          data.texts,
          data.labels
        )
        if (resp.success) setResultId(resp.data.id)
      } catch {
        // backend offline — no problem, client result is shown
      }
    }, 80)
  }

  function reset() {
    setPhase('idle')
    setFileInfo(null)
    setResult(null)
    setResultId(null)
    setShowModal(false)
    setPublished(false)
  }

  const canPublish = result && result.meanScore < 5.0

  return (
    <div className="dashboard">

      {/* ════ TOPBAR ════ */}
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

      {/* ════ MAIN 3-COLUMN GRID ════ */}
      <main className="dash-main">

        {/* ── LEFT PANEL ── */}
        <aside className="left-panel">

          {/* Data source card */}
          <div className="panel-card">
            <div className="panel-label">DATA SOURCE</div>
            {phase === 'idle' ? (
              <UploadZone onData={handleData} />
            ) : (
              <div className="file-summary">
                <span className="file-summary-icon">📄</span>
                <div className="file-summary-info">
                  <span className="file-name">{fileInfo?.filename}</span>
                  <span className="file-meta">
                    {fileInfo?.count} items
                    {fileInfo?.field ? ` · field: "${fileInfo.field}"` : ''}
                    {resultId ? ` · ${resultId}` : ''}
                  </span>
                </div>
                <button className="file-reset" onClick={reset} title="Reset">✕</button>
              </div>
            )}
          </div>

          {/* Algorithm list */}
          <div className="panel-card algo-info-card">
            <div className="panel-label">ALGORITHMS</div>
            {[
              ['ALG001', 'Cosine TF-IDF',   'Vector space model'],
              ['ALG002', 'Jaccard Index',    'Set intersection ratio'],
              ['ALG003', 'Levenshtein',      'Edit distance'],
              ['ALG004', 'Dice Coefficient', 'Bigram overlap'],
              ['ALG005', 'LCS Ratio',        'Common subsequence'],
            ].map(([id, name, desc]) => (
              <div key={id} className={`algo-info-row ${phase === 'result' ? 'active' : ''}`}>
                <span className="algo-num">{id}</span>
                <div className="algo-info-text">
                  <span className="algo-info-name">{name}</span>
                  <span className="algo-info-desc">{desc}</span>
                </div>
                {phase === 'result' && <span className="algo-check">✓</span>}
              </div>
            ))}
          </div>

          {/* Score legend */}
          <div className="panel-card legend-card">
            <div className="panel-label">SCORE LEGEND</div>
            {[
              ['0.0 – 3.0', '#22c55e', 'Original'],
              ['3.0 – 5.0', '#eab308', 'Low similarity'],
              ['5.0 – 7.5', '#f97316', 'Moderate — blocked'],
              ['7.5 – 10',  '#ef4444', 'High / Duplicate'],
            ].map(([range, color, label]) => (
              <div key={range} className="legend-row">
                <span className="legend-dot" style={{ background: color }} />
                <span className="legend-range">{range}</span>
                <span className="legend-label">{label}</span>
              </div>
            ))}
            <div className="legend-threshold">
              Publish threshold: <strong>5.0 / 10</strong>
            </div>
          </div>

        </aside>

        {/* ── CENTER PANEL ── */}
        <section className="center-panel">

          {phase === 'idle' && (
            <div className="center-idle">
              <div className="idle-icon">◈</div>
              <p className="idle-title">Upload a JSON file to begin</p>
              <p className="idle-sub">Mean similarity score will appear here</p>
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

              <p className="score-headline-label">MEAN SIMILARITY SCORE</p>

              {/* Animated gauge */}
              <ScoreGauge score={result.meanScore} />

              {/* Progress bar with threshold line */}
              <div className="score-bar-row">
                <span className="score-bar-end">0</span>
                <div className="score-bar-track">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${result.meanScore * 10}%`,
                      background: scoreColor(result.meanScore),
                      transition: 'width 1.4s cubic-bezier(0.16,1,0.3,1)',
                    }}
                  />
                  <div className="threshold-line">
                    <span className="threshold-tip">PUBLISH THRESHOLD (5.0)</span>
                  </div>
                </div>
                <span className="score-bar-end">10</span>
              </div>

              {/* Publish / block banner */}
              {published ? (
                <div className="publish-banner published">
                  <span className="banner-icon">✓</span>
                  <div>
                    <p className="banner-title">Content Published</p>
                    <p className="banner-sub">Successfully published — {resultId || fileInfo?.filename}</p>
                  </div>
                </div>
              ) : canPublish ? (
                <div className="publish-banner ok">
                  <div className="banner-left">
                    <span className="banner-icon">✓</span>
                    <div>
                      <p className="banner-title">Cleared for Publication</p>
                      <p className="banner-sub">
                        Score ({result.meanScore}/10) is below the 5.0 threshold.
                      </p>
                    </div>
                  </div>
                  <button className="publish-cta" onClick={() => setShowModal(true)}>
                    Publish →
                  </button>
                </div>
              ) : (
                <div className="publish-banner block">
                  <span className="banner-icon">✗</span>
                  <div>
                    <p className="banner-title">Publication Blocked</p>
                    <p className="banner-sub">
                      Score ({result.meanScore}/10) exceeds the 5.0 threshold.
                      Content shows significant similarity.
                    </p>
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

              {/* Stats mini-grid */}
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
                  <span
                    className="stat-val"
                    style={{ color: canPublish ? '#22c55e' : '#ef4444' }}
                  >
                    {published ? 'DONE' : canPublish ? 'PASS' : 'FAIL'}
                  </span>
                  <span className="stat-lbl">Status</span>
                </div>
              </div>
            </>
          ) : (
            <div className="panel-card right-placeholder">
              <div className="panel-label">ANALYSIS OUTPUT</div>
              <p className="placeholder-text">
                Per-algorithm scores and statistics will appear here after analysis.
              </p>
              <div className="placeholder-rows">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="placeholder-row">
                    <div className="ph-line ph-short" />
                    <div className="ph-line ph-long"  />
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>
      </main>

      {/* ════ PUBLISH MODAL ════ */}
      {showModal && (
        <PublishModal
          score={result?.meanScore}
          filename={fileInfo?.filename}
          resultId={resultId}
          onClose={() => setShowModal(false)}
          onPublished={() => { setPublished(true); setShowModal(false) }}
        />
      )}
    </div>
  )
}