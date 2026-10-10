import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export type BorderBeamSize = 'sm' | 'md' | 'line' | 'pulse-outside' | 'pulse-inner'
export type BorderBeamTheme = 'auto' | 'dark' | 'light'
export type BorderBeamColorVariant =
  | 'colorful'
  | 'mono'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'candy'
  | 'ice'
  | 'gold'

export interface SizeConfig {
  borderWidth: number
  borderRadius: number
  height?: number
  width?: number
}

export interface ThemeColors {
  brightness?: number
  saturation: number
  strokeOpacity: number
  innerOpacity: number
  bloomOpacity: number
  hairlineOpacity?: number
  innerShadow: string
}

export interface BorderBeamProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
  size?: BorderBeamSize
  theme?: BorderBeamTheme
  colorVariant?: BorderBeamColorVariant
  active?: boolean
  duration?: number
  strength?: number
  borderRadius?: number
  glowSize?: number
  brightness?: number
  saturation?: number
  staticColors?: boolean
  hueRange?: number
  className?: string
  style?: CSSProperties
  css?: string
  onActivate?: () => void
  onDeactivate?: () => void
}

export const sizePresets: Record<BorderBeamSize, SizeConfig> = {
  sm: { borderRadius: 12, borderWidth: 1 },
  md: { borderRadius: 24, borderWidth: 1.5 },
  line: { borderRadius: 16, borderWidth: 1.5 },
  'pulse-outside': { borderRadius: 24, borderWidth: 1.5 },
  'pulse-inner': { borderRadius: 24, borderWidth: 1.5 },
}

export const themeColors: Record<'light' | 'dark', ThemeColors> = {
  dark: {
    brightness: 1.3,
    saturation: 1.2,
    strokeOpacity: 1,
    innerOpacity: 0.65,
    bloomOpacity: 0.4,
    hairlineOpacity: 0.08,
    innerShadow: 'none',
  },
  light: {
    brightness: 0.85,
    saturation: 1.2,
    strokeOpacity: 0.95,
    innerOpacity: 0.45,
    bloomOpacity: 0.3,
    hairlineOpacity: 0.08,
    innerShadow: 'none',
  },
}

export const sizeThemePresets = Object.fromEntries(
  Object.keys(sizePresets).map((size) => [
    size,
    { dark: { ...themeColors.dark }, light: { ...themeColors.light } },
  ])
) as Record<BorderBeamSize, Record<'dark' | 'light', ThemeColors>>

export const palettes: Record<BorderBeamColorVariant, readonly string[]> = {
  colorful: ['#28d6c0', '#3b82f6', '#965cfa', '#f477bc', '#ffc769'],
  mono: ['#71717a', '#fafafa', '#a1a1aa'],
  ocean: ['#22d3ee', '#3b82f6', '#a78bfa'],
  sunset: ['#fbbf24', '#fb7185', '#f97316'],
  forest: ['#a3e635', '#34d399', '#0d9488'],
  candy: ['#f9a8d4', '#c084fc', '#818cf8'],
  ice: ['#e0f2fe', '#67e8f9', '#60a5fa'],
  gold: ['#fef3c7', '#fbbf24', '#d97706'],
}

export function bounded(value: number | undefined, fallback: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? (value as number) : fallback))
}

export function beamPath(width: number, height: number, radius: number, line: boolean) {
  const inset = 0.75
  const right = Math.max(inset, width - inset)
  const bottom = Math.max(inset, height - inset)
  if (line) return `M ${inset} ${bottom} H ${right}`
  const r = bounded(radius - inset, 0, 0, Math.min(right - inset, bottom - inset) / 2)
  return [
    `M ${inset + r} ${inset}`,
    `H ${right - r} A ${r} ${r} 0 0 1 ${right} ${inset + r}`,
    `V ${bottom - r} A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H ${inset + r} A ${r} ${r} 0 0 1 ${inset} ${bottom - r}`,
    `V ${inset + r} A ${r} ${r} 0 0 1 ${inset + r} ${inset} Z`,
  ].join(' ')
}
