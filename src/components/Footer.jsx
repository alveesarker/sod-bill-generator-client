export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink-200 bg-white">
      <div className="max-w-5xl mx-auto w-full px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-xs text-ink-400">
          &copy; {new Date().getFullYear()}{' '}
          <span className="font-medium text-ink-700">SoD Bill Generator</span>. All rights
          reserved.
        </div>

        <div className="text-xs text-ink-400 text-center">
          Developed and Designed by{' '}
          <a
            href="https://github.com/alveesarker"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-ink-600 hover:underline"
          >
            Alvee Sarker
          </a>{' '}
          &amp; Edited by{' '}
          <a
            href="https://github.com/shah-07"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-ink-600 hover:underline"
          >
            Sah Paran
          </a>
        </div>
      </div>
    </footer>
  )
}
