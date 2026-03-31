import { useState } from 'react'
import { api } from '../utils/api'

export default function PublishModal({ score, filename, resultId, onClose, onPublished }) {
  const [step, setStep]   = useState('confirm')  // confirm | publishing | done | error
  const [errMsg, setErrMsg] = useState('')

  async function handlePublish() {
    setStep('publishing')
    try {
      if (resultId) {
        // real backend publish
        await api.similarity.publish(resultId)
      } else {
        // offline / file-upload mode — simulate
        await new Promise(r => setTimeout(r, 1600))
      }
      setStep('done')
      onPublished && onPublished()
    } catch (e) {
      setErrMsg(e.message || 'Publish failed.')
      setStep('error')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        {/* ── confirm ── */}
        {step === 'confirm' && (
          <>
            <div className="modal-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" stroke="#22c55e" strokeWidth="2" />
                <path d="M11 18.5l5 5 9-9" stroke="#22c55e" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="modal-title">Ready to Publish</h2>
            <p className="modal-body">
              Mean similarity score is{' '}
              <strong style={{ color: '#22c55e' }}>{score}/10</strong> — below the
              threshold of <strong>5.0</strong>. This content is considered sufficiently
              original and cleared for publication.
            </p>
            <p className="modal-file">{filename}</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={onClose}>Cancel</button>
              <button className="modal-publish-btn" onClick={handlePublish}>
                Publish Content →
              </button>
            </div>
          </>
        )}

        {/* ── publishing ── */}
        {step === 'publishing' && (
          <div className="modal-loading">
            <div className="spinner" />
            <p>Publishing…</p>
          </div>
        )}

        {/* ── done ── */}
        {step === 'done' && (
          <>
            <div className="modal-icon big">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="24" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="2" />
                <path d="M14 26.5l8 8 16-16" stroke="#22c55e" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="modal-title">Published!</h2>
            <p className="modal-body">
              <strong>{filename}</strong> has been successfully published.
            </p>
            <button className="modal-publish-btn" onClick={onClose}>Done</button>
          </>
        )}

        {/* ── error ── */}
        {step === 'error' && (
          <>
            <h2 className="modal-title" style={{ color: '#ef4444' }}>Publish Failed</h2>
            <p className="modal-body">{errMsg}</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={onClose}>Close</button>
              <button className="modal-publish-btn" onClick={() => setStep('confirm')}>
                Try Again
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}