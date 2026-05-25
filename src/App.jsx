import { useState } from 'react'
import StudentForm from './components/StudentForm.jsx'
import SupervisorForm from './components/SupervisorForm.jsx'
import WeekDateSelector from './components/WeekDateSelector.jsx'
import ClassScheduleForm from './components/ClassScheduleForm.jsx'
import GenerateSection from './components/GenerateSection.jsx'
import Header from './components/Header.jsx'
import StepNav from './components/StepNav.jsx'

const STEPS = [
  { id: 1, label: 'Student Info' },
  { id: 2, label: 'Supervisors' },
  { id: 3, label: 'Working Dates' },
  { id: 4, label: 'Class Schedule' },
  { id: 5, label: 'Generate' },
]

const defaultStudent = {
  name: '',
  id: '',
  phoneNumber: '',
  bankaccnum: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  numBills: 1,
}

const defaultSupervisor = () => ({ name: '', hoursPerWeek: 9 })

const defaultWeekDates = () => ({ 1: [], 2: [], 3: [], 4: [] })

const defaultCourse = () => ({ dayCode: 'M', startTime: '08:00', endTime: '09:30' })

export default function App() {
  const [step, setStep] = useState(1)
  const [student, setStudent] = useState(defaultStudent)
  const [supervisors, setSupervisors] = useState([defaultSupervisor()])
  const [weekDates, setWeekDates] = useState(defaultWeekDates())
  const [courses, setCourses] = useState([])
  const [templateFile, setTemplateFile] = useState(null)
  const [errors, setErrors] = useState({})

  // Sync supervisors count with numBills
  const handleStudentChange = (updates) => {
    const next = { ...student, ...updates }
    setStudent(next)
    if (updates.numBills !== undefined) {
      const n = parseInt(updates.numBills) || 1
      setSupervisors(prev => {
        const arr = [...prev]
        while (arr.length < n) arr.push(defaultSupervisor())
        return arr.slice(0, n)
      })
    }
  }

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
        if (!s.hoursPerWeek || s.hoursPerWeek < 1) errs[`sup_hours_${i}`] = 'Hours must be ≥ 1'
        if (s.hoursPerWeek > 20) errs[`sup_hours_${i}`] = 'Hours cannot exceed 20'
      })
      // Check combined
      const total = supervisors.reduce((sum, s) => sum + Number(s.hoursPerWeek || 0), 0)
      if (total > 20) errs.combined = `Combined weekly hours (${total}) exceed maximum of 20`
    }
    if (step === 3) {
      const anySelected = Object.values(weekDates).some(arr => arr.length > 0)
      if (!anySelected) errs.weekDates = 'Please select at least one eligible date'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 5))
  }
  const prev = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <StepNav steps={STEPS} current={step} onStepClick={setStep} />

        <div className="mt-8 animate-fadein">
          {step === 1 && (
            <StudentForm
              student={student}
              onChange={handleStudentChange}
              errors={errors}
            />
          )}
          {step === 2 && (
            <SupervisorForm
              supervisors={supervisors}
              onChange={setSupervisors}
              errors={errors}
            />
          )}
          {step === 3 && (
            <WeekDateSelector
              month={student.month}
              year={student.year}
              weekDates={weekDates}
              onChange={setWeekDates}
              errors={errors}
            />
          )}
          {step === 4 && (
            <ClassScheduleForm
              courses={courses}
              onChange={setCourses}
            />
          )}
          {step === 5 && (
            <GenerateSection
              student={student}
              supervisors={supervisors}
              weekDates={weekDates}
              courses={courses}
              templateFile={templateFile}
              onTemplateChange={setTemplateFile}
            />
          )}
        </div>

        {/* Nav buttons */}
        {step < 5 && (
          <div className="mt-8 flex justify-between">
            <button
              className="btn-secondary"
              onClick={prev}
              disabled={step === 1}
            >
              ← Back
            </button>
            <button className="btn-primary" onClick={next}>
              {step === 4 ? 'Review & Generate →' : 'Continue →'}
            </button>
          </div>
        )}
        {step === 5 && (
          <div className="mt-8 flex justify-start">
            <button className="btn-secondary" onClick={prev}>← Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
