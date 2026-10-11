import type { PulseDriverConfig } from './styles';
interface PulseInstance {
    el: HTMLElement;
    config: PulseDriverConfig;
}
const instances = new Set<PulseInstance>();
let rafId: number | null = null;
let lastFrame = 0;
const FRAME_INTERVAL = 1000 / 30 - 2;
const TWO_PI = Math.PI * 2;
function now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
function pingPong(phase: number): number {
    return (1 - Math.cos(TWO_PI * phase)) / 2;
}
function frame(ts: number): void {
    rafId = requestAnimationFrame(frame);
    if (ts - lastFrame < FRAME_INTERVAL)
        return;
    lastFrame = ts;
    const tSec = ts / 1000;
    instances.forEach(({ el, config }) => {
        for (const osc of config.oscillators) {
            const phase = (tSec - osc.delay) / osc.period;
            const value = osc.a + (osc.b - osc.a) * pingPong(phase);
            el.style.setProperty(osc.prop, osc.unit === 'px' ? `${value.toFixed(2)}px` : value.toFixed(4));
        }
        if (config.hue) {
            const { prop, range, period, continuous } = config.hue;
            const value = continuous
                ? ((tSec / period) % 1) * range
                : -range + 2 * range * pingPong(tSec / period);
            el.style.setProperty(prop, `${value.toFixed(2)}deg`);
        }
    });
}
function startLoop(): void {
    if (rafId == null) {
        lastFrame = 0;
        rafId = requestAnimationFrame(frame);
    }
}
function stopLoopIfIdle(): void {
    if (instances.size === 0 && rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}
export function registerPulseInstance(el: HTMLElement, config: PulseDriverConfig): () => void {
    const instance: PulseInstance = { el, config };
    instances.add(instance);
    startLoop();
    return () => {
        instances.delete(instance);
        stopLoopIfIdle();
    };
}
