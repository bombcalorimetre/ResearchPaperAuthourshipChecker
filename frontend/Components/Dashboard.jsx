import { useState, useEffect } from 'react'
import UploadZone    from './Uploadzone'
import ScoreGauge    from './Scoregauge'
import AlgoBreakdown from './Algobreakdown'
import PublishModal  from './Publishmodal'
import { computeAllScores } from '../utils/Similarity'
import { api }              from '../utils/Api'

/* ── helper: colour by score ── */
function scoreColor(s) {
  if (s >= 8.0) return '#ef4444'
  if (s >= 6.0) return '#f97316'
  if (s >= 3.0) return '#eab308'
  return '#22c55e'
}

function PublishedResultsView() {
  const [publishedResults, setPublishedResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublishedResults()
  }, [])

  async function fetchPublishedResults() {
    try {
      const resp = await api.results.list()
      if (resp.success) {
        const published = resp.data.filter(r => r.status === 'published')
        setPublishedResults(published)
      }
    } catch (err) {
      console.error('Failed to fetch results:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="center-idle">
        <div className="computing-ring" />
        <p className="idle-title">Loading published results…</p>
      </div>
    )
  }

  if (publishedResults.length === 0) {
    return (
      <div className="center-idle">
        <div className="idle-icon">📋</div>
        <p className="idle-title">No published results yet</p>
        <p className="idle-sub">Analyze files and publish them to see them here</p>
      </div>
    )
  }

  return (
    <div className="published-results">
      <div className="results-header">
        <h2>Published Results</h2>
        <p className="results-count">Total: {publishedResults.length} published</p>
      </div>
      <div className="results-grid">
        {publishedResults.map((result) => (
          <div key={result.id} className="result-card">
            <div className="result-card-header">
              <div className="result-id">{result.id}</div>
              <div className="result-score" style={{ color: scoreColor(result.meanScore) }}>
                {result.meanScore}/10
              </div>
            </div>
            
            <div className="result-meta">
              <p><strong>Published:</strong> {new Date(result.publishedAt).toLocaleString()}</p>
              <p><strong>Analyzed:</strong> {new Date(result.analyzedAt).toLocaleString()}</p>
              <p><strong>Items:</strong> {result.labels.length}</p>
            </div>

            <div className="result-labels">
              <p className="label-title">Items Analyzed:</p>
              <div className="labels-list">
                {result.labels.map((label, i) => (
                  <span key={i} className="label-badge">{label}</span>
                ))}
              </div>
            </div>

            <div className="result-scores">
              <p className="scores-title">Algorithm Scores:</p>
              <div className="scores-breakdown">
                <div className="score-item">
                  <span>Cosine TF-IDF:</span>
                  <span className="score-val">{(result.scores.cosine * 10).toFixed(2)}</span>
                </div>
                <div className="score-item">
                  <span>Jaccard:</span>
                  <span className="score-val">{(result.scores.jaccard * 10).toFixed(2)}</span>
                </div>
                <div className="score-item">
                  <span>Levenshtein:</span>
                  <span className="score-val">{(result.scores.levenshtein * 10).toFixed(2)}</span>
                </div>
                <div className="score-item">
                  <span>Dice:</span>
                  <span className="score-val">{(result.scores.dice * 10).toFixed(2)}</span>
                </div>
                <div className="score-item">
                  <span>LCS:</span>
                  <span className="score-val">{(result.scores.lcs * 10).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="result-status">
              <span className="status-badge published">✓ Published</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [tab, setTab] = useState('analysis')  // analysis | published
  const [phase, setPhase] = useState('idle')  // idle | computing | result
  const [fileInfo, setFileInfo] = useState(null)
  const [result, setResult] = useState(null)
  const [resultId, setResultId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [published, setPublished] = useState(false)

  /* ── receive parsed data from UploadZone ── */
  function handleData(data) {
    setFileInfo(data)
    setPhase('computing')
    setPublished(false)
    setResultId(null)

    setTimeout(async () => {
      const clientResult = computeAllScores(data.texts)
      setResult(clientResult)
      setPhase('result')

      try {
        const resp = await api.similarity.analyze(null, data.texts, data.labels)
        if (resp.success) setResultId(resp.data.id)
      } catch {
        // backend offline
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

  const canPublish = result && result.meanScore < 6.0

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
          <div className="tab-nav">
            <button
              className={`tab-btn ${tab === 'analysis' ? 'active' : ''}`}
              onClick={() => { setTab('analysis'); reset() }}
            >
              📊 Analysis
            </button>
            <button
              className={`tab-btn ${tab === 'published' ? 'active' : ''}`}
              onClick={() => setTab('published')}
            >
              📋 Published Results
            </button>
          </div>
        </div>
        <div className="topbar-right">
          {tab === 'analysis' && phase === 'result' && (
            <button className="topbar-btn" onClick={reset}>↩ New Analysis</button>
          )}
        </div>
      </header>

      {/* ════ MAIN CONTENT ════ */}
      {tab === 'analysis' ? (
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
                ['3.0 – 6.0', '#eab308', 'Low similarity'],
                ['6.0 – 8.0', '#f97316', 'Moderate — blocked'],
                ['8.0 – 10',  '#ef4444', 'High / Duplicate'],
              ].map(([range, color, label]) => (
                <div key={range} className="legend-row">
                  <span className="legend-dot" style={{ background: color }} />
                  <span className="legend-range">{range}</span>
                  <span className="legend-label">{label}</span>
                </div>
              ))}
              <div className="legend-threshold">
                Publish threshold: <strong>6.0 / 10</strong>
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
                      <span className="threshold-tip">PUBLISH THRESHOLD (6.0)</span>
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
                          Score ({result.meanScore}/10) is below the 6.0 threshold.
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
                        Score ({result.meanScore}/10) exceeds the 6.0 threshold.
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
      ) : (
        <main className="dash-main full-width">
          <PublishedResultsView />
        </main>
      )}

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