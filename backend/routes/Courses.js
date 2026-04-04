const express = require('express')
const { readDB, writeDB, nextId } = require('../middleware/db')
const router = express.Router()

// GET /api/courses
router.get('/', (_req, res) => {
  const { courses } = readDB('courses.json')
  res.json({ success: true, count: courses.length, data: courses })
})

// GET /api/courses/:id
router.get('/:id', (req, res) => {
  const { courses } = readDB('courses.json')
  const course = courses.find(c => c.id === req.params.id)
  if (!course) return res.status(404).json({ success: false, error: 'Course not found' })
  res.json({ success: true, data: course })
})

// POST /api/courses
router.post('/', (req, res) => {
  const db = readDB('courses.json')
  const item = { id: nextId('CRS', db.courses.map(c => c.id)), ...req.body }
  db.courses.push(item)
  writeDB('courses.json', db)
  res.status(201).json({ success: true, data: item })
})

// PUT /api/courses/:id
router.put('/:id', (req, res) => {
  const db = readDB('courses.json')
  const idx = db.courses.findIndex(c => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Course not found' })
  db.courses[idx] = { ...db.courses[idx], ...req.body, id: req.params.id }
  writeDB('courses.json', db)
  res.json({ success: true, data: db.courses[idx] })
})

// DELETE /api/courses/:id
router.delete('/:id', (req, res) => {
  const db = readDB('courses.json')
  const idx = db.courses.findIndex(c => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ success: false, error: 'Course not found' })
  const [removed] = db.courses.splice(idx, 1)
  writeDB('courses.json', db)
  res.json({ success: true, data: removed })
})

module.exports = router