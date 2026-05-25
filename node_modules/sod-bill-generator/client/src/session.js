export function exportSession({ student, supervisors, weekDates, courses }) {
    const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        student,
        supervisors,
        weekDates,
        courses,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
    })

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
                reject(new Error('Could not read file. Make sure it is a valid JSON export.'))
            }
        }

        reader.onerror = () => reject(new Error('File read failed.'))
        reader.readAsText(file)
    })
}