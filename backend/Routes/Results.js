const express = require('express')
const { readDB, writeDB } = require('../../middleware/db')
const router = express.Router()

// GET /api/results          (optional ?paperId=PAP001)
router.get('/', (req, res) => {
  const { results } = readDB('results.json')
  const { paperId } = req.query
  const data = paperId ? results.filter(r => r.paperId === paperId) : results
  res.json({ success: true, count: data.length, data })
})

// GET /api/results/:id
router.get('/:id', (req, res) => {
  const { results } = readDB('results.json')
  const result = results.find(r => r.id === req.params.id)
  if (!result) return res.status(404).json({ success: false, error: 'Result not found' })
  res.json({ success: true, data: result })
})

// DELETE /api/results/:id
router.delete('/:id', (req, res) => {
  const db  = readDB('results.json')
  const idx = db.results.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Result not found' })
  db.results.splice(idx, 1)
  writeDB('results.json', db)
  res.json({ success: true, message: `Result ${req.params.id} deleted` })
})

module.exports = router