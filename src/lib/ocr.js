// Thin wrapper around tesseract.js: one lazily-created worker shared by
// the whole app. Worker, wasm core and language data are self-hosted under
// /tess (see scripts/copy-tess-assets.mjs) so nothing loads from a CDN;
// the ~15 MB engine is fetched from our origin on first use and cached.

let workerPromise = null
let progressListener = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/tess`
      const worker = await createWorker('eng', 1, {
        workerPath: `${base}/worker.min.js`,
        corePath: `${base}/core`,
        langPath: `${base}/lang`,
        logger: (m) => {
          if (!progressListener) return
          if (m.status === 'recognizing text') {
            progressListener({ stage: 'reading', progress: m.progress })
          } else {
            progressListener({ stage: 'loading', progress: null })
          }
        },
      })
      // PSM 3 (full automatic layout analysis). tesseract.js's own default
      // treats the image as one text block, which merges table cells into
      // garbage — on the reference IRAS screenshot it loses half the
      // courses that PSM 3 finds.
      await worker.setParameters({ tessedit_pageseg_mode: '3' })
      return worker
    })().catch((err) => {
      workerPromise = null // allow a retry after a failed download
      throw err
    })
  }
  return workerPromise
}

/**
 * OCR a list of canvases and return one text per canvas.
 * onProgress receives { stage: 'loading' | 'reading', progress: 0..1 | null }.
 */
export async function recognizeAll(canvases, onProgress) {
  const worker = await getWorker()
  progressListener = onProgress || null
  try {
    const texts = []
    for (let i = 0; i < canvases.length; i++) {
      const { data } = await worker.recognize(canvases[i])
      texts.push(data.text)
      if (onProgress) {
        onProgress({ stage: 'reading', progress: (i + 1) / canvases.length })
      }
    }
    return texts
  } finally {
    progressListener = null
  }
}
