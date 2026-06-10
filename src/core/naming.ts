export type AdSetType = 'Seasonal' | 'Evergreen'
export type CreativeType = 'Video' | 'Image'
export type Version = 'V1' | 'V2'
export type Size = 'Story' | 'Post' // 9:16 / 4:5

export interface DeliverableId {
  adSetType: AdSetType
  theme: string
  year: number
  creativeType: CreativeType
  version: Version
  size: Size
  clientName: string
}

/** "Back To School" -> "BackToSchool", "O'Brien & Sons Ortho." -> "OBrienSonsOrtho" */
function pascal(s: string): string {
  return s
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
}

/** {Ad Set Type}_{Creative Theme-YYYY}_{Creative Type}_{Version}_{Size}_{Client Name} */
export function deliverableName(d: DeliverableId): string {
  return [
    d.adSetType,
    `${pascal(d.theme)}-${d.year}`,
    d.creativeType,
    d.version,
    d.size,
    pascal(d.clientName),
  ].join('_')
}
