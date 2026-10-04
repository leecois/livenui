import { REFLECTION_INTERVAL_MS } from '../perfConfig';
import { paintReflections } from './paint';
let scheduled = false;
let lastReflectionMs = 0;
export function scheduleReflectionPaint(): void {
    if (scheduled)
        return;
    scheduled = true;
    if (typeof requestAnimationFrame === 'undefined')
        return;
    requestAnimationFrame((now) => {
        scheduled = false;
        if (now - lastReflectionMs < REFLECTION_INTERVAL_MS)
            return;
        lastReflectionMs = now;
        paintReflections();
    });
}
