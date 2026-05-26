import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto w-full px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">

        <div className="text-xs text-gray-400">
          © {new Date().getFullYear()} <span className="font-medium text-gray-700">SoD Bill Generator</span>. All rights reserved.
        </div>

        <div className="text-xs text-gray-400 text-center">
          Designed & developed by{' '}
          <Link
            to="https://github.com/alveesarker"
            className="font-semibold text-gray-600 hover:underline"
            target='blank'
          >
            Alvee Sarker
          </Link>
        </div>

        <div className="text-xs text-gray-400">
          Built with React · docxtemplater · Tailwind CSS
        </div>

      </div>
    </footer>
  )
}