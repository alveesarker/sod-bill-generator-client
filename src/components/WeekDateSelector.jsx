import { useEffect, useState } from 'react'
import ImageExtract from './ImageExtract.jsx'
import { MONTH_NAMES, DAY_NAMES_SHORT, daysInMonth, weekdayOf } from '../lib/format.js'
import { parseWeekDatesFromTexts } from '../lib/scheduleParsers.js'
import { fetchSharedDates } from '../lib/api.js'

// Visual identity for the four week panels.
const WEEK_STYLES = [
  {
    panel: 'bg-brand-soft border-brand/25 hover:border-brand/50',
    text: 'text-brand-dark',
    selected: 'bg-brand text-white',
  },
  {
    panel: 'bg-plum-soft border-plum/25 hover:border-plum/50',
    text: 'text-plum',
    selected: 'bg-plum text-white',
  },
  {
    panel: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400',
    text: 'text-cyan-700',
    selected: 'bg-cyan-600 text-white',
  },
  {
    panel: 'bg-rose-50 border-rose-200 hover:border-rose-400',
    text: 'text-rose-600',
    selected: 'bg-rose-500 text-white',
  },
]

export default function WeekDateSelector({
  month,
  year,
  weekDates,
  onChange,
  onExtracted,
  onUseShared,
  errors,
}) {
  const totalDays = daysInMonth(month, year)

  // Dates another student already extracted for this month, if any.
  const [shared, setShared] = useState(null)
  const [sharedApplied, setSharedApplied] = useState(false)
  useEffect(() => {
    let cancelled = false
    setShared(null)
    setSharedApplied(false)
    fetchSharedDates(year, month).then((entry) => {
      if (!cancelled) setShared(entry)
    })
    return () => {
      cancelled = true
    }
  }, [year, month])

  const useShared = () => {
    onUseShared({ month, year, weekDates: shared.weekDates })
    setSharedApplied(true)
  }

  const sharedCount = shared
    ? Object.values(shared.weekDates).reduce((n, arr) => n + arr.length, 0)
    : 0

  const handleTexts = async (texts) => {
    // Each week takes the variant that read it best (see the parser): one
    // variant losing a single week no longer loses it for the whole upload.
    const parsed = parseWeekDatesFromTexts(texts)
    if (parsed.weekDates) return onExtracted(parsed)
    throw new Error(
      'No "Week 1/2/3/4" lists found. Make sure the message text is readable in the screenshot.'
    )
  }
  const allDays = Array.from({ length: totalDays }, (_, i) => i + 1)
  const assigned = new Set(Object.values(weekDates).flat())

  const toggleDate = (week, day) => {
    // A date may belong to at most one week, so remove it everywhere first.
    const wasSelected = (weekDates[week] || []).includes(day)
    const next = {}
    for (let w = 1; w <= 4; w++) {
      next[w] = (weekDates[w] || []).filter((d) => d !== day)
    }
    if (!wasSelected) {
      next[week] = [...next[week], day].sort((a, b) => a - b)
    }
    onChange(next)
  }

  const clearWeek = (week) => onChange({ ...weekDates, [week]: [] })

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <span className="step-dot bg-brand-soft text-brand-dark border border-brand/30">4</span>
          <div>
            <h2 className="section-title">Eligible Working Dates</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              {MONTH_NAMES[month - 1]} {year} &middot; Assign dates to each week
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-5">
          <ImageExtract
            title="Fill from a screenshot"
            hint='Upload the announcement message &mdash; lines like "Week 1 : 1,2,3,4,5,6" fill the grids, and a month header like "JUNE 2026" sets the month automatically.'
            onTexts={handleTexts}
          />
        </div>

        {shared && (
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-6 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[14rem] text-xs text-cyan-700">
              <strong>
                Shared dates available for {MONTH_NAMES[month - 1]} {year}:
              </strong>{' '}
              another student already uploaded this month&rsquo;s announcement ({sharedCount}{' '}
              date{sharedCount === 1 ? '' : 's'}, saved{' '}
              {new Date(shared.updatedAt).toLocaleDateString()}) &mdash; no screenshot needed.
            </div>
            {sharedApplied ? (
              <span className="text-xs font-semibold text-cyan-700">
                &#10003; Applied &mdash; review the grids below
              </span>
            ) : (
              <button type="button" className="btn-secondary text-sm" onClick={useShared}>
                Use these dates
              </button>
            )}
          </div>
        )}

        <div className="bg-brand-soft border border-brand/25 rounded-xl p-4 mb-6 text-xs text-ink-700">
          <strong>Note:</strong> weeks here are billing weeks, not calendar weeks. Assign dates
          the way your department defines them &mdash; they can be non-consecutive, and each date
          can belong to only one week.
        </div>

        {errors.weekDates && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-500 text-sm mb-4">
            {errors.weekDates}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((wk) => {
            const style = WEEK_STYLES[wk - 1]
            const selected = weekDates[wk] || []
            return (
              <div key={wk} className={`rounded-xl border p-4 transition-colors ${style.panel}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-semibold text-sm ${style.text}`}>Week {wk}</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${style.selected}`}>{selected.length} dates</span>
                    {selected.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearWeek(wk)}
                        className="text-xs text-ink-500 hover:text-ink-900 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {allDays.map((day) => {
                    const isSelected = selected.includes(day)
                    const inOtherWeek = !isSelected && assigned.has(day)
                    const dayName = DAY_NAMES_SHORT[weekdayOf(year, month, day)]
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={inOtherWeek}
                        onClick={() => toggleDate(wk, day)}
                        title={`${day} ${MONTH_NAMES[month - 1]} (${dayName})`}
                        className={`aspect-square flex items-center justify-center rounded-lg text-xs font-mono font-medium transition-all duration-150 ${
                          isSelected
                            ? style.selected
                            : inOtherWeek
                              ? 'opacity-25 cursor-not-allowed text-ink-500'
                              : 'text-ink-600 hover:bg-white/70 hover:text-ink-900'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>

                {selected.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-ink-900/10 flex flex-wrap gap-1">
                    {selected.map((d) => (
                      <span key={d} className={`badge font-mono ${style.selected}`}>
                        {String(d).padStart(2, '0')} {DAY_NAMES_SHORT[weekdayOf(year, month, d)]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-5 bg-cream/60 rounded-xl p-4 border border-ink-200">
          <h3 className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-2">
            Date Assignment Summary
          </h3>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((wk) => (
              <div
                key={wk}
                className={`text-xs px-3 py-1.5 rounded-lg border ${WEEK_STYLES[wk - 1].panel}`}
              >
                <span className={WEEK_STYLES[wk - 1].text}>Week {wk}</span>
                <span className="text-ink-500 ml-1">
                  {(weekDates[wk] || []).length > 0 ? (weekDates[wk] || []).join(', ') : 'No dates'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-2">
            Total assigned: {assigned.size} / {totalDays} days
          </p>
        </div>
      </div>
    </div>
  )
}
