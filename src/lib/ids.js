// crypto.randomUUID needs a secure context (https or localhost), which both
// Vite dev and Vercel provide. The fallback covers odd embedded browsers.
export function makeId(prefix = 'id') {
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}
