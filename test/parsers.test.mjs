// Unit tests for the OCR-text parsers. Pure Node, no framework:
//   npm test  (from client/)
import assert from 'node:assert/strict'
import {
  parseCoursesFromText,
  parseWeekDatesFromText,
  parseWeekDatesFromTexts,
} from '../src/lib/scheduleParsers.js'

let passed = 0
function test(name, fn) {
  try {
    fn()
    passed++
  } catch (err) {
    console.error(`FAIL ${name}`)
    throw err
  }
}

const course = (dayCode, startTime, endTime) => ({ dayCode, startTime, endTime })
const sorted = (list) =>
  [...list].sort((a, b) =>
    `${a.dayCode}|${a.startTime}`.localeCompare(`${b.dayCode}|${b.startTime}`)
  )
const assertCourses = (text, expected) =>
  assert.deepEqual(sorted(parseCoursesFromText(text)), sorted(expected))

// ---------------------------------------------------------------- courses

test('clean IRAS text yields all six courses', () => {
  assertCourses(
    `CSE216 Microprocessor Interfacing 4 BC6008 MW:16:20-17:50 16 / 17 94.12 %
     CSE216L Labwork based on CSE216 1 CENLAB3 S:13:00-14:30 16 / 17 94.12 %
     CSE310 Electronics II 3 BC6007 AR:13:00-14:30 18 / 18 100 %
     CSE310L Labwork based on CSE310 6 CENLAB2 R:14:40-16:10 18 / 18 100 %
     CSE425 Artificial Intelligence 2 BC6007 M:18:30-21:30 5 / 6 83.33 %
     CSE451 Software Engineering 1 BC6009 S:18:30-21:30 4 / 5 80 %`,
    [
      course('MW', '16:20', '17:50'),
      course('S', '13:00', '14:30'),
      course('AR', '13:00', '14:30'),
      course('R', '14:40', '16:10'),
      course('M', '18:30', '21:30'),
      course('S', '18:30', '21:30'),
    ]
  )
})

test('end time wrapped to the next line with junk between', () => {
  assertCourses('MW:16:20- 16/17 94.12% [Z]\n17:50', [course('MW', '16:20', '17:50')])
})

test('$ misread of S, glued and with separator', () => {
  assertCourses('$13:00-14:30', [course('S', '13:00', '14:30')])
  assertCourses('$:13:00-14:30', [course('S', '13:00', '14:30')])
})

test('5 misread of S only converts when a separator follows', () => {
  assertCourses('5:13:00-14:30', [course('S', '13:00', '14:30')])
  // a real clock value with seconds must not become a day code
  assertCourses('15:30:45', [])
  // a bare number before a time stays a number
  assertCourses('5 13:00-14:30', [])
})

test('day code glued to a room code is still found', () => {
  assertCourses('CENLAB3S:13:00- 14:30', [course('S', '13:00', '14:30')])
  assertCourses('BC6007AR:13:00-14:30', [course('AR', '13:00', '14:30')])
})

test('dash misreads of colons are tolerated', () => {
  assertCourses('S:18:30- 21-30', [course('S', '18:30', '21:30')])
  assertCourses('S-18:30-21:30', [course('S', '18:30', '21:30')])
  assertCourses('AR:13:00-14-30', [course('AR', '13:00', '14:30')])
})

test('letters before a code block it, ordinary words never match', () => {
  assertCourses('CLASS 13:00-14:30', [])
  assertCourses('STAR 16:20-17:50', [])
  assertCourses('MARCH 14:30-16:00', [])
})

test('percentages, seat counts and out-of-range values are ignored', () => {
  assertCourses('94.12 % 16 / 17 100 % 83.33 %', [])
  assertCourses('M:18:30-19:00 94.12%', [course('M', '18:30', '19:00')])
  // durations must stay between 30 minutes and 6 hours
  assertCourses('M:13:00-13:10', [])
  assertCourses('M:08:00-15:00', [])
})

test('duplicates collapse', () => {
  assertCourses('S:13:00-14:30 S:13:00-14:30', [course('S', '13:00', '14:30')])
})

// Raw browser-OCR output captured from the replica of the user's IRAS
// screenshot (clean variant). Only the MW row survives OCR intact here;
// the parser must extract it and invent nothing else.
test('real OCR dump (clean variant) parses without inventing courses', () => {
  assertCourses(
    `) MW:16:20-

CSE216 Microprocessor Int... 4 BC6008 17:50 16117 | 94.12%

CSE216L Labwork based on 1 CENLAB3 30% (16117 94.12% |
abwo ased on... 14-30

CSE310 Electronics Ii 3 BC6007 hve

R:14:40-

CSE310L Labwork based on... 6 CENLABZ
_— ) M:18:30-

CSE425 Artificial Intelligence 2 BC6007 010 516 |

: S:18:30-
CSE451 Software Engineer... 1 BC6009 S130 415 |`,
    [course('MW', '16:20', '17:50')]
  )
})

// Same capture, threshold variant: dash-tolerant times recover the
// evening S course on top of AR and R.
test('real OCR dump (thresh variant) recovers AR, R and evening S', () => {
  assertCourses(
    `MW:16:20-
CSE216 Microprocessor Int... 4 BC6008 1750 16717 J 94.12% |
CSE216L Labwork based 1 CENLAB3 300 EE £5
WOr sed on... 14:30
AR:13:00-
CSE310 Electronics 3 BC6007 14:30 (18718 | | 100% |
R:14:40-
CSE310L Labwork based on... 6 CENLAB2 16:10 18718 | 100% |
oo M:18:30-
CSE425 Artificial Intelligence 2 BC6007 >t a0 (516 |
) S:18:30-
CSEA451 Software Engineer... 1 BC6009 21-30 (a15 [20% |`,
    [
      course('AR', '13:00', '14:30'),
      course('R', '14:40', '16:10'),
      course('S', '18:30', '21:30'),
    ]
  )
})

// ------------------------------------------------------------- week dates

test('dates announcement with month header, missing comma and periods', () => {
  const { month, year, weekDates } = parseWeekDatesFromText(
    `SoD duty roster +880 1712-345678
     JUNE 2026
     Week 1 : 1,2,3,4
     Week 2 : 7,8,9,10,11
     Week 3 : 14,15 16,17,18
     Week 4 : 21,22,23.24,25,27,28
     11:04 AM`
  )
  assert.equal(month, 6)
  assert.equal(year, 2026)
  assert.deepEqual(weekDates[1], [1, 2, 3, 4])
  assert.deepEqual(weekDates[2], [7, 8, 9, 10, 11])
  assert.deepEqual(weekDates[3], [14, 15, 16, 17, 18])
  // 23.24 is a missing comma, not a clock time; 26 was deliberately skipped
  assert.deepEqual(weekDates[4], [21, 22, 23, 24, 25, 27, 28])
})

test('dates: clock times and phone numbers never leak into weeks', () => {
  const { weekDates } = parseWeekDatesFromText('Week 1: 11:04 AM 2,3')
  assert.deepEqual(weekDates[1], [2, 3])
})

test('dates: space-separated day runs are not mistaken for phone numbers', () => {
  const { weekDates } = parseWeekDatesFromText('Week 1 : 14 15 16 17\nWeek 2 : 21 22')
  assert.deepEqual(weekDates[1], [14, 15, 16, 17])
  assert.deepEqual(weekDates[2], [21, 22])
})

test('dates: phone number formats are stripped', () => {
  for (const phone of ['+8801712345678', '01712-345678', '+880 1712-345678']) {
    const { weekDates } = parseWeekDatesFromText(`Contact ${phone}\nWeek 1 : 2,3`)
    assert.deepEqual(weekDates[1], [2, 3], `leak from ${phone}`)
  }
})

test('dates: a trailing day before a timestamp line is kept', () => {
  const { weekDates } = parseWeekDatesFromText('Week 4 : 27,28\n11:04 AM')
  assert.deepEqual(weekDates[4], [27, 28])
})

test('dates: a day belongs to the first week that claims it', () => {
  const { weekDates } = parseWeekDatesFromText('Week 1 : 5,6 Week 2 : 6,7')
  assert.deepEqual(weekDates[1], [5, 6])
  assert.deepEqual(weekDates[2], [7])
})

test('dates: days beyond the detected month length are dropped', () => {
  const { month, weekDates } = parseWeekDatesFromText('FEBRUARY 2026 Week 1 : 27,28,29,30')
  assert.equal(month, 2)
  assert.deepEqual(weekDates[1], [27, 28])
})

// The July 2026 announcement: whatever OCR does to one week's label, the
// other three anchor it back to its slot.
const JULY = (weekTwoLabel) => `JULY 2026

Week 1 : 5,6,7,8,9,10,11

${weekTwoLabel} : 12,13,14,15,16,17,18

Week 3 : 19,20,21,22,23,24,25

Week 4 : 26,27,28,29,30,31
6:51 PM`

test('dates: a week with a mangled label is recovered from its position', () => {
  for (const label of ['Wook 2', 'Weck 2', 'Week Z', 'Week', 'W33k 2', 'Neek 2']) {
    const { month, weekDates } = parseWeekDatesFromText(JULY(label))
    assert.equal(month, 7)
    assert.deepEqual(weekDates[1], [5, 6, 7, 8, 9, 10, 11], `week 1 with "${label}"`)
    assert.deepEqual(weekDates[2], [12, 13, 14, 15, 16, 17, 18], `week 2 with "${label}"`)
    assert.deepEqual(weekDates[3], [19, 20, 21, 22, 23, 24, 25], `week 3 with "${label}"`)
    assert.deepEqual(weekDates[4], [26, 27, 28, 29, 30, 31], `week 4 with "${label}"`)
  }
})

test('dates: a colon glued to the week number is not read as a clock time', () => {
  const { weekDates } = parseWeekDatesFromText(
    'JULY 2026\nWeek 1:5,6\nWeek 2:12,13,14\nWeek 3:19,20,21\nWeek 4:26,27'
  )
  assert.deepEqual(weekDates[1], [5, 6])
  assert.deepEqual(weekDates[2], [12, 13, 14])
  assert.deepEqual(weekDates[3], [19, 20, 21])
  assert.deepEqual(weekDates[4], [26, 27])
})

test('dates: the month header is never mistaken for an unlabelled week', () => {
  const { month, year, weekDates } = parseWeekDatesFromText(
    'JULY 2026\nWeek 1 : 5,6,7\nWeek 3 : 19,20,21\nWeek 4 : 26,27,28'
  )
  assert.equal(month, 7)
  assert.equal(year, 2026)
  assert.deepEqual(weekDates[2], []) // nothing to fill it with
  assert.deepEqual(weekDates[1], [5, 6, 7])
})

test('dates: a day list only fills a week slot its position allows', () => {
  // a stray list before week 1 has no open week below it, so it is dropped
  const { weekDates } = parseWeekDatesFromText('Roster 15,16,17,18\nWeek 1 : 1,2,3\nWeek 2 : 4,5,6')
  assert.deepEqual(weekDates[1], [1, 2, 3])
  assert.deepEqual(weekDates[3], [])
  assert.deepEqual(weekDates[4], [])
  // ...but a leftover line between weeks 1 and 3 takes the open week 2
  const gap = parseWeekDatesFromText('Week 1 : 1,2,3\nWeek 3 : 14,15,16').weekDates
  assert.deepEqual(gap[2], [])
  const filled = parseWeekDatesFromText('Week 1 : 1,2,3\nRoster 7,8,9\nWeek 3 : 14,15,16').weekDates
  assert.deepEqual(filled[2], [7, 8, 9])
})

test('dates: unlabelled lists need a real week label somewhere to be trusted', () => {
  const { weekDates } = parseWeekDatesFromText('Invoice 12,13,14,15 total 20')
  assert.equal(weekDates, null)
})

test('dates: each week takes the OCR variant that read it best', () => {
  // variant A loses week 2, variant B loses weeks 3 and 4 — neither is
  // complete, and A alone (17 days) would have won a whole-variant pick
  const { month, year, weekDates } = parseWeekDatesFromTexts([
    'JULY 2026\nWeek 1 : 5,6,7,8\nWeek 3 : 19,20,21,22\nWeek 4 : 26,27,28,29,30',
    'Week 1 : 5,6\nWeek 2 : 12,13,14,15',
  ])
  assert.equal(month, 7)
  assert.equal(year, 2026)
  assert.deepEqual(weekDates[1], [5, 6, 7, 8])
  assert.deepEqual(weekDates[2], [12, 13, 14, 15])
  assert.deepEqual(weekDates[3], [19, 20, 21, 22])
  assert.deepEqual(weekDates[4], [26, 27, 28, 29, 30])
})

test('dates: merged variants still give a day to one week only', () => {
  const { weekDates } = parseWeekDatesFromTexts([
    'Week 1 : 5,6,7',
    'Week 2 : 7,8,9', // 7 misread into week 2 by the other variant
  ])
  assert.deepEqual(weekDates[1], [5, 6, 7])
  assert.deepEqual(weekDates[2], [8, 9])
})

test('dates: no week lines in any variant means null result', () => {
  const { weekDates } = parseWeekDatesFromTexts(['random text 12:30', 'nothing here'])
  assert.equal(weekDates, null)
})

test('dates: no week lines means null result', () => {
  const { weekDates } = parseWeekDatesFromText('random text 12:30 nothing here')
  assert.equal(weekDates, null)
})

console.log(`ok - ${passed} tests passed`)
