import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const feature = 'apps/docs/features/component-library'
const sdkNames = new Set([
  'border-beam',
  'thinking-orbs',
  'metal-fx',
  'liquid-gooey',
  'voice-glow',
  'img-fx',
  'bot-avatars',
])
const errors: string[] = []

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries
      .filter((entry) => !['dist', 'node_modules', '.next'].includes(entry.name))
      .map((entry) => {
        const path = join(directory, entry.name)
        return entry.isDirectory() ? files(path) : Promise.resolve([path])
      })
  )
  return nested.flat()
}

function imports(path: string, source: string) {
  const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
  return parsed.statements
    .filter(ts.isImportDeclaration)
    .flatMap((node) =>
      ts.isStringLiteral(node.moduleSpecifier)
        ? [{ target: node.moduleSpecifier.text, typeOnly: Boolean(node.importClause?.isTypeOnly) }]
        : []
    )
}

const workspaces = new Map<string, { path: string; dependencies: Record<string, string> }>()
for (const parent of ['apps', 'packages']) {
  for (const directory of await readdir(parent, { withFileTypes: true })) {
    if (!directory.isDirectory()) continue
    const path = join(parent, directory.name)
    const manifest = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'))
    if (workspaces.has(manifest.name)) errors.push(`Duplicate workspace ${manifest.name}`)
    workspaces.set(manifest.name, {
      path,
      dependencies: {
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      },
    })
  }
}
const graph = new Map<string, string[]>()
for (const [name, workspace] of workspaces) {
  const dependencies = []
  for (const [dependency, version] of Object.entries(workspace.dependencies)) {
    if (!version.startsWith('workspace:')) continue
    if (!workspaces.has(dependency)) errors.push(`${name}: unknown workspace ${dependency}`)
    dependencies.push(dependency)
    if (
      workspace.path.startsWith('packages/') &&
      workspaces.get(dependency)?.path.startsWith('apps/')
    )
      errors.push(`${name}: packages must not depend on applications`)
  }
  graph.set(name, dependencies)
}
function visit(name: string, chain: string[]) {
  if (chain.includes(name)) {
    errors.push(`Workspace cycle: ${[...chain, name].join(' -> ')}`)
    return
  }
  for (const dependency of graph.get(name) || []) visit(dependency, [...chain, name])
}
for (const name of workspaces.keys()) visit(name, [])

for (const path of await files(feature)) {
  if (!/\.(ts|tsx)$/.test(path)) continue
  const layer = relative(feature, path).split('/')[0]
  const source = await readFile(path, 'utf8')
  for (const entry of imports(path, source)) {
    if (sdkNames.has(entry.target) && layer !== 'previews')
      errors.push(`${path}: SDK runtime imports belong in previews`)
    if (layer === 'lib' && !entry.target.startsWith('.') && !entry.typeOnly)
      errors.push(`${path}: domain logic must not import runtime frameworks`)
    if (entry.target.startsWith('.')) {
      const destination = relative(resolve(feature), resolve(dirname(path), entry.target)).split(
        '/'
      )[0]
      if (layer === 'lib' && !['lib', 'data'].includes(destination))
        errors.push(`${path}: domain import crosses into ${destination}`)
      if (layer === 'hooks' && !['hooks', 'lib'].includes(destination))
        errors.push(`${path}: hook import crosses into ${destination}`)
      if (layer === 'components' && destination === 'hooks' && !entry.typeOnly)
        errors.push(`${path}: panels receive state; do not create sessions`)
    }
  }
}
for (const path of await files('packages/agent-ui/src')) {
  if (!/\.(ts|tsx)$/.test(path)) continue
  for (const { target } of imports(path, await readFile(path, 'utf8'))) {
    if (target !== 'react' && !target.startsWith('.'))
      errors.push(`${path}: foundation must remain independent of application and SDKs`)
  }
}

const documents = [
  ...(await readdir(root)).filter((path) => path.endsWith('.md')),
  ...(await files('docs')).filter((path) => path.endsWith('.md')),
  ...(await files('packages')).filter((path) => path.endsWith('.md')),
]
for (const path of documents) {
  const source = await readFile(path, 'utf8')
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0]
    if (!target || /^[a-z]+:/i.test(target)) continue
    const destination = resolve(dirname(join(root, path)), target)
    if (!destination.startsWith(`${root}/`))
      errors.push(`${path}: documentation link leaves repository: ${target}`)
    else if (!(await stat(destination).catch(() => null)))
      errors.push(`${path}: broken link ${target}`)
  }
}
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else
  console.log(
    `Architecture: ${workspaces.size} workspaces, no cycles, valid feature boundaries and ${documents.length} linked documents`
  )
