const express = require('express')
const cors    = require('cors')

const app  = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

// Logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method.padEnd(6)} ${req.path}`)
  next()
})

// Routes
app.use('/api/students',    require('./routes/Students'))
app.use('/api/courses',     require('./routes/Courses'))
app.use('/api/papers',      require('./routes/Papers'))
app.use('/api/submissions', require('./routes/Submissions'))
app.use('/api/similarity',  require('./routes/Similarity'))
app.use('/api/results',     require('./routes/Results'))

// Health
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'SimCheck API', version: '2.0.0', timestamp: new Date().toISOString() })
)

// 404
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n  ◈  SimCheck API  →  http://localhost:${PORT}/api`)
  console.log(`  ◈  Health        →  http://localhost:${PORT}/api/health\n`)
})

module.exports = app