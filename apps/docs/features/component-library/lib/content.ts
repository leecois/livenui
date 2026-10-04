import type { Library } from './config'
import { sourceInstallCommand } from './distribution'
import type { Example } from './examples'

type ComponentContent = {
  purpose: string
  description: string
  hint: string
  controls: string[]
}

export const libraryOrder = ['beam', 'orbs', 'avatars', 'gooey', 'voice', 'metal', 'image']

export const content: Record<string, ComponentContent> = {
  beam: {
    purpose: 'Draw attention',
    description:
      'Highlight a primary action, focused input or important card with a moving border.',
    hint: 'Try a shape and palette using the buttons inside the preview.',
    controls: ['size', 'colorVariant', 'duration', 'glowSize'],
  },
  orbs: {
    purpose: 'Show progress',
    description:
      'Make searching, listening and composing states visible with an animated particle orb.',
    hint: 'Change State to compare breathing, working and listening animations.',
    controls: ['state', 'size', 'speed', 'color'],
  },
  metal: {
    purpose: 'Emphasize actions',
    description: 'Add reflective rings, text or badges to an action, plan label or announcement.',
    hint: 'Choose Ring, Text or Badge. Move over the ring to bend its edge.',
    controls: ['preset', 'variant', 'strength', 'innerShadow', 'font', 'color', 'scale'],
  },
  gooey: {
    purpose: 'Add playful motion',
    description:
      'Give menus, sliders and draggable items a liquid surface that stretches and merges.',
    hint: 'Switch behavior below the preview, then click or drag the scene. Keyboard controls also work.',
    controls: ['blur', 'contrast', 'fill', 'waviness'],
  },
  voice: {
    purpose: 'Visualize audio',
    description:
      'Show speaking and listening activity with a glow, dots or wireframe driven by audio level.',
    hint: 'Try simulation first. Microphone input starts only when you choose it.',
    controls: ['type', 'look', 'colorVariant', 'level', 'strength'],
  },
  image: {
    purpose: 'Reveal images',
    description:
      'Transition an image from a pixel mosaic to a finished result with an animated reveal.',
    hint: 'Replay the reveal or change the preset to compare transitions.',
    controls: ['preset', 'strength', 'speed', 'autoReveal', 'pixelScale'],
  },
  avatars: {
    purpose: 'Express agent states',
    description:
      'Give an assistant a character that follows the pointer and responds to working or sleeping states.',
    hint: 'Move the pointer to change its gaze, click to hop, or choose a state below.',
    controls: ['type', 'state', 'shading', 'size', 'hat', 'glasses'],
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
