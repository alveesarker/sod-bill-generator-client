const DAY_CODES = [
  { value: 'S', label: 'S – Sunday' },
  { value: 'M', label: 'M – Monday' },
  { value: 'T', label: 'T – Tuesday' },
  { value: 'W', label: 'W – Wednesday' },
  { value: 'R', label: 'R – Thursday' },
  { value: 'F', label: 'F – Friday' },
  { value: 'A', label: 'A – Saturday' },
  { value: 'MW', label: 'MW – Mon + Wed' },
  { value: 'ST', label: 'ST – Sun + Tue' },
  { value: 'AR', label: 'AR – Sat + Thu' },
]

const START_TIMES = ['08:00', '09:40', '11:20', '13:00', '14:40', '16:20']
const END_TIMES = ['09:30', '11:10', '12:50', '14:30', '16:10', '17:50']

function formatTime12(t) {
  const [h, m] = t.split(':').map(Number)
  const p = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2,'0')} ${p}`
}

export default function ClassScheduleForm({ courses, onChange }) {
  const addCourse = () => {
    onChange([...courses, { dayCode: 'M', startTime: '08:00', endTime: '09:30' }])
  }

  const removeCourse = (i) => {
    onChange(courses.filter((_, idx) => idx !== i))
  }

  const update = (i, key, value) => {
    const next = [...courses]
    next[i] = { ...next[i], [key]: value }
    onChange(next)
  }

  const DAY_CODE_EXPAND = {
    S: 'Sunday', M: 'Monday', T: 'Tuesday', W: 'Wednesday',
    R: 'Thursday', F: 'Friday', A: 'Saturday',
    MW: 'Mon & Wed', ST: 'Sun & Tue', AR: 'Sat & Thu',
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="step-indicator bg-gold-500/20 text-gold-400 border border-gold-500/30">4</div>
            <div>
              <h2 className="section-title">Class Schedule</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                SoD schedules will automatically avoid these times
              </p>
            </div>
          </div>
          <button className="btn-primary" onClick={addCourse}>
            <span>+</span> Add Course
          </button>
        </div>
      </div>

      <div className="p-6">
        {courses.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-ink-700 rounded-xl">
            <div className="text-3xl mb-3">📚</div>
            <p className="text-ink-400 text-sm font-medium">No courses added yet</p>
            <p className="text-ink-600 text-xs mt-1">
              Add courses to prevent SoD schedule conflicts
            </p>
            <button className="btn-secondary mt-4 mx-auto" onClick={addCourse}>
              + Add First Course
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-2">
              <span className="col-span-4 label">Day</span>
              <span className="col-span-3 label">Start Time</span>
              <span className="col-span-3 label">End Time</span>
              <span className="col-span-2 label"></span>
            </div>

            {courses.map((course, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-center bg-ink-800 rounded-xl px-3 py-3 border border-ink-700 animate-fadein">
                <div className="col-span-4">
                  <select
                    value={course.dayCode}
                    onChange={e => update(i, 'dayCode', e.target.value)}
                    className="select-field text-sm"
                  >
                    {DAY_CODES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <select
                    value={course.startTime}
                    onChange={e => update(i, 'startTime', e.target.value)}
                    className="select-field text-sm"
                  >
                    {START_TIMES.map(t => (
                      <option key={t} value={t}>{formatTime12(t)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <select
                    value={course.endTime}
                    onChange={e => update(i, 'endTime', e.target.value)}
                    className="select-field text-sm"
                  >
                    {END_TIMES.map(t => (
                      <option key={t} value={t}>{formatTime12(t)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button className="btn-danger" onClick={() => removeCourse(i)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <button className="btn-secondary w-full justify-center mt-2" onClick={addCourse}>
              + Add Another Course
            </button>
          </div>
        )}

        {/* Day code reference */}
        <div className="mt-6 bg-ink-800/50 border border-ink-700 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">Day Code Reference</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {DAY_CODES.map(d => (
              <div key={d.value} className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-gold-400 w-6">{d.value}</span>
                <span className="text-ink-500">{DAY_CODE_EXPAND[d.value]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
