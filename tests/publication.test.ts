import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'
import { resolveSiteUrl } from '../apps/docs/lib/site'

test('site origin accepts local and hosted HTTP(S) while rejecting unsafe or ambiguous URLs', () => {
  expect(resolveSiteUrl().href).toBe('https://livenui.dev/')
  expect(resolveSiteUrl('http://localhost:3000').href).toBe('http://localhost:3000/')
  expect(resolveSiteUrl('https://docs.example.test').href).toBe('https://docs.example.test/')
  for (const value of [
    'invalid',
    'javascript:alert(1)',
    'ftp://example.test',
    'https://user:example@example.test',
    'https://example.test/docs',
    'https://example.test?preview=true',
    'https://example.test#preview',
  ]) {
    expect(() => resolveSiteUrl(value)).toThrow('NEXT_PUBLIC_APP_URL must be an HTTP(S) origin')
  }
})

test('hosted agent reference and crawler endpoints share the configured origin and canonical paths', async () => {
  const child = Bun.spawn(
    [
      process.execPath,
      '--eval',
      `
import assert from 'node:assert/strict';
import { mock } from 'bun:test';
mock.module('~/lib/source', () => ({ source: { getPages: () => [
  { url: '/agents' }, { url: '/agents/orbs' }, { url: '/agents/studio' },
] } }));
const { GET } = await import('./app/agent-skill.md/route.ts');
const response = await GET();
assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
const text = await response.text();
for (const id of ['beam', 'orbs', 'metal', 'gooey', 'voice', 'image', 'avatars']) {
  assert.ok(text.includes('npx shadcn@latest add https://docs.example.test/r/' + id + '.json'));
}
assert.ok(!text.includes('localhost'));
const { default: sitemap } = await import('./app/sitemap.ts');
assert.deepEqual(sitemap().map(item => item.url), [
  'https://docs.example.test/agents', 'https://docs.example.test/agents/orbs',
  'https://docs.example.test/studio',
]);
const { default: robots } = await import('./app/robots.ts');
assert.equal(robots().sitemap, 'https://docs.example.test/sitemap.xml');
console.log('passed');
`,
    ],
    {
      cwd: fileURLToPath(new URL('../apps/docs', import.meta.url)),
      env: { ...process.env, NEXT_PUBLIC_APP_URL: 'https://docs.example.test' },
      stdout: 'pipe',
      stderr: 'pipe',
    }
  )
  const [exitCode, output, errors] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  expect({ exitCode, output, errors }).toEqual({ exitCode: 0, output: 'passed\n', errors: '' })
})

test('MDX math plugins render inline and display formulas with the patched shared KaTeX', async () => {
  const child = Bun.spawn(
    [
      process.execPath,
      '--eval',
      `
import assert from 'node:assert/strict';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
const source = 'Inline $e^{i\\\\pi}+1=0$.\\n\\n$$\\n\\\\frac{1}{2}\\n$$\\n';
const output = String(await compile(source, { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }));
assert.ok(output.includes('katex-mathml'));
assert.ok(output.includes('katex-display'));
assert.ok(!output.includes('katex-error'));
const unsafe = String(await compile('$\\\\href{javascript:alert(1)}{test}$', { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }));
assert.ok(!unsafe.includes('href:'));
console.log('passed');
`,
    ],
    {
      cwd: fileURLToPath(new URL('../apps/docs', import.meta.url)),
      stdout: 'pipe',
      stderr: 'pipe',
    }
  )
  const [exitCode, output, errors] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  expect({ exitCode, output, errors }).toEqual({ exitCode: 0, output: 'passed\n', errors: '' })
})
