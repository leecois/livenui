import type { DeformFn } from './core';
export interface OutlineBuf {
    xy: Float32Array;
    n: number;
}
const ARC_N = 14;
const EDGE_STEP = 1.5;
const _o = { x: 0, y: 0 };
export function createOutlineBuf(capacity = 512): OutlineBuf {
    return { xy: new Float32Array(capacity * 2), n: 0 };
}
export function roundRectOutline(x: number, y: number, w: number, h: number, r: number, deform: DeformFn | null, buf: OutlineBuf = createOutlineBuf()): OutlineBuf {
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    const need = 4 * (ARC_N + 1) + Math.ceil((2 * (w + h)) / EDGE_STEP) + 8;
    if (buf.xy.length < need * 2)
        buf.xy = new Float32Array(need * 2);
    const xy = buf.xy;
    let n = 0;
    const push = (px: number, py: number) => {
        if (deform) {
            deform(px, py, _o);
            xy[n * 2] = _o.x;
            xy[n * 2 + 1] = _o.y;
        }
        else {
            xy[n * 2] = px;
            xy[n * 2 + 1] = py;
        }
        n++;
    };
    const edge = (x0: number, y0: number, x1: number, y1: number) => {
        const len = Math.hypot(x1 - x0, y1 - y0);
        const k = Math.max(1, Math.ceil(len / EDGE_STEP));
        for (let i = 0; i < k; i++) {
            const t = i / k;
            push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
        }
    };
    const arc = (cx: number, cy: number, a0: number, a1: number) => {
        for (let i = 0; i <= ARC_N; i++) {
            const a = a0 + (a1 - a0) * (i / ARC_N);
            push(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
    };
    edge(x + r, y, x + w - r, y);
    arc(x + w - r, y + r, -Math.PI / 2, 0);
    edge(x + w, y + r, x + w, y + h - r);
    arc(x + w - r, y + h - r, 0, Math.PI / 2);
    edge(x + w - r, y + h, x + r, y + h);
    arc(x + r, y + h - r, Math.PI / 2, Math.PI);
    edge(x, y + h - r, x, y + r);
    arc(x + r, y + r, Math.PI, 1.5 * Math.PI);
    buf.n = n;
    return buf;
}
export function outlinePathD(buf: OutlineBuf): string {
    const { xy, n } = buf;
    if (n === 0)
        return '';
    let d = `M${xy[0].toFixed(2)} ${xy[1].toFixed(2)}`;
    for (let i = 1; i < n; i++)
        d += `L${xy[i * 2].toFixed(2)} ${xy[i * 2 + 1].toFixed(2)}`;
    return d + 'Z';
}
