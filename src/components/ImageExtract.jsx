import { useRef, useState } from 'react'
import { prepareVariants } from '../lib/imagePrep.js'
import { recognizeAll } from '../lib/ocr.js'

/**
 * Reusable "fill from a screenshot" panel.
 *
 * Props:
 *   title    – heading shown in the panel
 *   hint     – one-line description of what to upload
 *   onTexts  – async (texts: string[]) => summary string
 *              receives the OCR text of each preprocessing variant,
 *              applies the results to app state, and returns a short
 *              success message; it should throw when nothing was found.
 */
export default function ImageExtract({ title, hint, onTexts }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null) // {kind:'ok'|'err', text}
  const [progress, setProgress] = useState(null)
  const [dragging, setDragging] = useState(false)
  // What the reader actually made of the image. Shown on demand: when a
  // line comes out wrong, this is the only way to see why.
  const [readText, setReadText] = useState(null)

  const handleFile = async (file) => {
    if (!file || busy) return
    if (!file.type.startsWith('image/')) {
      setStatus({ kind: 'err', text: 'That file is not an image. Upload a PNG or JPG screenshot.' })
      return
    }

    setBusy(true)
    setStatus(null)
    setProgress(null)
    setReadText(null)
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(file)
    })

    try {
      const variants = await prepareVariants(file)
      const texts = await recognizeAll(variants, (p) => setProgress(p))
      // the longest read is the most complete one to show
      setReadText(texts.reduce((a, b) => (b.length > a.length ? b : a), ''))
      const summary = await onTexts(texts)
      setStatus({ kind: 'ok', text: summary })
    } catch (err) {
      setStatus({ kind: 'err', text: err.message || 'Could not read the image.' })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
        dragging ? 'border-brand bg-brand-soft' : 'border-ink-300 bg-cream/40'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-4 flex-wrap">
        {preview && (
          <img
            src={preview}
            alt="Uploaded screenshot"
            className="w-16 h-16 object-cover rounded-lg border border-ink-200"
          />
        )}

        <div className="flex-1 min-w-[12rem]">
          <div className="text-sm font-semibold text-ink-900">{title}</div>
          <p className="text-xs text-ink-500 mt-0.5">{hint}</p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Reading\u2026' : preview ? 'Upload another' : '\u2191 Upload screenshot'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {busy && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-ink-500 mb-1">
            <span>
              {progress?.stage === 'reading'
                ? 'Reading text from the image\u2026'
                : 'Preparing the reader (first use downloads a few MB)\u2026'}
            </span>
            {progress?.stage === 'reading' && progress.progress != null && (
              <span className="font-mono">{Math.round(progress.progress * 100)}%</span>
            )}
          </div>
          <div className="bg-ink-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`bg-brand h-1.5 rounded-full transition-all ${
                progress?.progress == null ? 'w-1/3 animate-pulse' : ''
              }`}
              style={
                progress?.progress != null
                  ? { width: `${Math.round(progress.progress * 100)}%` }
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {status && (
        <div
          className={`mt-3 text-xs rounded-lg px-3 py-2 border ${
            status.kind === 'ok'
              ? 'bg-plum-soft text-plum border-plum/25'
              : 'bg-rose-50 text-rose-500 border-rose-200'
          }`}
        >
          {status.text}
        </div>
      )}

      {readText && (
        <details className="mt-3">
          <summary className="text-xs text-ink-500 cursor-pointer hover:text-ink-900">
            What the reader saw
          </summary>
          <pre className="mt-2 text-[11px] leading-relaxed text-ink-600 bg-white border border-ink-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {readText.trim() || '(nothing legible)'}
          </pre>
        </details>
      )}

      <p className="mt-3 text-xs text-ink-400">
        The image is read entirely in your browser &mdash; it is never uploaded anywhere.
        Always review the results below and fix anything the reader misheard.
      </p>
    </div>
  )
}
