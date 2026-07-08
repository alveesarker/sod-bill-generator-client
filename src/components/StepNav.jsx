export default function StepNav({ steps, current, onStepClick }) {
  return (
    <nav aria-label="Progress" className="flex items-center">
      {steps.map((step, i) => {
        const done = step.id < current
        const active = step.id === current
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => done && onStepClick(step.id)}
              className={`flex items-center gap-2 ${done ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`step-dot transition-all duration-200 ${
                  active
                    ? 'bg-brand text-white ring-4 ring-brand/20'
                    : done
                      ? 'bg-plum text-white'
                      : 'bg-white border border-ink-300 text-ink-500'
                }`}
              >
                {done ? '\u2713' : step.id}
              </span>
              <span
                className={`hidden sm:block text-sm font-medium transition-colors ${
                  active ? 'text-brand-dark' : done ? 'text-plum' : 'text-ink-500'
                }`}
              >
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={`flex-1 h-px mx-3 ${step.id < current ? 'bg-plum/40' : 'bg-ink-200'}`}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
