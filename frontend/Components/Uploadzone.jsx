import { useRef, useState } from 'react'

/* ── built-in samples ──────────────────── */
const SAMPLES = {
  answers: [
    { id: 'STU001', student: 'Alex Geo Kishore',  content: 'The ER model represents entities with attributes and relationships using cardinality constraints. Strong entities have their own primary keys while weak entities depend on a strong entity for identification. The ER model is converted to relational tables where each entity becomes a table and relationships are represented using foreign keys.' },
    { id: 'STU002', student: 'Beth Kumar',         content: 'Entity-relationship diagrams depict entities, their attributes, and the cardinality of relationships between them. Entities become relational tables with primary keys upon conversion. Weak entities depend on strong entities and receive composite keys that include the parent foreign key.' },
    { id: 'STU003', student: 'Carlos Raj',         content: 'ER diagrams model real-world systems using entities, attributes, and relationships with cardinalities. In relational schema conversion, entities become tables and relationships are expressed through foreign keys. The online bookstore system includes entities: Book, Author, Customer, Order, and Category as strong entities.' },
    { id: 'STU004', student: 'Diana Nair',         content: 'Python is a general-purpose programming language widely used for data science, web development, and automation. It supports object-oriented, functional, and procedural programming paradigms.' },
    { id: 'STU005', student: 'Eve Suresh',         content: 'Database normalization eliminates redundancy and ensures data integrity through normal forms. 1NF removes repeating groups, 2NF eliminates partial dependencies, and 3NF removes transitive dependencies.' },
    { id: 'STU006', student: 'Frank Thomas',       content: 'ER model uses entities with attributes and relationships showing cardinalities. Strong entities have independent primary keys. Weak entities depend on strong entities. When converting to relational schema, each entity becomes a table. Many-to-many relationships require a junction table.' },
  ],
  texts: [
    'Database management systems store and retrieve structured data efficiently using query languages.',
    'Data in database systems is stored and retrieved efficiently via structured query languages.',
    'Machine learning requires large labelled training datasets to build accurate predictive models.',
    'Accurate predictive models in machine learning depend on large amounts of labelled training data.',
    'SQL is a declarative language used to query and manage relational databases.',
    'Relational databases are queried and managed using SQL, a declarative data language.',
  ],
}

function parseSample(key) {
  const s = SAMPLES[key]
  if (typeof s[0] === 'string') {
    return { texts: s, labels: s.map((_, i) => `T${String(i + 1).padStart(3, '0')}`), field: null, filename: `sample_${key}.json`, count: s.length }
  }
  return {
    texts:    s.map(x => x.content),
    labels:   s.map(x => x.student),
    field:    'content',
    filename: `sample_${key}.json`,
    count:    s.length,
  }
}

/* ── main component ────────────────────── */
export default function UploadZone({ onData }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError]       = useState('')

  function parseFile(file) {
    setError('')
    if (!file?.name.endsWith('.json')) { setError('Only .json files are supported.'); return }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target.result)
        const arr = Array.isArray(raw) ? raw : [raw]
        if (arr.length < 2) { setError('Need at least 2 items to compare.'); return }

        const first = arr[0]
        let texts, labels, field

        if (typeof first === 'string') {
          texts  = arr.map(String)
          labels = arr.map((_, i) => `Item ${String(i + 1).padStart(3, '0')}`)
          field  = null
        } else if (typeof first === 'object') {
          const keys      = Object.keys(first)
          const textField = keys.find(k => {
            const avg = arr.slice(0, 5).reduce((s, x) => s + String(x[k] || '').length, 0) / 5
            return avg > 10
          }) || keys[0]
          field  = textField
          texts  = arr.map(x => String(x[textField] || ''))
          const lk = keys.find(k => k !== textField)
          labels = arr.map((x, i) => lk ? String(x[lk]).slice(0, 20) : `Item ${String(i + 1).padStart(3, '0')}`)
        } else {
          setError('Unsupported JSON structure.'); return
        }

        onData({ texts, labels, field, filename: file.name, count: arr.length })
      } catch {
        setError('Invalid JSON — check your file and try again.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="upload-outer">
      <div
        className={`upload-zone${dragging ? ' drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); parseFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef} type="file" accept=".json" hidden
          onChange={(e) => parseFile(e.target.files[0])}
        />

        <div className="upload-icon-wrap">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="10" fill="rgba(251,191,36,0.08)" />
            <path d="M22 28V16M22 16L16 22M22 16L28 22"
              stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 32h20" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <p className="upload-title">Drop your JSON file here</p>
        <p className="upload-sub">or <span className="upload-link">browse to upload</span></p>
        <p className="upload-hint">Array of strings or objects with text fields</p>
        {error && <p className="upload-error">{error}</p>}
      </div>

      <div className="sample-row">
        <span className="sample-lbl">Try a sample:</span>
        <button className="sample-chip" onClick={(e) => { e.stopPropagation(); onData(parseSample('answers')) }}>
          📚 DB Answers
        </button>
        <button className="sample-chip" onClick={(e) => { e.stopPropagation(); onData(parseSample('texts')) }}>
          📝 Text Strings
        </button>
      </div>
    </div>
  )
}