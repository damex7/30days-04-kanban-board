// Shared button styles so every button in the app looks like it belongs to
// the same drawing set. Variants: primary (orange), ghost (outlined), danger.
const VARIANTS = {
  primary: 'border-accent bg-accent text-on-accent hover:brightness-110',
  ghost: 'border-line-strong bg-transparent text-ink hover:bg-panel-2',
  danger: 'border-overdue bg-transparent text-overdue hover:bg-overdue hover:text-panel',
}

export default function Button({ variant = 'ghost', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 border px-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
