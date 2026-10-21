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

const rendererSetup = `
import assert from 'node:assert/strict';
import { mock } from 'bun:test';
const made = [], draws = [], frames = new Map();
let frameId = 0;
const context = { clearRect() {}, drawImage(...args) { draws.push(args); } };
const canvas = () => ({ width: 8, height: 8, style: {}, getContext: () => context, addEventListener() {}, removeEventListener() {} });
Object.assign(globalThis, {
  document: { createElement: canvas }, window: { devicePixelRatio: 1 },
  requestAnimationFrame: fn => { frames.set(++frameId, fn); return frameId; },
  cancelAnimationFrame: id => frames.delete(id),
});
class V { set() {} }
class C { setRGB() {} }
class Renderer {
  ratio = 1; disposed = false;
  constructor(o) { this.canvas = o.canvas; made.push(this); }
  setPixelRatio(n) { this.ratio = n; }
  getPixelRatio() { return this.ratio; }
  setClearColor() {} getContext() { return {}; }
  setSize(w, h) { this.canvas.width = w * this.ratio; this.canvas.height = h * this.ratio; }
  setViewport() {} setScissor() {} setScissorTest() {} render() {}
  dispose() { this.disposed = true; }
}
class Scene { add() {} }
class Material { constructor(o) { Object.assign(this, o); } dispose() {} }
class Geometry { dispose() {} }
mock.module('three', () => ({ Vector2: V, Color: C, WebGLRenderer: Renderer, Scene, OrthographicCamera: class {}, ShaderMaterial: Material, PlaneGeometry: Geometry, Mesh: class {}, NormalBlending: 1 }));
const engine = await import('./packages/img-fx/src/engine/renderer.ts');
const { PRESETS } = await import('./packages/img-fx/src/presets/index.ts');
const instance = (width, height) => engine.createInstance({ canvas: canvas(), cssWidth: width, cssHeight: height, preset: PRESETS['pixels-organic'].modes.dark });
`

for (const dpr of [1, 2]) {
  test(`paused Image one-shot drawing and resize allocate complete backing pixels at DPR ${dpr}`, async () => {
    await probe(`${rendererSetup}
window.devicePixelRatio = ${dpr};
engine.setMaxDpr(${dpr});
const inst = instance(320, 180);
engine.setInstancePaused(inst, true);
engine.renderInstanceOnce(inst);
assert.deepEqual([made[0].canvas.width, made[0].canvas.height], [320 * ${dpr}, 180 * ${dpr}]);
assert.deepEqual(draws.at(-1).slice(1, 5), [0, 0, 320 * ${dpr}, 180 * ${dpr}]);
engine.updateInstanceSize(inst, 500, 300);
engine.renderInstanceOnce(inst);
assert.deepEqual([made[0].canvas.width, made[0].canvas.height], [500 * ${dpr}, 300 * ${dpr}]);
assert.deepEqual(draws.at(-1).slice(1, 5), [0, 0, 500 * ${dpr}, 300 * ${dpr}]);
const offscreen = instance(900, 900);
engine.setInstanceVisible(offscreen, false);
engine.renderInstanceOnce(offscreen);
assert.deepEqual([made[0].canvas.width, made[0].canvas.height], [500 * ${dpr}, 300 * ${dpr}]);
engine.destroyInstance(offscreen);
engine.destroyInstance(inst);
assert.equal(frames.size, 0);
console.log('passed');
`)
  })
}

test('resetting a custom Image shader after teardown cannot recreate an unowned renderer', async () => {
  await probe(`${rendererSetup}
engine.setSharedFragmentShader(null);
assert.equal(made.length, 0);
assert.equal(frames.size, 0);
const inst = instance(320, 180);
engine.setSharedFragmentShader('custom shader');
engine.destroyInstance(inst);
assert.equal(made[0].disposed, true);
assert.equal(frames.size, 0);
engine.setSharedFragmentShader(null);
assert.equal(made.length, 1);
assert.equal(frames.size, 0);
const next = instance(64, 64);
assert.equal(made.length, 2);
engine.destroyInstance(next);
assert.equal(frames.size, 0);
console.log('passed');
`)
})

test('Voice sleeps after paused paint and wakes for active or changed instances', async () => {
  await probe(`
import assert from 'node:assert/strict';
const frames = new Map(); let next = 0;
Object.assign(globalThis, {
  requestAnimationFrame: fn => { frames.set(++next, fn); return next; },
  cancelAnimationFrame: id => frames.delete(id),
});
const host = () => {
  const el = { writes: 0, querySelector: () => null, hasAttribute: () => false, clientWidth: 100, clientHeight: 80 };
  el.style = { setProperty() { el.writes++; } };
  return el;
};
const config = (id, paused) => new Proxy({ id, paused, look: 'glow', distortion: 0, reducedMotion: true, layers: {} }, { get: (target, key) => key in target ? target[key] : 1 });
const { registerVoiceInstance } = await import('./packages/voice-glow/src/voiceDriver.ts');
const step = t => {
  assert.equal(frames.size, 1);
  const [id, fn] = frames.entries().next().value;
  frames.delete(id); fn(t);
};
let calls = 0, reports = 0;
const frozen = host();
const offFrozen = registerVoiceInstance(frozen, config('frozen', true), { getLevel: () => { calls++; return .5; } }, () => reports++);
step(100);
assert.ok(frozen.writes > 0); assert.equal(frames.size, 0);
assert.equal(calls, 0); assert.equal(reports, 1); offFrozen();
const paused = host(), active = host(); let activeCalls = 0;
const offPaused = registerVoiceInstance(paused, config('paused', true), {});
const offActive = registerVoiceInstance(active, config('active', false), { getLevel: () => { activeCalls++; return .5; } });
step(200);
const pausedWrites = paused.writes, activeWrites = active.writes;
assert.ok(pausedWrites > 0); assert.ok(activeWrites > 0); assert.equal(frames.size, 1);
step(217); step(234);
assert.equal(paused.writes, pausedWrites); assert.ok(active.writes > activeWrites);
assert.equal(activeCalls, 3); assert.equal(frames.size, 1);
offActive(); assert.equal(frames.size, 0); offPaused(); assert.equal(frames.size, 0);
const resumed = registerVoiceInstance(paused, config('paused', false), { getLevel: () => .6 });
assert.equal(frames.size, 1); step(300); assert.ok(paused.writes > pausedWrites);
assert.equal(frames.size, 1); resumed(); assert.equal(frames.size, 0);
const beforeRepaint = paused.writes;
const offRepaint = registerVoiceInstance(paused, config('paused', true), {});
step(400); assert.ok(paused.writes > beforeRepaint); assert.equal(frames.size, 0); offRepaint();
let offDuringFrame;
offDuringFrame = registerVoiceInstance(host(), config('self', false), {}, () => offDuringFrame());
step(500); assert.equal(frames.size, 0); offDuringFrame();
let offNested;
const offOuter = registerVoiceInstance(host(), config('outer', false), {}, () => {
  offOuter();
  offNested = registerVoiceInstance(host(), config('nested', false), {});
});
step(600); assert.equal(frames.size, 1); step(617); offNested(); assert.equal(frames.size, 0);
console.log('passed');
`)
})

test('custom Avatar paths use distinct material caches while identical paths reuse them', async () => {
  await probe(`
import assert from 'node:assert/strict';
import { mock } from 'bun:test';
let refs = [];
mock.module('react', () => ({
  forwardRef: fn => fn, useEffect() {}, useLayoutEffect() {}, useId: () => 'fixture', useImperativeHandle() {},
  useRef: value => { const ref = { current: value }; refs.push(ref); return ref; },
  useState: value => [typeof value === 'function' ? value() : value, () => {}],
}));
const jsx = (type, props) => ({ type, props });
mock.module('react/jsx-runtime', () => ({ jsx, jsxs: jsx }));
mock.module('react/jsx-dev-runtime', () => ({ jsxDEV: jsx }));
globalThis.Path2D = class { constructor(d) { this.d = d; } };
const fills = [];
class FakeCanvas {
  constructor(width, height) { this.width = width; this.height = height; }
  getContext() { return {
    setTransform() {}, fill: p => fills.push(p.d),
    getImageData: () => {
      const data = new Uint8ClampedArray(this.width * this.height * 4);
      for (let y = 10; y < this.height - 10; y++) for (let x = 10; x < this.width - 10; x++) data[(y * this.width + x) * 4 + 3] = 255;
      return { data };
    },
  }; }
}
globalThis.OffscreenCanvas = FakeCanvas;
const { BotAvatar } = await import('./packages/bot-avatars/src/BotAvatar.tsx');
const configFor = path => {
  refs = []; BotAvatar({ path, paused: true, shading: 'plastic' }, null);
  const cfg = refs.find(ref => ref.current?.path instanceof Path2D)?.current;
  assert.ok(cfg); return cfg;
};
const firstPath = 'M10 56H95V95H10Z', secondPath = 'M10 63H95V95H10Z';
const first = configFor(firstPath), second = configFor(secondPath), same = configFor(firstPath);
assert.notEqual(first.typeKey, second.typeKey); assert.notEqual(first.path, second.path);
assert.equal(first.typeKey, same.typeKey); assert.equal(first.path, same.path);
const { warmPlastic } = await import('./packages/bot-avatars/src/plastic.ts');
warmPlastic(first.typeKey, first.path, 64, .65, false);
warmPlastic(second.typeKey, second.path, 64, .65, false);
warmPlastic(same.typeKey, same.path, 64, .65, false);
assert.deepEqual(fills, [firstPath, secondPath]);
console.log('passed');
`)
})

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

test('paused Voice repaints resized and revealed hosts without keeping frames alive', async () => {
  await probe(`
import assert from 'node:assert/strict';
import { registerVoiceInstance } from './packages/voice-glow/src/voiceDriver.ts';
const frames = new Map<number, FrameRequestCallback>(); let id = 0;
const observers = [];
globalThis.ResizeObserver = class {
  disconnected = false;
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe() {}
  disconnect() { this.disconnected = true; }
};
Object.assign(globalThis, {
  requestAnimationFrame: (fn: FrameRequestCallback) => { frames.set(++id, fn); return id; },
  cancelAnimationFrame: (id: number) => frames.delete(id),
});
const ctx = new Proxy({ createLinearGradient: () => ({ addColorStop() {} }) }, { get: (target, key) => key in target ? target[key] : () => {} });
const canvas = { width: 0, height: 0, getContext: () => ctx };
const properties = new Map<string,string>();
const host = {
  clientWidth: 100, clientHeight: 80,
  hasAttribute: () => false,
  querySelector: (selector: string) => selector === ':scope > [data-voice-beam-band]' ? canvas : null,
  style: { setProperty: (key: string, value: string) => properties.set(key, value) },
};
const config = (id: string, paused: boolean) => new Proxy({ id, paused, look: 'glow', distortion: 0, reducedMotion: true, theme: 'dark', layers: {}, bandColors: { above: '255,0,0', mid: '0,255,0', below: '0,0,255', core: '255,255,255' } }, { get: (target, key) => key in target ? target[key] : 1 });
function step(t: number) { const [id, fn] = frames.entries().next().value!; frames.delete(id); fn(t); }
const off = registerVoiceInstance(host as any, config('held', true) as any, {});
step(100);
assert.deepEqual([canvas.width, canvas.height, frames.size], [100,80,0]);
const originalClip = properties.get('--vb-clip-below-held');
host.clientWidth = 300; host.clientHeight = 160;
observers[0].callback();
step(200);
assert.deepEqual([canvas.width, canvas.height, frames.size], [300,160,0]);
assert.notEqual(properties.get('--vb-clip-below-held'), originalClip);
const heldHue = properties.get('--vb-hue-held');
observers[0].callback();
assert.equal(frames.size, 0);
host.clientWidth = 0; host.clientHeight = 0;
observers[0].callback(); step(300);
assert.equal(frames.size, 0);
host.clientWidth = 220; host.clientHeight = 120;
observers[0].callback(); step(400);
assert.deepEqual([canvas.width, canvas.height, frames.size], [220,120,0]);
assert.equal(properties.get('--vb-hue-held'), heldHue);
off();
assert.equal(observers[0].disconnected, true);
host.clientWidth = 350; observers[0].callback();
assert.equal(frames.size, 0);
console.log('passed');
`)
})
