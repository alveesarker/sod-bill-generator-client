import ImageExtract from './ImageExtract.jsx'
import { parseCoursesFromText } from '../lib/scheduleParsers.js'

const DAY_CODES = [
  { value: 'S', label: 'S \u2013 Sunday', expand: 'Sunday' },
  { value: 'M', label: 'M \u2013 Monday', expand: 'Monday' },
  { value: 'T', label: 'T \u2013 Tuesday', expand: 'Tuesday' },
  { value: 'W', label: 'W \u2013 Wednesday', expand: 'Wednesday' },
  { value: 'R', label: 'R \u2013 Thursday', expand: 'Thursday' },
  { value: 'F', label: 'F \u2013 Friday', expand: 'Friday' },
  { value: 'A', label: 'A \u2013 Saturday', expand: 'Saturday' },
  { value: 'MW', label: 'MW \u2013 Mon + Wed', expand: 'Mon & Wed' },
  { value: 'ST', label: 'ST \u2013 Sun + Tue', expand: 'Sun & Tue' },
  { value: 'AR', label: 'AR \u2013 Sat + Thu', expand: 'Sat & Thu' },
]

export default function ClassScheduleForm({ courses, onChange, errors = {} }) {
  const addCourse = () =>
    onChange([...courses, { dayCode: 'M', startTime: '08:00', endTime: '09:30' }])

  const removeCourse = (i) => onChange(courses.filter((_, idx) => idx !== i))

  const update = (i, patch) =>
    onChange(courses.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))

  // Merge courses read from a screenshot into the list, skipping duplicates.
  const handleTexts = async (texts) => {
    const seen = new Set(courses.map((c) => `${c.dayCode}|${c.startTime}|${c.endTime}`))
    const found = []
    for (const text of texts) {
      for (const c of parseCoursesFromText(text)) {
        const key = `${c.dayCode}|${c.startTime}|${c.endTime}`
        if (seen.has(key)) continue
        seen.add(key)
        found.push(c)
      }
    }
    if (found.length === 0) {
      throw new Error(
        'No day/time patterns found. Make sure text like "MW:16:20-17:50" is readable in the screenshot.'
      )
    }
    onChange([...courses, ...found])
    return `Added ${found.length} course${found.length === 1 ? '' : 's'} \u2014 review the rows below and remove any you are not taking.`
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <span className="step-dot bg-brand-soft text-brand-dark border border-brand/30">3</span>
          <div>
            <h2 className="section-title">Class Schedule</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Duty sessions are scheduled around these times
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-5">
          <ImageExtract
            title="Fill from a screenshot"
            hint='Upload your section list &mdash; day/time text like "MW:16:20-17:50" is detected automatically.'
            onTexts={handleTexts}
          />
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-ink-300 rounded-xl">
            <p className="text-ink-600 text-sm font-medium">No courses added yet</p>
            <p className="text-ink-400 text-xs mt-1">
              Add your classes so duty hours never collide with them. Skip this step if you have
              no classes this month.
            </p>
            <button type="button" className="btn-secondary mt-4" onClick={addCourse}>
              + Add First Course
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-12 gap-3 px-2">
              <span className="col-span-4 label mb-0">Day</span>
              <span className="col-span-3 label mb-0">Start Time</span>
              <span className="col-span-3 label mb-0">End Time</span>
              <span className="col-span-2" />
            </div>

            {courses.map((course, i) => (
              <div
                key={i}
                className={`grid grid-cols-12 gap-3 items-center bg-cream/60 rounded-xl px-3 py-3 border animate-fadein ${
                  errors[`course_time_${i}`] ? 'border-rose-400' : 'border-ink-200'
                }`}
              >
                <div className="col-span-12 sm:col-span-4">
                  <select
                    aria-label={`Day for course ${i + 1}`}
                    className="select-field text-sm"
                    value={course.dayCode}
                    onChange={(e) => update(i, { dayCode: e.target.value })}
                  >
                    {DAY_CODES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <input
                    type="time"
                    aria-label={`Start time for course ${i + 1}`}
                    className="input-field text-sm"
                    value={course.startTime}
                    onChange={(e) => update(i, { startTime: e.target.value })}
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <input
                    type="time"
                    aria-label={`End time for course ${i + 1}`}
                    className="input-field text-sm"
                    value={course.endTime}
                    onChange={(e) => update(i, { endTime: e.target.value })}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => removeCourse(i)}
                    aria-label={`Remove course ${i + 1}`}
                  >
                    &#10005;
                  </button>
                </div>
                {errors[`course_time_${i}`] && (
                  <p className="col-span-12 error-text mt-0">{errors[`course_time_${i}`]}</p>
                )}
              </div>
            ))}

            <button type="button" className="btn-secondary w-full justify-center" onClick={addCourse}>
              + Add Another Course
            </button>
          </div>
        )}

        <div className="mt-6 bg-cream/60 border border-ink-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-ink-600 uppercase tracking-wider mb-3">
            Day Code Reference
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {DAY_CODES.map((d) => (
              <div key={d.value} className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-brand-dark w-6">{d.value}</span>
                <span className="text-ink-500">{d.expand}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
