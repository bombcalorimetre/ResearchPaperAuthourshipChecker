const express = require('express')
const { readDB, writeDB, nextId } = require('../middleware/db')
const router = express.Router()

// GET /api/papers          (optional ?courseId=CRS001)
router.get('/', (req, res) => {
  const { papers } = readDB('papers.json')
  const { courseId } = req.query
  const data = courseId ? papers.filter(p => p.courseId === courseId) : papers
  res.json({ success: true, count: data.length, data })
})

// GET /api/papers/:id
router.get('/:id', (req, res) => {
  const { papers } = readDB('papers.json')
  const paper = papers.find(p => p.id === req.params.id)
  if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' })
  res.json({ success: true, data: paper })
})

// POST /api/papers
router.post('/', (req, res) => {
  const db = readDB('papers.json')
  const item = {
    id: nextId('PAP', db.papers.map(p => p.id)),
    ...req.body,
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
  }
  db.papers.push(item)
  writeDB('papers.json', db)
  res.status(201).json({ success: true, data: item })
})

// PUT /api/papers/:id
router.put('/:id', (req, res) => {
  const db = readDB('papers.json')
  const idx = db.papers.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Paper not found' })
  db.papers[idx] = { ...db.papers[idx], ...req.body, id: req.params.id }
  writeDB('papers.json', db)
  res.json({ success: true, data: db.papers[idx] })
})

// DELETE /api/papers/:id
router.delete('/:id', (req, res) => {
  const db = readDB('papers.json')
  const idx = db.papers.findIndex(p => p.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Paper not found' })
  db.papers.splice(idx, 1)
  writeDB('papers.json', db)
  res.json({ success: true, message: `Paper ${req.params.id} deleted` })
})

module.exports = router