// Copies the tesseract.js runtime (worker, LSTM core builds, English
// language data) from node_modules into public/tess so OCR loads entirely
// from our own origin — no third-party CDN at runtime. Wired to
// postinstall/prebuild; public/tess is git-ignored.
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const nm = join(root, 'node_modules')
const out = join(root, 'public', 'tess')

const files = [
  [join(nm, 'tesseract.js/dist/worker.min.js'), join(out, 'worker.min.js')],
  // createWorker(..., 1) is LSTM-only, so only the -lstm cores can be
  // requested; the .wasm.js builds are single-file (wasm embedded).
  ...['', '-simd', '-relaxedsimd'].map((v) => [
    join(nm, `tesseract.js-core/tesseract-core${v}-lstm.wasm.js`),
    join(out, 'core', `tesseract-core${v}-lstm.wasm.js`),
  ]),
  [
    // 4.0.0_best_int is what tesseract.js v7 fetches from its CDN by
    // default, so self-hosting it keeps recognition accuracy identical.
    join(nm, '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'),
    join(out, 'lang', 'eng.traineddata.gz'),
  ],
]

for (const [src, dest] of files) {
  mkdirSync(dirname(dest), { recursive: true })
  copyFileSync(src, dest)
}
console.log(`[tess-assets] copied ${files.length} files to public/tess`)
