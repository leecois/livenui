type Validator = (value: unknown) => boolean
const number: Validator = (value) => typeof value === 'number' && Number.isFinite(value)
const string: Validator = (value) => typeof value === 'string'
const boolean: Validator = (value) => typeof value === 'boolean'
const oneOf =
  (...values: unknown[]): Validator =>
  (value) =>
    values.includes(value)
const union =
  (...validators: Validator[]): Validator =>
  (value) =>
    validators.some((check) => check(value))
const object =
  (fields: Record<string, Validator>, required: string[] = []): Validator =>
  (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const entries = value as Record<string, unknown>
    return (
      required.every((key) => Object.hasOwn(entries, key)) &&
      Object.entries(entries).every(
        ([key, child]) => Object.hasOwn(fields, key) && fields[key]?.(child)
      )
    )
  }
const numbers = (...keys: string[]) => Object.fromEntries(keys.map((key) => [key, number]))
const tuple =
  (length: number): Validator =>
  (value) =>
    Array.isArray(value) && value.length === length && value.every(number)
const array =
  (item: Validator): Validator =>
  (value) =>
    Array.isArray(value) && value.every(item)
const theme = oneOf('auto', 'light', 'dark')
const move = object(numbers('stiffness', 'damping', 'stretch', 'tail', 'force', 'bend', 'bendX'))
const evolve = object({
  ...numbers(
    'massStiffness',
    'massDamping',
    'sizeStiffness',
    'sizeDamping',
    'radiusStiffness',
    'radiusDamping',
    'contentBlur',
    'roundness',
    'cornerDuration',
    'cornerDelay',
    'anticipation',
    'travel'
  ),
  cornerEase: string,
})
const liquid: Record<string, Validator> = {
  effect: oneOf('morph', 'move', 'melt', 'bend'),
  morph: object({
    shape: boolean,
    ...numbers('speed', 'bounce', 'contentBlur'),
    advanced: object({ evolve, ...numbers('blobInset', 'bridgeGrow') }),
  }),
  move: object({ ...numbers('springiness', 'wobble', 'stretch', 'trail'), advanced: move }),
  bend: object({ ...numbers('vertical', 'horizontal'), advanced: move }),
  melt: object({
    ...numbers(
      'blur',
      'contrast',
      'reach',
      'fade',
      'warp',
      'mix',
      'mixBlur',
      'gravity',
      'waviness'
    ),
    src: string,
  }),
  dissolve: union(
    boolean,
    number,
    object({
      ...numbers(
        'blur',
        'warp',
        'pull',
        'range',
        'zone',
        'mix',
        'gravity',
        'taper',
        'warpFreq',
        'flowSpeed',
        'detail',
        'releaseMs',
        'fadeMs',
        'strength',
        'sink',
        'seamBlur'
      ),
      active: boolean,
      warpStyle: oneOf('fractalNoise', 'turbulence'),
      surface: oneOf('liquid', 'image'),
    })
  ),
  radius: union(number, tuple(4)),
  transition: union(
    oneOf('snappy', 'smooth', 'bouncy'),
    object(numbers('stiffness', 'damping', 'mass')),
    object({ duration: number, ease: string }, ['duration'])
  ),
}
const schemas: Record<string, Record<string, Validator>> = {
  ThinkingOrb: {
    opts: (value) =>
      !!value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.values(value).every(number),
    gravity: union(
      boolean,
      object({
        ...numbers(
          'reach',
          'strength',
          'deform',
          'taper',
          'curve',
          'falloff',
          'smoothing',
          'handover',
          'squash',
          'blur',
          'fadeMs'
        ),
        sprite: object({ src: string, ...numbers('width', 'height', 'hotX', 'hotY') }, [
          'src',
          'width',
          'height',
          'hotX',
          'hotY',
        ]),
      })
    ),
  },
  MetalFx: {
    innerShadow: union(boolean, object({ ...numbers('offsetY', 'blur', 'alpha'), color: string })),
  },
  MetalText: {
    theme,
    innerShadow: union(
      oneOf(null),
      object(numbers('offsetY', 'blur', 'alpha'), ['offsetY', 'blur', 'alpha'])
    ),
  },
  MetalBadge: {
    theme,
    core: object(numbers('r', 'blur', 'a', 'size'), ['r', 'blur', 'a', 'size']),
  },
  Liquid: liquid,
  VoiceBeam: {
    colors: array(string),
    bandColors: object({ core: string, above: string, mid: string, below: string }),
  },
  ImageGeneration: {
    colors: array(union(string, oneOf(null))),
    images: array((value) => typeof value === 'string' && !!value.trim()),
    revealDelayRange: tuple(2),
    revealInitialDelay: union(number, tuple(2)),
    revealHoldMs: union(number, tuple(2)),
  },
  BotAvatar: {
    size: union(number, string),
    pose: object(numbers('yaw', 'pitch', 'roll')),
  },
}

export function validateStructuredProp(component: string, key: string, value: unknown) {
  if (!schemas[component]?.[key]?.(value))
    throw new Error(`${key} has an incompatible value for ${component}.`)
}
