import clsx from 'clsx'
import { Heading } from '../../components/catalyst/heading'

/** Step title + one-line description, consistent across every builder step. */
export function StepIntro({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6">
      <Heading level={2}>{title}</Heading>
      {children && <p className="mt-1.5 max-w-2xl text-sm/6 text-zinc-500">{children}</p>}
    </header>
  )
}

/** Small section heading inside a step (e.g. "Shared copy"). */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 mb-3 text-sm font-semibold text-zinc-950">{children}</h3>
}

/** Responsive grid for selectable tiles. */
export function TileGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
}

/** A selectable card. Shows a brand/persona color chip and a check badge when active. */
export function Tile({
  active,
  onClick,
  accent,
  title,
  meta,
}: {
  active: boolean
  onClick: () => void
  accent?: string
  title: string
  meta?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'group relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition',
        active
          ? 'border-transparent bg-white shadow-sm ring-2 ring-sky-500'
          : 'border-zinc-950/10 bg-white hover:border-zinc-950/20 hover:bg-zinc-950/[2.5%]',
      )}
    >
      {active && (
        <span className="absolute top-2.5 right-2.5 flex size-4 items-center justify-center rounded-full bg-sky-500 text-white">
          <CheckGlyph />
        </span>
      )}
      <div className="flex w-full items-center gap-2 pr-5">
        {accent && (
          <span className="size-3.5 shrink-0 rounded-md ring-1 ring-black/10" style={{ background: accent }} />
        )}
        <span className="truncate font-semibold text-zinc-950">{title}</span>
      </div>
      {meta && <span className="text-xs/5 text-zinc-500">{meta}</span>}
    </button>
  )
}

/** Compact two-or-more option toggle. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-950/10 bg-zinc-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={clsx(
            'rounded-md px-4 py-1.5 text-sm font-semibold transition',
            value === opt ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-800',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="size-2.5">
      <path d="M3 7.5 5.5 10 11 4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
