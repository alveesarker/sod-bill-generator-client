const STEPS_HELP = [
  ['Student Info', 'Your name, ID, phone, bank account, the billing month, and how many supervisors you work under.'],
  ['Supervisors', 'Each supervisor and their weekly hours. All supervisors together may not exceed 20 hours per week.'],
  ['Class Schedule', 'Your classes for the semester \u2014 add them by hand or upload a screenshot of your section list. Generated duty sessions will never overlap with them.'],
  ['Working Dates', 'The dates you are available, assigned to billing weeks 1\u20134 \u2014 pick them by hand or upload a screenshot of the announcement message.'],
  ['Generate', 'Preview each schedule, then download one filled Word bill per supervisor.'],
]

const RULES = [
  'Duty is planned between 8:00 AM and 6:00 PM, in sessions of at least one hour, starting on the half hour.',
  'Sessions never overlap your classes, and bills for different supervisors never overlap each other.',
  'Weekly totals always land on whole hours, and the combined weekly ceiling of 20 hours is enforced automatically.',
  'Use "Save session" before you close the tab \u2014 next month, load it back and only update the working dates.',
]

export default function About({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/50 backdrop-blur-sm overflow-y-auto py-10 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-ink-200 rounded-2xl max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-ink-200">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900">About this app</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              SoD Bill Generator &middot; Student on Duty automation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-400 hover:text-ink-900 transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-8 py-7 space-y-8 text-sm text-ink-700 leading-relaxed">
          <section>
            <h3 className="text-plum font-semibold text-base mb-2">What it does</h3>
            <p>
              Students on Duty submit a monthly bill per supervisor listing every duty session
              with its date, day, times, and hours. Building that schedule by hand means dodging
              class times, keeping bills from overlapping, respecting the weekly hour ceiling, and
              filling up to 28 table rows per bill. This app does all of it in one click and hands
              you the finished Word documents.
            </p>
          </section>

          <section>
            <h3 className="text-plum font-semibold text-base mb-3">The five steps</h3>
            <ol className="space-y-2">
              {STEPS_HELP.map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span className="step-dot bg-brand-soft text-brand-dark border border-brand/30 shrink-0">
                    {i + 1}
                  </span>
                  <p>
                    <span className="font-semibold text-ink-900">{title}.</span> {body}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="text-plum font-semibold text-base mb-2">Scheduling rules</h3>
            <ul className="space-y-1.5 list-disc pl-5">
              {RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>

          <section className="text-xs text-ink-500 border-t border-ink-200 pt-4">
            Nothing you enter is stored anywhere &mdash; data lives in your browser tab and is
            sent to the server only to compute schedules and fill the template.
          </section>
        </div>
      </div>
    </div>
  )
}
