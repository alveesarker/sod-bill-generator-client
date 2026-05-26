import { useState } from 'react'
import About from './About.jsx'

export default function Header() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-3xl flex items-center justify-center">
              <img src="/images/cse.png" alt="" className="rounded-3xl" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink-100 leading-none">
                Bill Generator
              </h1>
              <p className="text-xs text-ink-500 mt-0.5">Student on Duty · Automated Scheduling</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* About button */}
            <button
              onClick={() => setShowAbout(true)}
              className="text-xs text-ink-400 hover:text-ink-100 border border-ink-700 hover:border-ink-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              About
            </button>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-jade-500 animate-pulse" />
              <span className="text-xs text-ink-500">Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* About modal */}
      {showAbout && <About onClose={() => setShowAbout(false)} />}
    </>
  )
}