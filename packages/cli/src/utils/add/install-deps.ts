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
    const toList = (dependencies: Record<string, string | null>) =>
      Object.entries(dependencies)
        .filter(([name]) => !installed.has(name))
        .map(([name, version]) => (!version ? name : `${name}@${version}`))
    const items = toList(deps)
    const devItems = toList(devDeps)
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
      if (items.length) await add(items)
      if (devItems.length) await add([...devItems, '-D'])
      spin.stop('Dependencies installed.')
    } catch (error) {
      spin.stop('Dependency installation failed.')
      throw error
    }
  }
}

export const installDeps = createDependencyInstaller()
