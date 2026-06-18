import { z } from 'zod'

export const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'kebab-case slug')

// Typography/imagery intentionally absent — brand-kit concerns (see design doc).
export const PersonaSchema = z.object({
  slug,
  name: z.string().min(1),
  archetype: z.string().min(1),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'hex color'),
  positioning: z.string().min(1),
  messagingBehavior: z.string().min(1),
  patientBase: z.array(z.string().min(1)),
  exampleClients: z.array(z.string()),
  layout: z.array(z.string()),
  visualTone: z.array(z.string()),
  iconography: z.array(z.string()),
  texture: z.array(z.string()),
  designPrinciples: z.array(z.string()),
  donts: z.array(z.string()),
  resources: z
    .array(z.object({ label: z.string().min(1), url: z.string().url() }))
    .optional(),
})
export type Persona = z.infer<typeof PersonaSchema>

export const CANVAS = {
  Story: { w: 1080, h: 1920 }, // 9:16
  Post: { w: 1080, h: 1350 }, // 4:5
} as const
export type SizeKey = keyof typeof CANVAS

export const SlotName = z.enum(['headline', 'subhead', 'cta', 'offer', 'disclaimer', 'photo', 'logo', 'badge'])
export type Slot = z.infer<typeof SlotName>

const ZoneSchema = z.object({
  slot: SlotName,
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  layer: z.number().int().min(0),
  maxLines: z.number().int().positive().optional(),
})
export type Zone = z.infer<typeof ZoneSchema>

const PlacementSchema = z.object({
  safeTop: z.number().int().min(0),
  safeBottom: z.number().int().min(0),
  margin: z.number().int().min(0),
})

const BeatSchema = z.object({
  atMs: z.number().int().min(0),
  slot: SlotName,
  effect: z.enum(['fade-in', 'rise-in', 'pop-in', 'slide-left', 'slide-right', 'none']),
})
export type Beat = z.infer<typeof BeatSchema>

const VideoGrammarSchema = z.object({
  durationMs: z.number().int().positive(),
  fps: z.number().int().positive(),
  loop: z.boolean(),
  reducedMotion: z.enum(['static', 'simplified']),
  beats: z.array(BeatSchema),
})

const zonesInCanvas = (size: SizeKey) => (zones: Zone[]) =>
  zones.every((zn) => zn.x + zn.w <= CANVAS[size].w && zn.y + zn.h <= CANVAS[size].h)

export const LofiTemplateSchema = z
  .object({
    slug,
    name: z.string().min(1),
    description: z.string().min(1),
    slots: z.array(SlotName).min(1),
    zones: z.object({
      Story: z.array(ZoneSchema).refine(zonesInCanvas('Story'), { message: 'zone exceeds Story canvas' }),
      Post: z.array(ZoneSchema).refine(zonesInCanvas('Post'), { message: 'zone exceeds Post canvas' }),
    }),
    placement: z.object({ Story: PlacementSchema, Post: PlacementSchema }),
    videoGrammar: VideoGrammarSchema,
  })
  .refine((t) => t.videoGrammar.beats.every((b) => b.atMs < t.videoGrammar.durationMs), {
    message: 'beat is past the video duration',
  })
export type LofiTemplate = z.infer<typeof LofiTemplateSchema>

export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'hex color')

export const BrandKitSchema = z.object({
  slug,
  clientName: z.string().min(1),
  personaSlug: slug,
  colors: z.object({
    brand: HexColor,
    ink: HexColor.optional(),
    surface: HexColor.optional(),
    accent: HexColor.optional(),
    onBrand: HexColor.optional(),
  }),
  typography: z
    .object({ displayFont: z.string().min(1), bodyFont: z.string().min(1) })
    .optional(),
  logo: z.object({
    assetPath: z.string().min(1),
    aspect: z.number().positive().optional(),
  }),
  radius: z.number().int().min(0).optional(),
  donts: z.array(z.string()).optional(),
  // Exactly three short benefit phrases sourced from the client (Notion USPs + website).
  valueProps: z.array(z.string().min(1)).length(3).optional(),
})
export type BrandKit = z.infer<typeof BrandKitSchema>

export const HifiTemplateManifestSchema = z.object({
  slug,
  name: z.string().min(1),
  archetype: slug, // references a lo-fi template slug
  suitedPersonas: z.array(slug),
  // Campaigns (themes) this template is built for, e.g. ['christmas-2026'].
  // Omit for an evergreen template that fits any campaign.
  suitedCampaigns: z.array(slug).optional(),
  slots: z.array(SlotName).min(1),
})
export type HifiTemplateManifest = z.infer<typeof HifiTemplateManifestSchema>

// Per-version copy. `logo` is intentionally absent — it comes from the brand kit.
export const SlotContentSchema = z.object({
  headline: z.string().optional(),
  subhead: z.string().optional(),
  cta: z.string().optional(),
  offer: z.string().optional(),
  disclaimer: z.string().optional(),
  badge: z.string().optional(),
  photo: z.string().optional(), // asset path
})
export type SlotContent = z.infer<typeof SlotContentSchema>

export const CampaignVersionSchema = z.object({
  content: SlotContentSchema,
  notes: z.string().optional(),
})
export type CampaignVersion = z.infer<typeof CampaignVersionSchema>

export const CampaignSchema = z.object({
  slug,
  clientSlug: slug,
  adSetType: z.enum(['Seasonal', 'Evergreen']),
  theme: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  hifiTemplateSlug: slug,
  versions: z.object({ V1: CampaignVersionSchema, V2: CampaignVersionSchema }),
})
export type Campaign = z.infer<typeof CampaignSchema>

export const RenderManifestSchema = z.object({
  campaignSlug: slug,
  requested: z
    .array(
      z.object({
        version: z.enum(['V1', 'V2']),
        size: z.enum(['Story', 'Post']),
        creativeType: z.enum(['Image', 'Video']),
      }),
    )
    .min(1),
})
export type RenderManifest = z.infer<typeof RenderManifestSchema>
