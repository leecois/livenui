import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

const setup = `
import assert from 'node:assert/strict';
const frames = new Map(); let next = 0;
const noop = () => {};
const gl = new Proxy({}, {get: (_, key) => key === 'getShaderParameter' || key === 'getProgramParameter' ? () => true : key === 'getExtension' ? () => null : key.startsWith('create') || key === 'getUniformLocation' ? () => ({}) : /^[A-Z_0-9]+$/.test(key) ? 1 : noop});
const ctx = new Proxy({}, {get: (_, key) => key === 'createLinearGradient' || key === 'createRadialGradient' ? () => ({addColorStop:noop}) : noop});
const canvas = () => ({width:128,height:128,style:{},getContext:type => type === 'webgl2' ? gl : ctx,addEventListener:noop,removeEventListener:noop});
Object.assign(globalThis, {document:{createElement:canvas,addEventListener:noop,hidden:false},window:{devicePixelRatio:1},requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id)});
const engine = await import('./packages/metal-fx/src/engine/renderer/loop.ts');
engine.setGlowCallback(()=>false);
const create = (options = {}) => engine.createInstance({hostCanvas:canvas(),cssWidth:64,cssHeight:64,cornerRadius:32,kind:'circle',...options});
const step = (time = 1000) => {
  assert.equal(frames.size, 1);
  const [id, fn] = frames.entries().next().value;
  frames.delete(id);
  fn(time);
};
`

async function probe(source: string) {
  const child = Bun.spawn([process.execPath, '--eval', setup + source], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [exitCode, output, errors] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  expect({ exitCode, output, errors }).toEqual({ exitCode: 0, output: '', errors: '' })
}

for (const callback of ['onComposite', 'onFirstCopy', 'onAfterFrame']) {
  test(`Metal ${callback} may destroy the final instance without later callbacks or frames`, async () => {
    await probe(`
const calls = [];
const options = Object.fromEntries(['onComposite', 'onFirstCopy', 'onAfterFrame'].map(name => [name, () => {
  calls.push(name);
  if (name === '${callback}') engine.destroyInstance(inst);
}]));
const inst = create(options);
step();
assert.deepEqual(calls, ['onComposite', 'onFirstCopy', 'onAfterFrame'].slice(0, ['onComposite', 'onFirstCopy', 'onAfterFrame'].indexOf('${callback}') + 1));
assert.equal(frames.size, 0);
assert.equal(inst.everCopied, false);
`)
  })
}

test('Metal replacement during a frame waits for its own renderer frame', async () => {
  await probe(`
let replacement, paints = 0;
const inst = create({onComposite() {
  engine.destroyInstance(inst);
  replacement = create({onAfterFrame() { paints++; }});
}});
step();
assert.equal(paints, 0);
assert.equal(inst.everCopied, false);
step(1100);
assert.equal(paints, 1);
engine.destroyInstance(replacement);
assert.equal(frames.size, 0);
`)
})

test('Metal skips a peer removed from the current material batch', async () => {
  await probe(`
let paints = 0;
const first = create({onAfterFrame() { engine.destroyInstance(second); }});
const second = create({onAfterFrame() { paints++; }});
step();
assert.equal(paints, 0);
assert.equal(second.everCopied, false);
assert.equal(first.everCopied, true);
engine.destroyInstance(first);
assert.equal(frames.size, 0);
`)
})

test('Metal glow callbacks cannot mutate a destroyed instance or paint a replacement early', async () => {
  await probe(`
let replacement, paints = 0;
const inst = create();
engine.registerGlowInstance(inst);
engine.setGlowCallback(current => {
  assert.equal(current, inst);
  engine.destroyInstance(inst);
  replacement = create({onAfterFrame() { paints++; }});
  return true;
});
step();
assert.equal(inst.glowFast, false);
assert.equal(paints, 0);
step(1100);
assert.equal(paints, 1);
engine.destroyInstance(replacement);
assert.equal(frames.size, 0);
`)
})
