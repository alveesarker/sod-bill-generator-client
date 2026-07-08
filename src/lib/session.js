// Save the whole form state as a JSON file the student can reload next month.
export function exportSession({ student, supervisors, weekDates, courses }) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    student,
    supervisors,
    weekDates,
    courses,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `SoD_Session_${student.name || 'student'}_${student.month}_${student.year}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importSession(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.student || !data.supervisors || !data.weekDates) {
          reject(new Error('Invalid session file.'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('Could not read file. Make sure it is a valid session export.'))
      }
    }
    reader.onerror = () => reject(new Error('File read failed.'))
    reader.readAsText(file)
  })
}
