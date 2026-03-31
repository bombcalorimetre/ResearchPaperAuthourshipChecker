const express = require('express')
const { readDB, writeDB, nextId } = require('../../middleware/db')
const router = express.Router()

// GET /api/submissions    (optional ?paperId=PAP001  ?studentId=STU002)
router.get('/', (req, res) => {
  const { submissions } = readDB('submissions.json')
  const { paperId, studentId } = req.query
  let data = submissions
  if (paperId)   data = data.filter(s => s.paperId   === paperId)
  if (studentId) data = data.filter(s => s.studentId === studentId)
  res.json({ success: true, count: data.length, data })
})

// GET /api/submissions/:id
router.get('/:id', (req, res) => {
  const { submissions } = readDB('submissions.json')
  const sub = submissions.find(s => s.id === req.params.id)
  if (!sub) return res.status(404).json({ success: false, error: 'Submission not found' })
  res.json({ success: true, data: sub })
})

// POST /api/submissions
router.post('/', (req, res) => {
  const db = readDB('submissions.json')
  const item = {
    id: nextId('SUB', db.submissions.map(s => s.id)),
    ...req.body,
    submittedAt: new Date().toISOString(),
    status: 'submitted',
  }
  db.submissions.push(item)
  writeDB('submissions.json', db)
  res.status(201).json({ success: true, data: item })
})

// PUT /api/submissions/:id
router.put('/:id', (req, res) => {
  const db = readDB('submissions.json')
  const idx = db.submissions.findIndex(s => s.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Submission not found' })
  db.submissions[idx] = { ...db.submissions[idx], ...req.body, id: req.params.id }
  writeDB('submissions.json', db)
  res.json({ success: true, data: db.submissions[idx] })
})

// DELETE /api/submissions/:id
router.delete('/:id', (req, res) => {
  const db = readDB('submissions.json')
  const idx = db.submissions.findIndex(s => s.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Submission not found' })
  db.submissions.splice(idx, 1)
  writeDB('submissions.json', db)
  res.json({ success: true, message: `Submission ${req.params.id} deleted` })
})

module.exports = router