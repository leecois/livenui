import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

test('an installer retries a failed write instead of marking the file installed', async () => {
  const child = Bun.spawn(
    [
      process.execPath,
      '--eval',
      `
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mock } from 'bun:test';
const directory = await fs.mkdtemp(join(tmpdir(), 'livenui-write-retry-'));
let fail = true;
const realWrite = fs.writeFile.bind(fs);
mock.module('node:fs/promises', () => ({ ...fs, default: {
  ...fs,
  writeFile: async (...args) => {
    if (fail) { fail = false; throw new Error('simulated write failure'); }
    return realWrite(...args);
  },
} }));
mock.module('@clack/prompts', () => ({ confirm: async () => false, isCancel: () => false, log: { step() {} }, outro() {} }));
const { createComponentInstaller } = await import('./packages/cli/src/utils/add/install-component.ts');
try {
  const installer = createComponentInstaller({
    projectDir: directory,
    config: { baseDir: '', aliases: {}, commands: {} },
    resolver: async () => ({ name: 'sample', files: [{ type: 'components', path: 'sample.txt', target: 'sample.txt', content: 'installed' }], dependencies: {}, devDependencies: {}, subComponents: [] }),
  });
  await assert.rejects(installer.install('sample'), /simulated write failure/);
  await installer.install('sample');
  assert.equal(await fs.readFile(join(directory, 'sample.txt'), 'utf8'), 'installed');
} finally { await fs.rm(directory, { recursive: true, force: true }); }
console.log('passed');
`,
    ],
    {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
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
