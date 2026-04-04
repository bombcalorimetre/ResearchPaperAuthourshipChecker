# Testing Guide - Research Paper Authorship Checker

## Setup & Installation

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
Expected output:
```
◈  SimCheck API  →  http://localhost:4000/api
◈  Health        →  http://localhost:4000/api/health
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Expected output:
```
VITE v5.4.2  ready in 234 ms

➜  Local:   http://localhost:5173/
```

## Test Scenarios

### Test 1: File Upload with Sample Data
1. Open http://localhost:5173 in browser
2. Click on upload zone or drag a JSON file
3. Use sample data: Click "📚 DB Answers" button
4. **Expected**: 
   - Page transitions to "computing" state with loading animation
   - After ~1s, results appear with mean score gauge

### Test 2: Similarity Scoring with Score < 6.0
1. After upload, check the **Mean Similarity Score** in the center gauge
2. If score < 6.0 (e.g., 4.2, 5.8):
   - **Banner message**: "Cleared for Publication"
   - **Color**: Green checkmark (✓)
   - **Publish button**: Visible and clickable
3. **Expected colors**:
   - 0.0 – 3.0: Green (Original)
   - 3.0 – 6.0: Yellow (Low similarity)
   - 6.0 – 8.0: Orange (Moderate — blocked)
   - 8.0 – 10: Red (High / Duplicate)

### Test 3: Similarity Scoring with Score ≥ 6.0
1. Use sample data with higher similarity
2. If score ≥ 6.0 (e.g., 6.5, 8.2):
   - **Banner message**: "Publication Blocked"
   - **Color**: Red X (✗)
   - **Publish button**: NOT visible
3. **Expected**: Cannot publish until score drops below 6.0

### Test 4: Publish Flow
1. Load data with score < 6.0
2. Click **"Publish →"** button
3. **Modal appears** with:
   - Confirmation message showing score
   - File name
   - "Cancel" and "Publish Content →" buttons
4. Click **"Publish Content →"**
5. **Publishing state**: Spinner appears for ~1.6s
6. **Success screen**: Checkmark (✓) and "Published!" message
7. Click **"Done"** to close modal
8. **Result**: 
   - Modal closes
   - Banner changes to "✓ Content Published"
   - Status card shows "DONE"

### Test 5: Per-Algorithm Breakdown
1. After analysis, check **right panel** "Algorithm Breakdown"
2. See all 5 algorithms with scores:
   - Cosine TF-IDF
   - Jaccard Index
   - Levenshtein
   - Dice Coefficient
   - LCS Ratio
3. **Color coding**:
   - Each algorithm has its own progress bar
   - Colors: Green (low) → Yellow → Orange → Red (high)
4. **Legend**: "Mean score = unweighted average of all 5..."

### Test 6: Multiple Analyses
1. After first analysis, click **"↩ New Analysis"** in top-right
2. Page resets to idle state
3. Upload new JSON file or use different sample
4. Repeat scoring and publishing

### Test 7: Backend Persistence
1. Complete publish action
2. Check backend `/backend/data/Results.json`:
```json
{
  "results": [
    {
      "id": "RES001",
      "analyzedAt": "2024-04-04T...",
      "labels": [...],
      "scores": {
        "cosine": 0.45,
        "jaccard": 0.38,
        "levenshtein": 0.52,
        "dice": 0.41,
        "lcs": 0.48
      },
      "meanScore": 4.48,
      "status": "published",
      "publishedAt": "2024-04-04T..."
    }
  ]
}
```

### Test 8: Error Handling
1. **Invalid file**: Upload non-JSON file
   - Expected: Error message "Only .json files are supported."
2. **Insufficient data**: Upload JSON with < 2 items
   - Expected: Error message "Need at least 2 items to compare."
3. **Invalid JSON structure**: Upload malformed JSON
   - Expected: Error message "Invalid JSON — check your file and try again."

## JSON File Format

### Array of Strings
```json
[
  "Text 1",
  "Text 2",
  "Text 3"
]
```

### Array of Objects
```json
[
  {"name": "Author1", "content": "...text..."},
  {"name": "Author2", "content": "...text..."},
  {"name": "Author3", "content": "...text..."}
]
```

## API Endpoints

### Health Check
```
GET http://localhost:4000/api/health
```

### Analyze Similarity
```
POST http://localhost:4000/api/similarity/analyze
Body: {
  "texts": ["text1", "text2", "text3"],
  "labels": ["Author1", "Author2", "Author3"],
  "paperId": null (optional)
}
Response: {
  "success": true,
  "data": {
    "id": "RES001",
    "scores": {...},
    "meanScore": 4.48,
    "publishEligible": true,
    "status": "analyzed"
  }
}
```

### Publish Result
```
POST http://localhost:4000/api/similarity/publish/RES001
Response: {
  "success": true,
  "data": {
    "id": "RES001",
    "status": "published",
    "publishedAt": "2024-04-04T..."
  }
}
```

## Threshold Reference

| Score Range | Status | Action |
|-------------|--------|--------|
| 0.0 – 3.0  | ✓ Original | Can publish |
| 3.0 – 6.0  | ✓ Low similarity | **Can publish** |
| 6.0 – 8.0  | ⚠️ Moderate | **Blocked** |
| 8.0 – 10.0 | ✗ Very high | Blocked |

**Key**: Publish button only appears when **score < 6.0**

## Troubleshooting

### Backend connection fails
- Check if backend is running on port 4000
- Verify CORS is enabled (should allow localhost:5173)
- Check browser DevTools → Network tab for /api calls

### Frontend shows "Computing..." forever
- Backend may be offline
- Check browser console for fetch errors
- Verify vite proxy in `vite.config.js`:
  ```javascript
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  }
  ```

### Results not saving
- Check `/backend/data/Results.json` permissions
- Ensure `db.js` can write to data directory
- Check backend console for write errors

### Color not changing correctly
- Clear browser cache (may have old CSS)
- Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Check that all scoreColor functions have been updated

## Performance Notes

- Algorithms run instantly on client (< 100ms for 10 items)
- Backend stores results asynchronously (best-effort)
- Modal animations lock file while publishing (1.6s)
- Gauge animation: 1.6s cubic-bezier easing

## Next Steps

To extend the application:

1. **Add course/paper integration**: Link uploads to specific courses
2. **Bulk analysis**: Upload multiple papers at once
3. **Dashboard reporting**: View history of all analyses
4. **CSV export**: Download results as CSV
5. **Student accounts**: Track individual student submissions
