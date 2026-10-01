// Due dates are stored as plain "YYYY-MM-DD" strings, not Date objects or
// timestamps. That avoids timezone bugs (a date picked in Lagos should not
// become "yesterday" in New York) and lets us compare dates as strings.

const pad = (n) => String(n).padStart(2, '0')

/** Today's date in the user's local timezone, as "YYYY-MM-DD". */
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Shift an ISO date string by a number of days. */
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  return todayISO(new Date(y, m - 1, d + days))
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** ISO strings sort like dates, so plain string comparison works. */
export function isOverdue(dueDate, today = todayISO()) {
  return Boolean(dueDate) && dueDate < today
}

/** "3 Oct" (or "3 Oct 2027" when not this year). */
export function formatDue(iso, today = todayISO()) {
  const [y, m, d] = iso.split('-').map(Number)
  const sameYear = today.startsWith(String(y))
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}
