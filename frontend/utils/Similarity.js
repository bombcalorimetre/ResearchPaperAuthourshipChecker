/**
 * similarity.js — Client-side algorithm engine
 * Used when the user uploads a raw JSON file directly (no paperId).
 * Mirrors the exact logic in backend/routes/similarity.js
 *
 * Algorithms:
 *   1. Cosine TF-IDF
 *   2. Jaccard Index
 *   3. Levenshtein (normalised)
 *   4. Dice Coefficient (bigrams)
 *   5. LCS Ratio
 *
 * Output: { individual[], meanRaw, meanScore (0-10) }
 */

/* ── tokeniser ─────────────────────────── */
const tokenize = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

/* ════════════════════════════════════════
   1. COSINE TF-IDF
   Builds weighted term vectors per doc,
   averages pairwise cosine similarity.
════════════════════════════════════════ */
function buildTFIDF(docs) {
  const tokenized = docs.map(tokenize)
  const N = docs.length

  const tfDocs = tokenized.map((tokens) => {
    const tf  = {}
    tokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1 })
    const len = tokens.length || 1
    Object.keys(tf).forEach((t) => { tf[t] /= len })
    return tf
  })

  const df = {}
  tokenized.forEach((tokens) =>
    [...new Set(tokens)].forEach((t) => { df[t] = (df[t] || 0) + 1 })
  )

  return tfDocs.map((tf) => {
    const vec = {}
    Object.keys(tf).forEach((t) => {
      vec[t] = tf[t] * (Math.log((N + 1) / ((df[t] || 0) + 1)) + 1)
    })
    return vec
  })
}

function cosinePair(a, b) {
  const terms = new Set([...Object.keys(a), ...Object.keys(b)])
  let dot = 0, mA = 0, mB = 0
  terms.forEach((t) => {
    const x = a[t] || 0, y = b[t] || 0
    dot += x * y; mA += x * x; mB += y * y
  })
  return (!mA || !mB) ? 0 : dot / (Math.sqrt(mA) * Math.sqrt(mB))
}

export function cosineScore(texts) {
  if (texts.length < 2) return 0
  const vecs = buildTFIDF(texts)
  let total = 0, count = 0
  for (let i = 0; i < vecs.length; i++)
    for (let j = i + 1; j < vecs.length; j++) {
      total += cosinePair(vecs[i], vecs[j])
      count++
    }
  return count ? total / count : 0
}

/* ════════════════════════════════════════
   2. JACCARD INDEX
   |A ∩ B| / |A ∪ B|  on token sets
════════════════════════════════════════ */
export function jaccardScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const A = new Set(tokenize(texts[i]))
      const B = new Set(tokenize(texts[j]))
      const inter = [...A].filter((x) => B.has(x)).length
      const union = new Set([...A, ...B]).size
      total += union ? inter / union : 1
      count++
    }
  return count ? total / count : 0
}

/* ════════════════════════════════════════
   3. LEVENSHTEIN (normalised)
   1 - editDistance / maxLength
════════════════════════════════════════ */
function levDist(s1, s2) {
  const a = s1.toLowerCase(), b = s2.toLowerCase()
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, k) => k)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

export function levenshteinScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const ml = Math.max(texts[i].length, texts[j].length)
      total += ml ? 1 - levDist(texts[i], texts[j]) / ml : 1
      count++
    }
  return count ? total / count : 0
}

/* ════════════════════════════════════════
   4. DICE COEFFICIENT (bigrams)
   2|A∩B| / (|A| + |B|)
════════════════════════════════════════ */
function bigrams(text) {
  const s = text.toLowerCase().replace(/\s+/g, ' ').trim()
  return Array.from({ length: Math.max(0, s.length - 1) }, (_, i) => s.slice(i, i + 2))
}

export function diceScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const bgA = bigrams(texts[i]), bgB = bigrams(texts[j])
      if (!bgA.length && !bgB.length) { total += 1; count++; continue }
      if (!bgA.length || !bgB.length) { count++; continue }
      const freq = {}
      bgA.forEach((b) => { freq[b] = (freq[b] || 0) + 1 })
      let inter = 0
      bgB.forEach((b) => { if (freq[b] > 0) { inter++; freq[b]-- } })
      total += (2 * inter) / (bgA.length + bgB.length)
      count++
    }
  return count ? total / count : 0
}

/* ════════════════════════════════════════
   5. LCS RATIO
   2 × LCS_length / (|A| + |B|)  on tokens
════════════════════════════════════════ */
function lcsLen(a, b) {
  const A = tokenize(a).slice(0, 150)
  const B = tokenize(b).slice(0, 150)
  if (!A.length || !B.length) return 0
  let prev = new Array(B.length + 1).fill(0)
  for (let i = 0; i < A.length; i++) {
    const curr = new Array(B.length + 1).fill(0)
    for (let j = 0; j < B.length; j++)
      curr[j + 1] = A[i] === B[j] ? prev[j] + 1 : Math.max(curr[j], prev[j + 1])
    prev = curr
  }
  return prev[B.length]
}

export function lcsScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const A = tokenize(texts[i]), B = tokenize(texts[j])
      const t = A.length + B.length
      total += t ? (2 * lcsLen(texts[i], texts[j])) / t : 1
      count++
    }
  return count ? total / count : 0
}

/* ════════════════════════════════════════
   MASTER — run all 5, return mean /10
════════════════════════════════════════ */
export const ALGO_META = [
  { key: 'cosine',      label: 'Cosine TF-IDF',    desc: 'Term-frequency vector angle',      fn: cosineScore },
  { key: 'jaccard',     label: 'Jaccard Index',     desc: 'Token set intersection / union',   fn: jaccardScore },
  { key: 'levenshtein', label: 'Levenshtein',       desc: 'Normalised edit distance',         fn: levenshteinScore },
  { key: 'dice',        label: 'Dice Coefficient',  desc: 'Bigram overlap ratio',             fn: diceScore },
  { key: 'lcs',         label: 'LCS Ratio',         desc: 'Longest common subsequence',       fn: lcsScore },
]

export function computeAllScores(texts) {
  const individual = ALGO_META.map(({ key, label, desc, fn }) => {
    const raw = fn(texts)            // 0–1
    return { key, label, desc, raw, outOf10: raw * 10 }
  })
  const meanRaw   = individual.reduce((s, r) => s + r.raw, 0) / individual.length
  const meanScore = parseFloat((meanRaw * 10).toFixed(2))   // 0–10, 2 dp
  return { individual, meanRaw, meanScore }
}