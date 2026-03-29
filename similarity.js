/**
 * SimCheck — Similarity Algorithms Library
 * Implements: Cosine TF-IDF, Jaccard, Levenshtein, Dice Coefficient, LCS
 */

/* ─────────────────────────────────────────────
   Utility: tokenize text
───────────────────────────────────────────── */
function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/* ─────────────────────────────────────────────
   1. Cosine Similarity (TF-IDF weighted)
   Measures angle between TF-IDF vectors in term space
───────────────────────────────────────────── */
function computeTFIDF(docs) {
  const tokenizedDocs = docs.map(tokenize);
  const N = docs.length;

  // Term frequencies per document
  const tfDocs = tokenizedDocs.map(tokens => {
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    // Normalize by doc length
    Object.keys(tf).forEach(t => { tf[t] /= tokens.length || 1; });
    return tf;
  });

  // Document frequency (how many docs contain each term)
  const df = {};
  tokenizedDocs.forEach(tokens => {
    [...new Set(tokens)].forEach(t => { df[t] = (df[t] || 0) + 1; });
  });

  // TF-IDF vectors
  const tfidfDocs = tfDocs.map(tf => {
    const vec = {};
    Object.keys(tf).forEach(t => {
      const idf = Math.log((N + 1) / ((df[t] || 0) + 1)) + 1;
      vec[t] = tf[t] * idf;
    });
    return vec;
  });

  return tfidfDocs;
}

function cosineSimilarity(vecA, vecB) {
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  allTerms.forEach(t => {
    const a = vecA[t] || 0;
    const b = vecB[t] || 0;
    dot  += a * b;
    magA += a * a;
    magB += b * b;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function computeCosineSimilarityMatrix(texts) {
  const vecs = computeTFIDF(texts);
  return texts.map((_, i) =>
    texts.map((_, j) => i === j ? 1 : cosineSimilarity(vecs[i], vecs[j]))
  );
}

/* ─────────────────────────────────────────────
   2. Jaccard Similarity
   |A ∩ B| / |A ∪ B| on token sets
───────────────────────────────────────────── */
function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

function computeJaccardMatrix(texts) {
  return texts.map((a, i) =>
    texts.map((b, j) => i === j ? 1 : jaccardSimilarity(a, b))
  );
}

/* ─────────────────────────────────────────────
   3. Levenshtein Distance (Normalized)
   Normalized to [0, 1] as 1 - (editDist / maxLen)
───────────────────────────────────────────── */
function levenshteinDistance(s1, s2) {
  const a = String(s1).toLowerCase();
  const b = String(s2).toLowerCase();
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use 1D DP for memory efficiency
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    prev = curr;
  }
  return prev[n];
}

function levenshteinSimilarity(a, b) {
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(String(a).length, String(b).length);
  if (maxLen === 0) return 1;
  return 1 - dist / maxLen;
}

function computeLevenshteinMatrix(texts) {
  return texts.map((a, i) =>
    texts.map((b, j) => i === j ? 1 : levenshteinSimilarity(a, b))
  );
}

/* ─────────────────────────────────────────────
   4. Dice Coefficient (Bigram overlap)
   2 * |bigrams(A) ∩ bigrams(B)| / (|bigrams(A)| + |bigrams(B)|)
───────────────────────────────────────────── */
function getBigrams(text) {
  const s = String(text).toLowerCase().replace(/\s+/g, ' ').trim();
  const bigrams = [];
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.push(s.slice(i, i + 2));
  }
  return bigrams;
}

function diceSimilarity(a, b) {
  const biA = getBigrams(a);
  const biB = getBigrams(b);
  if (biA.length === 0 && biB.length === 0) return 1;
  if (biA.length === 0 || biB.length === 0) return 0;

  const setA = {};
  biA.forEach(bg => { setA[bg] = (setA[bg] || 0) + 1; });

  let intersection = 0;
  biB.forEach(bg => {
    if (setA[bg] > 0) {
      intersection++;
      setA[bg]--;
    }
  });

  return (2 * intersection) / (biA.length + biB.length);
}

function computeDiceMatrix(texts) {
  return texts.map((a, i) =>
    texts.map((b, j) => i === j ? 1 : diceSimilarity(a, b))
  );
}

/* ─────────────────────────────────────────────
   5. LCS Ratio (Longest Common Subsequence)
   2 * LCS_length / (len(A) + len(B))
───────────────────────────────────────────── */
function lcsLength(a, b) {
  const tokA = tokenize(a);
  const tokB = tokenize(b);
  const m = tokA.length, n = tokB.length;
  if (m === 0 || n === 0) return 0;

  // Trim to max 200 tokens for performance
  const A = tokA.slice(0, 200);
  const B = tokB.slice(0, 200);

  let prev = new Array(B.length + 1).fill(0);
  for (let i = 0; i < A.length; i++) {
    const curr = new Array(B.length + 1).fill(0);
    for (let j = 0; j < B.length; j++) {
      curr[j + 1] = A[i] === B[j]
        ? prev[j] + 1
        : Math.max(curr[j], prev[j + 1]);
    }
    prev = curr;
  }
  return prev[B.length];
}

function lcsSimilarity(a, b) {
  const tokA = tokenize(a);
  const tokB = tokenize(b);
  const total = tokA.length + tokB.length;
  if (total === 0) return 1;
  const lcs = lcsLength(a, b);
  return (2 * lcs) / total;
}

function computeLCSMatrix(texts) {
  return texts.map((a, i) =>
    texts.map((b, j) => i === j ? 1 : lcsSimilarity(a, b))
  );
}

/* ─────────────────────────────────────────────
   Master function: compute all selected algos
───────────────────────────────────────────── */
function computeAllSimilarities(texts, selectedAlgos) {
  const results = {};
  const algoMap = {
    cosine:      computeCosineSimilarityMatrix,
    jaccard:     computeJaccardMatrix,
    levenshtein: computeLevenshteinMatrix,
    dice:        computeDiceMatrix,
    lcs:         computeLCSMatrix,
  };

  selectedAlgos.forEach(algo => {
    if (algoMap[algo]) {
      results[algo] = algoMap[algo](texts);
    }
  });
  return results;
}

/* ─────────────────────────────────────────────
   Ensemble Score: weighted average of algos
───────────────────────────────────────────── */
const ALGO_WEIGHTS = {
  cosine: 0.30,
  jaccard: 0.20,
  levenshtein: 0.15,
  dice: 0.20,
  lcs: 0.15,
};

function computeEnsembleMatrix(matrices, selectedAlgos) {
  const n = matrices[selectedAlgos[0]].length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      let totalW = 0, score = 0;
      selectedAlgos.forEach(algo => {
        const w = ALGO_WEIGHTS[algo] || 1 / selectedAlgos.length;
        score += matrices[algo][i][j] * w;
        totalW += w;
      });
      return score / (totalW || 1);
    })
  );
}

/* ─────────────────────────────────────────────
   Stats helper
───────────────────────────────────────────── */
function getPairwiseStats(matrix, labels) {
  const pairs = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      pairs.push({ i, j, score: matrix[i][j], labelA: labels[i], labelB: labels[j] });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const scores = pairs.map(p => p.score);
  const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const max = Math.max(...scores);
  const high = scores.filter(s => s >= 0.7).length;

  return { pairs, avg, max, high };
}