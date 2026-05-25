export default function StepNav({ steps, current, onStepClick }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = step.id < current
        const active = step.id === current
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => done && onStepClick(step.id)}
              className={`flex items-center gap-2 group transition-all duration-200 ${done ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`step-indicator transition-all duration-200 ${
                active
                  ? 'bg-gold-500 text-ink-950 ring-4 ring-gold-500/20'
                  : done
                    ? 'bg-jade-600 text-white'
                    : 'bg-ink-800 text-ink-500 border border-ink-600'
              }`}>
                {done ? '✓' : step.id}
              </div>
              <span className={`text-sm font-medium hidden sm:block transition-colors ${
                active ? 'text-gold-400' : done ? 'text-jade-400' : 'text-ink-500'
              }`}>
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 transition-colors ${
                step.id < current ? 'bg-jade-700' : 'bg-ink-800'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
