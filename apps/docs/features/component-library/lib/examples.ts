import { type Library, libraries, type Props, variantDefaults } from './config'
import { optionLabel } from './content'

export type Example = { id: string; library: string; name: string; variant: string; props: Props }

function example(
  library: Library,
  id: string,
  name: string,
  props: Props,
  variant = 'ring'
): Example {
  return {
    id: `${library.id}-${id}`,
    library: library.id,
    name,
    variant,
    props: { ...variantDefaults(library, variant), ...props },
  }
}

function series(library: Library, field: string, group: string) {
  const options = library.fields.find((item) => item.name === field)?.options || []
  return options.map((value) =>
    example(library, `${field}-${value}`, `${optionLabel(field, value)} ${group}`, {
      [field]: value,
    })
  )
}

export const examples: Example[] = libraries.flatMap((library) => {
  switch (library.id) {
    case 'beam':
      return [...series(library, 'size', 'beam'), ...series(library, 'colorVariant', 'palette')]
    case 'orbs':
      return series(library, 'state', 'orb')
    case 'metal':
      return [
        ...series(library, 'preset', 'metal'),
        example(library, 'text', 'Reflective text', {}, 'text'),
        example(library, 'badge', 'Liquid badge', {}, 'badge'),
      ]
    case 'gooey':
      return ['morph', 'move', 'melt', 'bend'].map((effect) =>
        example(library, effect, `${optionLabel('effect', effect)} shapes`, {
          item: { effect, radius: 999 },
        })
      )
    case 'voice':
      return [
        ...series(library, 'type', 'voice'),
        ...series(library, 'look', 'visualizer'),
        ...series(library, 'colorVariant', 'voice palette'),
      ]
    case 'image':
      return series(library, 'preset', 'reveal')
    case 'avatars':
      return [
        ...series(library, 'type', 'bot'),
        ...series(library, 'shading', 'material'),
        ...series(library, 'state', 'face'),
        ...series(library, 'hat', 'hat').filter((item) => item.props.hat !== 'none'),
        ...series(library, 'glasses', 'glasses').filter((item) => item.props.glasses !== 'none'),
        example(library, 'headphones', 'Headphone bot', { headphones: true }),
        example(library, 'bow-tie', 'Bow tie bot', { bowTie: true }),
      ]
    default:
      return []
  }
})

export function findExample(library: string, id?: string) {
  return examples.find((example) => example.library === library && example.id === id)
}

export const avatarContexts = libraries
  .filter((library) => library.id === 'avatars')
  .flatMap((library) => [
    {
      example: example(library, 'context-inbox', 'Inbox assistant', {
        type: 'star',
        state: 'working',
        size: 40,
      }),
      description: 'Sorting new messages',
      status: 'Working',
    },
    {
      example: example(library, 'context-research', 'Research assistant', {
        type: 'ghost',
        state: 'sleeping',
        size: 40,
      }),
      description: 'Ready for the next task',
      status: 'Sleeping',
    },
  ])
