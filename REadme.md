# SimCheck — React Similarity Dashboard

A production-grade React dashboard for computing JSON text similarity using 5 algorithms,
producing a single **mean score out of 10** as the output.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open http://localhost:5173
```

---

## 📁 Project Structure

```
simcheck-react/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx              — React entry point
│   ├── App.jsx               — Root component
│   ├── index.css             — Full dashboard styles
│   ├── utils/
│   │   └── similarity.js     — All 5 algorithms + mean score engine
│   └── components/
│       ├── Dashboard.jsx     — 3-column dashboard layout
│       ├── UploadZone.jsx    — Drag-and-drop JSON upload
│       ├── ScoreGauge.jsx    — Animated SVG arc gauge (score/10)
│       ├── AlgoBreakdown.jsx — Individual algo score bars
│       └── PublishModal.jsx  — Publish confirmation flow
```

---

## 🧮 Algorithms

| # | Algorithm | Technique |
|---|-----------|-----------|
| 1 | **Cosine TF-IDF** | Term-frequency weighted vector cosine similarity |
| 2 | **Jaccard Index** | `|A ∩ B| / |A ∪ B|` on token sets |
| 3 | **Levenshtein** | Normalised character edit distance |
| 4 | **Dice Coefficient** | Bigram overlap: `2|A∩B| / (|A|+|B|)` |
| 5 | **LCS Ratio** | `2 × LCS_len / (|A| + |B|)` on token sequences |

**Mean score** = unweighted average of all 5 raw scores × 10

---

## 📋 JSON Formats Supported

**Array of strings:**
```json
["text one", "text two", "text three"]
```

**Array of objects:**
```json
[
  { "student": "Alice", "answer": "ER model uses entities and relationships..." },
  { "student": "Bob",   "answer": "Entity relationship diagrams show cardinality..." }
]
```

The app auto-detects the longest text field for comparison.

---

## 🚦 Publish Logic

| Mean Score | Status | Action |
|-----------|--------|--------|
| **< 5.0** | ✅ Original | **Publish button enabled** |
| **≥ 5.0** | ❌ Too similar | Publication blocked |

---

## 🛠 Build for Production

```bash
npm run build
# Output in /dist — serve with any static host
```

---

## 🎓 Context

Built for BCSE302L — Database Systems (VIT University)
DA1 submission: Alex Geo Kishore · 24BCE5451