import catalog from '../data/catalog.json'
import { registryOrigin, sourceImport, sourceInstallCommand } from './distribution'
import { meltDemoImages } from './media'
import { validateOrbConfiguration } from './orb-limits'
import { validateStructuredProp } from './structured-props'

export type Props = Record<string, unknown>
export type Field = {
  name: string
  type: string
  description: string
  kind: string
  options: (string | number)[]
  optional: boolean
}
export type Library = {
  id: string
  name: string
  package: string
  component: string
  tagline: string
  description: string
  engine: string
  version: string
  fields: Field[]
  variants: { id: string; component: string; fields: Field[] }[]
  itemFields: Field[]
}
export type Preset = { id: string; library: string; name: string; props: Props; variant: string }

export const libraries: Library[] = catalog
export const defaults: Record<string, Props> = {
  beam: { size: 'md', colorVariant: 'ocean', duration: 4 },
  orbs: { state: 'working', size: 64, speed: 1 },
  metal: {
    preset: 'chromatic',
    variant: 'circle',
    strength: 0.81,
    innerShadow: true,
    normalizeHostStyles: false,
  },
  gooey: {
    blur: 6,
    contrast: 18,
    fill: 'color-mix(in srgb, var(--surface, Canvas) 92%, var(--foreground, CanvasText))',
  },
  voice: { type: 'default', look: 'glow', colorVariant: 'ocean', level: 0.5 },
  image: { preset: 'pixels-organic', strength: 1, speed: 1, autoReveal: true },
  avatars: { type: 'clover', state: 'default', shading: 'fabric', size: 96 },
}

export function configuredLibrary(library: Library, variant = 'ring'): Library {
  const component = library.variants.find((item) => item.id === variant)
  return component
    ? { ...library, component: component.component, fields: component.fields }
    : library
}

export function variantDefaults(library: Library, variant: string): Props {
  if (library.id === 'metal' && variant === 'text')
    return { font: '500 24px/1.2 system-ui', color: 'var(--foreground)', strength: 0.9 }
  if (library.id === 'metal' && variant === 'badge') return { scale: 1, strength: 0.9 }
  return { ...defaults[library.id] }
}

export function isCodeOnlyProp(library: Library, key: string): boolean {
  return (
    ['stream', 'audio', 'frame', 'excludeSrcs', 'reflectionTargets', 'mask'].includes(key) ||
    (library.id === 'gooey' && key === 'filter')
  )
}

export function parseProps(text: string, library: Library): Props {
  const props: unknown = JSON.parse(text)
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    throw new Error('Use a JSON object of component props.')
  }
  const result = props as Props
  const inspect = (value: unknown, depth = 0): void => {
    if (depth > 8) throw new Error('Configuration is too deeply nested.')
    if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > 10000))
      throw new Error('Use finite numbers within the playground limit of 10000.')
    if (value && typeof value === 'object') {
      if (Object.keys(value).length > 256) throw new Error('Configuration has too many values.')
      for (const [key, child] of Object.entries(value)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key))
          throw new Error(`Unsupported key: ${key}`)
        inspect(child, depth + 1)
      }
    }
  }
  inspect(result)
  for (const [key, value] of Object.entries(result)) {
    const field = library.fields.find((item) => item.name === key)
    if (!field) throw new Error(`Unknown prop: ${key}`)
    if (field.kind === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new Error(`${key} must be a finite number.`)
    }
    if (field.kind === 'boolean' && typeof value !== 'boolean') {
      throw new Error(`${key} must be true or false.`)
    }
    if (field.kind === 'string' && typeof value !== 'string') {
      throw new Error(`${key} must be a string.`)
    }
    if (field.kind === 'select' && !field.options.some((option) => option === value)) {
      throw new Error(`${key} must be one of: ${field.options.join(', ')}.`)
    }
    if (typeof value === 'number' && Math.abs(value) > 10000) {
      throw new Error(`${key} exceeds the playground limit of 10000.`)
    }
    if (isCodeOnlyProp(library, key)) {
      if (library.id === 'gooey' && key === 'filter')
        throw new Error(
          'filter requires application code and cannot be imported into the playground.'
        )
      throw new Error(`${key} requires an application reference; use it in your code instead.`)
    }
    if (
      key === 'images' &&
      (!Array.isArray(value) || !value.every((item) => typeof item === 'string' && item.trim()))
    )
      throw new Error('images must be an array of non-empty image paths.')
    if (key === 'item') {
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('item must be an object of Liquid.Item props.')
      parseProps(JSON.stringify(value), { ...library, fields: library.itemFields, itemFields: [] })
      const effect = (value as Props).effect
      if (effect !== undefined && !['morph', 'move', 'melt', 'bend'].includes(String(effect)))
        throw new Error('Unknown liquid effect.')
    } else if (field.kind === 'json') {
      validateStructuredProp(library.component, key, value)
    }
  }
  if (library.id === 'orbs') validateOrbConfiguration(result)
  return result
}

export function parseConfiguration(text: string, library: Library, fallbackVariant = 'ring') {
  if (new TextEncoder().encode(text).byteLength > 65536)
    throw new Error('Use a configuration smaller than 64 KB.')
  const data: unknown = JSON.parse(text)
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Invalid configuration file.')
  const envelope = data as Props
  if (envelope.library !== undefined && envelope.library !== library.id)
    throw new Error('Open the matching library before importing this configuration.')
  const variant =
    envelope.props !== undefined && typeof envelope.variant === 'string'
      ? envelope.variant
      : fallbackVariant
  if (!library.variants.some((item) => item.id === variant))
    throw new Error('Unknown component variant.')
  if (envelope.props !== undefined) {
    for (const key of Object.keys(envelope))
      if (!['library', 'component', 'variant', 'props'].includes(key))
        throw new Error(`Unsupported configuration key: ${key}`)
  }
  const props = parseProps(
    JSON.stringify(envelope.props ?? envelope),
    configuredLibrary(library, variant)
  )
  return { props, variant }
}

export function studioHref(library: Library, props: Props, variant: string) {
  const configuration = JSON.stringify({ library: library.id, variant, props })
  parseConfiguration(configuration, library)
  return `/studio?library=${library.id}#${new URLSearchParams({ config: configuration })}`
}

export function snippet(library: Library, props: Props): string {
  const { item, ...groupProps } = props
  const attributes = Object.entries(groupProps)
    .filter(([key]) => !(library.id === 'image' && key === 'images'))
    .filter(([key]) => !(library.component === 'MetalFx' && key === 'style'))
    .map(([key, value]) => `  ${key}={${JSON.stringify(value)}}`)
    .join('\n')
  const start = `import { ${library.component} } from '${sourceImport(library)}'\n\n`
  if (library.id === 'orbs' || library.id === 'avatars') {
    return `${start}<${library.component}\n${attributes}\n/>`
  }
  if (library.id === 'gooey') {
    const itemProps = { effect: 'morph', ...(item as Props) }
    if (itemProps.effect === 'melt') {
      return `${start}<Liquid\n${attributes}\n>\n  ${meltDemoImages.map(({ src, alt }) => `<Liquid.Item {...${JSON.stringify(itemProps)}}>\n    <img src="${new URL(src, registryOrigin).href}" alt="${alt}" style={{ width: 84, height: 84, borderRadius: 24 }} />\n  </Liquid.Item>`).join('\n  ')}\n</Liquid>`
    }
    return `${start}<Liquid\n${attributes}\n>\n  <Liquid.Item {...${JSON.stringify(itemProps)}}>\n    <button type="button">Your content</button>\n  </Liquid.Item>\n</Liquid>`
  }
  if (library.component === 'MetalText' || library.component === 'MetalBadge')
    return `${start}<${library.component}\n${attributes}\n>\n  ${library.component === 'MetalText' ? 'Pro' : 'New'}\n</${library.component}>`
  if (library.id === 'metal') {
    const circle = props.variant === 'circle'
    const host = {
      height: 40,
      ...(circle ? { width: 40 } : { padding: '0 20px' }),
      border: 0,
      borderRadius: 999,
      background:
        'var(--gradient-accent, linear-gradient(120deg, hsl(220 91% 54%), hsl(250 80% 54%)))',
      color: 'white',
    }
    const style = { ...(props.style as Record<string, unknown>), background: 'transparent' }
    return `import { useCallback, useRef } from 'react'\nimport { BEND_DEFAULTS, MetalFx, useMetalBend } from '${sourceImport(library)}'\n\nexport function MetalAction() {\n  const ring = useRef<HTMLDivElement>(null)\n  const getBend = useCallback(() => ({ ...BEND_DEFAULTS, enabled: ${props.paused !== true} }), [])\n  useMetalBend(ring, getBend)\n  return (\n    <MetalFx\n${attributes.replace(/^ {2}/gm, '      ')}\n      ref={ring}\n      style={${JSON.stringify(style)}}\n    >\n      <button type="button" aria-label="Create" style={${JSON.stringify(host)}}>${circle ? '↗' : 'Create'}</button>\n    </MetalFx>\n  )\n}`
  }
  if (library.id === 'image') {
    return `${start}<ImageGeneration\n${attributes}\n  images={${JSON.stringify(props.images ?? ['/your-image.jpg'])}}\n>\n  <div style={{ width: 320, height: 240 }} />\n</ImageGeneration>`
  }
  return `${start}<${library.component}\n${attributes}\n>\n  <button type="button">Your content</button>\n</${library.component}>`
}

export function prompt(library: Library, props: Props, origin?: string): string {
  return `Integrate ${library.component} into my React application.\n\nInstall Liven UI source: ${sourceInstallCommand(library, 'npm', origin)}\nThe registry copies editable source into components/livenui; it does not install an upstream effect SDK. Requires React 18 or newer. Keep my markup, accessibility and existing design tokens.\n\n${snippet(library, props)}\n\nProps:\n${library.fields.map((field) => `${field.name}: ${field.type}. ${field.description}`).join('\n')}\n\nKeep theme synchronized with the application. Respect reduced motion. Clean up renderers and microphone tracks on unmount.`
}

export function readPresets(storage: Pick<Storage, 'getItem'>): Preset[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem('livenui-presets') || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((value) => {
      if (
        !value ||
        typeof value !== 'object' ||
        typeof value.name !== 'string' ||
        typeof value.id !== 'string'
      )
        return []
      const library = libraries.find((item) => item.id === value.library)
      if (!library) return []
      try {
        const variant = typeof value.variant === 'string' ? value.variant : 'ring'
        if (!library.variants.some((item) => item.id === variant)) return []
        return [
          {
            id: value.id,
            library: library.id,
            name: value.name,
            props: parseProps(JSON.stringify(value.props), configuredLibrary(library, variant)),
            variant,
          },
        ]
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}
