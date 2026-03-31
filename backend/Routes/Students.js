const express = require('express')
const { readDB, writeDB, nextId } = require('../../middleware/db')
const router = express.Router()

// GET /api/students
router.get('/', (_req, res) => {
  const { students } = readDB('students.json')
  res.json({ success: true, count: students.length, data: students })
})

// GET /api/students/:id
router.get('/:id', (req, res) => {
  const { students } = readDB('students.json')
  const student = students.find(s => s.id === req.params.id)
  if (!student) return res.status(404).json({ success: false, error: 'Student not found' })
  res.json({ success: true, data: student })
})

// POST /api/students
router.post('/', (req, res) => {
  const db = readDB('students.json')
  const item = {
    id: nextId('STU', db.students.map(s => s.id)),
    ...req.body,
    createdAt: new Date().toISOString(),
  }
  db.students.push(item)
  writeDB('students.json', db)
  res.status(201).json({ success: true, data: item })
})

// PUT /api/students/:id
router.put('/:id', (req, res) => {
  const db = readDB('students.json')
  const idx = db.students.findIndex(s => s.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Student not found' })
  db.students[idx] = { ...db.students[idx], ...req.body, id: req.params.id }
  writeDB('students.json', db)
  res.json({ success: true, data: db.students[idx] })
})

// DELETE /api/students/:id
router.delete('/:id', (req, res) => {
  const db = readDB('students.json')
  const idx = db.students.findIndex(s => s.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Student not found' })
  const [removed] = db.students.splice(idx, 1)
  writeDB('students.json', db)
  res.json({ success: true, data: removed })
})

module.exports = router