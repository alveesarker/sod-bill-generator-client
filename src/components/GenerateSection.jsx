import { useState } from 'react'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_NAMES = [
  'Sunday','Monday','Tuesday','Wednesday',
  'Thursday','Friday','Saturday'
]

function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const p = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12

  return `${h12}:${String(m).padStart(2,'0')} ${p}`
}

function formatDate(year, month, day) {
  return `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`
}

function SchedulePreview({
  result,
  monthNumber,
  year,
  supervisorHours
}) {
  const { supervisor, schedule } = result

  const monthTotal = schedule.weeks.reduce((total, week) => {
    return total + week.reduce((wt, s) => wt + s.durationHours, 0)
  }, 0)

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ink-100">
              {supervisor}
            </h3>

            <p className="text-xs text-ink-500 mt-0.5">
              {supervisorHours} hrs/week assigned · {Math.round(monthTotal)} hrs total this month
            </p>
          </div>

          <div className="badge bg-gold-500/15 text-gold-400 border border-gold-500/30 font-mono">
            {Math.round(monthTotal)} hrs
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {schedule.weeks.map((sessions, wkIdx) => {
          const wkTotal = sessions.reduce(
            (s, sess) => s + sess.durationHours,
            0
          )

          if (sessions.length === 0) {
            return (
              <div
                key={wkIdx}
                className="bg-ink-800/30 rounded-xl p-3 border border-ink-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink-500">
                    Week {wkIdx + 1}
                  </span>

                  <span className="text-xs font-mono text-ink-600">
                    0 hrs
                  </span>
                </div>

                <p className="text-xs text-ink-600 italic">
                  No eligible dates for this week
                </p>
              </div>
            )
          }

          return (
            <div
              key={wkIdx}
              className="bg-ink-800/50 rounded-xl border border-ink-700"
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-700">
                <span className="text-xs font-semibold text-ink-300">
                  Week {wkIdx + 1}
                </span>

                <span
                  className={`text-xs font-mono font-bold ${
                    Math.round(wkTotal) >= supervisorHours
                      ? 'text-jade-400'
                      : 'text-gold-400'
                  }`}
                >
                  {Math.round(wkTotal)} / {supervisorHours} hrs
                </span>
              </div>

              <div className="divide-y divide-ink-800">
                {sessions.map((s, si) => (
                  <div
                    key={si}
                    className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs"
                  >
                    <span className="text-ink-400 font-mono">
                      {formatDate(year, monthNumber, s.date)}
                    </span>

                    <span className="text-ink-300">
                      {DAY_NAMES[s.dayOfWeek]}
                    </span>

                    <span className="text-ink-400 font-mono">
                      {minutesToTime(s.start)} – {minutesToTime(s.end)}
                    </span>

                    <span className="text-right text-gold-400 font-mono font-semibold">
                      {s.durationHours % 1 === 0
                        ? s.durationHours
                        : s.durationHours.toFixed(1)}h
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

export default function GenerateSection({
  student,
  supervisors,
  weekDates,
  courses,
}) {
  const [previewResults, setPreviewResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [bills, setBills] = useState([])

  const weekDatesArray = [
    weekDates[1] || [],
    weekDates[2] || [],
    weekDates[3] || [],
    weekDates[4] || [],
  ]

  const handlePreview = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: student.year,
          month: student.month,
          weekDates: weekDatesArray,
          supervisors,
          courses,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

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
      const res = await fetch('/api/generate-bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: student.name,
          id: student.id,
          phoneNumber: student.phoneNumber,
          bankaccnum: student.bankaccnum,
          year: student.year,
          month: student.month,
          weekDates: weekDatesArray,
          supervisors,
          courses,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      setBills(data.bills)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const downloadBill = (bill) => {
    const bytes = Uint8Array.from(
      atob(bill.buffer),
      c => c.charCodeAt(0)
    )

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')

    a.href = url
    a.download = bill.filename
    a.click()

    URL.revokeObjectURL(url)
  }

  const combinedHours = supervisors.reduce(
    (s, sup) => s + Number(sup.hoursPerWeek || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="step-indicator bg-gold-500/20 text-gold-400 border border-gold-500/30">
              5
            </div>

            <div>
              <h2 className="section-title">
                Review & Generate
              </h2>

              <p className="text-xs text-ink-500 mt-0.5">
                Preview schedules and export Word documents
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Summary info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-ink-800 rounded-xl p-3 border border-ink-700">
              <div className="text-xs text-ink-500 mb-1">
                Student
              </div>

              <div className="text-sm font-semibold text-ink-200 truncate">
                {student.name || '—'}
              </div>
            </div>

            <div className="bg-ink-800 rounded-xl p-3 border border-ink-700">
              <div className="text-xs text-ink-500 mb-1">
                Period
              </div>

              <div className="text-sm font-semibold text-ink-200">
                {MONTH_NAMES[student.month - 1]} {student.year}
              </div>
            </div>

            <div className="bg-ink-800 rounded-xl p-3 border border-ink-700">
              <div className="text-xs text-ink-500 mb-1">
                Bills
              </div>

              <div className="text-sm font-semibold text-gold-400">
                {supervisors.length}
              </div>
            </div>

            <div className="bg-ink-800 rounded-xl p-3 border border-ink-700">
              <div className="text-xs text-ink-500 mb-1">
                Combined hrs/wk
              </div>

              <div className="text-sm font-semibold text-jade-400">
                {combinedHours} / 20
              </div>
            </div>
          </div>

          {/* Supervisors summary */}
          <div className="bg-ink-800/50 rounded-xl p-4 border border-ink-700 mb-4">
            <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">
              Supervisors
            </h3>

            <div className="space-y-2">
              {supervisors.map((sup, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-ink-300">
                    {sup.name || `Supervisor ${i + 1}`}
                  </span>

                  <span className="font-mono text-gold-400">
                    {sup.hoursPerWeek} hrs/week
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Eligible dates */}
          <div className="bg-ink-800/50 rounded-xl p-4 border border-ink-700 mb-6">
            <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">
              Eligible Dates
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((wk) => (
                <div key={wk}>
                  <div className="text-xs text-ink-500 mb-1">
                    Week {wk}
                  </div>

                  <div className="text-xs font-mono text-ink-300">
                    {(weekDates[wk] || []).length > 0
                      ? (weekDates[wk] || []).join(', ')
                      : (
                        <span className="text-ink-600 italic">
                          none
                        </span>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="btn-primary animate-pulse-gold"
              onClick={handlePreview}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  {' '}
                  Generating Schedules...
                </>
              ) : (
                <>
                  <span>▶</span>
                  {' '}
                  Preview Schedules
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Preview results */}
      {previewResults && (
        <div className="space-y-4 animate-fadein">
          <h3 className="font-display text-xl font-bold text-ink-100">
            Generated Schedules
          </h3>

          {previewResults.map((result, i) => (
            <SchedulePreview
              key={i}
              result={result}
              monthNumber={student.month}
              year={student.year}
              supervisorHours={supervisors[i]?.hoursPerWeek || 0}
            />
          ))}

          {/* Generate DOCX */}
          <div className="card">
            <div className="card-header">
              <h3 className="section-title">
                Generate Word Documents
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-ink-800/50 rounded-xl p-4 border border-ink-700 text-xs text-ink-400">
                <div className="font-semibold text-ink-300 mb-2">
                  Template Loaded From Server
                </div>

                <div className="text-ink-500">
                  The DOCX template is already stored on the server.
                  No upload is required.
                </div>
              </div>

              <button
                className="btn-primary w-full justify-center py-3"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    {' '}
                    Generating DOCX Files...
                  </>
                ) : (
                  <>
                    <span>⬇</span>
                    {' '}
                    Generate & Download All Bills
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download bills */}
      {bills.length > 0 && (
        <div className="card animate-fadein">
          <div className="card-header">
            <h3 className="section-title text-jade-400">
              ✓ Bills Generated Successfully
            </h3>
          </div>

          <div className="p-6 space-y-3">
            {bills.map((bill, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-ink-800 rounded-xl p-4 border border-ink-700"
              >
                <div>
                  <div className="text-sm font-medium text-ink-200">
                    {bill.supervisor}
                  </div>

                  <div className="text-xs text-ink-500 font-mono mt-0.5">
                    {bill.filename}
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => downloadBill(bill)}
                >
                  ⬇ Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}