export default function About({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <div className="bg-ink-950 border border-ink-800 rounded-2xl max-w-3xl w-full shadow-2xl">

        {/* Modal header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-ink-800">
          <div>
            <h2 className="text-xl font-bold text-ink-100 font-display">About this app</h2>
            <p className="text-xs text-ink-500 mt-0.5">SoD Bill Generator · Student on Duty Automation</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-100 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-8 py-7 space-y-10 text-ink-300 text-sm leading-relaxed">

          {/* What is this */}
          <section>
            <h3 className="text-jade-400 font-semibold text-base mb-3">What is this app?</h3>
            <p>
              The SoD Bill Generator is an automated scheduling and billing tool built specifically
              for university students who work as Student on Duty (SoD) under one or more supervisors
              each month. Instead of manually building work schedules and filling out Word billing
              documents by hand, this app handles everything automatically — conflict checking, hour
              calculation, schedule distribution, and document generation — in a matter of seconds.
            </p>
          </section>

          {/* Why it's helpful — comparison table */}
          <section>
            <h3 className="text-jade-400 font-semibold text-base mb-4">Manual vs automated — what actually changes</h3>
            <p className="mb-4">
              A student using a saved Word template still has to do the hardest part every month —
              building the schedule, checking conflicts, calculating hours, and filling every row of
              the billing table. That is exactly what this app replaces.
            </p>

            <div className="rounded-xl overflow-hidden border border-ink-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-ink-900 text-ink-400">
                    <th className="text-left px-4 py-3 font-semibold">Task</th>
                    <th className="text-left px-4 py-3 font-semibold">Manually</th>
                    <th className="text-left px-4 py-3 font-semibold">With this app</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {[
                    ['Class conflict checking', 'Done mentally for every date', 'Automatic — zero effort'],
                    ['Overlap between supervisor bills', 'Checked manually, easy to miss', 'Automatic — impossible to overlap'],
                    ['Weekly hour limit enforcement', 'Calculated manually with risk of error', 'Enforced automatically every week'],
                    ['Filling date, day, start, end, hours per row', 'Typed manually — up to 28 rows per bill', 'Generated and filled instantly'],
                    ['Weekly total calculation', 'Manual addition', 'Calculated automatically'],
                    ['Monthly total calculation', 'Manual addition', 'Calculated automatically'],
                    ['Repeat everything per supervisor', 'Full repetition for each bill', 'One click per supervisor'],
                    ['Word template management', 'Open, edit, save manually', 'Template stored on server — not your concern'],
                  ].map(([task, manual, auto], i) => (
                    <tr key={i} className="bg-ink-950 hover:bg-ink-900/50 transition-colors">
                      <td className="px-4 py-3 text-ink-200 font-medium">{task}</td>
                      <td className="px-4 py-3 text-red-400">{manual}</td>
                      <td className="px-4 py-3 text-jade-400">{auto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                { label: 'Time per month manually', value: '15–25 min', color: 'text-red-400' },
                { label: 'Time per month with app', value: '0.5-1 min', color: 'text-jade-400' },
                { label: 'Time saved per semester', value: '1-1.5 hours', color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-ink-900 border border-ink-800 rounded-xl px-4 py-4 text-center">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-ink-500 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Step by step process */}
          <section>
            <h3 className="text-jade-400 font-semibold text-base mb-4">How to generate your bills — step by step</h3>
            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Student Info',
                  desc: 'Enter your full name, student ID, phone number, and bank account number. This information will appear on all generated bills. You only need to do this once — the Save Session feature remembers everything.',
                },
                {
                  step: '02',
                  title: 'Supervisors',
                  desc: 'Add each supervisor you are working under this month. Enter their name and the number of hours assigned to you per week under that supervisor. Each supervisor generates a completely separate bill. The combined weekly hours across all supervisors cannot exceed 20 hours.',
                },
                {
                  step: '03',
                  title: 'Working Dates',
                  desc: 'Select the eligible working dates for each week as provided by your department. Dates are grouped into Week 1 through Week 4. The app only schedules work sessions on the dates you select here — no assumptions are made about which dates are available.',
                },
                {
                  step: '04',
                  title: 'Class Schedule',
                  desc: 'Add your class timetable using day codes (M for Monday, MW for Monday and Wednesday, etc.) and select start and end times. The schedule generator uses this information to ensure no work session ever overlaps with a class.',
                },
                {
                  step: '05',
                  title: 'Generate',
                  desc: 'Click Generate. The app builds a complete, conflict-free schedule for every supervisor, calculates all hours, fills your Word template with the correct values, and makes each bill available to download as a properly named .docx file — ready to submit immediately.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 bg-ink-900 border border-ink-800 rounded-xl px-5 py-4">
                  <div className="text-jade-500 font-bold font-display text-lg leading-none mt-0.5 w-8 shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-ink-100 font-semibold mb-1">{item.title}</div>
                    <div className="text-ink-400 text-xs leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Save and Load session */}
          <section>
            <h3 className="text-jade-400 font-semibold text-base mb-4">Save session & Load session</h3>
            <div className="grid sm:grid-cols-2 gap-4">

              <div className="bg-ink-900 border border-ink-800 rounded-xl px-5 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">💾</span>
                  <span className="text-ink-100 font-semibold">Save session</span>
                </div>
                <p className="text-ink-400 text-xs leading-relaxed">
                  Clicking Save session downloads a small <span className="text-ink-200">.json</span> file
                  to your device. This file contains everything you have entered your student info,
                  supervisor details, class schedule, and selected working dates. Keep this file somewhere
                  safe on your computer.
                </p>
                <div className="mt-3 bg-ink-950 border border-ink-800 rounded-lg px-3 py-2 text-xs text-ink-500">
                  Example filename: <span className="text-jade-400">SoD_Session_Ahmad_5_2026.json</span>
                </div>
              </div>

              <div className="bg-ink-900 border border-ink-800 rounded-xl px-5 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📂</span>
                  <span className="text-ink-100 font-semibold">Load session</span>
                </div>
                <p className="text-ink-400 text-xs leading-relaxed">
                  At the start of next month, click Load session and select your saved <span className="text-ink-200">.json</span> file.
                  The app instantly restores your student info, supervisors, and class schedule exactly
                  as you left them. You are taken directly to the Working Dates step because that is the
                  only thing that changes each month. Update the dates and generate — everything else is
                  already done.
                </p>
              </div>

            </div>

            <div className="mt-4 border border-amber-800/40 rounded-xl px-5 py-4 text-xs text-gray-900 leading-relaxed">
              <span className="font-semibold">Tip:</span> After loading a session for a new month,
              go back to the step 1 and change the month then go to Step 3 and update the eligible working dates before generating. Your supervisors
              and class schedule from last month are already loaded and ready, you do not need to
              re-enter them.
            </div>
          </section>

          {/* Footer note */}
          <div className="border-t border-ink-800 pt-6 text-center text-ink-600 text-xs">
            SoD Bill Generator · Built for university students · All processing happens in your browser
          </div>

        </div>
      </div>
    </div>
  )
}