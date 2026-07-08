// Parsers that turn raw OCR text into app state. Pure functions, no DOM,
// so they are unit-testable in Node and reusable anywhere.

const MONTH_PREFIXES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
]

const DOUBLE_CODES = ['MW', 'ST', 'AR']
const SINGLE_CODES = ['S', 'M', 'T', 'W', 'R', 'F', 'A']

function pad2(n) {
  return String(n).padStart(2, '0')
}

/**
 * Scan OCR text for day-code + time-range patterns like "MW:16:20-17:50".
 *
 * Works as a token walk instead of one rigid regex so it survives the two
 * ways screenshots break the pattern apart:
 *   - the end time wrapping onto the next line ("MW:16:20-" ... "17:50")
 *   - junk between start and end (seat counts, percentages, buttons)
 *
 * A single letter only counts as a day code when a time follows it, which
 * keeps ordinary words from matching. Percent values like "94.12" are
 * rejected by the hour <= 23 rule.
 */
export function parseCoursesFromText(rawText) {
  // Normalize common OCR confusions before tokenizing: uppercase everything
  // (safe: codes must be followed by a time) and repair misread 'S' day
  // codes. '$'/'§' glued to a time is always an S; '5' only counts when an
  // explicit separator follows ("5:13:00") so real numbers never convert.
  const text = rawText
    .toUpperCase()
    .replace(/[$§]\s*(?=[:;.,]?\s*\d{1,2}[:.]\d{2})/g, 'S')
    .replace(/(?<![\dA-Z])5\s*(?=[:;.,]\s*\d{1,2}[:.]\d{2})/g, 'S')

  const tokenRe = new RegExp(
    // Day code with a time coming up. (?<![A-Z]) instead of \b: \b never
    // matches between a digit and a letter, so a room code glued to the
    // day ("CENLAB3S:13:00") would hide the S. A letter before still
    // blocks, keeping ordinary words ("CLASS") out. The separator class
    // includes '-' because OCR renders some colons as dashes.
    `(?<![A-Z])(${DOUBLE_CODES.join('|')}|[${SINGLE_CODES.join('')}])(?=\\s*[-:;.,]?\\s*\\d{1,2}[:.]\\d{2})` +
      // ...or a standalone time value. ':' and '.' separators as before,
      // plus '-' when the minutes look like minutes ("21-30" for 21:30) —
      // the hour<=23 / minute<=59 / duration checks weed out impostors.
      `|(?<!\\d)(\\d{1,2})[:.](\\d{2})(?!\\d)(\\s*%)?` +
      `|(?<!\\d)(\\d{1,2})-([0-5]\\d)(?![\\d-])(\\s*%)?`,
    'g'
  )

  const tokens = []
  let m
  while ((m = tokenRe.exec(text)) !== null) {
    if (m[1]) {
      tokens.push({ type: 'day', code: m[1] })
      continue
    }
    // skip values that are immediately followed by % (they are percentages)
    if (m[4] || m[7]) continue
    const h = Number(m[2] ?? m[5])
    const min = Number(m[3] ?? m[6])
    if (h <= 23 && min <= 59) {
      tokens.push({ type: 'time', mins: h * 60 + min })
    }
  }

  const courses = []
  const seen = new Set()

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'day') continue

    // collect the next two time tokens before the next day code
    const times = []
    for (let j = i + 1; j < tokens.length && times.length < 2; j++) {
      if (tokens[j].type === 'day') break
      times.push(tokens[j].mins)
    }
    if (times.length < 2) continue

    const [start, end] = times
    const duration = end - start
    // sanity: a class runs between 30 minutes and 6 hours
    if (duration < 30 || duration > 360) continue

    const key = `${tokens[i].code}|${start}|${end}`
    if (seen.has(key)) continue
    seen.add(key)

    courses.push({
      dayCode: tokens[i].code,
      startTime: `${pad2(Math.floor(start / 60))}:${pad2(start % 60)}`,
      endTime: `${pad2(Math.floor(end / 60))}:${pad2(end % 60)}`,
    })
  }

  return courses
}

/**
 * Scan OCR text for a week-dates announcement like:
 *
 *   JUNE 2026
 *   Week 1 : 1,2,3,4,5,6
 *   Week 2 : 7,8,9,10,11,12,13
 *
 * Tolerates missing commas ("14,15 16"), skipped days, and chat clutter:
 * timestamps ("11:04 AM") and phone numbers are stripped before numbers
 * are read, so they can never leak into the date lists.
 */
export function parseWeekDatesFromText(text) {
  // Strip phone numbers: single-line digit runs with lots of digits AND a
  // long contiguous group. Date lists are many short groups ("14 15 16 17")
  // and years are one 4-digit group, so both survive; \s would let the run
  // swallow a trailing date across a newline ("...27,28\n11:04"), so only
  // same-line whitespace is allowed inside a run.
  const cleaned = text
    .replace(/\+?\d[-\d \t]{6,}\d/g, (run) => {
      const digits = run.replace(/\D/g, '')
      const longest = Math.max(...run.split(/\D+/).map((g) => g.length))
      return digits.length >= 8 && longest >= 4 ? ' ' : run
    })
    .replace(/\b\d{1,2}:\d{2}\s*(AM|PM)?\b/gi, ' ') // clock times (colon only: OCR reads some commas as periods)

  // month + year, full names or 3-letter abbreviations
  let month = null
  let year = null
  const my = cleaned.match(
    new RegExp(`\\b(${MONTH_PREFIXES.join('|')})[A-Z]*\\b[\\s,.'\`-]*((?:20)\\d{2})`, 'i')
  )
  if (my) {
    month = MONTH_PREFIXES.indexOf(my[1].toUpperCase()) + 1
    year = Number(my[2])
  }

  const maxDay =
    month && year ? new Date(year, month, 0).getDate() : 31

  const weekDates = { 1: [], 2: [], 3: [], 4: [] }
  const assigned = new Set()
  let found = false

  const weekRe = /week\s*[.:#-]?\s*([1-4])\s*[:;=.-]*\s*([\d\s,.;|]+)/gi
  let w
  while ((w = weekRe.exec(cleaned)) !== null) {
    const wk = Number(w[1])
    const days = (w[2].match(/\d{1,2}/g) || [])
      .map(Number)
      .filter((d) => d >= 1 && d <= maxDay)

    for (const d of days) {
      if (assigned.has(d)) continue // a date belongs to one week only
      assigned.add(d)
      weekDates[wk].push(d)
      found = true
    }
    weekDates[wk].sort((a, b) => a - b)
  }

  return { month, year, weekDates: found ? weekDates : null }
}
