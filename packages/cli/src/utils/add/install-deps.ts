import fs from 'node:fs/promises'
import { confirm, isCancel, spinner } from '@clack/prompts'
import { resolveCommand } from 'package-manager-detector/commands'
import { x } from 'tinyexec'
import { getDeps } from '@/utils/add/get-deps'
import { getPackageManager } from '@/utils/get-package-manager'

export function createDependencyInstaller(
  options: {
    getInstalled?: typeof getDeps
    getManager?: typeof getPackageManager
    confirm?: typeof confirm
    spinner?: typeof spinner
    run?: (command: string, args: string[], options: { throwOnError: true }) => PromiseLike<unknown>
  } = {}
) {
  return async (deps: Record<string, string | null>, devDeps: Record<string, string | null>) => {
    const installed = await (options.getInstalled ?? getDeps)()
    const items = Object.entries(deps)
      .filter(([name]) => !installed.dependencies.has(name))
      .map(([name, version]) => {
        const spec = version ?? installed.devDependencies.get(name)
        return spec ? `${name}@${spec}` : name
      })
    const devItems = Object.entries(devDeps)
      .filter(
        ([name]) =>
          !Object.hasOwn(deps, name) &&
          !installed.dependencies.has(name) &&
          !installed.devDependencies.has(name)
      )
      .map(([name, version]) => (version ? `${name}@${version}` : name))
    if (!items.length && !devItems.length) return

    const manager = await (options.getManager ?? getPackageManager)()
    const value = await (options.confirm ?? confirm)({
      message: `Do you want to install with ${manager}?\n${[...items, ...devItems].map((item) => `- ${item}`).join('\n')}`,
    })
    if (isCancel(value) || !value) return

    const spin = (options.spinner ?? spinner)()
    const run = options.run ?? x
    const add = async (packages: string[]) => {
      const command = resolveCommand(manager, 'add', packages)
      if (!command) throw new Error(`Dependency installation is unsupported for ${manager}`)
      await run(command.command, command.args, { throwOnError: true })
    }
    spin.start('Installing dependencies...')
    try {
      if (items.length) {
        const promotions = Object.keys(deps).filter(
          (name) => !installed.dependencies.has(name) && installed.devDependencies.has(name)
        )
        if (manager !== 'npm' && manager !== 'pnpm' && promotions.length) {
          const original = await fs.readFile('package.json', 'utf8')
          const manifest = JSON.parse(original)
          manifest.dependencies ??= {}
          for (const name of promotions) {
            manifest.dependencies[name] = deps[name] ?? manifest.devDependencies[name]
            delete manifest.devDependencies[name]
          }
          await fs.writeFile('package.json', `${JSON.stringify(manifest, null, 2)}\n`)
          try {
            await add(items)
          } catch (error) {
            await fs.writeFile('package.json', original)
            throw error
          }
        } else {
          await add([...items, ...(manager === 'npm' || manager === 'pnpm' ? ['--save-prod'] : [])])
        }
      }
      if (devItems.length) await add([...devItems, '-D'])
      spin.stop('Dependencies installed.')
    } catch (error) {
      spin.stop('Dependency installation failed.')
      throw error
    }
  }
}

export const installDeps = createDependencyInstaller()
