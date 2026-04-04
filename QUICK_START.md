# Quick Start Guide

## Installation & Running

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 3: Start Backend Server (Terminal 1)
```bash
cd backend
npm run dev
```

### Step 4: Start Frontend Dev Server (Terminal 2)
```bash
cd frontend
npm run dev
```

### Step 5: Open Browser
Visit: **http://localhost:5173**

## Usage

1. **Upload file** or click sample buttons:
   - Drag & drop a JSON file into the upload zone
   - Or click "📚 DB Answers" or "📝 Text Strings" for samples

2. **View Results**:
   - Mean similarity score appears as an animated gauge
   - See individual algorithm scores on the right
   - Color indicates severity:
     - 🟢 Green (0–3): Original content
     - 🟡 Yellow (3–6): Low similarity — **Can publish**
     - 🟠 Orange (6–8): Moderate — **Blocked**
     - 🔴 Red (8–10): High — **Blocked**

3. **Publish Content** (if score < 6.0):
   - Click "Publish →" button
   - Confirm in modal dialog
   - See success message
   - Result saved to backend database

4. **Start New Analysis**:
   - Click "↩ New Analysis" to reset
   - Upload another file

## Key Features

✅ **5 Similarity Algorithms**:
   - Cosine TF-IDF
   - Jaccard Index
   - Levenshtein Edit Distance
   - Dice Coefficient (Bigrams)
   - LCS Ratio

✅ **Real-time Analysis**:
   - Client-side instant computation
   - Backend persistence (optional)
   - Async no blocking

✅ **Smart Publishing**:
   - Auto-detects if content is safe (< 6.0)
   - Blocks high similarity (≥ 6.0)
   - Modal confirmation workflow

✅ **Responsive UI**:
   - Animated score gauge
   - Color-coded severity
   - Per-algorithm breakdown
   - Status indicators

## Supported JSON Formats

### Simple Array of Strings
```json
["text1", "text2", "text3"]
```

### Array of Objects
```json
[
  {"name": "John", "essay": "...content..."},
  {"name": "Jane", "essay": "...content..."}
]
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect to backend | Ensure backend server is running on port 4000 |
| UI won't load | Clear cache (Ctrl+Shift+R) and refresh |
| Results not saving | Check `/backend/data/Results.json` exists |
| Upload not working | Use valid JSON with ≥ 2 items |

## File Structure
```
.
├── backend/
│   ├── Server.js              # Express server
│   ├── Routes/
│   │   ├── Similarity.js       # Main analysis logic
│   │   └── ...                 # Other routes
│   ├── data/                   # JSON database
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Components/
│   │   ├── Dashboard.jsx       # Main UI
│   │   ├── Uploadzone.jsx      # File upload
│   │   ├── Publishmodal.jsx    # Publish dialog
│   │   ├── Scoregauge.jsx      # Score visualization
│   │   └── Algobreakdown.jsx   # Algorithm breakdown
│   ├── utils/
│   │   ├── Api.js              # Backend client
│   │   └── Similarity.js       # Client-side algorithms
│   └── package.json
└── TEST_GUIDE.md               # Full testing reference
```

## Next Steps

1. ✅ Upload files and verify similarity detection
2. ✅ Test publish flow with different similarity scores
3. ✅ Check backend database for persisted results
4. 📊 Add course/student tracking
5. 📈 Create reporting dashboard
6. 📥 Implement CSV export

---

**Version**: 2.0  
**Last Updated**: April 2024  
**Status**: Ready for Testing ✓
