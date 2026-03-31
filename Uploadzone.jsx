import { useRef, useState } from 'react'

export default function UploadZone({ onData }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const parse = (file) => {
    setError('')
    if (!file?.name.endsWith('.json')) {
      setError('Only .json files are accepted.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const arr = Array.isArray(data) ? data : [data]
        if (arr.length < 2) { setError('Need at least 2 items to compare.'); return }

        const first = arr[0]
        let texts = [], labels = [], field = null

        if (typeof first === 'string') {
          texts = arr.map(String)
          labels = arr.map((_, i) => `Item ${i + 1}`)
        } else if (typeof first === 'object') {
          const keys = Object.keys(first)
          // pick longest avg text field
          const textField = keys.find((k) => {
            const avg = arr.slice(0, 5).reduce((s, x) => s + String(x[k] || '').length, 0) / 5
            return avg > 8
          }) || keys[0]
          field = textField
          texts = arr.map((x) => String(x[textField] || ''))
          const labelKey = keys.find((k) => k !== textField)
          labels = arr.map((x, i) => labelKey ? String(x[labelKey]).slice(0, 22) : `Item ${i + 1}`)
        }
        onData({ texts, labels, field, filename: file.name, count: arr.length })
      } catch {
        setError('Invalid JSON — check your file and try again.')
      }
    }
    reader.readAsText(file)
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    parse(e.dataTransfer.files[0])
  }

  return (
    <div className="upload-outer">
      <div
        className={`upload-zone${dragging ? ' drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <input ref={inputRef} type="file" accept=".json" hidden
          onChange={(e) => parse(e.target.files[0])} />

        <div className="upload-icon-wrap">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="10" fill="rgba(251,191,36,0.08)" />
            <path d="M22 28V16M22 16L16 22M22 16L28 22" stroke="#fbbf24"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 32h20" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <p className="upload-title">Drop your JSON file</p>
        <p className="upload-sub">
          or <span className="upload-link">browse to upload</span>
        </p>
        <p className="upload-hint">Array of strings or objects with text fields</p>

        {error && <p className="upload-error">{error}</p>}
      </div>

      <div className="sample-row">
        <span className="sample-lbl">Quick samples:</span>
        <button className="sample-chip" onClick={(e) => { e.stopPropagation(); loadSample('answers', onData) }}>📚 DB Answers</button>
        <button className="sample-chip" onClick={(e) => { e.stopPropagation(); loadSample('texts', onData) }}>📝 Texts</button>
      </div>
    </div>
  )
}

// ── Sample loader ──
const SAMPLES = {
  answers: {
    filename: 'sample_db_answers.json',
    items: [
      { student: 'Alex',   answer: 'The ER model represents entities with attributes and relationships using cardinality constraints. Strong entities have primary keys; weak entities depend on strong ones. Each entity converts to a relational table during schema design.' },
      { student: 'Beth',   answer: 'Entity-relationship diagrams show entities, their attributes, and cardinality of relationships. Entities become tables with primary keys. Weak entities depend on strong entities and get composite keys with the parent foreign key.' },
      { student: 'Carlos', answer: 'ER diagrams model real-world systems using entities, attributes, and relationships with cardinalities like one-to-many. In relational schema conversion, entities become tables and relationships are expressed through foreign keys.' },
      { student: 'Diana',  answer: 'Python is a general-purpose language used for data science and automation. It supports object-oriented and functional programming, and is widely used for building APIs and web applications.' },
      { student: 'Eve',    answer: 'Database normalization removes redundancy from relational schemas. 1NF, 2NF, and 3NF are progressive steps. The ER model is designed first and then converted to normalized relational tables with defined primary and foreign keys.' },
      { student: 'Frank',  answer: 'An ER model uses entities and relationships to capture database requirements. Strong entities map directly to tables with their own primary keys. Many-to-many relationships require junction tables in the relational model.' },
    ]
  },
  texts: {
    filename: 'sample_texts.json',
    items: [
      'Database management systems store and retrieve structured data efficiently using query languages.',
      'Data in database systems is stored and retrieved efficiently via structured query languages.',
      'Machine learning requires large labelled training datasets to build accurate predictive models.',
      'Accurate predictive models in machine learning depend on large amounts of labelled training data.',
      'SQL is a declarative language used to query and manage relational databases.',
      'Relational databases are queried and managed using SQL, a declarative data language.',
    ]
  }
}

function loadSample(key, onData) {
  const s = SAMPLES[key]
  const arr = s.items
  const first = arr[0]
  if (typeof first === 'string') {
    onData({ texts: arr.map(String), labels: arr.map((_, i) => `T${i + 1}`),
      field: null, filename: s.filename, count: arr.length })
  } else {
    const keys = Object.keys(first)
    const tf = keys[1]
    onData({
      texts: arr.map((x) => String(x[tf] || '')),
      labels: arr.map((x) => String(x[keys[0]]).slice(0, 22)),
      field: tf, filename: s.filename, count: arr.length,
    })
  }
}