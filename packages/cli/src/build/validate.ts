import path from 'node:path'
import type { Output, OutputComponent } from '@/registry/schema'
import { registryPath } from '@/utils/paths'

export function validateOutput(registry: Output) {
  function validateComponent(
    comp: OutputComponent,
    ctx: {
      stack?: Map<string, Set<string>>
      ancestors?: Set<string>
      visited?: Set<string>
    } = {}
  ) {
    const {
      stack = new Map<string, Set<string>>(),
      ancestors = new Set<string>(),
      visited = new Set<string>(),
    } = ctx
    if (ancestors.has(comp.name))
      throw new Error(`Circular registry dependency: ${comp.name}`)
    if (visited.has(comp.name)) return
    ancestors.add(comp.name)

    for (const file of comp.files) {
      const parents = stack.get(file.path)

      if (parents) {
        parents.add(comp.name)
      } else {
        stack.set(file.path, new Set([comp.name]))
      }
    }

    for (const name of comp.subComponents) {
      const subComp = registry.components.find((item) => item.name === name)
      if (!subComp) {
        console.warn(`skipped component ${name}: not found`)
        continue
      }

      validateComponent(subComp, {
        stack,
        ancestors,
        visited,
      })
    }
    ancestors.delete(comp.name)
    visited.add(comp.name)

    for (const file of comp.files) {
      const parents = stack.get(file.path)
      if (!parents) continue
      if (parents.size <= 1) continue

      throw new Error(
        `Duplicated file in same component ${Array.from(parents).join(', ')}: ${file.path}`
      )
    }
  }

  const compSet = new Set<string>()
  for (const comp of registry.components) {
    const name = path.posix.normalize(registryPath(comp.name))
    if (compSet.has(name))
      throw new Error(`duplicated component name ${comp.name}`)
    compSet.add(name)

    validateComponent(comp)
  }
}
