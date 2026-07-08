// Canvas preprocessing for OCR. Produces the two variants that were
// validated against real screenshots: OCR runs on both and the results
// are merged, because their failure modes are complementary.
//
//   clean:  upscaled + grayscale + contrast stretch (+ invert when dark)
//   thresh: the same, then hard black/white threshold

const TARGET_WIDTH = 2600
// Small crops (chat-window screenshots ~450px wide) need more than 4x to
// reach a size tesseract reads reliably; digits glue together below that
// ("1,2" -> "12"). Only images narrower than ~650px are affected by the
// cap, so typical phone screenshots still get modest scaling.
const MAX_SCALE = 6
const DARK_MEAN = 110
const THRESHOLD = 170
const CONTRAST = 0.35
// White margin added around the processed image. Tesseract's layout
// analysis mangles text near the canvas edge; on the reference IRAS
// screenshot the threshold variant goes from 3/6 to 6/6 detected courses
// with this margin. Applied after the invert decision so dark screenshots
// end up with a light border, not a black frame.
const PAD = 24

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to the <img> path
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the image. Try a PNG or JPG screenshot.'))
    }
    img.src = url
  })
}

function drawScaled(bitmap) {
  const w = bitmap.width || bitmap.naturalWidth
  const h = bitmap.height || bitmap.naturalHeight
  const scale = Math.min(MAX_SCALE, Math.max(1, TARGET_WIDTH / w))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  // white-fill first so transparent PNG regions read as paper, not black
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

function padWhite(canvas) {
  const out = document.createElement('canvas')
  out.width = canvas.width + PAD * 2
  out.height = canvas.height + PAD * 2
  const ctx = out.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(canvas, PAD, PAD)
  return out
}

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v
}

/**
 * Returns [cleanCanvas, threshCanvas] ready for OCR.
 */
export async function prepareVariants(file) {
  const bitmap = await loadBitmap(file)
  const base = drawScaled(bitmap)
  const ctx = base.getContext('2d')
  const imageData = ctx.getImageData(0, 0, base.width, base.height)
  const d = imageData.data

  // grayscale + mean luminance
  let sum = 0
  for (let i = 0; i < d.length; i += 4) {
    const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = d[i + 1] = d[i + 2] = v
    sum += v
  }
  const mean = sum / (d.length / 4)
  const invert = mean < DARK_MEAN

  const factor = 1 + CONTRAST * 2
  for (let i = 0; i < d.length; i += 4) {
    let v = d[i]
    if (invert) v = 255 - v
    v = clamp((v - 128) * factor + 128)
    d[i] = d[i + 1] = d[i + 2] = v
  }
  ctx.putImageData(imageData, 0, 0)

  const clean = padWhite(base)

  // thresholded copy (the white margin stays white: 255 > THRESHOLD)
  const thresh = document.createElement('canvas')
  thresh.width = clean.width
  thresh.height = clean.height
  const tctx = thresh.getContext('2d')
  tctx.drawImage(clean, 0, 0)
  const tData = tctx.getImageData(0, 0, thresh.width, thresh.height)
  const td = tData.data
  for (let i = 0; i < td.length; i += 4) {
    const v = td[i] > THRESHOLD ? 255 : 0
    td[i] = td[i + 1] = td[i + 2] = v
  }
  tctx.putImageData(tData, 0, 0)

  return [clean, thresh]
}
