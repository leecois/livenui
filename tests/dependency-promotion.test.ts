import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

for (const manager of ['npm', 'pnpm', 'bun']) {
  for (const fail of [false, true]) {
    test(`${manager} promotes dev-only runtime requirements${fail ? ' and preserves the manifest on failure' : ''}`, async () => {
      const child = Bun.spawn(
        [
          process.execPath,
          '--eval',
          `
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDependencyInstaller } from './packages/cli/src/utils/add/install-deps.ts';
const cwd = process.cwd();
const directory = await mkdtemp(join(tmpdir(), 'livenui-promote-'));
process.chdir(directory);
const original = JSON.stringify({ name: 'consumer', private: true, dependencies: { react: '^19' }, devDependencies: { three: '^0.180.0', typescript: '^7' } });
await writeFile('package.json', original);
let calls = 0;
const install = createDependencyInstaller({
  getManager: async () => '${manager}',
  confirm: async () => true,
  spinner: () => ({ start() {}, stop() {} }),
  run: async (command, args) => {
    calls++;
    assert.equal(command, '${manager}');
    assert.deepEqual(args, ['${manager === 'npm' ? 'i' : 'add'}', 'three@^0.180.0'${manager === 'bun' ? '' : ", '--save-prod'"}]);
    if ('${manager}' === 'bun') {
      const manifest = JSON.parse(await readFile('package.json', 'utf8'));
      assert.equal(manifest.dependencies.three, '^0.180.0');
      assert.equal(manifest.devDependencies.three, undefined);
      assert.equal(manifest.devDependencies.typescript, '^7');
      assert.equal(manifest.dependencies.react, '^19');
      assert.equal(manifest.private, true);
    }
    if (${fail}) throw new Error('controlled install failure');
  },
});
try {
  if (${fail}) {
    await assert.rejects(install({ three: null, react: null }, { typescript: null }), /controlled install failure/);
    assert.equal(await readFile('package.json', 'utf8'), original);
  } else {
    await install({ three: null, react: null }, { typescript: null });
  }
  assert.equal(calls, 1);
  const declined = createDependencyInstaller({ getManager: async () => '${manager}', confirm: async () => false, run: async () => assert.fail('declined install ran') });
  await writeFile('package.json', original);
  await declined({ three: '^0.186.0' }, {});
  assert.equal(await readFile('package.json', 'utf8'), original);
} finally {
  process.chdir(cwd);
  await rm(directory, { recursive: true, force: true });
}
console.log('passed');
`,
        ],
        { cwd: fileURLToPath(new URL('..', import.meta.url)), stdout: 'pipe', stderr: 'pipe' }
      )
      const [exitCode, output, errors] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])
      expect({ exitCode, output, errors }).toEqual({ exitCode: 0, output: 'passed\n', errors: '' })
    })
  }
}
