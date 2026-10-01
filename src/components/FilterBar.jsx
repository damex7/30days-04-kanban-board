import { useId } from 'react'
import { PRIORITIES } from '../state/boardReducer.js'
import { CloseIcon, SearchIcon } from './Icons.jsx'

const fieldClass =
  'h-10 border border-line-strong bg-panel px-3 text-sm text-ink placeholder:text-ink-soft/80'
const labelClass = 'sr-only'

export default function FilterBar({ filters, setFilter, clearFilters, isFiltered, allLabels, shownCount, totalCount }) {
  const ids = { search: useId(), priority: useId(), label: useId() }

  return (
    <search className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-[1_1_14rem]">
        <label htmlFor={ids.search} className={labelClass}>
          Search tasks
        </label>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
        <input
          id={ids.search}
          type="search"
          value={filters.query}
          onChange={(e) => setFilter('query', e.target.value)}
          placeholder="Search title, notes, labels…"
          className={`${fieldClass} w-full pl-9`}
        />
      </div>

      <label htmlFor={ids.priority} className={labelClass}>
        Filter by priority
      </label>
      <select id={ids.priority} value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} className={`${fieldClass} flex-[1_1_8rem]`}>
        <option value="">Any priority</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p[0].toUpperCase() + p.slice(1)} priority
          </option>
        ))}
      </select>

      <label htmlFor={ids.label} className={labelClass}>
        Filter by label
      </label>
      <select id={ids.label} value={filters.label} onChange={(e) => setFilter('label', e.target.value)} className={`${fieldClass} flex-[1_1_8rem]`}>
        <option value="">Any label</option>
        {allLabels.map((l) => (
          <option key={l} value={l}>
            #{l}
          </option>
        ))}
      </select>

      {isFiltered && (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex h-10 items-center gap-1.5 border border-transparent px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft hover:text-ink"
        >
          <CloseIcon className="size-3.5" /> Clear
        </button>
      )}

      {/* Polite live region: screen readers hear the result count as you type. */}
      <p role="status" className="basis-full font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft empty:hidden">
        {isFiltered ? `Showing ${shownCount} of ${totalCount} tasks · drag still works, hidden tasks keep their place` : ''}
      </p>
    </search>
  )
}
