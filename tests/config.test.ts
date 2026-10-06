import { describe, expect, test } from 'bun:test'
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
