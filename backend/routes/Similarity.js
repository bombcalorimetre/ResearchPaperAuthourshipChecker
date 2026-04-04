/**
 * similarity.js — POST /api/similarity/analyze
 * Runs all 5 algorithms, computes mean score /10,
 * persists to results.json, supports publish action.
 */
const express = require('express')
const { readDB, writeDB, nextId } = require('../middleware/db')
const router = express.Router()

/* ═══════════════════════════════════════════
   SIMILARITY ALGORITHMS
═══════════════════════════════════════════ */

const tokenize = t =>
  String(t).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)

// ── 1. Cosine TF-IDF ──────────────────────
function cosineScore(texts) {
  if (texts.length < 2) return 0
  const tokenized = texts.map(tokenize)
  const N = texts.length
  const tfDocs = tokenized.map(tokens => {
    const tf = {}
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1 })
    const len = tokens.length || 1
    Object.keys(tf).forEach(t => { tf[t] /= len })
    return tf
  })
  const df = {}
  tokenized.forEach(tokens =>
    [...new Set(tokens)].forEach(t => { df[t] = (df[t] || 0) + 1 })
  )
  const vecs = tfDocs.map(tf => {
    const v = {}
    Object.keys(tf).forEach(t => {
      v[t] = tf[t] * (Math.log((N + 1) / ((df[t] || 0) + 1)) + 1)
    })
    return v
  })
  let total = 0, count = 0
  for (let i = 0; i < vecs.length; i++)
    for (let j = i + 1; j < vecs.length; j++) {
      const terms = new Set([...Object.keys(vecs[i]), ...Object.keys(vecs[j])])
      let dot = 0, mA = 0, mB = 0
      terms.forEach(t => {
        const x = vecs[i][t] || 0, y = vecs[j][t] || 0
        dot += x * y; mA += x * x; mB += y * y
      })
      total += (!mA || !mB) ? 0 : dot / (Math.sqrt(mA) * Math.sqrt(mB))
      count++
    }
  return count ? total / count : 0
}

// ── 2. Jaccard ────────────────────────────
function jaccardScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const A = new Set(tokenize(texts[i])), B = new Set(tokenize(texts[j]))
      const inter = [...A].filter(x => B.has(x)).length
      const union = new Set([...A, ...B]).size
      total += union ? inter / union : 1
      count++
    }
  return count ? total / count : 0
}

// ── 3. Levenshtein (normalised) ───────────
function levenshteinScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i].toLowerCase(), b = texts[j].toLowerCase()
      if (a === b) { total += 1; count++; continue }
      let prev = Array.from({ length: b.length + 1 }, (_, k) => k)
      for (let ii = 1; ii <= a.length; ii++) {
        const curr = [ii]
        for (let jj = 1; jj <= b.length; jj++) {
          const cost = a[ii - 1] === b[jj - 1] ? 0 : 1
          curr[jj] = Math.min(curr[jj - 1] + 1, prev[jj] + 1, prev[jj - 1] + cost)
        }
        prev = curr
      }
      const ml = Math.max(a.length, b.length)
      total += ml ? 1 - prev[b.length] / ml : 1
      count++
    }
  return count ? total / count : 0
}

// ── 4. Dice Coefficient (bigrams) ─────────
function diceScore(texts) {
  if (texts.length < 2) return 0
  const bigrams = t => {
    const s = t.toLowerCase().replace(/\s+/g, ' ').trim()
    return Array.from({ length: Math.max(0, s.length - 1) }, (_, i) => s.slice(i, i + 2))
  }
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const bgA = bigrams(texts[i]), bgB = bigrams(texts[j])
      if (!bgA.length && !bgB.length) { total += 1; count++; continue }
      if (!bgA.length || !bgB.length) { count++; continue }
      const freq = {}
      bgA.forEach(b => { freq[b] = (freq[b] || 0) + 1 })
      let inter = 0
      bgB.forEach(b => { if (freq[b] > 0) { inter++; freq[b]-- } })
      total += (2 * inter) / (bgA.length + bgB.length)
      count++
    }
  return count ? total / count : 0
}

// ── 5. LCS Ratio ──────────────────────────
function lcsScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const A = tokenize(texts[i]).slice(0, 150)
      const B = tokenize(texts[j]).slice(0, 150)
      const t = A.length + B.length
      if (!t) { total += 1; count++; continue }
      let prev = new Array(B.length + 1).fill(0)
      for (let ii = 0; ii < A.length; ii++) {
        const curr = new Array(B.length + 1).fill(0)
        for (let jj = 0; jj < B.length; jj++)
          curr[jj + 1] = A[ii] === B[jj] ? prev[jj] + 1 : Math.max(curr[jj], prev[jj + 1])
        prev = curr
      }
      total += (2 * prev[B.length]) / t
      count++
    }
  return count ? total / count : 0
}

/* ═══════════════════════════════════════════
   POST /api/similarity/analyze
   Body: { paperId?, texts: string[], labels?: string[] }
═══════════════════════════════════════════ */
router.post('/analyze', (req, res) => {
  const { paperId, texts, labels } = req.body

  if (!texts || !Array.isArray(texts) || texts.length < 2)
    return res.status(400).json({ success: false, error: 'Need at least 2 texts to compare.' })

  // Run all 5 algorithms (raw scores 0–1)
  const scores = {
    cosine:      parseFloat(cosineScore(texts).toFixed(4)),
    jaccard:     parseFloat(jaccardScore(texts).toFixed(4)),
    levenshtein: parseFloat(levenshteinScore(texts).toFixed(4)),
    dice:        parseFloat(diceScore(texts).toFixed(4)),
    lcs:         parseFloat(lcsScore(texts).toFixed(4)),
  }

  // Mean of all 5, scaled to /10
  const meanRaw   = (scores.cosine + scores.jaccard + scores.levenshtein + scores.dice + scores.lcs) / 5
  const meanScore = parseFloat((meanRaw * 10).toFixed(2))

  // Get linked submission IDs if paperId provided
  let submissionIds = []
  if (paperId) {
    const { submissions } = readDB('submissions.json')
    submissionIds = submissions.filter(s => s.paperId === paperId).map(s => s.id)
  }

  // Persist result
  const db       = readDB('results.json')
  const resultId = nextId('RES', db.results.map(r => r.id))
  const newResult = {
    id: resultId,
    paperId: paperId || null,
    analyzedAt: new Date().toISOString(),
    submissionIds,
    labels: labels || texts.map((_, i) => `Item ${i + 1}`),
    scores,
    meanRaw:  parseFloat(meanRaw.toFixed(4)),
    meanScore,
    publishEligible: meanScore < 6.0,
    publishedAt: null,
    status: 'analyzed',
  }

  db.results.push(newResult)
  writeDB('results.json', db)

  res.json({ success: true, data: newResult })
})

/* ═══════════════════════════════════════════
   POST /api/similarity/publish/:resultId
═══════════════════════════════════════════ */
router.post('/publish/:resultId', (req, res) => {
  const db  = readDB('results.json')
  const idx = db.results.findIndex(r => r.id === req.params.resultId)

  if (idx === -1)
    return res.status(404).json({ success: false, error: 'Result not found' })
  if (db.results[idx].meanScore >= 6.0)
    return res.status(403).json({ success: false, error: 'Score too high — publication blocked.' })
  if (db.results[idx].publishedAt)
    return res.status(400).json({ success: false, error: 'Already published.' })

  db.results[idx].publishedAt = new Date().toISOString()
  db.results[idx].status = 'published'

  // Mark linked paper as published too
  if (db.results[idx].paperId) {
    const pdb  = readDB('papers.json')
    const pidx = pdb.papers.findIndex(p => p.id === db.results[idx].paperId)
    if (pidx !== -1) { pdb.papers[pidx].status = 'published'; writeDB('papers.json', pdb) }
  }

  writeDB('results.json', db)
  res.json({ success: true, data: db.results[idx] })
})

module.exports = router