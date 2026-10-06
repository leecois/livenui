import type { Library } from './config'
import { sourceInstallCommand } from './distribution'
import type { Example } from './examples'

type ComponentContent = {
  purpose: string
  description: string
  hint: string
  controls: string[]
  labels?: Record<string, string>
  choices?: Record<string, (string | number)[]>
  featured: string[]
  integration?: string
}

export const libraryOrder = ['beam', 'orbs', 'avatars', 'gooey', 'voice', 'metal', 'image']

export const content: Record<string, ComponentContent> = {
  beam: {
    purpose: 'Draw attention',
    description:
      'Highlight a primary action, focused input or important card with a moving border.',
    hint: 'Change Style and Color variant, then press Play to compare the border.',
    controls: ['size', 'colorVariant', 'duration', 'glowSize'],
    labels: { size: 'Style' },
    featured: ['beam-size-md', 'beam-size-line', 'beam-size-pulse-outside'],
  },
  orbs: {
    purpose: 'Show progress',
    description:
      'Make searching, listening and composing states visible with an animated particle orb.',
    hint: 'Change State to compare breathing, working and listening animations.',
    controls: ['state', 'size', 'speed', 'color'],
    featured: ['orbs-state-searching', 'orbs-state-listening', 'orbs-state-composing'],
  },
  metal: {
    purpose: 'Emphasize actions',
    description: 'Add reflective rings, text or badges to an action, plan label or announcement.',
    hint: 'Choose Ring, Text or Badge. Move over the ring to bend its edge.',
    controls: ['preset', 'variant', 'strength', 'innerShadow', 'font', 'color', 'scale'],
    featured: ['metal-preset-chromatic', 'metal-text', 'metal-badge'],
    integration:
      'Keep normalizeHostStyles={false} to preserve your gradient or background. Use useMetalBend with the component reference to enable pointer deformation.',
  },
  gooey: {
    purpose: 'Add playful motion',
    description:
      'Give menus, sliders and draggable items a liquid surface that stretches and merges.',
    hint: 'Switch behavior below the preview, then click or drag the scene. Keyboard controls also work.',
    controls: ['blur', 'contrast', 'fill', 'waviness'],
    featured: ['gooey-morph', 'gooey-move', 'gooey-bend'],
    integration:
      'Keep the child background transparent so the liquid surface can stretch around crisp text and icons. Apply your background to the liquid surface instead.',
  },
  voice: {
    purpose: 'Visualize audio',
    description:
      'Show speaking and listening activity with a glow, dots or wireframe driven by audio level.',
    hint: 'Press Play, then try simulation. Choose Use microphone for live input.',
    controls: ['type', 'look', 'colorVariant', 'level', 'strength'],
    featured: ['voice-look-glow', 'voice-look-dots', 'voice-look-lines'],
  },
  image: {
    purpose: 'Reveal images',
    description:
      'Transition an image from a pixel mosaic to a finished result with an animated reveal.',
    hint: 'Replay the reveal or change the preset to compare transitions.',
    controls: ['preset', 'strength', 'speed', 'autoReveal', 'pixelScale'],
    featured: [
      'image-preset-pixels-organic',
      'image-preset-pixels-mechanic',
      'image-preset-sweep-gradient',
    ],
  },
  avatars: {
    purpose: 'Express agent states',
    description:
      'Give an assistant a character that follows the pointer and responds to working or sleeping states.',
    hint: 'Try an agent mascot or choose another shape. Move the pointer to change its gaze; click to hop.',
    controls: ['type', 'state', 'shading', 'size'],
    labels: { type: 'Shape', state: 'Activity', shading: 'Material' },
    choices: {
      size: [32, 64, 96],
      state: ['default', 'working', 'sleeping'],
      shading: ['fabric', 'plastic', 'crisp', 'smooth', 'flat'],
    },
    featured: [
      'avatars-type-arrowhead',
      'avatars-type-chat',
      'avatars-type-connector',
      'avatars-type-bulb',
    ],
    integration:
      'Use arrowhead for discovery, chat for conversation, connector for coordination and bulb for research. These native shapes share all materials, states and interactions; no image assets are required.',
  },
}

export function matchesSearch(query: string, ...values: string[]): boolean {
  const text = values.join(' ').toLowerCase()
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word))
}

export function orderExamples(items: Example[]) {
  const groups = libraryOrder.map((id) => items.filter((item) => item.library === id))
  return Array.from({ length: Math.max(...groups.map((group) => group.length)) }, (_, index) =>
    groups.flatMap((group) => (group[index] ? [group[index]] : []))
  ).flat()
}

export function searchExamples(
  items: Example[],
  libraries: Library[],
  library: string,
  query: string
) {
  return items.filter((item) => {
    const source = libraries.find((source) => source.id === item.library)
    return (
      source &&
      (library === 'all' || item.library === library) &&
      matchesSearch(
        query,
        item.name,
        source.name,
        source.package,
        source.variants.find((variant) => variant.id === item.variant)?.component ||
          source.component,
        content[source.id].purpose,
        content[source.id].description,
        item.variant
      )
    )
  })
}

export function installCommand(library: Library, manager: 'npm' | 'pnpm' | 'bun', origin?: string) {
  return sourceInstallCommand(library, manager, origin)
}

export function fieldLabel(name: string) {
  const words = name.replace(/([a-z])([A-Z])/g, '$1 $2')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function optionLabel(field: string, value: string | number) {
  if (typeof value === 'number') return field === 'size' ? `${value}px` : String(value)
  if (field === 'state' && value === 'default') return 'Idle'
  const labels: Record<string, string> = {
    sm: 'Small',
    md: 'Medium',
    'pulse-outside': 'Outer pulse',
    'pulse-inner': 'Inner pulse',
    'pixels-organic': 'Organic pixels',
    'pixels-mechanic': 'Mechanical pixels',
    'sweep-gradient': 'Gradient sweep',
  }
  return labels[value] || fieldLabel(value.replaceAll('-', ' '))
}
