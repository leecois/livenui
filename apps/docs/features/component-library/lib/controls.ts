import type { Field, Library, Props } from './config'
import { orbDensityLimit } from './orb-limits'

export type ControlGroup = 'Appearance' | 'Motion' | 'Interaction'
export type NumberSpec = {
  min: number
  max: number
  step: number
  unit?: string
  limitMin?: number
  limitMax?: number
  integer?: boolean
  exclusiveMin?: boolean
}

const range = (min: number, max: number, step = 0.01, unit?: string): NumberSpec => ({
  min,
  max,
  step,
  unit,
})
const bounded = (min: number, max: number, step = 0.01, unit?: string): NumberSpec => ({
  ...range(min, max, step, unit),
  limitMin: min,
  limitMax: max,
})
const positive = (min: number, max: number, step = 0.01, unit?: string): NumberSpec => ({
  ...range(min, max, step, unit),
  limitMin: min,
})

const beam = {
  duration: positive(0.1, 10, 0.1, 's'),
  borderRadius: positive(0, 100, 1, 'px'),
  brightness: range(0, 3),
  saturation: range(0, 2),
  glowSize: range(0, 3),
  hueRange: range(0, 180, 1, '°'),
  strength: bounded(0, 1),
}
const numeric: Record<string, Record<string, NumberSpec>> = {
  beam,
  orbs: {
    speed: range(0.25, 3, 0.05, '×'),
    dots: { ...positive(0.1, 3, 0.05, '×'), limitMax: orbDensityLimit },
    dotSize: positive(0.1, 3, 0.05, '×'),
  },
  metal: {
    strength: bounded(0, 1),
    glowGain: range(0, 5, 0.05),
    borderRadius: positive(0, 100, 1, 'px'),
    shaderScale: range(0.1, 5, 0.05, '×'),
    ringCssPx: range(0, 20, 0.5, 'px'),
    scale: range(0.25, 3, 0.05, '×'),
    metalOpacity: range(0, 1),
    gradient: range(0, 1),
    glow: range(0, 3, 0.05),
  },
  gooey: {
    blur: positive(0, 24, 0.5, 'px'),
    contrast: range(1, 40, 1),
    filterPadding: range(0, 100, 1, 'px'),
    waviness: range(0, 30, 0.5),
    wavinessFreq: range(0, 0.1, 0.001),
  },
  voice: {
    ...beam,
    dotSize: positive(0.1, 3, 0.05, '×'),
    dotGap: positive(0.3, 3, 0.05, '×'),
    lineWidth: positive(0.05, 3, 0.05, '×'),
    lineGap: positive(0.3, 3, 0.05, '×'),
    texture: bounded(0, 1),
    gravity: positive(0.05, 3, 0.05),
    surfaceHeight: positive(0.1, 3, 0.05),
    surfaceCurve: bounded(-3, 5, 0.05),
    surfaceTail: bounded(-2, 3, 0.05),
    surfaceTailPosition: bounded(0, 0.98),
    surfaceTailCurve: positive(0.5, 5, 0.05),
    surfaceFade: bounded(0, 1),
    scale: positive(0.05, 3, 0.05, '×'),
    level: bounded(0, 1),
    sensitivity: positive(0, 6, 0.05),
    threshold: bounded(0, 0.95, 0.005),
    attack: positive(0, 2, 0.005, 's'),
    release: positive(0, 2, 0.01, 's'),
    idle: bounded(0, 1),
    breatheDuration: positive(0.2, 10, 0.1, 's'),
    reach: positive(0, 3),
    spread: positive(0, 3),
    flow: range(-3, 3, 0.05),
    processingDuration: positive(0.05, 5, 0.05, 's'),
    processingLevel: bounded(0, 1),
    processingEase: positive(0.05, 3, 0.05),
    processingTravel: positive(0, 3, 0.05),
    processingCurve: positive(1, 5, 0.05),
    cornerFollow: bounded(0, 1),
    hueDuration: positive(0.5, 10, 0.1, 's'),
    strokeOpacity: range(0, 2),
    innerOpacity: range(0, 2),
    bloomOpacity: range(0, 2),
    bend: positive(0, 3),
    bandStrength: positive(0, 3),
    bandWidth: positive(0, 3),
    bandPosition: positive(0, 3),
    bandCurve: positive(0.3, 5, 0.05),
    bandSpread: positive(0.05, 3, 0.05),
    bandSkew: bounded(-0.9, 0.9),
    bandOffset: range(-3, 3, 0.05),
    bandTail: bounded(0, 1.5),
    bandTailPosition: bounded(0, 0.98),
    bandTailCurve: positive(0.5, 5, 0.05),
    bandTailOverflow: positive(0, 3),
    bandAberration: bounded(0, 1),
    distortion: bounded(0, 1),
    distortionDetail: range(0.1, 5, 0.05),
    glowWidth: range(0.1, 3),
    glowHeight: range(0.1, 3),
    lobeSpacing: positive(0.1, 3),
    rangeWidth: range(0.1, 3),
    rangeHeight: range(0.1, 3),
    softness: range(0, 2),
    coreSize: range(0, 3),
    coreLight: bounded(0, 3),
    coreLightWidth: range(0, 3),
    coreLightHeight: range(0, 3),
    strokeScale: range(0.1, 3),
    innerScale: range(0.1, 3),
    innerHeight: range(0.1, 3),
    bloomScale: range(0.1, 3),
    bloomHeight: range(0.1, 3),
  },
  image: {
    strength: bounded(0, 2),
    speed: { ...range(0.25, 3, 0.05, '×'), limitMin: 0, exclusiveMin: true },
    pixelScale: { ...range(0.25, 4, 0.05, '×'), limitMin: 0, exclusiveMin: true },
    revealFadeOutMs: positive(0, 3000, 50, 'ms'),
    borderRadius: positive(0, 100, 1, 'px'),
  },
  avatars: {
    size: { ...range(16, 256, 1, 'px'), limitMin: 0, exclusiveMin: true },
    brightness: bounded(0, 2),
    saturation: bounded(0, 1.5),
    speed: positive(0, 3, 0.05, '×'),
    seed: bounded(0, 1),
    shadow: bounded(0, 2),
    highlight: bounded(0, 2),
    depth: bounded(0.2, 2),
    roundness: bounded(0, 1),
    furLength: bounded(0.3, 2.5, 0.05, '×'),
    furDensity: bounded(0.3, 2, 0.05, '×'),
    furFuzz: bounded(0, 1, 0.05),
    furClumps: bounded(0, 1, 0.05),
    furCurl: bounded(0, 1, 0.05),
    furGravity: bounded(0, 1, 0.05),
    light: range(0, 2),
    rim: bounded(0, 2),
    backLight: range(0, 2),
    lightFront: bounded(0, 85, 1, '°'),
    shine: range(0, 2),
    sheen: range(0, 2),
    backSoftness: range(0, 2),
    spread: bounded(0.4, 2.5),
    turn: bounded(0, 2),
    whirl: bounded(0, 2),
    whirlSize: bounded(0.6, 1.6),
    whirlWidth: bounded(0.4, 2),
    whirlLength: bounded(0.4, 1.6),
    whirlTilt: bounded(0.5, 1.8),
    jumpHeight: range(0, 80, 1, 'px'),
    jumpTime: positive(0.2, 3, 0.01, 's'),
    jumpStretch: range(0.5, 2),
    jumpSquash: range(0.5, 2),
    jumpSquashTime: positive(0.05, 2, 0.01, 's'),
    jumpGroundTime: positive(0, 2, 0.01, 's'),
    jumpRiseTime: positive(0.05, 2, 0.01, 's'),
    jumpClickSquashTime: positive(0.05, 2, 0.01, 's'),
    jumpSpin: { ...positive(0, 5, 1), integer: true },
    jumpLean: range(-30, 30, 1, '°'),
    jumpEvery: range(0, 20, 0.5, 's'),
    jumpLand: range(-1, 1, 0.01, 's'),
  },
}

export function numberSpec(library: Library, name: string): NumberSpec | undefined {
  const spec = numeric[library.id]?.[name]
  if (library.id === 'metal' && library.component !== 'MetalFx' && name === 'strength')
    return range(0, 2)
  return spec
}

export function numberError(value: number, spec: NumberSpec): string | undefined {
  if (!Number.isFinite(value) || Math.abs(value) > 10000)
    return 'Use a finite number between −10000 and 10000.'
  if (spec.limitMin !== undefined && value < spec.limitMin)
    return `Use ${spec.limitMin} or greater.`
  if (spec.exclusiveMin && value === spec.limitMin)
    return `Use a number greater than ${spec.limitMin}.`
  if (spec.limitMax !== undefined && value > spec.limitMax) return `Use ${spec.limitMax} or less.`
  if (spec.integer && !Number.isInteger(value)) return 'Use a whole number.'
}

export function snapNumber(value: number, spec: NumberSpec): number {
  const clamped = Math.max(spec.min, Math.min(spec.max, value))
  return Number((spec.min + Math.round((clamped - spec.min) / spec.step) * spec.step).toFixed(6))
}

export function controlGroup(field: Field): ControlGroup {
  if (
    /^(state|active|paused|interactive|level|sensitivity|threshold|stream|autoReveal|processing)$/.test(
      field.name
    )
  )
    return 'Interaction'
  if (
    /^(speed|duration|flow|attack|release|idle|breathe|processing|hueDuration|jump|turn|whirl|reveal)/.test(
      field.name
    )
  )
    return 'Motion'
  return 'Appearance'
}

export function controlVisible(library: Library, field: Field, props: Props): boolean {
  if (library.id === 'avatars' && field.name.startsWith('fur'))
    return (props.shading ?? 'fabric') === 'fabric'
  if (library.id === 'voice') {
    if (['dotSize', 'dotGap', 'dotShape'].includes(field.name)) return props.look === 'dots'
    if (['lineWidth', 'lineGap', 'linePattern'].includes(field.name)) return props.look === 'lines'
  }
  return true
}

export function isColorField(field: Field): boolean {
  return (
    field.kind === 'string' &&
    ['color', 'ink', 'fill', 'accessoryColor', 'textColor', 'cardBg'].includes(field.name)
  )
}

export function booleanDefault(library: Library, name: string): boolean {
  return (
    (library.id === 'beam' && name === 'active') ||
    (library.id === 'voice' && ['active', 'bands'].includes(name)) ||
    (library.id === 'avatars' && name === 'interactive') ||
    (library.component === 'MetalFx' && name === 'normalizeHostStyles')
  )
}
