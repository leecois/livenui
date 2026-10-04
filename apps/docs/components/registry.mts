import catalog from '../features/component-library/data/catalog.json'

export const registry = {
  name: 'livenui',
  components: catalog.map((library) => ({
    name: library.id,
    legacyName: library.package,
    title: library.name,
    description: library.description,
    source: `packages/${library.package}`,
    target: `components/livenui/${library.id}`,
  })),
}
