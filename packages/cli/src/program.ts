import { Command } from 'commander'
import { add } from '@/commands/add'
import { createOrLoadConfig } from '@/config'
import { localResolver, type Resolver, remoteResolver } from '@/utils/add/install-component'
import packageJson from '../package.json'

const dirShortcuts: Record<string, string> = {
  ':dev': 'http://localhost:3000/registry',
  ':localhost': 'http://localhost:3000/registry',
}

export function createProgram(
  options: { add?: typeof add; loadConfig?: typeof createOrLoadConfig } = {}
) {
  const program = new Command()
    .name('livenui')
    .description('CLI to install Liven UI components')
    .version(packageJson.version)
    .option('--config <string>')

  program
    .command('add')
    .description('add a new component to your docs')
    .argument('[components...]', 'components to download')
    .option('--dir <string>', 'the root url or directory to resolve registry')
    .action(async (input: string[], _options: unknown, command: Command) => {
      const selected = command.optsWithGlobals<{ config?: string; dir?: string }>()
      const resolver = getResolverFromDir(selected.dir)
      await (options.add ?? add)(
        input,
        resolver,
        await (options.loadConfig ?? createOrLoadConfig)(selected.config)
      )
    })

  return program
}

function getResolverFromDir(dir = 'http://localhost:3000/registry'): Resolver {
  const source = Object.hasOwn(dirShortcuts, dir) ? dirShortcuts[dir] : dir
  return source.startsWith('http://') || source.startsWith('https://')
    ? remoteResolver(source)
    : localResolver(source)
}
