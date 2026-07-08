const MAX_COMBINED = 20

export default function SupervisorForm({ supervisors, onChange, errors }) {
  const combined = supervisors.reduce((sum, s) => sum + Number(s.hoursPerWeek || 0), 0)
  const overLimit = combined > MAX_COMBINED

  const update = (i, patch) => {
    const next = supervisors.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    onChange(next)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="step-dot bg-brand-soft text-brand-dark border border-brand/30">2</span>
            <div>
              <h2 className="section-title">Supervisor Details</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Name each supervisor and set their weekly hours
              </p>
            </div>
          </div>
          <span
            className={`badge border ${
              overLimit
                ? 'bg-rose-50 text-rose-500 border-rose-200'
                : 'bg-plum-soft text-plum border-plum/30'
            }`}
          >
            Combined: {combined} / {MAX_COMBINED} hrs/wk
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {supervisors.map((sup, i) => (
          <div key={i} className="bg-cream/60 rounded-xl p-5 border border-ink-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-lg bg-brand-soft text-brand-dark font-mono text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-ink-700">Supervisor {i + 1}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor={`sup-name-${i}`}>
                  Supervisor Name
                </label>
                <input
                  id={`sup-name-${i}`}
                  type="text"
                  value={sup.name}
                  placeholder="e.g. Dr. Jane Doe"
                  onChange={(e) => update(i, { name: e.target.value })}
                  className={`input-field ${errors[`sup_name_${i}`] ? 'border-rose-400' : ''}`}
                />
                {errors[`sup_name_${i}`] && (
                  <p className="error-text">{errors[`sup_name_${i}`]}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor={`sup-hours-${i}`}>
                  Assigned Hours Per Week
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id={`sup-hours-${i}`}
                    type="number"
                    min={1}
                    max={20}
                    value={sup.hoursPerWeek}
                    onChange={(e) => update(i, { hoursPerWeek: Number(e.target.value) })}
                    className={`input-field w-24 ${errors[`sup_hours_${i}`] ? 'border-rose-400' : ''}`}
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={sup.hoursPerWeek || 1}
                      onChange={(e) => update(i, { hoursPerWeek: Number(e.target.value) })}
                      className="w-full accent-brand"
                      aria-label={`Hours per week for supervisor ${i + 1}`}
                    />
                    <div className="flex justify-between text-xs text-ink-400 mt-0.5">
                      <span>1</span>
                      <span>10</span>
                      <span>20</span>
                    </div>
                  </div>
                </div>
                {errors[`sup_hours_${i}`] && (
                  <p className="error-text">{errors[`sup_hours_${i}`]}</p>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-500">
              Max monthly total from this supervisor:{' '}
              <span className="font-mono text-ink-700">
                {(Number(sup.hoursPerWeek) || 0) * 4} hours
              </span>
            </p>
          </div>
        ))}

        {errors.combined && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-500 text-sm">
            {errors.combined}
          </div>
        )}

        <div className="bg-cream/60 rounded-xl p-4 border border-ink-200">
          <h3 className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-3">
            Weekly Hour Summary
          </h3>
          <div className="space-y-2">
            {supervisors.map((sup, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-ink-500 w-28 truncate">
                  {sup.name || `Supervisor ${i + 1}`}
                </span>
                <div className="flex-1 bg-ink-200 rounded-full h-1.5">
                  <div
                    className="bg-brand h-1.5 rounded-full transition-all"
                    style={{ width: `${((Number(sup.hoursPerWeek) || 0) / MAX_COMBINED) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-brand-dark w-12 text-right">
                  {sup.hoursPerWeek} hrs
                </span>
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2 border-t border-ink-200">
              <span className="text-xs font-semibold text-ink-600 w-28">Combined</span>
              <div className="flex-1 bg-ink-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${overLimit ? 'bg-rose-500' : 'bg-plum'}`}
                  style={{ width: `${Math.min((combined / MAX_COMBINED) * 100, 100)}%` }}
                />
              </div>
              <span
                className={`text-xs font-mono w-12 text-right ${overLimit ? 'text-rose-500' : 'text-plum'}`}
              >
                {combined}/{MAX_COMBINED}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
