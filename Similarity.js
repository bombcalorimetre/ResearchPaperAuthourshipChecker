// ════════════════════════════════════════════════
//  SimCheck — Similarity Algorithms
//  Cosine TF-IDF | Jaccard | Levenshtein | Dice | LCS
// ════════════════════════════════════════════════

/* ── Tokeniser ── */
const tokenize = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

// ────────────────────────────────────────────────
// 1. COSINE SIMILARITY (TF-IDF weighted)
// ────────────────────────────────────────────────
function buildTFIDF(docs) {
  const tokenizedDocs = docs.map(tokenize)
  const N = docs.length

  const tfDocs = tokenizedDocs.map((tokens) => {
    const tf = {}
    tokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1 })
    const len = tokens.length || 1
    Object.keys(tf).forEach((t) => { tf[t] /= len })
    return tf
  })

  const df = {}
  tokenizedDocs.forEach((tokens) => {
    ;[...new Set(tokens)].forEach((t) => { df[t] = (df[t] || 0) + 1 })
  })

  return tfDocs.map((tf) => {
    const vec = {}
    Object.keys(tf).forEach((t) => {
      const idf = Math.log((N + 1) / ((df[t] || 0) + 1)) + 1
      vec[t] = tf[t] * idf
    })
    return vec
  })
}

function cosineSim(vecA, vecB) {
  const terms = new Set([...Object.keys(vecA), ...Object.keys(vecB)])
  let dot = 0, magA = 0, magB = 0
  terms.forEach((t) => {
    const a = vecA[t] || 0
    const b = vecB[t] || 0
    dot  += a * b
    magA += a * a
    magB += b * b
  })
  if (!magA || !magB) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

export function cosineScore(texts) {
  if (texts.length < 2) return 0
  const vecs = buildTFIDF(texts)
  let total = 0, count = 0
  for (let i = 0; i < vecs.length; i++)
    for (let j = i + 1; j < vecs.length; j++) {
      total += cosineSim(vecs[i], vecs[j])
      count++
    }
  return count ? total / count : 0
}

// ────────────────────────────────────────────────
// 2. JACCARD SIMILARITY  |A ∩ B| / |A ∪ B|
// ────────────────────────────────────────────────
function jaccardPair(a, b) {
  const A = new Set(tokenize(a))
  const B = new Set(tokenize(b))
  if (!A.size && !B.size) return 1
  if (!A.size || !B.size) return 0
  const inter = [...A].filter((x) => B.has(x)).length
  const union = new Set([...A, ...B]).size
  return inter / union
}

export function jaccardScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      total += jaccardPair(texts[i], texts[j])
      count++
    }
  return count ? total / count : 0
}

// ────────────────────────────────────────────────
// 3. LEVENSHTEIN (normalised edit distance)
// ────────────────────────────────────────────────
function levenshtein(s1, s2) {
  const a = String(s1).toLowerCase()
  const b = String(s2).toLowerCase()
  if (a === b) return 0
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[n]
}

function levenshteinSim(a, b) {
  const dist = levenshtein(a, b)
  const maxLen = Math.max(String(a).length, String(b).length)
  return maxLen ? 1 - dist / maxLen : 1
}

export function levenshteinScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      total += levenshteinSim(texts[i], texts[j])
      count++
    }
  return count ? total / count : 0
}

// ────────────────────────────────────────────────
// 4. DICE COEFFICIENT (bigram overlap)
// ────────────────────────────────────────────────
function bigrams(text) {
  const s = String(text).toLowerCase().replace(/\s+/g, ' ').trim()
  const out = []
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2))
  return out
}

function dicePair(a, b) {
  const bgA = bigrams(a)
  const bgB = bigrams(b)
  if (!bgA.length && !bgB.length) return 1
  if (!bgA.length || !bgB.length) return 0
  const freq = {}
  bgA.forEach((bg) => { freq[bg] = (freq[bg] || 0) + 1 })
  let inter = 0
  bgB.forEach((bg) => { if (freq[bg] > 0) { inter++; freq[bg]-- } })
  return (2 * inter) / (bgA.length + bgB.length)
}

export function diceScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      total += dicePair(texts[i], texts[j])
      count++
    }
  return count ? total / count : 0
}

// ────────────────────────────────────────────────
// 5. LCS RATIO (Longest Common Subsequence)
// ────────────────────────────────────────────────
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

function lcsSim(a, b) {
  const A = tokenize(a), B = tokenize(b)
  const total = A.length + B.length
  return total ? (2 * lcsLen(a, b)) / total : 1
}

export function lcsScore(texts) {
  if (texts.length < 2) return 0
  let total = 0, count = 0
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      total += lcsSim(texts[i], texts[j])
      count++
    }
  return count ? total / count : 0
}

// ────────────────────────────────────────────────
// MASTER: run all 5 and return mean score /10
// ────────────────────────────────────────────────
export const ALGO_META = [
  { key: 'cosine',      label: 'Cosine TF-IDF',   desc: 'Term-frequency vector angle',      fn: cosineScore },
  { key: 'jaccard',     label: 'Jaccard Index',    desc: 'Token-set intersection / union',   fn: jaccardScore },
  { key: 'levenshtein', label: 'Levenshtein',      desc: 'Normalised edit distance',         fn: levenshteinScore },
  { key: 'dice',        label: 'Dice Coefficient', desc: 'Bigram overlap ratio',             fn: diceScore },
  { key: 'lcs',         label: 'LCS Ratio',        desc: 'Longest common subsequence',       fn: lcsScore },
]

export function computeAllScores(texts) {
  const results = ALGO_META.map(({ key, label, desc, fn }) => {
    const raw = fn(texts)           // 0–1
    return { key, label, desc, raw, outOf10: raw * 10 }
  })
  const mean = results.reduce((s, r) => s + r.raw, 0) / results.length
  return {
    individual: results,
    meanRaw: mean,
    meanScore: parseFloat((mean * 10).toFixed(2)),  // 0–10, 2dp
  }
}