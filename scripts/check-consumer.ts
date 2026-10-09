import assert from 'node:assert/strict'
import { cp, lstat, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { type Browser, chromium, expect } from '@playwright/test'
import { productionPreview, runLogged } from './lib/production-preview'

const cases = [
  {
    id: 'beam',
    props: { size: 'sm', colorVariant: 'sunset', duration: 2, active: true },
    selector: '[data-beam][data-active]',
  },
  {
    id: 'orbs',
    props: { state: 'listening', size: 64, speed: 1.5, color: '#38bdf8', paused: true },
    selector: 'canvas',
  },
  {
    id: 'metal',
    props: { preset: 'silver', variant: 'circle', strength: 0.6, paused: true },
    selector: '.metal-fx-root canvas',
  },
  {
    id: 'gooey',
    props: { blur: 8, contrast: 20, item: { effect: 'bend' } },
    selector: '[data-gooey-svg]',
  },
  {
    id: 'voice',
    props: {
      type: 'default',
      look: 'glow',
      colorVariant: 'ocean',
      level: 0.65,
      paused: true,
      active: true,
    },
    selector: '[data-voice-beam] canvas',
  },
  {
    id: 'image',
    props: {
      preset: 'pixels-organic',
      strength: 0.8,
      speed: 1.5,
      images: ['/agent-images/prism-garden.webp'],
      autoReveal: true,
      paused: false,
    },
    selector: '.image-gen-root canvas',
  },
  {
    id: 'avatars',
    props: { type: 'connector', state: 'default', shading: 'fabric', size: 96, paused: true },
    selector: 'canvas',
  },
]

await mkdir('tmp', { recursive: true })
const artifacts = await mkdtemp(resolve('tmp/consumer-'))
const project = join(artifacts, 'react-app')
await mkdir(project)
const manifest = JSON.parse(await readFile('package.json', 'utf8'))
await writeFile(
  join(project, 'package.json'),
  JSON.stringify(
    {
      name: 'livenui-consumer-check',
      private: true,
      type: 'module',
      dependencies: {
        react: manifest.devDependencies.react,
        'react-dom': manifest.devDependencies['react-dom'],
      },
      devDependencies: {
        typescript: manifest.devDependencies.typescript,
        '@types/react': manifest.devDependencies['@types/react'],
        '@types/react-dom': manifest.devDependencies['@types/react-dom'],
      },
    },
    null,
    2
  )
)
await writeFile(
  join(project, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        noEmit: true,
        paths: { '@/*': ['./*'] },
        types: ['react', 'react-dom'],
        typeRoots: ['./node_modules/@types'],
      },
      include: ['**/*.tsx', 'components/**/*.ts'],
    },
    null,
    2
  )
)
await writeFile(
  join(project, 'components.json'),
  JSON.stringify(
    {
      style: 'new-york',
      rsc: false,
      tsx: true,
      tailwind: { css: 'styles.css', baseColor: 'neutral', cssVariables: true },
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui',
        lib: '@/lib',
        hooks: '@/hooks',
      },
    },
    null,
    2
  )
)
await writeFile(join(project, 'styles.css'), '')
console.log(`Consumer artifacts: ${artifacts}`)
const preview = await productionPreview(artifacts)
let browser: Browser | undefined
let consumer: ReturnType<typeof Bun.serve> | undefined
try {
  browser = await chromium.launch({
    channel: Bun.env.LIVENUI_BROWSER_CHANNEL || 'chrome',
    args: ['--enable-unsafe-swiftshader'],
  })
  await runLogged(
    ['npm', 'install', '--no-audit', '--no-fund'],
    project,
    join(artifacts, 'dependencies.log')
  )
  assert.equal((await lstat(join(project, 'node_modules'))).isSymbolicLink(), false)
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: async (text: string) => Reflect.set(window, 'copiedText', text) },
    })
  })
  const records: {
    id: string
    command: string
    executed: string[]
    snippet: string
    files: number
  }[] = []
  for (const item of cases) {
    await page.goto(`${preview.origin}/studio?library=${item.id}`)
    await page.getByRole('button', { name: 'Edit JSON', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Edit component props', exact: true })
      .fill(JSON.stringify(item.props))
    await page.getByRole('button', { name: 'Apply configuration', exact: true }).click()
    await page.getByRole('tab', { name: 'Code', exact: true }).click()
    const panel = page.locator('.code-panel')
    await panel.getByRole('button', { name: 'Copy snippet', exact: true }).click()
    const snippet: string = await page.evaluate(() => Reflect.get(window, 'copiedText'))
    assert.equal(snippet, await panel.locator('code').textContent())
    assert.ok(snippet.includes(`@/components/livenui/${item.id}`))
    for (const [name, value] of Object.entries(item.props)) {
      assert.ok(
        snippet.includes(
          name === 'item' ? JSON.stringify(value) : `${name}={${JSON.stringify(value)}}`
        ),
        `Copied configuration omitted ${item.id}.${name}`
      )
    }
    await page
      .locator('.install-panel')
      .getByRole('button', { name: 'Copy command', exact: true })
      .click()
    const command: string = await page.evaluate(() => Reflect.get(window, 'copiedText'))
    assert.equal(command, `npx shadcn@latest add https://livenui.dev/r/${item.id}.json`)
    const url = `${preview.origin}/r/${item.id}.json`
    const response = await fetch(url)
    assert.equal(response.status, 200)
    const registry = (await response.json()) as {
      files: { target: string; content: string }[]
      dependencies?: string[]
      devDependencies?: string[]
    }
    const executed = ['npx', '--yes', 'shadcn@latest', 'add', url, '--yes']
    await runLogged(executed, project, join(artifacts, `install-${item.id}.log`))
    for (const file of registry.files) {
      const installed = await readFile(
        join(project, file.target.replace('@components/', 'components/')),
        'utf8'
      )
      assert.equal(
        installed.trim(),
        (file.target === `@components/livenui/${item.id}.tsx`
          ? file.content.replace(/^'use client'\n\n/, '')
          : file.content
        ).trim(),
        `Installed payload changed: ${file.target}`
      )
    }
    const split = snippet.lastIndexOf('\n\n')
    const source = snippet.includes('export function MetalAction')
      ? `${snippet}\nexport default MetalAction\n`
      : `${snippet.slice(0, split)}\n\nexport default function Example() { return (${snippet.slice(split).trim()}) }\n`
    const entry = join(project, `${item.id}.tsx`)
    await writeFile(entry, source)
    records.push({ id: item.id, command, executed, snippet, files: registry.files.length })
    console.log(
      `${item.id}: copied configuration installed; ${registry.files.length} source/legal files verified`
    )
  }
  const installed = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'))
  for (const dependency of ['three', '@paper-design/shaders']) {
    assert.ok(installed.dependencies[dependency], `Missing consumer runtime: ${dependency}`)
    assert.equal((await lstat(join(project, 'node_modules', dependency))).isSymbolicLink(), false)
  }
  assert.ok(installed.devDependencies['@types/three'])
  assert.ok(!JSON.stringify(installed).includes('workspace:'))
  const componentName = (id: string) => id[0].toUpperCase() + id.slice(1)
  await writeFile(
    join(project, 'main.tsx'),
    `import { createRoot } from 'react-dom/client'\n${cases.map((item) => `import ${componentName(item.id)} from './${item.id}'`).join('\n')}\ncreateRoot(document.getElementById('root')!).render(<main>${cases.map((item) => `<section id="${item.id}"><h2>${item.id}</h2><${componentName(item.id)} /></section>`).join('')}</main>)\n`
  )
  await runLogged(
    ['npx', '--no-install', 'tsc', '--noEmit'],
    project,
    join(artifacts, 'typecheck.log')
  )
  const result = await Bun.build({
    entrypoints: [join(project, 'main.tsx')],
    target: 'browser',
    outdir: join(project, 'dist'),
    minify: true,
    metafile: true,
  })
  if (!result.success) throw new AggregateError(result.logs, 'Fresh consumer bundle failed')
  assert.ok(result.metafile)
  for (const input of Object.keys(result.metafile.inputs)) {
    assert.ok(
      resolve(input).startsWith(`${project}/`),
      `Bundle escaped the independent consumer: ${input}`
    )
  }
  await writeFile(
    join(artifacts, 'bundle-inputs.json'),
    JSON.stringify(result.metafile.inputs, null, 2)
  )
  await cp('apps/docs/public/agent-images', join(project, 'dist/agent-images'), { recursive: true })
  await writeFile(
    join(project, 'dist/index.html'),
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Liven UI consumer check</title><style>:root{--gradient-accent:linear-gradient(135deg,#2563eb,#4f21e9)}body{margin:0;background:#181818;color:#fafafa;font:16px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;padding:24px}section{min-height:280px;padding:24px;border:1px solid #333;border-radius:24px}h2{font-size:16px}button{padding:16px;border:0;border-radius:999px;background:var(--gradient-accent);color:white}</style><div id="root"></div><script type="module" src="/main.js"></script></html>'
  )
  consumer = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) {
      const pathname = new URL(request.url).pathname
      const file = Bun.file(join(project, 'dist', pathname === '/' ? 'index.html' : pathname))
      return file
        .exists()
        .then((exists) => (exists ? new Response(file) : new Response(null, { status: 404 })))
    },
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const imageResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/agent-images/prism-garden.webp'
  )
  await page.goto(`http://127.0.0.1:${consumer.port}`)
  assert.equal((await imageResponse).status(), 200)
  for (const item of cases) {
    const section = page.locator(`#${item.id}`)
    await section.scrollIntoViewIfNeeded()
    const renderer = section.locator(item.selector).first()
    await expect(renderer).toBeVisible()
    await section.screenshot({ path: join(artifacts, `consumer-${item.id}.png`) })
  }
  assert.deepEqual(errors, [])
  await page.screenshot({ path: join(artifacts, 'consumer-full-page.png'), fullPage: true })
  await writeFile(
    join(artifacts, 'result.json'),
    JSON.stringify(
      { browser: browser.version(), records, installed, errors, rootDependencyLink: false },
      null,
      2
    )
  )
  console.log(
    'PASS: seven copied integrations typechecked, bundled and rendered with independently installed dependencies'
  )
} finally {
  consumer?.stop(true)
  try {
    await browser?.close()
  } finally {
    await preview.stop()
  }
}
