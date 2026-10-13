import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

const setup = `
import assert from 'node:assert/strict';
import { mock } from 'bun:test';
mock.module('./packages/img-fx/src/engine/reveal.ts', () => ({
  loadImage: async src => ({ src }),
  pickRandomImage: images => ({ src: images[0], idx: 0 }),
}));
const { createCycle } = await import('./packages/img-fx/src/engine/cycle.ts');
const timers = new Map(); let timerId = 0;
globalThis.setTimeout = (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; };
globalThis.clearTimeout = id => timers.delete(id);
const reveals = []; let hides = 0;
const reveal = {
  canvas: { clientWidth: 100, clientHeight: 80 },
  startReveal: options => reveals.push(options),
  startHide() { hides++; }, startBoil() {}, clear() {},
};
const options = { reveal, images: ['old'], delayRange: [1, 1], holdMs: 100, fadeOutMs: 50 };
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
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

for (const phase of ['idle', 'reveal', 'visible', 'hide', 'boil']) {
  for (const action of ['stop()', 'dispose()', 'setPaused(true)']) {
    test(`Image ${phase} callback can ${action} without scheduling canceled work`, async () => {
      await probe(`
const phase = '${phase}';
let canceled = false;
const cycle = createCycle({...options, onPhase(event) {
  if (event.phase === (phase === 'boil' ? 'idle' : phase)) {
    canceled = true;
    cycle.${action};
  }
}});
if (phase === 'idle') cycle.start();
else {
  cycle.triggerOnce();
  await flush();
  if (phase === 'visible') reveals[0].onRevealComplete();
  if (phase === 'hide') cycle.triggerHide();
  if (phase === 'boil') cycle.triggerBoil({ autoRevealAfterMs: 100 });
}
assert.equal(canceled, true);
assert.equal(cycle.isRunning(), false);
assert.equal(timers.size, 0);
assert.equal(reveals.length, phase === 'idle' || phase === 'reveal' ? 0 : 1);
assert.equal(hides, 0);
`)
    })
  }
}

for (const phase of ['idle', 'reveal', 'visible', 'hide', 'boil']) {
  test(`Image replacement from ${phase} callback retains only the new reveal`, async () => {
    await probe(`
let replaced = false;
const cycle = createCycle({...options, onPhase(event) {
  if (!replaced && event.phase === ('${phase}' === 'boil' ? 'idle' : '${phase}')) {
    replaced = true;
    cycle.stop();
    cycle.setImages(['new']);
    cycle.triggerOnce({hold: 'manual'});
  }
}});
if ('${phase}' === 'idle') cycle.start();
else {
  cycle.triggerOnce();
  await flush();
  if ('${phase}' === 'visible') reveals[0].onRevealComplete();
  if ('${phase}' === 'hide') cycle.triggerHide();
  if ('${phase}' === 'boil') cycle.triggerBoil({ autoRevealAfterMs: 100 });
}
await flush();
assert.equal(replaced, true);
assert.deepEqual(reveals.map(item => item.image.src), ['visible', 'hide', 'boil'].includes('${phase}') ? ['old', 'new'] : ['new']);
reveals.at(-1).onRevealComplete();
assert.equal(cycle.getPhase(), 'visible');
assert.equal(cycle.isRunning(), true);
assert.equal(timers.size, 0);
cycle.dispose();
`)
  })
}
