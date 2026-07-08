import { useState } from 'react'
import { MONTH_NAMES, DAY_NAMES, clock12, formatDMY } from '../lib/format.js'
import { API_BASE } from '../lib/api.js'

function SchedulePreview({ result, monthNumber, year, supervisorHours }) {
  const { supervisor, schedule } = result
  const monthTotal = schedule.weeks.reduce(
    (sum, week) => sum + week.reduce((w, s) => w + s.durationHours, 0),
    0
  )

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-ink-900">{supervisor}</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {supervisorHours} hrs/week assigned &middot; {Math.round(monthTotal)} hrs total this
            month
          </p>
        </div>
        <span className="badge bg-brand-soft text-brand-dark border border-brand/30 font-mono">
          {Math.round(monthTotal)} hrs
        </span>
      </div>

      <div className="p-4 space-y-4">
        {schedule.weeks.map((sessions, wkIdx) => {
          const weekTotal = sessions.reduce((s, sess) => s + sess.durationHours, 0)

          if (sessions.length === 0) {
            return (
              <div key={wkIdx} className="bg-cream/50 rounded-xl p-3 border border-ink-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-ink-500">Week {wkIdx + 1}</span>
                  <span className="text-xs font-mono text-ink-400">0 hrs</span>
                </div>
                <p className="text-xs text-ink-400 italic">No sessions this week</p>
              </div>
            )
          }

          return (
            <div key={wkIdx} className="bg-cream/50 rounded-xl border border-ink-200">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-200">
                <span className="text-xs font-semibold text-ink-700">Week {wkIdx + 1}</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    Math.round(weekTotal) >= supervisorHours ? 'text-plum' : 'text-brand-dark'
                  }`}
                >
                  {Math.round(weekTotal)} / {supervisorHours} hrs
                </span>
              </div>
              <div className="divide-y divide-ink-200/70">
                {sessions.map((s, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs">
                    <span className="text-ink-600 font-mono">
                      {formatDMY(year, monthNumber, s.date)}
                    </span>
                    <span className="text-ink-700">{DAY_NAMES[s.dayOfWeek]}</span>
                    <span className="text-ink-600 font-mono">
                      {clock12(s.start)} &ndash; {clock12(s.end)}
                    </span>
                    <span className="text-right text-brand-dark font-mono font-semibold">
                      {s.durationHours % 1 === 0 ? s.durationHours : s.durationHours.toFixed(1)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function GenerateSection({ student, supervisors, weekDates, courses }) {
  const [previewResults, setPreviewResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [bills, setBills] = useState([])

  const weekDatesArray = [1, 2, 3, 4].map((w) => weekDates[w] || [])
  const combined = supervisors.reduce((s, sup) => s + Number(sup.hoursPerWeek || 0), 0)

  const callApi = async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Request failed')
    return data
  }

  const handlePreview = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await callApi('/api/generate-schedule', {
        year: student.year,
        month: student.month,
        weekDates: weekDatesArray,
        supervisors,
        courses,
      })
      setPreviewResults(data.results)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const data = await callApi('/api/generate-bills', {
        name: student.name,
        id: student.id,
        phoneNumber: student.phoneNumber,
        bankaccnum: student.bankaccnum,
        year: student.year,
        month: student.month,
        weekDates: weekDatesArray,
        supervisors,
        courses,
      })
      setBills(data.bills)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const downloadBill = (bill) => {
    const bytes = Uint8Array.from(atob(bill.buffer), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = bill.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="step-dot bg-brand-soft text-brand-dark border border-brand/30">5</span>
            <div>
              <h2 className="section-title">Review &amp; Generate</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Preview the schedules, then export the Word bills
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-cream/60 rounded-xl p-3 border border-ink-200">
              <div className="text-xs text-ink-500 mb-1">Student</div>
              <div className="text-sm font-semibold text-ink-900 truncate">
                {student.name || '\u2014'}
              </div>
            </div>
            <div className="bg-cream/60 rounded-xl p-3 border border-ink-200">
              <div className="text-xs text-ink-500 mb-1">Period</div>
              <div className="text-sm font-semibold text-ink-900">
                {MONTH_NAMES[student.month - 1]} {student.year}
              </div>
            </div>
            <div className="bg-cream/60 rounded-xl p-3 border border-ink-200">
              <div className="text-xs text-ink-500 mb-1">Bills</div>
              <div className="text-sm font-semibold text-brand-dark">{supervisors.length}</div>
            </div>
            <div className="bg-cream/60 rounded-xl p-3 border border-ink-200">
              <div className="text-xs text-ink-500 mb-1">Combined hrs/wk</div>
              <div className="text-sm font-semibold text-plum">{combined} / 20</div>
            </div>
          </div>

          <div className="bg-cream/60 rounded-xl p-4 border border-ink-200 mb-4">
            <h3 className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-3">
              Supervisors
            </h3>
            <div className="space-y-2">
              {supervisors.map((sup, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-ink-700">{sup.name || `Supervisor ${i + 1}`}</span>
                  <span className="font-mono text-brand-dark">{sup.hoursPerWeek} hrs/week</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-cream/60 rounded-xl p-4 border border-ink-200 mb-6">
            <h3 className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-3">
              Eligible Dates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((wk) => (
                <div key={wk}>
                  <div className="text-xs text-ink-500 mb-1">Week {wk}</div>
                  <div className="text-xs font-mono text-ink-700">
                    {(weekDates[wk] || []).length > 0 ? (
                      (weekDates[wk] || []).join(', ')
                    ) : (
                      <span className="text-ink-400 italic">none</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="btn-primary" onClick={handlePreview} disabled={loading}>
            {loading ? 'Generating schedules\u2026' : '\u25B6 Preview Schedules'}
          </button>
          <p className="text-xs text-ink-400 mt-2">
            The first request after a quiet period can take up to a minute while the server wakes
            up.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-500 text-sm">
          {error}
        </div>
      )}

      {previewResults && (
        <div className="space-y-4 animate-fadein">
          <h3 className="font-display text-xl font-bold text-ink-900">Generated Schedules</h3>

          {previewResults.map((result, i) => (
            <SchedulePreview
              key={i}
              result={result}
              monthNumber={student.month}
              year={student.year}
              supervisorHours={supervisors[i]?.hoursPerWeek || 0}
            />
          ))}

          <div className="card">
            <div className="card-header">
              <h3 className="section-title">Generate Word Documents</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-cream/60 rounded-xl p-4 border border-ink-200 text-xs text-ink-600">
                <div className="font-semibold text-ink-700 mb-1">Template loaded from server</div>
                The official bill template is stored on the server &mdash; nothing to upload.
              </div>
              <button
                type="button"
                className="btn-primary w-full justify-center py-3"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating Word files\u2026' : '\u2B07 Generate & Download All Bills'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bills.length > 0 && (
        <div className="card animate-fadein">
          <div className="card-header">
            <h3 className="section-title text-plum">&#10003; Bills Generated Successfully</h3>
          </div>
          <div className="p-6 space-y-3">
            {bills.map((bill, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 bg-cream/60 rounded-xl p-4 border border-ink-200"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-900">{bill.supervisor}</div>
                  <div className="text-xs text-ink-500 font-mono mt-0.5 truncate">
                    {bill.filename}
                  </div>
                </div>
                <button type="button" className="btn-primary" onClick={() => downloadBill(bill)}>
                  &#11015; Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
