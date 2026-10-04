import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

async function probe(source: string) {
  const child = Bun.spawn([process.execPath, '--eval', source], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [exitCode, output, errors] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  expect({ exitCode, output, errors }).toEqual({ exitCode: 0, output: 'passed\n', errors: '' })
}

const cycleSetup = `
import assert from 'node:assert/strict';
import { mock } from 'bun:test';
const loads = [];
mock.module('./packages/img-fx/src/engine/reveal.ts', () => ({
  loadImage: src => new Promise((resolve, reject) => loads.push({ src, resolve, reject })),
  pickRandomImage: images => ({ src: images[0], idx: 0 }),
}));
const { createCycle } = await import('./packages/img-fx/src/engine/cycle.ts');
const timers = new Map();
let timerId = 0;
globalThis.setTimeout = (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; };
globalThis.clearTimeout = id => timers.delete(id);
const requests = [];
const events = [];
const reveal = {
  canvas: { clientWidth: 100, clientHeight: 80 },
  startReveal: options => requests.push(options),
  startHide() {},
  startBoil() {},
  clear() {},
};
const cycle = createCycle({
  reveal, images: ['old'], delayRange: [1, 1], holdMs: 100, fadeOutMs: 50,
  onPhase: event => events.push(event),
});
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
const runTimer = () => {
  assert.equal(timers.size, 1);
  const [id, { fn }] = timers.entries().next().value;
  timers.delete(id);
  fn();
};
`

test('image cycles ignore stale resolutions, rejections and reveal callbacks', async () => {
  await probe(`${cycleSetup}
cycle.triggerOnce({ hold: 'manual' });
cycle.stop();
cycle.setImages(['new']);
cycle.triggerOnce({ hold: 'manual' });
loads[1].resolve({ src: 'new' });
await flush();
loads[0].resolve({ src: 'old' });
await flush();
assert.deepEqual(requests.map(request => request.image.src), ['new']);
assert.equal(events[0].src, 'new');
requests[0].onRevealComplete();
assert.equal(cycle.getPhase(), 'visible');
assert.equal(timers.size, 0);
cycle.stop();
cycle.setImages(['failed']);
cycle.triggerOnce({ hold: 'manual' });
cycle.setImages(['replacement']);
cycle.triggerOnce({ hold: 'manual' });
loads[3].resolve({ src: 'replacement' });
await flush();
requests[1].onRevealComplete();
loads[2].reject(new Error('old request failed'));
await flush();
assert.equal(cycle.isRunning(), true);
assert.equal(cycle.getPhase(), 'visible');
assert.equal(events.at(-1).src, 'replacement');
assert.equal(timers.size, 0);
cycle.stop();
cycle.setImages(['latest']);
cycle.triggerOnce({ hold: 'manual' });
loads[4].resolve({ src: 'latest' });
await flush();
requests[1].onRevealComplete();
assert.equal(cycle.getPhase(), 'reveal');
requests[2].onRevealComplete();
assert.equal(cycle.getPhase(), 'visible');
cycle.dispose();
console.log('passed');
`)
})

test('image cycles invalidate pending work on pause and disposal and resume normally', async () => {
  await probe(`${cycleSetup}
cycle.triggerOnce({ hold: 'manual' });
cycle.setPaused(true);
cycle.setPaused(false);
loads[0].resolve({ src: 'old' });
await flush();
assert.equal(requests.length, 0);
runTimer();
loads[1].resolve({ src: 'resumed' });
await flush();
requests[0].onRevealComplete();
assert.equal(cycle.getPhase(), 'visible');
assert.equal(cycle.isRunning(), true);
cycle.stop();
cycle.triggerOnce();
cycle.dispose();
loads[2].resolve({ src: 'disposed' });
await flush();
assert.equal(requests.length, 1);
assert.equal(timers.size, 0);
cycle.start();
runTimer();
cycle.dispose();
loads[3].reject(new Error('disposed request failed'));
await flush();
assert.equal(timers.size, 0);
assert.equal(cycle.isRunning(), false);
cycle.triggerOnce();
loads[4].reject(new Error('current request failed'));
await flush();
assert.equal(cycle.isRunning(), false);
assert.equal(timers.size, 0);
console.log('passed');
`)
})

test('avatar ticker releases global listeners and owns one frame across subscription changes', async () => {
  await probe(`
import assert from 'node:assert/strict';
class Target {
  listeners = new Map();
  adds = 0;
  removes = 0;
  hidden = false;
  addEventListener(type, fn) {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(fn);
    this.listeners.set(type, handlers);
    this.adds++;
  }
  removeEventListener(type, fn) {
    assert.ok(this.listeners.get(type)?.delete(fn));
    if (!this.listeners.get(type).size) this.listeners.delete(type);
    this.removes++;
  }
  dispatch(type, event = {}) {
    for (const handler of this.listeners.get(type) ?? []) handler(event);
  }
}
const document = new Target();
const window = new Target();
const frames = new Map();
let frameId = 0;
const canceled = [];
Object.assign(globalThis, {
  document, window,
  requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
  cancelAnimationFrame: id => { canceled.push(id); frames.delete(id); },
});
const frame = now => {
  assert.equal(frames.size, 1);
  const [id, fn] = frames.entries().next().value;
  frames.delete(id);
  fn(now);
};
const { subscribe, pointer } = await import('./packages/bot-avatars/src/ticker.ts');
const first = [];
const second = [];
const offFirst = subscribe(dt => first.push(dt));
const offSecond = subscribe(dt => second.push(dt));
assert.equal(document.adds + window.adds, 4);
assert.equal(frames.size, 1);
document.dispatch('pointermove', { clientX: 20, clientY: 30 });
assert.deepEqual(pointer, { x: 20, y: 30 });
frame(100);
assert.deepEqual(first, [0]);
assert.deepEqual(second, [0]);
offFirst();
assert.equal(document.removes + window.removes, 0);
frame(150);
assert.deepEqual(first, [0]);
assert.deepEqual(second, [0, 0.05]);
document.hidden = true;
document.dispatch('visibilitychange');
assert.equal(frames.size, 0);
assert.equal(canceled.length, 1);
document.hidden = false;
document.dispatch('visibilitychange');
frame(1000);
assert.equal(second.at(-1), 0);
offSecond();
assert.equal(frames.size, 0);
assert.equal(document.listeners.size + window.listeners.size, 0);
assert.equal(document.removes + window.removes, 4);
assert.ok(Number.isNaN(pointer.x) && Number.isNaN(pointer.y));
offSecond();
document.dispatch('pointermove', { clientX: 90, clientY: 90 });
assert.ok(Number.isNaN(pointer.x));
document.hidden = true;
const resumed = [];
const offResumed = subscribe(dt => resumed.push(dt));
assert.equal(frames.size, 0);
assert.equal(document.adds + window.adds, 8);
document.hidden = false;
document.dispatch('visibilitychange');
frame(2000);
assert.deepEqual(resumed, [0]);
window.dispatch('blur');
offResumed();
assert.equal(document.listeners.size + window.listeners.size, 0);
assert.equal(document.adds + window.adds, document.removes + window.removes);
let offNested;
const offOuter = subscribe(() => {
  offNested ??= subscribe(() => {});
});
frame(3000);
assert.equal(frames.size, 1);
offOuter();
offNested();
assert.equal(frames.size, 0);
assert.equal(document.listeners.size + window.listeners.size, 0);
const offHidden = subscribe(() => {
  document.hidden = true;
  document.dispatch('visibilitychange');
});
frame(4000);
assert.equal(frames.size, 0);
offHidden();
assert.equal(document.listeners.size + window.listeners.size, 0);
console.log('passed');
`)
})

test('image cycles retain pause when automatic playback starts', async () => {
  await probe(`${cycleSetup}
cycle.setPaused(true);
cycle.start();
assert.equal(cycle.isRunning(), false);
assert.equal(timers.size, 0);
assert.equal(loads.length, 0);
cycle.setPaused(false);
assert.equal(cycle.isRunning(), true);
runTimer();
loads[0].resolve({ src: 'old' });
await flush();
requests[0].onRevealComplete();
assert.equal(cycle.getPhase(), 'visible');
cycle.dispose();
assert.equal(timers.size, 0);
console.log('passed');
`)
})

for (const continuous of [false, true]) {
  test(`image cycles preserve ${continuous ? 'continuous' : 'one-shot'} playback after pausing a hide`, async () => {
    await probe(`${cycleSetup}
if (${continuous}) {
  cycle.start();
  runTimer();
} else cycle.triggerOnce();
loads[0].resolve({ src: 'old' });
await flush();
requests[0].onRevealComplete();
runTimer();
assert.equal(cycle.getPhase(), 'hide');
cycle.setPaused(true);
assert.equal(timers.size, 0);
cycle.setPaused(false);
runTimer();
assert.equal(cycle.getPhase(), 'idle');
assert.equal(cycle.isRunning(), ${continuous});
assert.equal(timers.size, ${continuous ? 1 : 0});
assert.deepEqual(events.at(-1), { phase: 'idle', src: null });
cycle.dispose();
console.log('passed');
`)
  })
}

test('one-shot image reveals retain manual hold after pausing an in-flight load', async () => {
  await probe(`${cycleSetup}
cycle.triggerOnce({ hold: 'manual' });
cycle.setPaused(true);
cycle.setPaused(false);
loads[0].resolve({ src: 'stale' });
await flush();
assert.equal(requests.length, 0);
runTimer();
loads[1].resolve({ src: 'resumed' });
await flush();
requests[0].onRevealComplete();
assert.equal(cycle.getPhase(), 'visible');
assert.equal(timers.size, 0);
cycle.triggerHide();
runTimer();
assert.equal(cycle.isRunning(), false);
assert.equal(timers.size, 0);
cycle.dispose();
console.log('passed');
`)
})
