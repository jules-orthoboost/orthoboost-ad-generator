import type { JSX } from 'react'
import type {
  Beat,
  SizeKey,
  Slot,
  SlotContent,
  HifiTemplateManifest,
} from '../../core/schemas'
import type { ResolvedTokens } from '../../core/tokens'

export interface TemplateRenderProps {
  size: SizeKey
  tokens: ResolvedTokens
  content: SlotContent
  /** Resolved, ready-to-use URL for the brand logo (BASE_URL already applied). */
  logoUrl: string
  beats: Beat[]
  durationMs: number
  /** Preview playback. The Phase 4 harness drives frames via virtual time. */
  playing: boolean
  reducedMotion: boolean
  /** Harness-injected virtual time in ms; preview leaves it undefined (uses a rAF clock). */
  frameNowMs?: number
}

export type HifiTemplateComponent = (props: TemplateRenderProps) => JSX.Element

export interface RegisteredTemplate {
  manifest: HifiTemplateManifest
  Component: HifiTemplateComponent
}

export type SlotKey = Slot
