export default function SupervisorForm({ supervisors, onChange, errors }) {
  const combinedHours = supervisors.reduce((s, sup) => s + Number(sup.hoursPerWeek || 0), 0)
  const overLimit = combinedHours > 20

  const update = (i, key, value) => {
    const next = [...supervisors]
    next[i] = { ...next[i], [key]: value }
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="step-indicator bg-gold-500/20 text-gold-400 border border-gold-500/30">2</div>
              <div>
                <h2 className="section-title">Supervisor Details</h2>
                <p className="text-xs text-ink-500 mt-0.5">Configure each supervisor and their weekly hour allocation</p>
              </div>
            </div>
            <div className={`badge ${overLimit ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-jade-500/15 text-jade-400 border border-jade-500/30'}`}>
              Combined: {combinedHours} / 20 hrs/wk
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {supervisors.map((sup, i) => (
            <div key={i} className="bg-ink-800 rounded-xl p-5 border border-ink-700">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gold-500/20 flex items-center justify-center">
                  <span className="text-gold-400 font-mono text-xs font-bold">{i + 1}</span>
                </div>
                <span className="text-sm font-semibold text-ink-300">Supervisor {i + 1}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Supervisor Name</label>
                  <input
                    type="text"
                    value={sup.name}
                    onChange={e => update(i, 'name', e.target.value)}
                    placeholder="e.g. Dr. something"
                    className={`input-field ${errors[`sup_name_${i}`] ? 'border-rose-500/60' : ''}`}
                  />
                  {errors[`sup_name_${i}`] && (
                    <p className="text-rose-400 text-xs mt-1">{errors[`sup_name_${i}`]}</p>
                  )}
                </div>
                <div>
                  <label className="label">Assigned Hours Per Week</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={sup.hoursPerWeek}
                      onChange={e => update(i, 'hoursPerWeek', Number(e.target.value))}
                      className={`input-field w-24 ${errors[`sup_hours_${i}`] ? 'border-rose-500/60' : ''}`}
                    />
                    <div className="flex-1">
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={sup.hoursPerWeek}
                        onChange={e => update(i, 'hoursPerWeek', Number(e.target.value))}
                        className="w-full accent-gold-500"
                      />
                      <div className="flex justify-between text-xs text-ink-600 mt-0.5">
                        <span>1</span><span>10</span><span>20</span>
                      </div>
                    </div>
                  </div>
                  {errors[`sup_hours_${i}`] && (
                    <p className="text-rose-400 text-xs mt-1">{errors[`sup_hours_${i}`]}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="text-xs text-ink-500">
                  Max monthly total from this supervisor:{' '}
                  <span className="text-ink-300 font-mono">{sup.hoursPerWeek * 4} hours</span>
                </div>
              </div>
            </div>
          ))}

          {errors.combined && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">
              ⚠️ {errors.combined}
            </div>
          )}

          <div className="bg-ink-800/50 rounded-xl p-4 border border-ink-700">
            <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Weekly Hour Summary</h3>
            <div className="space-y-2">
              {supervisors.map((sup, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-ink-500 w-28 truncate">
                    {sup.name || `Supervisor ${i + 1}`}
                  </span>
                  <div className="flex-1 bg-ink-700 rounded-full h-1.5">
                    <div
                      className="bg-gold-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(sup.hoursPerWeek / 20) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gold-400 w-12 text-right">
                    {sup.hoursPerWeek} hrs
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1 border-t border-ink-700 mt-1">
                <span className="text-xs text-ink-400 font-semibold w-28">Combined</span>
                <div className="flex-1 bg-ink-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${overLimit ? 'bg-rose-500' : 'bg-jade-500'}`}
                    style={{ width: `${Math.min((combinedHours / 20) * 100, 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-mono w-12 text-right ${overLimit ? 'text-rose-400' : 'text-jade-400'}`}>
                  {combinedHours}/20
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
