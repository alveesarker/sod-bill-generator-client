// Where the API lives: explicit base URL in production builds, or '' so
// the Vite dev proxy handles /api during development.
export const API_BASE = "https://sod-bill-generator-server.onrender.com";

// Shared week-dates store. Every SoD student receives the same
// departmental announcement, so dates read from an uploaded screenshot
// are saved on the server (keyed by month) and offered to everyone else.

export async function fetchSharedDates(year, month) {
  try {
    const res = await fetch(`${API_BASE}/api/week-dates/${year}/${month}`)
    const data = await res.json()
    return data.success && data.found ? data : null
  } catch {
    return null // sharing is best-effort; the manual flow always works
  }
}

export function saveSharedDates(year, month, weekDates) {
  // fire-and-forget: sharing must never block or break the upload flow
  return fetch(`${API_BASE}/api/week-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month, weekDates }),
  }).catch(() => {})
}
