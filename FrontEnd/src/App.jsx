import { useState } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import prism from "prismjs"
import axios from 'axios'
import './App.css'

function getPrismLang(lang) {
  const map = {
    'javascript': 'javascript', 'typescript': 'typescript', 'python': 'python',
    'java': 'java', 'c': 'c', 'c++': 'cpp', 'c#': 'csharp', 'go': 'go',
    'php': 'php', 'ruby': 'ruby', 'rust': 'rust', 'kotlin': 'kotlin',
    'swift': 'swift', 'sql': 'sql', 'html': 'html', 'css': 'css'
  }
  return map[lang?.toLowerCase()] || 'javascript'
}

function highlightCode(code, lang) {
  if (!code) return ''
  const prismLang = getPrismLang(lang)
  const grammar = prism.languages[prismLang] || prism.languages.javascript
  return prism.highlight(code, grammar, prismLang)
}

function parseSections(markdown) {
  const lines = markdown.split('\n')
  const sections = []
  let current = null
  for (const line of lines) {
    if (line.startsWith('# ')) {
      if (current) sections.push(current)
      current = { heading: line.replace(/^# /, '').trim(), lines: [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) sections.push(current)
  return sections
}

function parseErrors(lines) {
  const text = lines.join('\n').trim()
  if (text === '✅ No Errors Found') return []
  const errors = []
  let current = null
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('**Error')) {
      if (current) errors.push(current)
      current = {}
      continue
    }
    const kv = line.match(/^-\s*\*\*(.+?):\*\*\s*(.+)$/)
    if (kv && current) {
      current[kv[1].trim().toLowerCase()] = kv[2].trim()
    }
  }
  if (current) errors.push(current)
  return errors
}

function parseCodeBlock(lines) {
  const text = lines.join('\n')
  const m = text.match(/```(\w*)\n([\s\S]*?)```/)
  return m ? { lang: m[1], code: m[2].trimEnd() } : null
}

function parseNumberedList(lines) {
  return lines.map(l => l.trim().match(/^\d+\.\s+(.+)$/)).filter(Boolean).map(m => m[1])
}

function parseBulletList(lines) {
  return lines.map(l => l.trim().match(/^-\s+(.+)$/)).filter(Boolean).map(m => m[1])
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`review-card ${className}`}>
      <div className="card-header"><h3>{title}</h3></div>
      <div className="card-body">{children}</div>
    </div>
  )
}

function App() {
  const [code, setCode] = useState(` function sum() {
  return 1 + 1
}`)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copyMsg, setCopyMsg] = useState('')
  const [quotaExceeded, setQuotaExceeded] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('')

  async function reviewCode() {
    setLoading(true)
    setError('')
    setCopyMsg('')
    setQuotaExceeded(false)
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || ''
      const response = await axios.post(`${BASE_URL}/ai/get-review`, { code, language: selectedLanguage })
      setReview(String(response.data))
    } catch (err) {
      const status = err.response?.status
      const data = err.response?.data
      if (status === 429) {
        setQuotaExceeded(true)
      } else {
        const msg = typeof data === 'string' ? data : data?.error || data?.message || 'Something went wrong. Check the backend logs.'
        setError(msg)
        setReview('')
      }
    } finally {
      setLoading(false)
    }
  }

  function copyReview() {
    navigator.clipboard.writeText(review)
    setCopyMsg('Copied!')
    setTimeout(() => setCopyMsg(''), 2000)
  }

  function downloadReview() {
    const blob = new Blob([review], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'code-review.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const sections = parseSections(review)
  const metaItems = []
  const complexityItems = []
  const cards = []

  for (const sec of sections) {
    const h = sec.heading
    const raw = sec.lines.join('\n').trim()

    if (h.includes('🔍') || h.includes('🛠') || h.includes('📦')) {
      const label = h.includes('🔍') ? 'Language' : h.includes('🛠') ? 'Framework' : 'Library'
      metaItems.push({ label, value: raw })
      continue
    }

    if (h.includes('⚡')) { complexityItems.push({ label: 'Time', value: raw }); continue }
    if (h.includes('💾')) { complexityItems.push({ label: 'Space', value: raw }); continue }

    if (h.includes('⭐ Overall Rating')) {
      cards.push(
        <SectionCard key="rating" title="Overall Rating" className="card-rating">
          <span className={`rating-badge rating-${raw.toLowerCase()}`}>{raw}</span>
        </SectionCard>
      )
    } else if (h.includes('📊 Code Score')) {
      const score = raw.replace('/100', '')
      cards.push(
        <SectionCard key="score" title="Code Score">
          <div className="score-display"><span className="score-num">{score}</span><span className="score-total">/100</span></div>
        </SectionCard>
      )
    } else if (h.includes('📋 Total Issues')) {
      const crit = sec.lines.find(l => l.includes('Critical:'))?.split(':')[1]?.trim() || '0'
      const maj = sec.lines.find(l => l.includes('Major:'))?.split(':')[1]?.trim() || '0'
      const min = sec.lines.find(l => l.includes('Minor:'))?.split(':')[1]?.trim() || '0'
      cards.push(
        <SectionCard key="issues" title="Total Issues">
          <div className="issue-row">
            <span className="issue-badge issue-critical">{crit} Critical</span>
            <span className="issue-badge issue-major">{maj} Major</span>
            <span className="issue-badge issue-minor">{min} Minor</span>
          </div>
        </SectionCard>
      )
    } else if (h.includes('❌ Errors')) {
      const errors = parseErrors(sec.lines)
      if (errors.length === 0) {
        cards.push(
          <SectionCard key="errors" title="Errors" className="card-success">
            <div className="no-errors">✅ No Errors Found</div>
          </SectionCard>
        )
      } else {
        cards.push(
          <SectionCard key="errors" title={`Errors (${errors.length})`}>
            <div className="errors-list">
              {errors.map((err, i) => (
                <div className="error-subcard" key={i}>
                  <div className="error-num">Error {i + 1}</div>
                  <div className="error-fields">
                    {err.type && (
                      <div className="error-field"><span className="ef-label">Type</span><span className="ef-value"><span className={`err-tag err-${err.type.toLowerCase().replace(/\s+/g, '-')}`}>{err.type}</span></span></div>
                    )}
                    {err.severity && (
                      <div className="error-field"><span className="ef-label">Severity</span><span className="ef-value"><span className={`sev-tag sev-${err.severity.toLowerCase()}`}>{err.severity}</span></span></div>
                    )}
                    {err.line && (
                      <div className="error-field"><span className="ef-label">Line</span><span className="ef-value ef-line">{err.line}</span></div>
                    )}
                    {err.reason && (
                      <div className="error-field"><span className="ef-label">Reason</span><span className="ef-value">{err.reason}</span></div>
                    )}
                    {err.fix && (
                      <div className="error-field"><span className="ef-label">Fix</span><span className="ef-value ef-fix">{err.fix}</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )
      }
    } else if (h.includes('🔧 Fixed Code')) {
      const block = parseCodeBlock(sec.lines)
      if (block) cards.push(
        <SectionCard key="fixed-code" title="Fixed Code">
          <pre className="code-card"><code dangerouslySetInnerHTML={{ __html: highlightCode(block.code, block.lang) }} /></pre>
        </SectionCard>
      )
    } else if (h.includes('📖 Line-by-Line Explanation')) {
      const items = parseNumberedList(sec.lines)
      if (items.length) cards.push(
        <SectionCard key="fixed-explain" title="Line-by-Line Explanation">
          <ol className="explist">{items.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </SectionCard>
      )
    } else if (h.includes('🚀 Optimized Code')) {
      const block = parseCodeBlock(sec.lines)
      if (block) cards.push(
        <SectionCard key="opt-code" title="Optimized Code">
          <pre className="code-card"><code dangerouslySetInnerHTML={{ __html: highlightCode(block.code, block.lang) }} /></pre>
        </SectionCard>
      )
    } else if (h.includes('📖 Optimized Code Explanation')) {
      const items = parseNumberedList(sec.lines)
      if (items.length) cards.push(
        <SectionCard key="opt-explain" title="Optimized Code Explanation">
          <ol className="explist">{items.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </SectionCard>
      )
    } else if (h.includes('💡 Best Practices')) {
      const items = parseBulletList(sec.lines)
      if (items.length) cards.push(
        <SectionCard key="practices" title="Best Practices">
          <ul className="practices-list">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </SectionCard>
      )
    } else if (h.includes('📝 Final Verdict')) {
      cards.push(
        <SectionCard key="verdict" title="Final Verdict" className="card-verdict">
          <p className="verdict-text">{raw}</p>
        </SectionCard>
      )
    }
  }

  return (
    <>
      <main>
        <div className="left">
          <div className="lang-selector">
            <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}>
              <option value="">Auto Detect</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="C">C</option>
              <option value="C++">C++</option>
              <option value="C#">C#</option>
              <option value="Go">Go</option>
              <option value="PHP">PHP</option>
              <option value="Ruby">Ruby</option>
              <option value="Rust">Rust</option>
              <option value="Kotlin">Kotlin</option>
              <option value="Swift">Swift</option>
              <option value="SQL">SQL</option>
              <option value="HTML">HTML</option>
              <option value="CSS">CSS</option>
            </select>
          </div>
          <div className="code">
            <Editor
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => prism.highlight(code, prism.languages.javascript, "javascript")}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 16,
                border: "1px solid #ddd",
                borderRadius: "5px",
                height: "100%",
                width: "100%"
              }}
            />
          </div>
          <div onClick={loading ? undefined : reviewCode} className={`review ${loading ? 'review-disabled' : ''}`}>
            {loading ? "Reviewing..." : "Review"}
          </div>
        </div>
        <div className="right">
          {error && <div className="error">{error}</div>}
          {quotaExceeded && (
            <div className="review-card card-warning">
              <div className="card-header"><h3>Quota Exceeded</h3></div>
              <div className="card-body">
                <div className="quota-icon">⚠️</div>
                <p className="quota-text">
                  Gemini API quota exceeded. The free daily limit has been reached.
                  Please try again after the quota resets or use another API key.
                </p>
              </div>
            </div>
          )}
          {review && !error && !quotaExceeded && (
            <div className="review-dashboard">
              <div className="toolbar">
                <button className="toolbar-btn" onClick={copyReview}>Copy Review</button>
                <button className="toolbar-btn" onClick={downloadReview}>Download Review</button>
                {copyMsg && <span className="copy-msg">{copyMsg}</span>}
              </div>

              {metaItems.length > 0 && (
                <div className="review-card card-meta">
                  <div className="card-header"><h3>Overview</h3></div>
                  <div className="meta-grid">
                    {metaItems.map((m, i) => (
                      <div className="meta-item" key={i}>
                        <span className="meta-label">{m.label}</span>
                        <span className="meta-value">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cards}

              {complexityItems.length > 0 && (
                <div className="review-card card-complexity">
                  <div className="card-header"><h3>Complexity</h3></div>
                  <div className="complexity-grid">
                    {complexityItems.map((c, i) => (
                      <div className="complexity-item" key={i}>
                        <span className="cx-label">{c.label}</span>
                        <span className="cx-value">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default App
