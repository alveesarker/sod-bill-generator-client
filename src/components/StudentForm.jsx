const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEARS = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 1 + i,
);

export default function StudentForm({ student, onChange, errors }) {
  const field = (key, label, placeholder, type = "text", auto = "") => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        name={key}
        autoComplete={auto}
        value={student[key]}
        onChange={(e) => onChange({ [key]: e.target.value })}
        placeholder={placeholder}
        className={`input-field ${
          errors[key] ? "border-rose-500/60 focus:border-rose-500" : ""
        }`}
      />
      {errors[key] && (
        <p className="text-rose-400 text-xs mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="step-indicator bg-gold-500/20 text-gold-400 border border-gold-500/30">
            1
          </div>
          <div>
            <h2 className="section-title">Student Information</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Enter the student details for the bill header
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {field("name", "Full Name", "e.g. something", "text", "name")}
        {field("id", "Student ID", "e.g. 2311249", "text", "off")}
        {field("phoneNumber", "Phone Number", "e.g. 01X-XXXXXXX", "tel", "phone")}
        {field(
          "bankaccnum",
          "Bank Account Number",
          "e.g. 1234567890",
          "text",
          "off",
        )}

        <div>
          <label className="label">Month</label>
          <select
            value={student.month}
            onChange={(e) => onChange({ month: Number(e.target.value) })}
            className="select-field"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Year</label>
          <select
            value={student.year}
            onChange={(e) => onChange({ year: Number(e.target.value) })}
            className="select-field"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label">Number of Bills (Supervisors)</label>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => onChange({ numBills: n })}
                className={`flex-1 py-2.5 rounded-xl border font-mono font-semibold text-sm transition-all duration-200 ${
                  student.numBills === n
                    ? "bg-gold-500 border-gold-500 text-ink-950"
                    : "bg-ink-800 border-ink-600 text-ink-400 hover:border-ink-500"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-500 mt-2">
            One bill will be generated per supervisor
          </p>
        </div>
      </div>
    </div>
  );
}
