import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'
import {
  configuredLibrary,
  defaults,
  libraries,
  parseConfiguration,
  parseProps,
  readPresets,
  snippet,
  studioHref,
  variantDefaults,
} from '../apps/docs/features/component-library/lib/config'

function libraryFor(id: string) {
  const library = libraries.find((item) => item.id === id)
  if (!library) throw new Error(`Missing fixture: ${id}`)
  return library
}
const orb = libraryFor('orbs')
const metal = libraryFor('metal')
const gooey = libraryFor('gooey')

describe('configuration import and export', () => {
  test('raw SVG filters stay code-only across shared configs, JSON and saved presets', () => {
    const props = { filter: '<foreignObject><img onerror="alert(1)" /></foreignObject>' }
    expect(() => parseProps(JSON.stringify(props), gooey)).toThrow(
      'filter requires application code'
    )
    expect(() => parseConfiguration(JSON.stringify({ library: 'gooey', props }), gooey)).toThrow(
      'filter requires application code'
    )
    expect(() => studioHref(gooey, props, 'ring')).toThrow('filter requires application code')
    expect(
      readPresets({
        getItem: () =>
          JSON.stringify([
            { id: 'unsafe', name: 'Unsafe', library: 'gooey', variant: 'ring', props },
          ]),
      })
    ).toEqual([])
  })
  test('structured props reject incompatible shapes before rendering', () => {
    const invalid: [string, string, object][] = [
      ['voice', 'ring', { colors: { core: 'red' } }],
      ['voice', 'ring', { colors: [null] }],
      ['voice', 'ring', { bandColors: { core: 42 } }],
      ['avatars', 'ring', { size: { width: 96 } }],
      ['avatars', 'ring', { pose: { yaw: 'left' } }],
      ['avatars', 'ring', { pose: { unknown: 1 } }],
      ['image', 'ring', { revealDelayRange: { min: 2 } }],
      ['image', 'ring', { revealDelayRange: [1] }],
      ['image', 'ring', { revealHoldMs: [1, 'two'] }],
      ['image', 'ring', { colors: [42] }],
      ['orbs', 'ring', { opts: { density: 'dense' } }],
      ['orbs', 'ring', { gravity: { sprite: { src: '/cursor.svg' } } }],
      ['metal', 'ring', { mask: 'bad' }],
      ['metal', 'ring', { innerShadow: { blur: 'soft' } }],
      ['metal', 'text', { theme: 'invalid' }],
      ['metal', 'text', { innerShadow: { blur: 1 } }],
      ['metal', 'text', { innerShadow: true }],
      ['metal', 'badge', { core: { r: 4 } }],
      ['gooey', 'ring', { item: { morph: { advanced: { evolve: { cornerEase: 3 } } } } }],
      ['gooey', 'ring', { item: { move: { advanced: { damping: 'slow' } } } }],
      ['gooey', 'ring', { item: { bend: { vertical: false } } }],
      ['gooey', 'ring', { item: { melt: { src: 1 } } }],
      ['gooey', 'ring', { item: { dissolve: { warpStyle: 'invalid' } } }],
      ['gooey', 'ring', { item: { radius: [1, 2, 3] } }],
      ['gooey', 'ring', { item: { transition: { ease: 'linear' } } }],
    ]
    for (const [id, variant, props] of invalid)
      expect(() =>
        parseProps(JSON.stringify(props), configuredLibrary(libraryFor(id), variant))
      ).toThrow()
  })

  test('structured validation preserves supported SDK unions and nested tuning', () => {
    const valid: [string, string, object][] = [
      ['voice', 'ring', { colors: ['red', 'blue'], bandColors: { core: 'red' } }],
      ['avatars', 'ring', { size: '6rem', pose: { yaw: -0.6, pitch: 0.2, roll: 0 } }],
      [
        'image',
        'ring',
        {
          colors: ['red', null],
          revealDelayRange: [0, 2],
          revealHoldMs: 5,
          revealInitialDelay: [1, 2],
        },
      ],
      ['orbs', 'ring', { opts: { custom: 1 }, gravity: true }],
      [
        'orbs',
        'ring',
        {
          gravity: {
            strength: 2,
            sprite: { src: '/cursor.svg', width: 32, height: 32, hotX: 0, hotY: 0 },
          },
        },
      ],
      ['metal', 'ring', { innerShadow: { color: 'red', blur: 0.5 } }],
      ['metal', 'text', { theme: 'dark', innerShadow: null }],
      ['metal', 'text', { innerShadow: { offsetY: 1, blur: 0.5, alpha: 0.9 } }],
      ['metal', 'badge', { core: { r: 46, blur: 100, a: 0.94, size: 49 } }],
      [
        'gooey',
        'ring',
        {
          item: {
            morph: { shape: true, advanced: { evolve: { travel: 1, cornerEase: 'ease-in' } } },
            move: { advanced: { damping: 20 } },
            bend: { vertical: 0.5 },
            melt: { src: '/image.webp', gravity: 1 },
            dissolve: { active: false, warpStyle: 'turbulence', surface: 'image' },
            radius: [1, 2, 3, 4],
            transition: { duration: 0.3, ease: 'linear' },
          },
        },
      ],
    ]
    for (const [id, variant, props] of valid)
      expect(parseProps(JSON.stringify(props), configuredLibrary(libraryFor(id), variant))).toEqual(
        props
      )
    for (const transition of ['snappy', {}, { stiffness: 200 }, { duration: 0.5 }])
      expect(
        parseProps(JSON.stringify({ item: { transition, dissolve: 0.5, radius: 12 } }), gooey)
      ).toEqual({ item: { transition, dissolve: 0.5, radius: 12 } })
  })
  test('Studio handoff keeps validated props and component variants in the URL fragment', () => {
    for (const library of libraries) {
      for (const { id: variant } of library.variants) {
        const props = {
          ...variantDefaults(library, variant),
          ...(configuredLibrary(library, variant).fields.some((field) => field.name === 'theme')
            ? { theme: 'dark' }
            : {}),
        }
        const url = new URL(studioHref(library, props, variant), 'http://localhost:3000')
        expect(url.searchParams.get('library')).toBe(library.id)
        expect(url.searchParams.has('config')).toBe(false)
        const configuration = new URLSearchParams(url.hash.slice(1)).get('config')
        expect(parseConfiguration(configuration || '', library)).toEqual({ props, variant })
      }
    }
    expect(parseConfiguration('{"state":"listening"}', orb)).toEqual({
      props: { state: 'listening' },
      variant: 'ring',
    })
    expect(parseConfiguration('{"variant":"circle"}', metal)).toEqual({
      props: { variant: 'circle' },
      variant: 'ring',
    })
  })
  test('shared configurations reject incompatible envelopes, unsafe props and oversized UTF-8 payloads', () => {
    for (const text of [
      '[]',
      'null',
      '{"library":"voice","props":{"state":"working"}}',
      '{"variant":"missing","props":{}}',
      '{"props":{"__proto__":{}}}',
      '{"props":{},"constructor":{}}',
      '{"props":{"state":"invalid"}}',
      '{"props":[1]}',
      JSON.stringify({ props: { color: '🌈'.repeat(20000) } }),
    ])
      expect(() => parseConfiguration(text, orb)).toThrow()
    expect(() => studioHref(orb, { state: 'invalid' }, 'ring')).toThrow()
    expect(
      parseConfiguration('{"props":{"font":"500 24px system-ui"},"variant":"text"}', metal)
    ).toEqual({ props: { font: '500 24px system-ui' }, variant: 'text' })
  })
  test('rejects malformed, unknown and incompatible configurations', () => {
    for (const text of [
      '[]',
      'null',
      '{"state":"invalid"}',
      '{"speed":"fast"}',
      '{"paused":1}',
      '{"dots":100000000}',
      '{"__proto__":{}}',
      '{"opts":{"constructor":{}}}',
    ])
      expect(() => parseProps(text, orb)).toThrow()
    expect(parseProps('{"state":"listening","speed":0.7}', orb)).toEqual({
      state: 'listening',
      speed: 0.7,
    })
  })
  test('recovers from corrupted storage and preserves component variants', () => {
    const text = {
      id: 'one',
      library: 'metal',
      name: 'Text',
      variant: 'text',
      props: variantDefaults(metal, 'text'),
    }
    const invalid = { id: 'two', library: 'orbs', name: 'Broken', props: { state: 'bad' } }
    expect(readPresets({ getItem: () => '{broken' })).toEqual([])
    expect(
      readPresets({ getItem: () => JSON.stringify([text, invalid, null, { name: 'No ID' }]) })
    ).toEqual([text])
  })
  test('exports the selected metal component with its required props', () => {
    const selected = configuredLibrary(metal, 'text')
    const code = snippet(selected, variantDefaults(metal, 'text'))
    expect(code).toContain('import { MetalText }')
    expect(code).toContain('font={"500 24px/1.2 system-ui"}')
    expect(code).not.toContain('<MetalFx')
  })
  test('standalone metal actions fall back to the canonical accent tokens', async () => {
    const tokens = await readFile('packages/agent-ui/src/tokens.css', 'utf8')
    const start = tokens.match(/--livenui-accent-start:\s*([^;]+);/)?.[1]
    const end = tokens.match(/--livenui-accent-end:\s*([^;]+);/)?.[1]
    const gradient = tokens.match(/--gradient-accent:\s*([^;]+);/)?.[1]
    expect(start).toBeDefined()
    expect(end).toBeDefined()
    expect(gradient).toBeDefined()
    const fallback = gradient
      ?.replace('var(--livenui-accent-start)', start ?? '')
      .replace('var(--livenui-accent-end)', end ?? '')
      .replace(/\s/g, '')
    for (const variant of ['circle', 'button']) {
      const code = snippet(metal, { ...defaults.metal, variant })
      expect(code.replace(/\s/g, '')).toContain(`var(--gradient-accent,${fallback})`)
    }
  })
  test('metal exports typecheck with custom host styles and playback props', () => {
    const sources = new Map<string, string>()
    for (const variant of ['ring', 'text', 'badge']) {
      const props = { ...variantDefaults(metal, variant), paused: true }
      if (variant === 'ring') Object.assign(props, { style: { margin: 4 } })
      const code = snippet(configuredLibrary(metal, variant), props)
      const split = code.lastIndexOf('\n\n')
      sources.set(
        resolve(`metal-export-${variant}.tsx`),
        variant === 'ring'
          ? code
          : `${code.slice(0, split)}\nexport function Example() { return (${code.slice(split)}) }`
      )
    }
    const options: ts.CompilerOptions = {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      paths: { '@/components/livenui/metal': [resolve('packages/metal-fx/src/index.ts')] },
      types: ['react', 'react-dom'],
    }
    const host = ts.createCompilerHost(options)
    const getSourceFile = host.getSourceFile.bind(host)
    host.getSourceFile = (file, language, ...rest) => {
      const source = sources.get(file)
      return source === undefined
        ? getSourceFile(file, language, ...rest)
        : ts.createSourceFile(file, source, language, true, ts.ScriptKind.TSX)
    }
    const program = ts.createProgram([...sources.keys()], options, host)
    expect(
      ts
        .getPreEmitDiagnostics(program)
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    ).toEqual([])
  })
  test('places liquid item configuration on the child', () => {
    const props = parseProps('{"blur":8,"item":{"effect":"bend","bend":{"vertical":0.7}}}', gooey)
    const code = snippet(gooey, props)
    expect(code).toContain('<Liquid.Item')
    expect(code).toContain('"effect":"bend"')
    expect(code).not.toContain('  item=')
    expect(code).not.toContain('"morph":{"shape":true}')
    const meltCode = snippet(gooey, { item: { effect: 'melt' } })
    expect(meltCode.match(/<Liquid.Item/g)).toHaveLength(2)
    expect(meltCode).toContain('<img src="/agent-images/warm-ribbon.webp"')
    expect(meltCode).toContain('<img src="/agent-images/cool-ribbon.webp"')
    expect(() => parseProps('{"item":{"effect":"invalid"}}', gooey)).toThrow()
    for (const item of [{ scale: 'large' }, { observe: 1 }, { unknown: true }])
      expect(() => parseProps(JSON.stringify({ item }), gooey)).toThrow()
  })
  test('image pool exports contain one valid attribute and reject incompatible values', () => {
    const image = libraryFor('image')
    const props = parseProps('{"images":["/one.jpg","/two.jpg"],"borderRadius":48}', image)
    const code = snippet(image, props)
    expect(code.match(/images=/g)).toHaveLength(1)
    expect(code).toContain('images={["/one.jpg","/two.jpg"]}')
    for (const value of [42, 'one.jpg', [null], ['']])
      expect(() => parseProps(JSON.stringify({ images: value }), image)).toThrow()
  })
  test('every library has a valid default recipe', () => {
    expect(libraries).toHaveLength(7)
    for (const library of libraries)
      expect(parseProps(JSON.stringify(defaults[library.id]), library)).toEqual(
        defaults[library.id]
      )
  })
})
