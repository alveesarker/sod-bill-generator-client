const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate()
}

function getDayName(year, month, day) {
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  return names[new Date(year, month - 1, day).getDay()]
}

export default function WeekDateSelector({ month, year, weekDates, onChange, errors }) {
  const totalDays = getDaysInMonth(month, year)
  const allDays = Array.from({ length: totalDays }, (_, i) => i + 1)

  const toggleDate = (week, day) => {
    const current = weekDates[week] || []
    const isIn = current.includes(day)

    // Remove from other weeks first
    const cleaned = {}
    for (let w = 1; w <= 4; w++) {
      cleaned[w] = (weekDates[w] || []).filter(d => d !== day)
    }

    if (!isIn) {
      cleaned[week] = [...cleaned[week], day].sort((a, b) => a - b)
    }

    onChange(cleaned)
  }

  const clearWeek = (week) => {
    onChange({ ...weekDates, [week]: [] })
  }

  const weekColors = ['gold', 'violet', 'cyan', 'rose']
  const weekBgs = [
    'bg-gold-500/10 border-gold-500/20 hover:border-gold-500/40',
    'bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40',
    'bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40',
    'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40',
  ]
  const weekTextColors = ['text-gold-400', 'text-violet-400', 'text-cyan-400', 'text-rose-400']
  const weekSelectedBgs = [
    'bg-gold-500 text-ink-950',
    'bg-violet-500 text-white',
    'bg-cyan-500 text-ink-950',
    'bg-rose-500 text-white',
  ]

  // Figure out which dates are assigned to any week
  const assignedDates = new Set(Object.values(weekDates).flat())

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="step-indicator bg-gold-500/20 text-gold-400 border border-gold-500/30">3</div>
            <div>
              <h2 className="section-title">Eligible Working Dates</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                {MONTH_NAMES[month - 1]} {year} · Manually assign dates to each week
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-ink-800/50 border border-amber-500/20 rounded-xl p-4 mb-6 text-xs text-amber-300/80">
            ⚠️ <strong>Important:</strong> Weeks are NOT calendar weeks. Assign dates manually as your department defines them. 
            Dates can be non-consecutive. A date can only belong to one week.
          </div>

          {errors.weekDates && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm mb-4">
              {errors.weekDates}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(wk => {
              const selected = weekDates[wk] || []
              const wkIdx = wk - 1
              return (
                <div key={wk} className={`rounded-xl border p-4 ${weekBgs[wkIdx]}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-semibold text-sm ${weekTextColors[wkIdx]}`}>
                      Week {wk}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${weekSelectedBgs[wkIdx]} text-xs`}>
                        {selected.length} dates
                      </span>
                      {selected.length > 0 && (
                        <button
                          onClick={() => clearWeek(wk)}
                          className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {allDays.map(day => {
                      const isSelected = selected.includes(day)
                      const isOtherWeek = !isSelected && assignedDates.has(day)
                      const dayName = getDayName(year, month, day)
                      return (
                        <button
                          key={day}
                          onClick={() => !isOtherWeek && toggleDate(wk, day)}
                          disabled={isOtherWeek}
                          title={`${day} ${MONTH_NAMES[month-1]} (${dayName})`}
                          className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-mono font-medium transition-all duration-150 ${
                            isSelected
                              ? weekSelectedBgs[wkIdx]
                              : isOtherWeek
                                ? 'opacity-25 cursor-not-allowed text-ink-600'
                                : 'hover:bg-white/10 text-ink-400 hover:text-ink-200'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  {selected.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex flex-wrap gap-1">
                        {selected.map(d => (
                          <span key={d} className={`badge ${weekSelectedBgs[wkIdx]} font-mono text-xs`}>
                            {String(d).padStart(2,'0')} {getDayName(year, month, d)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="mt-5 bg-ink-800/50 rounded-xl p-4 border border-ink-700">
            <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Date Assignment Summary</h3>
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4].map(wk => (
                <div key={wk} className={`text-xs px-3 py-1.5 rounded-lg border ${weekBgs[wk-1]}`}>
                  <span className={weekTextColors[wk-1]}>Week {wk}</span>
                  <span className="text-ink-500 ml-1">
                    {(weekDates[wk]||[]).length > 0 
                      ? (weekDates[wk]||[]).join(', ')
                      : 'No dates'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-600 mt-2">
              Total assigned: {assignedDates.size} / {totalDays} days
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
