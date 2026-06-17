import { CANVAS, type LofiTemplate, type SizeKey, type Slot } from '../core/schemas'

export const SLOT_COLORS: Record<Slot, string> = {
  photo: '#94a3b8',
  headline: '#3182ce',
  subhead: '#63b3ed',
  cta: '#38a169',
  logo: '#805ad5',
  offer: '#dd6b20',
  disclaimer: '#94a3b8',
  badge: '#ed64a6',
}

interface Props {
  template: LofiTemplate
  size: SizeKey
  height?: number
}

/** Scaled SVG wireframe of an archetype's zones, safe areas, and margins for one size. */
export function ZoneCanvas({ template, size, height = 440 }: Props) {
  const canvas = CANVAS[size]
  const scale = height / canvas.h
  const width = canvas.w * scale
  const place = template.placement[size]
  const zones = [...template.zones[size]].sort((a, b) => a.layer - b.layer)

  return (
    <figure className="zone-canvas">
      <svg width={width} height={height} viewBox={`0 0 ${canvas.w} ${canvas.h}`}>
        <rect x={0} y={0} width={canvas.w} height={canvas.h} fill="#f8fafc" stroke="#cbd5e1" />
        {/* Safe areas (platform UI overlay zones) */}
        {place.safeTop > 0 && (
          <rect x={0} y={0} width={canvas.w} height={place.safeTop} fill="#f0525222" />
        )}
        {place.safeBottom > 0 && (
          <rect
            x={0}
            y={canvas.h - place.safeBottom}
            width={canvas.w}
            height={place.safeBottom}
            fill="#f0525222"
          />
        )}
        {/* Margin guides */}
        <rect
          x={place.margin}
          y={place.margin}
          width={canvas.w - place.margin * 2}
          height={canvas.h - place.margin * 2}
          fill="none"
          stroke="#94a3b8"
          strokeDasharray="18 14"
        />
        {zones.map((z) => (
          <g key={`${z.slot}-${z.x}-${z.y}`}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              fill={`${SLOT_COLORS[z.slot]}33`}
              stroke={SLOT_COLORS[z.slot]}
              strokeWidth={4}
            />
            <text
              x={z.x + z.w / 2}
              y={z.y + z.h / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={44}
              fontWeight={600}
              fill={SLOT_COLORS[z.slot]}
            >
              {z.slot}
              {z.maxLines ? ` (${z.maxLines}L)` : ''}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        {size} · {canvas.w}×{canvas.h}
        {place.safeTop > 0 && ` · safe ${place.safeTop}/${place.safeBottom}`} · margin{' '}
        {place.margin}
      </figcaption>
    </figure>
  )
}
