// Archetype-matched glyphs for the 11 personas, rendered as a tinted chip.
// Solid 20×20 paths in the heroicons-mini style; `accent` drives the tint.

const ICON_PATHS: Record<string, React.ReactNode> = {
  // Budget-Friendly Everyday Ortho — price tag
  'dr-a-joe': (
    <path
      fillRule="evenodd"
      d="M5.5 3A2.5 2.5 0 0 0 3 5.5v2.879a2.5 2.5 0 0 0 .732 1.767l6.5 6.5a2.5 2.5 0 0 0 3.536 0l2.878-2.878a2.5 2.5 0 0 0 0-3.536l-6.5-6.5A2.5 2.5 0 0 0 8.38 3H5.5ZM6 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      clipRule="evenodd"
    />
  ),
  // Premium Family Ortho — home
  'dr-g-house': (
    <path d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" />
  ),
  // Family-Focused Community Ortho — heart
  'dr-m-rogers': (
    <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 0 1-1.162-.682 22.045 22.045 0 0 1-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 0 1 8-2.828A4.5 4.5 0 0 1 18 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 0 1-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 0 1-.69.001l-.002-.001Z" />
  ),
  // Luxury Wellness Practice — gem
  'd-k-kardashian': (
    <path
      fillRule="evenodd"
      d="M5.36 3.4A1 1 0 0 1 6.16 3h7.68a1 1 0 0 1 .8.4l2.9 3.86a1 1 0 0 1-.05 1.27l-6.74 7.63a1 1 0 0 1-1.5 0L2.51 8.53a1 1 0 0 1-.05-1.27L5.36 3.4Zm1.3 1.6L4.78 7.5h2.47l1.13-2.5H7.66h-1Zm3.94 0 1.13 2.5h2.47L12.34 5h-1.74Zm2.9 4L10 14.42 6.5 9h7ZM6.5 9H4.9l3.02 3.42L6.5 9Zm7 0h1.6l-3.02 3.42L13.5 9Z"
      clipRule="evenodd"
    />
  ),
  // Adult Cosmetic-Focused Aesthetic Ortho — sparkles
  'dr-k-clarkson': (
    <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.239-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633l-.683-2.051ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
  ),
  // High-Expertise Clinical Ortho — bar chart (ORTHO_DATA)
  'dr-c-yang': (
    <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 16.5 2h-1ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9A1.5 1.5 0 0 0 9.5 18h1a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 10.5 6h-1ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5A1.5 1.5 0 0 0 3.5 18h1A1.5 1.5 0 0 0 6 16.5v-5A1.5 1.5 0 0 0 4.5 10h-1Z" />
  ),
  // Science-Driven Holistic Clinic — beaker
  'dr-b-nye': (
    <path
      fillRule="evenodd"
      d="M8.5 2a.75.75 0 0 0 0 1.5h.25V7l-4.43 7.09A1.75 1.75 0 0 0 5.8 16.75h8.4a1.75 1.75 0 0 0 1.48-2.66L11.25 7V3.5h.25a.75.75 0 0 0 0-1.5h-3Zm1.25 5.43V3.5h.5v3.93a.75.75 0 0 0 .114.398l1.986 3.172H7.65l1.986-3.172a.75.75 0 0 0 .114-.398Z"
      clipRule="evenodd"
    />
  ),
  // Modern Alternative Wellness — leaf
  'dr-a-sciuto': (
    <path d="M16.53 3.06c.26.02.45.22.47.48.42 6.87-3.02 12.71-9.83 12.96a3.42 3.42 0 0 1-3.63-3.63C3.8 6.06 9.65 2.63 16.53 3.06ZM6.1 14.5a.75.75 0 0 0 1.05 1.06c1.9-1.86 3.9-3.66 6.4-5.44a.75.75 0 1 0-.87-1.22c-2.57 1.83-4.63 3.68-6.58 5.6Z" />
  ),
  // Pediatric Dentistry & Orthodontics — tooth
  'dr-d-houser': (
    <path d="M10 3.42c-1.19-.94-2.73-1.11-4.06-.5C4.13 3.75 3.13 5.66 3.57 7.6c.3 1.36.98 2.55 1.28 3.9.36 1.62.42 3.32.92 4.9.2.62.62 1.1 1.2 1.1.63 0 .97-.55 1.08-1.13.26-1.3.37-2.65.95-3.85.22-.47.58-.87 1-.87s.78.4 1 .87c.58 1.2.69 2.55.95 3.85.11.58.45 1.13 1.08 1.13.58 0 1-.48 1.2-1.1.5-1.58.56-3.28.92-4.9.3-1.35.98-2.54 1.28-3.9.44-1.94-.56-3.85-2.37-4.68-1.33-.61-2.87-.44-4.06.5Z" />
  ),
  // Pediatric Wellness Practice — smile
  'dr-mcstuffins': (
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8 8.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-6.44 2.3a.75.75 0 0 1 1.03.25 2.85 2.85 0 0 0 4.82 0 .75.75 0 0 1 1.28.78 4.35 4.35 0 0 1-7.38 0 .75.75 0 0 1 .25-1.03Z"
      clipRule="evenodd"
    />
  ),
  // The Wellness Educator — academic cap
  'dr-v-frizzle': (
    <path d="M10.32 2.21a.75.75 0 0 0-.64 0L1.6 6.02a.75.75 0 0 0 0 1.36l2.9 1.35v3.02c0 .3.17.56.44.68l4.74 2.2a.75.75 0 0 0 .64 0l4.74-2.2a.75.75 0 0 0 .44-.68V8.73l1.5-.7v3.72a.75.75 0 0 0 1.5 0V7.02c0-.3-.17-.57-.44-.7l-8.24-4.1Zm3.68 7.22-3.36 1.56a.75.75 0 0 1-.64 0L6 9.43v2.84l4 1.86 4-1.86V9.43Z" />
  ),
}

// Fallback for any future persona without a mapped glyph.
const FALLBACK = (
  <path
    fillRule="evenodd"
    d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM5.6 14.4A5.48 5.48 0 0 1 10 12.5c1.8 0 3.4.75 4.4 1.9A6.47 6.47 0 0 1 10 16.5c-1.7 0-3.25-.8-4.4-2.1Z"
    clipRule="evenodd"
  />
)

export function PersonaGlyph({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      {ICON_PATHS[slug] ?? FALLBACK}
    </svg>
  )
}

/** Rounded chip that tints the persona glyph with its accent color. */
export function PersonaIcon({
  slug,
  accent,
  size = 'sm',
  selected = false,
}: {
  slug: string
  accent: string
  size?: 'sm' | 'lg'
  selected?: boolean
}) {
  const chip =
    size === 'lg'
      ? 'size-10 rounded-xl'
      : 'size-6 rounded-lg'
  const glyph = size === 'lg' ? 'size-5' : 'size-3.5'
  return (
    <span
      className={`flex shrink-0 items-center justify-center ring-1 ring-inset transition-colors duration-200 ${chip}`}
      style={
        selected
          ? { background: accent, color: '#fff', ['--tw-ring-color' as string]: 'rgb(0 0 0 / 0.08)' }
          : { background: `${accent}1a`, color: accent, ['--tw-ring-color' as string]: `${accent}33` }
      }
    >
      <PersonaGlyph slug={slug} className={glyph} />
    </span>
  )
}
