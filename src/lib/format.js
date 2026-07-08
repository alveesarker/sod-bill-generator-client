export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate()
}

export function weekdayOf(year, month, day) {
  return new Date(year, month - 1, day).getDay()
}

// "13:00" -> "1:00 PM"
export function to12Hour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return clock12(h * 60 + m)
}

// minutes since midnight -> "1:00 PM"
export function clock12(mins) {
  const h24 = Math.floor(mins / 60)
  const m = mins % 60
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export function formatDMY(year, month, day) {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}
