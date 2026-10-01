// dnd-kit gives each sortable item a { x, y, scaleX, scaleY } transform.
// We only translate (no scaling), so cards of different heights don't
// get squashed while they slide around.
export function toTranslate(transform) {
  if (!transform) return undefined
  return `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
}
