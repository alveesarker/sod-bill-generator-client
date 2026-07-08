import { useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import StepNav from './components/StepNav.jsx'
import StudentForm from './components/StudentForm.jsx'
import SupervisorForm from './components/SupervisorForm.jsx'
import ClassScheduleForm from './components/ClassScheduleForm.jsx'
import WeekDateSelector from './components/WeekDateSelector.jsx'
import GenerateSection from './components/GenerateSection.jsx'
import { exportSession, importSession } from './lib/session.js'
import { saveSharedDates } from './lib/api.js'
import { MONTH_NAMES, daysInMonth } from './lib/format.js'

const STEPS = [
  { id: 1, label: 'Student Info' },
  { id: 2, label: 'Supervisors' },
  { id: 3, label: 'Class Schedule' },
  { id: 4, label: 'Working Dates' },
  { id: 5, label: 'Generate' },
]

const WORKING_DATES_STEP = 4
const MAX_COMBINED = 20

const defaultStudent = () => ({
  name: '',
  id: '',
  phoneNumber: '',
  bankaccnum: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  numBills: 1,
})

const defaultSupervisor = () => ({ name: '', hoursPerWeek: 9 })
const defaultWeekDates = () => ({ 1: [], 2: [], 3: [], 4: [] })

export default function App() {
  const [step, setStep] = useState(1)
  const [student, setStudent] = useState(defaultStudent)
  const [supervisors, setSupervisors] = useState([defaultSupervisor()])
  const [weekDates, setWeekDates] = useState(defaultWeekDates())
  const [courses, setCourses] = useState([])
  const [errors, setErrors] = useState({})
  const [importError, setImportError] = useState('')

  const handleStudentChange = (patch) => {
    setStudent((prev) => ({ ...prev, ...patch }))
    if (patch.numBills !== undefined) {
      const n = parseInt(patch.numBills, 10) || 1
      setSupervisors((prev) => {
        const next = [...prev]
        while (next.length < n) next.push(defaultSupervisor())
        return next.slice(0, n)
      })
    }
  }

  const handleExport = () => exportSession({ student, supervisors, weekDates, courses })

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportError('')
    try {
      const data = await importSession(file)
      setStudent(data.student || defaultStudent())
      setSupervisors(data.supervisors || [defaultSupervisor()])
      setWeekDates(data.weekDates || defaultWeekDates())
      setCourses(data.courses || [])
      setErrors({})
      // Land on Working Dates so the student picks fresh dates for the new month.
      setStep(WORKING_DATES_STEP)
    } catch (err) {
      setImportError(err.message)
    }
    e.target.value = '' // allow re-importing the same file
  }

  // Apply week dates to the app. When a month is named (e.g. "JUNE 2026"),
  // month and year are set from it automatically, and day numbers beyond
  // that month's length are dropped.
  const applyDates = ({ month, year, weekDates: extracted }, { share }) => {
    const nextMonth = month || student.month
    const nextYear = year || student.year
    const maxDay = daysInMonth(nextMonth, nextYear)

    const pruned = {}
    let total = 0
    for (let w = 1; w <= 4; w++) {
      pruned[w] = (extracted[w] || []).filter((d) => d >= 1 && d <= maxDay)
      total += pruned[w].length
    }
    setWeekDates(pruned)

    const parts = [`${total} date${total === 1 ? '' : 's'} assigned across weeks 1\u20134`]
    if (month) {
      setStudent((s) => ({ ...s, month: nextMonth, year: nextYear }))
      parts.unshift(
        `Detected ${MONTH_NAMES[nextMonth - 1]} ${nextYear} \u2014 month & year updated`
      )
      // Screenshot uploads (and only those) refill the shared store, so
      // the next student can reuse this month's dates without an image.
      if (share && total > 0) saveSharedDates(nextYear, nextMonth, pruned)
    }
    return `${parts.join(' \u00B7 ')}. Review the grids below.`
  }

  // From a screenshot upload on step 4: apply AND share.
  const handleDatesExtracted = (parsed) => applyDates(parsed, { share: true })
  // From the shared store: apply only (never echo back to the server).
  const handleSharedDates = (parsed) => applyDates(parsed, { share: false })

  const validateStep = () => {
    const errs = {}

    if (step === 1) {
      if (!student.name.trim()) errs.name = 'Student name is required'
      if (!student.id.trim()) errs.id = 'Student ID is required'
      if (!student.phoneNumber.trim()) errs.phoneNumber = 'Phone number is required'
      if (!student.bankaccnum.trim()) errs.bankaccnum = 'Bank account number is required'
    }

    if (step === 2) {
      supervisors.forEach((s, i) => {
        if (!s.name.trim()) errs[`sup_name_${i}`] = 'Supervisor name is required'
        if (!s.hoursPerWeek || s.hoursPerWeek < 1) errs[`sup_hours_${i}`] = 'Hours must be at least 1'
        if (s.hoursPerWeek > MAX_COMBINED) errs[`sup_hours_${i}`] = `Hours cannot exceed ${MAX_COMBINED}`
      })
      const combined = supervisors.reduce((sum, s) => sum + Number(s.hoursPerWeek || 0), 0)
      if (combined > MAX_COMBINED) {
        errs.combined = `Combined weekly hours (${combined}) exceed the maximum of ${MAX_COMBINED}`
      }
    }

    // Step 3 (Class Schedule): no classes is fine, but entered times must be sane.
    if (step === 3) {
      courses.forEach((c, i) => {
        if (!c.startTime || !c.endTime) {
          errs[`course_time_${i}`] = 'Start and end times are required'
        } else if (c.endTime <= c.startTime) {
          errs[`course_time_${i}`] = 'End time must be after start time'
        }
      })
    }

    if (step === WORKING_DATES_STEP) {
      const anySelected = Object.values(weekDates).some((arr) => arr.length > 0)
      if (!anySelected) errs.weekDates = 'Select at least one eligible date'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 5))
  }
  const prev = () => setStep((s) => Math.max(s - 1, 1))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <StepNav steps={STEPS} current={step} onStepClick={setStep} />

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-ink-500">Session:</span>
          <button type="button" onClick={handleExport} className="btn-secondary text-sm">
            Save session
          </button>
          <label className="btn-secondary text-sm cursor-pointer">
            Load session
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {importError && <span className="text-sm text-rose-500">{importError}</span>}
        </div>

        <div className="mt-8 animate-fadein" key={step}>
          {step === 1 && (
            <StudentForm student={student} onChange={handleStudentChange} errors={errors} />
          )}
          {step === 2 && (
            <SupervisorForm supervisors={supervisors} onChange={setSupervisors} errors={errors} />
          )}
          {step === 3 && (
            <ClassScheduleForm courses={courses} onChange={setCourses} errors={errors} />
          )}
          {step === 4 && (
            <WeekDateSelector
              month={student.month}
              year={student.year}
              weekDates={weekDates}
              onChange={setWeekDates}
              onExtracted={handleDatesExtracted}
              onUseShared={handleSharedDates}
              errors={errors}
            />
          )}
          {step === 5 && (
            <GenerateSection
              student={student}
              supervisors={supervisors}
              weekDates={weekDates}
              courses={courses}
            />
          )}
        </div>

        {step < 5 ? (
          <div className="mt-8 flex justify-between">
            <button type="button" className="btn-secondary" onClick={prev} disabled={step === 1}>
              &larr; Back
            </button>
            <button type="button" className="btn-primary" onClick={next}>
              {step === 4 ? 'Review & Generate \u2192' : 'Continue \u2192'}
            </button>
          </div>
        ) : (
          <div className="mt-8 flex justify-start">
            <button type="button" className="btn-secondary" onClick={prev}>
              &larr; Back
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
