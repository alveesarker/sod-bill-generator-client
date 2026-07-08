import { MONTH_NAMES } from '../lib/format.js'

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i)

function TextField({ name, label, placeholder, type = 'text', autoComplete = 'off', value, error, onChange }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${error ? 'border-rose-400 focus:border-rose-400' : ''}`}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

export default function StudentForm({ student, onChange, errors }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <span className="step-dot bg-brand-soft text-brand-dark border border-brand/30">1</span>
          <div>
            <h2 className="section-title">Student Information</h2>
            <p className="text-xs text-ink-500 mt-0.5">These details go on the bill header</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          name="name"
          label="Full Name"
          placeholder="Your full name"
          autoComplete="name"
          value={student.name}
          error={errors.name}
          onChange={(v) => onChange({ name: v })}
        />
        <TextField
          name="id"
          label="Student ID"
          placeholder="e.g. 2311249"
          value={student.id}
          error={errors.id}
          onChange={(v) => onChange({ id: v })}
        />
        <TextField
          name="phoneNumber"
          label="Phone Number"
          placeholder="e.g. 01X-XXXXXXX"
          type="tel"
          autoComplete="tel"
          value={student.phoneNumber}
          error={errors.phoneNumber}
          onChange={(v) => onChange({ phoneNumber: v })}
        />
        <TextField
          name="bankaccnum"
          label="Bank Account Number"
          placeholder="MTB account number"
          value={student.bankaccnum}
          error={errors.bankaccnum}
          onChange={(v) => onChange({ bankaccnum: v })}
        />

        <div>
          <label className="label" htmlFor="month">
            Month
          </label>
          <select
            id="month"
            className="select-field"
            value={student.month}
            onChange={(e) => onChange({ month: Number(e.target.value) })}
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="year">
            Year
          </label>
          <select
            id="year"
            className="select-field"
            value={student.year}
            onChange={(e) => onChange({ year: Number(e.target.value) })}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <span className="label">Number of Bills (Supervisors)</span>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ numBills: n })}
                className={`flex-1 py-2.5 rounded-xl border font-mono font-semibold text-sm transition-all duration-200 ${
                  student.numBills === n
                    ? 'bg-brand border-brand text-white'
                    : 'bg-white border-ink-300 text-ink-500 hover:border-ink-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-500 mt-2">One bill is generated per supervisor</p>
        </div>
      </div>
    </div>
  )
}
