import { useState } from 'react'
import About from './About.jsx'

export default function Header() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-cream/85 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/cse.png"
              alt="CSE Department"
              className="w-9 h-9 rounded-2xl"
            />
            <div>
              <h1 className="font-display text-xl font-bold leading-none">Bill Generator</h1>
              <p className="text-xs text-ink-500 mt-0.5">
                Student on Duty &middot; Automated Scheduling
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowAbout(true)}
              className="text-xs text-ink-600 hover:text-ink-900 border border-ink-300 hover:border-ink-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              About
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-plum animate-pulse" />
              <span className="text-xs text-ink-500">Ready</span>
            </div>
          </div>
        </div>
      </header>

      {showAbout && <About onClose={() => setShowAbout(false)} />}
    </>
  )
}
