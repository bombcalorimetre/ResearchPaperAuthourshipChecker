/**
 * api.js — Frontend service layer
 * Every call to the Express backend lives here.
 * Vite proxies /api → http://localhost:4000
 */

const BASE = '/api'

async function request(path, options = {}) {
  const res  = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export const api = {

  /* ── Students ─────────────────────────── */
  students: {
    list:   ()         => request('/students'),
    get:    (id)       => request(`/students/${id}`),
    create: (body)     => request('/students',       { method: 'POST',   body: JSON.stringify(body) }),
    update: (id, body) => request(`/students/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
    remove: (id)       => request(`/students/${id}`, { method: 'DELETE' }),
  },

  /* ── Courses ──────────────────────────── */
  courses: {
    list: ()   => request('/courses'),
    get:  (id) => request(`/courses/${id}`),
  },

  /* ── Papers ───────────────────────────── */
  papers: {
    list:   (courseId) => request(`/papers${courseId ? `?courseId=${courseId}` : ''}`),
    get:    (id)       => request(`/papers/${id}`),
    create: (body)     => request('/papers',       { method: 'POST',   body: JSON.stringify(body) }),
    update: (id, body) => request(`/papers/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
    remove: (id)       => request(`/papers/${id}`, { method: 'DELETE' }),
  },

  /* ── Submissions ──────────────────────── */
  submissions: {
    list:   (filters)  => {
      const qs = new URLSearchParams(filters || {}).toString()
      return request(`/submissions${qs ? `?${qs}` : ''}`)
    },
    get:    (id)       => request(`/submissions/${id}`),
    create: (body)     => request('/submissions',       { method: 'POST',   body: JSON.stringify(body) }),
    update: (id, body) => request(`/submissions/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
    remove: (id)       => request(`/submissions/${id}`, { method: 'DELETE' }),
  },

  /* ── Similarity ───────────────────────── */
  similarity: {
    /**
     * Analyze a set of texts via the backend.
     * @param {string|null} paperId  - link to PAP001 etc (optional)
     * @param {string[]}    texts    - array of text strings
     * @param {string[]}    labels   - display labels for each text
     */
    analyze: (paperId, texts, labels) =>
      request('/similarity/analyze', {
        method: 'POST',
        body: JSON.stringify({ paperId, texts, labels }),
      }),

    /**
     * Publish a previously analyzed result.
     * Only succeeds if meanScore < 5.0
     */
    publish: (resultId) =>
      request(`/similarity/publish/${resultId}`, { method: 'POST' }),
  },

  /* ── Results ──────────────────────────── */
  results: {
    list:   (paperId)  => request(`/results${paperId ? `?paperId=${paperId}` : ''}`),
    get:    (id)       => request(`/results/${id}`),
    remove: (id)       => request(`/results/${id}`, { method: 'DELETE' }),
  },
}