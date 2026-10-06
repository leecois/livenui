import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

for (const fail of [false, true]) {
  test(`post-build ${fail ? 'failure produces a failing process exit' : 'success preserves a successful process exit'}`, async () => {
    const child = Bun.spawn(
      [
        process.execPath,
        '--eval',
        `
import assert from 'node:assert/strict';
import { mock } from 'bun:test';
const errors = [];
let calls = 0;
console.error = (...args) => errors.push(args);
mock.module('@next/env', () => ({ default: { loadEnvConfig() {} } }));
mock.module('./scripts/update-orama-index.ts', () => ({ updateSearchIndexes: async () => {
  calls++;
  if (${fail}) throw new Error('controlled sync failure');
} }));
await import('./scripts/post-build.ts');
assert.equal(calls, 1);
assert.equal(errors.length, ${fail ? 1 : 0});
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
    expect({ exitCode, output, errors }).toEqual({
      exitCode: fail ? 1 : 0,
      output: 'passed\n',
      errors: '',
    })
  })
}

test('remote search sync requires opt-in, credentials and an operator-supplied index', async () => {
  const child = Bun.spawn(
    [
      process.execPath,
      '--eval',
      `
import assert from 'node:assert/strict';
import { mock } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const calls = [];
console.log = () => {};
mock.module('@oramacloud/client', () => ({
  CloudManager: class { constructor(options) { calls.push(['manager', options]); } },
}));
mock.module('fumadocs-core/search/orama-cloud', () => ({
  sync: async (manager, options) => { calls.push(['sync', options]); },
}));
const { updateSearchIndexes } = await import('./scripts/update-orama-index.ts');
const directory = await mkdtemp(join(tmpdir(), 'livenui-search-sync-'));
process.chdir(directory);
try {
delete process.env.LIVENUI_SYNC_SEARCH;
delete process.env.ORAMA_PRIVATE_API_KEY;
delete process.env.ORAMA_INDEX_ID;
await updateSearchIndexes();
assert.deepEqual(calls, []);
process.env.LIVENUI_SYNC_SEARCH = '1';
await updateSearchIndexes();
assert.deepEqual(calls, []);
process.env.ORAMA_PRIVATE_API_KEY = 'test-credential';
await assert.rejects(updateSearchIndexes(), /ORAMA_INDEX_ID is required/);
process.env.ORAMA_INDEX_ID = '   ';
await assert.rejects(updateSearchIndexes(), /ORAMA_INDEX_ID is required/);
assert.deepEqual(calls, []);
await mkdir('.next/server/app', { recursive: true });
await writeFile('.next/server/app/static.json.body', '[{"id":"example"}]');
process.env.ORAMA_INDEX_ID = ' test-index ';
await updateSearchIndexes();
assert.deepEqual(calls, [
  ['manager', { api_key: 'test-credential' }],
  ['sync', { index: 'test-index', documents: [{ id: 'example' }] }],
]);
} finally {
  await rm(directory, { recursive: true, force: true });
}
process.stdout.write('passed\\n');
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
