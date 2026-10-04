import { expect, test } from 'bun:test'
import { fileURLToPath } from 'node:url'

const hook = fileURLToPath(new URL('../packages/voice-glow/src/useMicrophone.ts', import.meta.url))

test('microphone shares pending capture and releases ended tracks and listeners', async () => {
  const probe = `
    import assert from 'node:assert/strict'
    import { mock } from 'bun:test'
    const effects = []
    const state = []
    mock.module('react', () => ({
      useCallback: (fn) => fn,
      useEffect: (fn) => effects.push(fn),
      useRef: (value) => ({ current: value }),
      useState: (value) => {
        const index = state.length
        state.push(typeof value === 'function' ? value() : value)
        return [state[index], (next) => state[index] = next]
      },
    }))
    let calls = 0
    let resolveCapture
    Object.defineProperty(globalThis, 'navigator', {
      value: { mediaDevices: { getUserMedia: () => {
        calls++
        return new Promise((resolve) => resolveCapture = resolve)
      } } },
      configurable: true,
    })
    const { useMicrophone } = await import(${JSON.stringify(hook)})
    const mic = useMicrophone()
    const cleanups = effects.map((effect) => effect())
    const first = mic.start()
    assert.equal(mic.start(), first)
    await Promise.resolve()
    assert.equal(calls, 1)
    let stops = 0
    let listeners = 0
    const track = new EventTarget()
    const add = track.addEventListener.bind(track)
    const remove = track.removeEventListener.bind(track)
    track.addEventListener = (...args) => { listeners++; add(...args) }
    track.removeEventListener = (...args) => { listeners--; remove(...args) }
    track.stop = () => stops++
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] }
    resolveCapture(stream)
    assert.equal(await first, stream)
    assert.equal(state[1], 'live')
    assert.equal(listeners, 1)
    track.dispatchEvent(new Event('ended'))
    assert.equal(stops, 1)
    assert.equal(listeners, 0)
    assert.equal(state[0], null)
    assert.equal(state[1], 'idle')
    cleanups.forEach((cleanup) => cleanup?.())
    assert.equal(stops, 1)
  `
  const process = Bun.spawn([Bun.which('bun') ?? 'bun', '-e', probe], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [exit, error] = await Promise.all([process.exited, new Response(process.stderr).text()])
  expect(error).toBe('')
  expect(exit).toBe(0)
})
