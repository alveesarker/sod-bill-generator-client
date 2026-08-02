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

// Week numbers OCR reads as letters: '1' comes back as I/l/|, '2' as Z.
const WEEK_INDEX = { 1: 1, I: 1, L: 1, '|': 1, 2: 2, Z: 2, 3: 3, 4: 4 }

// A standalone 1-2 digit number: "2026" stays a year instead of becoming
// 20 and 26. Used for unlabelled lines only — inside a "Week N :" list,
// glued digits ("1213") are still worth splitting.
const DAY_RE = /(?<!\d)(\d{1,2})(?!\d)/g

/**
 * Text ranges of `cleaned` that no "Week N : ..." match covered, split into
 * lines with their absolute offsets. These are the candidates for a week
 * line whose label OCR mangled.
 */
function unmatchedLines(cleaned, ranges) {
  const gaps = []
  let pos = 0
  for (const r of [...ranges].sort((a, b) => a.start - b.start)) {
    if (r.start > pos) gaps.push([pos, r.start])
    pos = Math.max(pos, r.end)
  }
  if (pos < cleaned.length) gaps.push([pos, cleaned.length])

  const lines = []
  for (const [start, end] of gaps) {
    let offset = start
    for (const piece of cleaned.slice(start, end).split('\n')) {
      lines.push({ start: offset, text: piece })
      offset += piece.length + 1
    }
  }
  return lines
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
 *
 * A week whose label OCR mangled ("Wook 2", "Week Z", "Weck") is recovered
 * by position: a leftover line that is just a list of days, sitting between
 * the weeks that did parse, takes the week number left open between them.
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
    // clock times (colon only: OCR reads some commas as periods). The
    // lookbehind spares a week label whose colon OCR glued to the number:
    // in "Week 2:12,13" the "2:12" is a week and its first date, not 2:12 AM.
    .replace(/(?<!\bweek\s{0,3})\b\d{1,2}:\d{2}\s*(AM|PM)?\b/gi, ' ')

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

  // a date belongs to one week only: the first week to claim it keeps it
  const claim = (wk, days) => {
    for (const d of days) {
      if (assigned.has(d)) continue
      assigned.add(d)
      weekDates[wk].push(d)
      found = true
    }
    weekDates[wk].sort((a, b) => a - b)
  }

  // pass 1: explicit "Week N : 1,2,3" lists
  const labelled = []
  // (?!\d) keeps the first date from being taken as the week number when
  // the number itself is unreadable: "Week : 12,13" is not week 1 of 2,13.
  const weekRe = /week\s*[.:#-]?\s*([1-4ILZ|])(?!\d)\s*[:;=.-]*\s*([\d\s,.;|]+)/gi
  let w
  while ((w = weekRe.exec(cleaned)) !== null) {
    const wk = WEEK_INDEX[w[1].toUpperCase()]
    labelled.push({
      week: wk,
      start: w.index,
      // trailing whitespace is part of the match (the day list may wrap to
      // the next line); excluding it keeps the following line unmatched
      end: w.index + w[0].replace(/\s+$/, '').length,
      days: (w[2].match(/\d{1,2}/g) || []).map(Number).filter((d) => d >= 1 && d <= maxDay),
    })
    claim(wk, labelled[labelled.length - 1].days)
  }

  // pass 2: a week whose label OCR mangled shows up as a leftover line of
  // bare days. Only trusted alongside labels that did parse — without that
  // anchor any numeric line in a wrong screenshot would become week 1.
  const openWeeks = [1, 2, 3, 4].filter((wk) => !labelled.some((l) => l.week === wk))
  if (labelled.length > 0 && openWeeks.length > 0) {
    for (const line of unmatchedLines(cleaned, labelled)) {
      if (openWeeks.length === 0) break
      if (/\b(19|20)\d{2}\b/.test(line.text)) continue // month header, not days

      // Drop what is left of the label ("Wook 2 :") up to its separator, so
      // the week's own number is not read as a date. A bare day list has no
      // separator to strip — clock times were removed above.
      const sep = line.text.search(/[:;=]/)
      const body =
        sep >= 0 && sep <= 15 && /[a-z]/i.test(line.text.slice(0, sep))
          ? line.text.slice(sep + 1)
          : line.text

      const days = (body.match(DAY_RE) || [])
        .map(Number)
        .filter((d) => d >= 1 && d <= maxDay)
      // a real week line is a run of days; two stray numbers are not enough
      if (days.length < 3) continue
      const fresh = days.filter((d) => !assigned.has(d))
      if (fresh.length < 2) continue

      // the open week number must fit between the labelled weeks around it
      const prev = Math.max(0, ...labelled.filter((l) => l.start < line.start).map((l) => l.week))
      const next = Math.min(5, ...labelled.filter((l) => l.start > line.start).map((l) => l.week))
      const slot = openWeeks.findIndex((wk) => wk > prev && wk < next)
      if (slot === -1) continue

      claim(openWeeks[slot], fresh)
      openWeeks.splice(slot, 1)
    }
  }

  return { month, year, weekDates: found ? weekDates : null }
}

/**
 * Parse the OCR text of every preprocessing variant and combine them.
 *
 * The variants fail by LOSING days (glued digits, a mangled week label),
 * not by inventing them, and they fail on different lines — so each week
 * takes the variant that recovered the most days for it, rather than one
 * variant winning the whole announcement and taking its gaps along.
 */
export function parseWeekDatesFromTexts(texts) {
  let month = null
  let year = null
  const best = { 1: [], 2: [], 3: [], 4: [] }
  let found = false

  for (const text of texts) {
    const parsed = parseWeekDatesFromText(text)
    month = month || parsed.month
    year = year || parsed.year
    if (!parsed.weekDates) continue
    found = true
    for (const wk of [1, 2, 3, 4]) {
      if (parsed.weekDates[wk].length > best[wk].length) best[wk] = parsed.weekDates[wk]
    }
  }

  if (!found) return { month, year, weekDates: null }

  // re-apply the one-week-only rule: the lists came from different parses
  const weekDates = { 1: [], 2: [], 3: [], 4: [] }
  const assigned = new Set()
  for (const wk of [1, 2, 3, 4]) {
    for (const d of best[wk]) {
      if (assigned.has(d)) continue
      assigned.add(d)
      weekDates[wk].push(d)
    }
  }

  return { month, year, weekDates }
}
