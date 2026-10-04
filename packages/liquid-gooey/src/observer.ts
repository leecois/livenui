import { measureRadius } from './geometry';
const viteHot = (import.meta as {
    hot?: {
        accept(cb: () => void): void;
        invalidate(): void;
    };
}).hot;
if (viteHot)
    viteHot.accept(() => viteHot.invalidate());
export interface BlendConfig {
    host: SVGGElement;
    blur: number;
    warp: number;
    pull: number;
    range?: number;
    zone?: number;
    mix?: number;
    gravity?: number;
    taper?: number;
    detail?: number;
    warpFreq?: number;
    flowSpeed?: number;
    warpStyle?: 'fractalNoise' | 'turbulence';
    active?: boolean;
    releaseMs?: number;
    fadeMs?: number;
    strength?: number;
    sink?: number;
    surface?: 'liquid' | 'image';
    seamBlur?: number;
}
export interface EvolveOptions {
    massStiffness?: number;
    massDamping?: number;
    sizeStiffness?: number;
    sizeDamping?: number;
    radiusStiffness?: number;
    radiusDamping?: number;
    contentBlur?: number;
    roundness?: number;
    cornerDuration?: number;
    cornerDelay?: number;
    cornerEase?: string;
    anticipation?: number;
    travel?: number;
}
export const EVOLVE_DEFAULTS: Required<EvolveOptions> = {
    massStiffness: 320,
    massDamping: 17,
    sizeStiffness: 170,
    sizeDamping: 11.5,
    radiusStiffness: 900,
    radiusDamping: 60,
    contentBlur: 7,
    roundness: 1,
    cornerDuration: 460,
    cornerDelay: 0,
    cornerEase: 'cubic-bezier(0.3, 1.05, 0.4, 1)',
    anticipation: 90,
    travel: 32,
};
const easeCache = new Map<string, (t: number) => number>();
function easingFn(spec: string): (t: number) => number {
    let fn = easeCache.get(spec);
    if (fn)
        return fn;
    const m = /cubic-bezier\(([^)]+)\)/.exec(spec);
    if (m) {
        const [x1, y1, x2, y2] = m[1].split(',').map(Number);
        fn = (t: number) => {
            if (t <= 0)
                return 0;
            if (t >= 1)
                return 1;
            let lo = 0;
            let hi = 1;
            for (let i = 0; i < 24; i++) {
                const mid = (lo + hi) / 2;
                const x = 3 * mid * (1 - mid) * (1 - mid) * x1 + 3 * mid * mid * (1 - mid) * x2 + mid ** 3;
                if (x < t)
                    lo = mid;
                else
                    hi = mid;
            }
            const u = (lo + hi) / 2;
            return 3 * u * (1 - u) * (1 - u) * y1 + 3 * u * u * (1 - u) * y2 + u ** 3;
        };
    }
    else if (spec === 'ease-in-out') {
        fn = easingFn('cubic-bezier(0.42, 0, 0.58, 1)');
    }
    else {
        fn = (t: number) => Math.min(1, Math.max(0, t));
    }
    easeCache.set(spec, fn);
    return fn;
}
export interface MoveOptions {
    stiffness?: number;
    damping?: number;
    stretch?: number;
    tail?: number;
    force?: number;
    bend?: number;
    bendX?: number;
}
export const MOVE_DEFAULTS: Required<MoveOptions> = {
    stiffness: 380,
    damping: 18,
    stretch: 0.18,
    tail: 0.46,
    force: 0.5,
    bend: 0,
    bendX: 0,
};
export interface ItemDynamics {
    evolve: boolean;
    move: boolean;
    evolveOpts?: Required<EvolveOptions>;
    moveOpts?: Required<MoveOptions>;
}
export interface ObservedTarget {
    target: HTMLElement;
    blob: SVGRectElement;
    radius?: number;
    blobInset?: number;
    bridgeGrow?: number;
    blend?: BlendConfig;
    dynamics?: ItemDynamics;
}
interface Frame {
    x: number;
    y: number;
    w: number;
    h: number;
}
interface MeltEntry {
    el: HTMLImageElement;
    rects: SVGRectElement[];
    pattern: SVGPatternElement;
    image: SVGImageElement;
    radiusPx: number;
    measured: {
        x: number;
        y: number;
        w: number;
        h: number;
        ow: number;
        oh: number;
    } | null;
    lowRes: boolean;
    lastGeom: string | null;
    lastHole: string | null;
}
interface MeltLayer {
    last?: string;
    filter: SVGElement;
    disp: SVGElement;
    blurEl: SVGElement;
    erode: SVGElement;
    turb: SVGElement;
    noiseOffset: SVGElement;
    circle: SVGCircleElement;
    gl: SVGGElement;
    shift: SVGGElement;
}
interface MeltRefs {
    layers: MeltLayer[];
    entries: MeltEntry[];
    seam: {
        gl: SVGGElement;
        filter: SVGElement;
        blurEl: SVGElement;
        circle: SVGCircleElement;
        last?: string;
    } | null;
}
const MELT_LAYERS = 3;
function cornerTotalOf(eo: Required<EvolveOptions>): number {
    return Math.max(0, eo.cornerDelay) + Math.max(1, eo.cornerDuration);
}
function pillRadius(r: number, w: number, h: number): number {
    return Math.max(0, Math.min(r, Math.min(w, h) / 2));
}
interface Sim {
    cx: number;
    cy: number;
    w: number;
    h: number;
    r: number;
    vcx: number;
    vcy: number;
    vw: number;
    vh: number;
    vr: number;
}
interface Item extends ObservedTarget {
    baseW: number;
    baseH: number;
    radiusPx: number;
    last: Frame | null;
    frame: Frame | null;
    lastBlend: {
        cx: number;
        cy: number;
        s: number;
        d: number;
        pk: string;
    } | null;
    melt: MeltRefs | null;
    sim: Sim | null;
    motionEnv: number;
    tPrev: {
        cx: number;
        cy: number;
    } | null;
    tvx: number;
    tvy: number;
    lead01: number;
    cornerT0: number;
    lastTargetMoveT: number;
    lastTargetSize: {
        w: number;
        h: number;
    } | null;
    morphActive: boolean;
    round01: number;
    tailEl: SVGCircleElement | null;
    tailMidA: SVGCircleElement | null;
    tailMidB: SVGCircleElement | null;
    tailPhase: number;
    bendCur: number;
    bendCurX: number;
    bendPathEl: SVGPathElement | null;
    lastBendD: string | null;
    lastBendVars: string | null;
    tailX: number;
    tailY: number;
    tailVx: number;
    tailVy: number;
    tailR: number;
    contentBlurred: boolean;
    lastPaint: {
        t: string;
        w: string;
        h: string;
        rx: string;
    } | null;
    lastTail: string | null;
    lastBi: number;
    biSmooth: number | null;
    meltFade: number;
    meltRel: {
        from: number;
        t: number;
    } | null;
    meltOp: number;
    meltPhase: number;
    meltPrev: {
        x: number;
        y: number;
    } | null;
    meltGeom: {
        o: Frame;
    } | null;
    meltWroteAt: number;
    meltAxis: 'x' | 'y' | null;
    meltHostLast: string | null;
    ro: ResizeObserver;
}
function springStep(cur: number, vel: number, target: number, k: number, c: number, dt: number): [
    number,
    number
] {
    const a = k * (target - cur) - c * vel;
    const v = vel + a * dt;
    return [cur + v * dt, v];
}
function springSteps(cur: number, vel: number, target: number, k: number, c: number, dt: number): [
    number,
    number
] {
    let n = Math.max(1, Math.ceil(dt * 60));
    const h = dt / n;
    let p = cur;
    let v = vel;
    while (n-- > 0) {
        const step = springStep(p, v, target, k, c, h);
        p = step[0];
        v = step[1];
    }
    return [p, v];
}
function q(v: number, step: number): number {
    return Math.round(v / step) * step;
}
const SVG_NS = 'http://www.w3.org/2000/svg';
let meltCounter = 0;
function smoothstep(t: number): number {
    const c = Math.min(1, Math.max(0, t));
    return c * c * (3 - 2 * c);
}
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs))
        el.setAttribute(k, v);
    return el;
}
function downscaleHref(el: HTMLImageElement): string | null {
    try {
        if (!el.complete || !el.naturalWidth)
            return null;
        const dw = Math.max(2, Math.min(el.naturalWidth, Math.round((el.offsetWidth || 40) * 3)));
        const dh = Math.max(2, Math.min(el.naturalHeight, Math.round((el.offsetHeight || 40) * 3)));
        if (el.naturalWidth <= dw * 1.5)
            return null;
        const cv = document.createElement('canvas');
        cv.width = dw;
        cv.height = dh;
        const c2 = cv.getContext('2d');
        if (!c2)
            return null;
        const scale = Math.max(dw / el.naturalWidth, dh / el.naturalHeight);
        const sw = dw / scale;
        const sh = dh / scale;
        c2.drawImage(el, (el.naturalWidth - sw) / 2, (el.naturalHeight - sh) / 2, sw, sh, 0, 0, dw, dh);
        return cv.toDataURL();
    }
    catch {
        return null;
    }
}
export class ObserveEngine {
    gooBlur = 6;
    private items = new Set<Item>();
    private awake = false;
    private clean = 0;
    private raf = 0;
    private sourcesReady = false;
    private mo: MutationObserver | null = null;
    private interval: ReturnType<typeof setInterval> | null = null;
    private removeListeners: Array<() => void> = [];
    constructor(private getGroup: () => HTMLElement | null) { }
    add(t: ObservedTarget): () => void {
        const item: Item = {
            ...t,
            baseW: t.target.offsetWidth || 1,
            baseH: t.target.offsetHeight || 1,
            radiusPx: this.resolveRadius(t),
            last: null,
            frame: null,
            lastBlend: null,
            melt: null,
            sim: null,
            motionEnv: 0,
            tPrev: null,
            tvx: 0,
            tvy: 0,
            lead01: 0,
            cornerT0: 0,
            lastTargetMoveT: 0,
            lastTargetSize: null,
            morphActive: false,
            round01: 0,
            tailEl: null,
            tailMidA: null,
            tailMidB: null,
            tailPhase: 0,
            bendCur: 0,
            bendCurX: 0,
            bendPathEl: null,
            lastBendD: null,
            lastBendVars: null,
            tailX: 0,
            tailY: 0,
            tailVx: 0,
            tailVy: 0,
            tailR: 0,
            contentBlurred: false,
            lastPaint: null,
            lastTail: null,
            lastBi: t.blobInset ?? 0,
            biSmooth: null,
            meltFade: 0,
            meltRel: null,
            meltOp: 1,
            meltPhase: 0,
            meltPrev: null,
            meltGeom: null,
            meltWroteAt: 0,
            meltAxis: null,
            meltHostLast: null,
            ro: new ResizeObserver(() => {
                item.baseW = t.target.offsetWidth || 1;
                item.baseH = t.target.offsetHeight || 1;
                item.radiusPx = this.resolveRadius(t);
                this.syncMelt(item);
                this.wake();
            }),
        };
        item.ro.observe(t.target);
        this.items.add(item);
        this.refreshMelt(item);
        if (t.dynamics?.move) {
            const tail = svg('circle', { cx: '0', cy: '0', r: '0' });
            const midA = svg('circle', { cx: '0', cy: '0', r: '0' });
            const midB = svg('circle', { cx: '0', cy: '0', r: '0' });
            t.blob.parentNode?.insertBefore(tail, t.blob);
            t.blob.parentNode?.insertBefore(midA, t.blob);
            t.blob.parentNode?.insertBefore(midB, t.blob);
            item.tailEl = tail;
            item.tailMidA = midA;
            item.tailMidB = midB;
            const bendPath = svg('path', { d: '' }) as SVGPathElement;
            t.blob.parentNode?.insertBefore(bendPath, t.blob);
            item.bendPathEl = bendPath;
        }
        this.ensureSources();
        this.measureAll();
        this.wake();
        return () => {
            item.ro.disconnect();
            this.items.delete(item);
            this.clearBlend(item);
            if (item.contentBlurred)
                item.target.style.removeProperty('filter');
            item.tailEl?.remove();
            item.tailMidA?.remove();
            item.tailMidB?.remove();
            item.bendPathEl?.remove();
        };
    }
    wake = (): void => {
        this.clean = 0;
        if (this.awake || this.items.size === 0)
            return;
        this.awake = true;
        this.raf = requestAnimationFrame(this.loop);
    };
    dispose(): void {
        cancelAnimationFrame(this.raf);
        this.mo?.disconnect();
        this.removeListeners.forEach(off => off());
        this.removeListeners = [];
        if (this.interval)
            clearInterval(this.interval);
        this.items.forEach(i => i.ro.disconnect());
        this.items.clear();
        this.awake = false;
        this.sourcesReady = false;
    }
    private resolveRadius(t: ObservedTarget): number {
        if (t.radius != null)
            return t.radius;
        return measureRadius(t.target, t.target.offsetWidth, t.target.offsetHeight)[0];
    }
    private syncMelt(item: Item): void {
        if (!item.blend)
            return;
        const melt = item.melt;
        const t = item.target;
        const imgs = t instanceof HTMLImageElement
            ? [t]
            : (Array.from(t.querySelectorAll('img')) as HTMLImageElement[]);
        const same = !!melt &&
            melt.entries.length === imgs.length &&
            melt.entries.every((e, i) => e.el === imgs[i]);
        if (!same) {
            this.refreshMelt(item);
            return;
        }
        for (const entry of melt.entries) {
            entry.radiusPx = measureRadius(entry.el, entry.el.offsetWidth, entry.el.offsetHeight)[0];
            entry.lastGeom = null;
        }
    }
    private refreshMelt(item: Item): void {
        const blend = item.blend;
        if (!blend)
            return;
        const host = blend.host;
        while (host.firstChild)
            host.removeChild(host.firstChild);
        const t = item.target;
        const imgs = t instanceof HTMLImageElement
            ? [t]
            : (Array.from(t.querySelectorAll('img')) as HTMLImageElement[]);
        const uid = `gooey-melt-${++meltCounter}`;
        const seed = String((meltCounter * 7) % 100);
        const zone = blend.zone ?? this.gooBlur * 2.2 + 4;
        const freqK = Math.max(0.2, blend.warpFreq ?? 1);
        const bf = Math.min(0.3, Math.max(0.01, freqK / (zone * 1.1))).toFixed(4);
        const octaves = String(Math.max(1, Math.round(blend.detail ?? 2)));
        const noiseType = blend.warpStyle ?? 'fractalNoise';
        const defs = svg('defs', {});
        const gradient = svg('radialGradient', { id: `${uid}-g` });
        gradient.append(svg('stop', { offset: '0%', 'stop-color': '#fff' }), svg('stop', { offset: '55%', 'stop-color': '#fff' }), svg('stop', { offset: '78%', 'stop-color': '#fff', 'stop-opacity': '0.55' }), svg('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': '0' }));
        defs.append(gradient);
        const mkLayer = (suffix: string) => {
            const filter = svg('filter', {
                id: `${uid}-f${suffix}`,
                filterUnits: 'userSpaceOnUse',
                x: '0',
                y: '0',
                width: '0',
                height: '0',
                'color-interpolation-filters': 'sRGB',
            });
            const turb = svg('feTurbulence', {
                type: noiseType,
                baseFrequency: bf,
                numOctaves: octaves,
                seed,
                result: 'noise0',
            });
            filter.append(turb);
            const noiseOffset = svg('feOffset', { in: 'noise0', dx: '0', dy: '0', result: 'noise' });
            const disp = svg('feDisplacementMap', {
                in: 'SourceGraphic',
                in2: 'noise',
                scale: '0',
                xChannelSelector: 'R',
                yChannelSelector: 'G',
                result: 'disp',
            });
            filter.append(noiseOffset);
            const blurEl = svg('feGaussianBlur', { in: 'disp', stdDeviation: '0', result: 'soft' });
            const sat = svg('feColorMatrix', {
                in: 'soft',
                type: 'saturate',
                values: '1.2',
                result: 'col',
            });
            const erode = svg('feColorMatrix', {
                in: 'noise',
                type: 'matrix',
                values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1',
                result: 'erode',
            });
            const clip = svg('feComposite', { in: 'col', in2: 'erode', operator: 'in' });
            filter.append(disp, blurEl, sat, erode, clip);
            const mask = svg('mask', {
                id: `${uid}-m${suffix}`,
                maskUnits: 'userSpaceOnUse',
                x: '-10000',
                y: '-10000',
                width: '20000',
                height: '20000',
            });
            const circle = svg('circle', { cx: '0', cy: '0', r: '0', fill: `url(#${uid}-g)` });
            mask.append(circle);
            defs.append(filter, mask);
            const gl = svg('g', {});
            gl.setAttribute('mask', `url(#${uid}-m${suffix})`);
            gl.setAttribute('opacity', '0');
            const filtered = svg('g', {});
            filtered.setAttribute('filter', `url(#${uid}-f${suffix})`);
            const shift = svg('g', {});
            filtered.append(shift);
            gl.append(filtered);
            return { filter, disp, blurEl, erode, turb, noiseOffset, circle, gl, shift };
        };
        const layers = Array.from({ length: MELT_LAYERS }, (_, i) => mkLayer(`l${i}`));
        host.append(defs, ...layers.map(l => l.gl));
        let seam: NonNullable<MeltRefs['seam']> | null = null;
        if ((blend.seamBlur ?? 1) > 0) {
            const filter = svg('filter', {
                id: `${uid}-fs`,
                filterUnits: 'userSpaceOnUse',
                x: '0',
                y: '0',
                width: '0',
                height: '0',
                'color-interpolation-filters': 'sRGB',
            });
            const blurEl = svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '0' });
            filter.append(blurEl);
            const mask = svg('mask', {
                id: `${uid}-ms`,
                maskUnits: 'userSpaceOnUse',
                x: '-10000',
                y: '-10000',
                width: '20000',
                height: '20000',
            });
            const circle = svg('circle', { cx: '0', cy: '0', r: '0', fill: `url(#${uid}-g)` });
            mask.append(circle);
            defs.append(filter, mask);
            const gl = svg('g', {});
            gl.setAttribute('mask', `url(#${uid}-ms)`);
            gl.setAttribute('opacity', '0');
            const filtered = svg('g', {});
            filtered.setAttribute('filter', `url(#${uid}-fs)`);
            gl.append(filtered);
            host.insertBefore(gl, defs.nextSibling);
            seam = { gl, filter, blurEl, circle: circle as SVGCircleElement };
        }
        const entries: MeltEntry[] = imgs.map((el, i) => {
            const pattern = svg('pattern', {
                id: `${uid}-p${i}`,
                patternUnits: 'userSpaceOnUse',
                x: '0',
                y: '0',
                width: '1',
                height: '1',
            });
            const image = svg('image', { width: '1', height: '1', preserveAspectRatio: 'xMidYMid slice' });
            image.setAttribute('href', el.currentSrc || el.src);
            pattern.append(image);
            defs.append(pattern);
            const rects = layers.map(l => {
                const rect = svg('rect', { x: '0', y: '0', width: '0', height: '0', fill: `url(#${uid}-p${i})` });
                l.shift.append(rect);
                return rect;
            });
            if (seam) {
                const rect = svg('rect', { x: '0', y: '0', width: '0', height: '0', fill: `url(#${uid}-p${i})` });
                seam.gl.firstElementChild!.append(rect);
                rects.push(rect);
            }
            const radiusPx = measureRadius(el, el.offsetWidth, el.offsetHeight)[0];
            return {
                el,
                rects,
                pattern,
                image,
                radiusPx,
                lowRes: false,
                measured: null,
                lastGeom: null,
                lastHole: null,
            };
        });
        host.setAttribute('opacity', '0');
        item.melt = { layers, entries, seam };
        if (blend.surface === 'image' && imgs[0]) {
            const bp = svg('pattern', {
                id: `${uid}-bp`,
                patternUnits: 'objectBoundingBox',
                patternContentUnits: 'objectBoundingBox',
                width: '1',
                height: '1',
            });
            const bpImage = svg('image', {
                width: '1',
                height: '1',
                preserveAspectRatio: 'xMidYMid slice',
            });
            bpImage.setAttribute('href', imgs[0].currentSrc || imgs[0].src);
            bp.append(bpImage);
            defs.append(bp);
            item.blob.setAttribute('fill', `url(#${uid}-bp)`);
        }
        else {
            item.blob.removeAttribute('fill');
        }
    }
    private clearBlend(item: Item): void {
        item.blend?.host.setAttribute('opacity', '0');
        item.meltHostLast = null;
        item.meltWroteAt = 0;
        item.meltAxis = null;
        for (const layer of item.melt?.layers ?? [])
            layer.last = undefined;
        if (item.melt?.seam) {
            item.melt.seam.last = undefined;
            item.melt.seam.gl.setAttribute('opacity', '0');
        }
        for (const entry of item.melt?.entries ?? []) {
            entry.el.style.removeProperty('mask-image');
            entry.el.style.removeProperty('-webkit-mask-image');
            entry.el.style.removeProperty('mask-composite');
            entry.el.style.removeProperty('-webkit-mask-composite');
            entry.lastHole = null;
            entry.lastGeom = null;
        }
    }
    private lastNow = 0;
    private frameEma = 17;
    private loop = (now: number): void => {
        if (this.items.size === 0) {
            this.awake = false;
            this.lastNow = 0;
            return;
        }
        const dt = this.lastNow ? Math.min(0.25, Math.max(1 / 240, (now - this.lastNow) / 1000)) : 1 / 60;
        if (this.lastNow) {
            this.frameEma += (Math.min(now - this.lastNow, 80) - this.frameEma) * 0.12;
        }
        this.lastNow = now;
        if (this.measureAll(dt))
            this.clean = 0;
        else
            this.clean++;
        if (this.clean > 30) {
            this.awake = false;
            this.lastNow = 0;
            return;
        }
        this.raf = requestAnimationFrame(this.loop);
    };
    private measureAll(dt = 1 / 60): boolean {
        const group = this.getGroup();
        if (!group || this.items.size === 0)
            return false;
        const g = group.getBoundingClientRect();
        let changed = false;
        for (const item of this.items) {
            const r = item.target.getBoundingClientRect();
            item.frame = { x: r.left - g.left, y: r.top - g.top, w: r.width, h: r.height };
        }
        for (const item of this.items) {
            if (!item.blend || !item.melt)
                continue;
            for (const entry of item.melt.entries) {
                const ir = entry.el.getBoundingClientRect();
                entry.measured = {
                    x: ir.left - g.left,
                    y: ir.top - g.top,
                    w: ir.width,
                    h: ir.height,
                    ow: entry.el.offsetWidth,
                    oh: entry.el.offsetHeight,
                };
            }
        }
        for (const item of this.items) {
            if (this.writeBlob(item, dt))
                changed = true;
        }
        for (const item of this.items) {
            if (item.blend && this.writeBlend(item, dt))
                changed = true;
        }
        return changed;
    }
    private effectiveInset(item: Item, dt: number): number {
        let bi = item.blobInset ?? 0;
        const grow = item.bridgeGrow ?? 0;
        if (grow > 0 && item.frame) {
            const f = item.frame;
            const range = Math.max(14, this.gooBlur * 3);
            let best = Infinity;
            for (const other of this.items) {
                if (other === item || !other.frame)
                    continue;
                const o = other.frame;
                const dx = Math.max(o.x - (f.x + f.w), f.x - (o.x + o.w), 0);
                const dy = Math.max(o.y - (f.y + f.h), f.y - (o.y + o.h), 0);
                const gap = Math.hypot(dx, dy);
                if (gap < best)
                    best = gap;
            }
            if (best < range)
                bi -= grow * smoothstep(1 - best / range);
        }
        if (grow <= 0) {
            item.biSmooth = bi;
            return bi;
        }
        if (item.biSmooth === null)
            item.biSmooth = bi;
        else
            item.biSmooth += (bi - item.biSmooth) * Math.min(1, dt * 18);
        return item.biSmooth;
    }
    private writeBlob(item: Item, dt: number): boolean {
        const f = item.frame!;
        const dyn = item.dynamics;
        if (!dyn || (!dyn.evolve && !dyn.move)) {
            const bi = this.effectiveInset(item, dt);
            const last = item.last;
            const frameChanged = !last ||
                Math.abs(last.x - f.x) >= 0.05 ||
                Math.abs(last.y - f.y) >= 0.05 ||
                Math.abs(last.w - f.w) >= 0.05 ||
                Math.abs(last.h - f.h) >= 0.05;
            const biChanged = Math.abs(bi - item.lastBi) >= 0.05;
            if (!frameChanged && !biChanged)
                return false;
            item.blob.style.transform = `translate(${f.x + bi}px, ${f.y + bi}px)`;
            if (frameChanged || biChanged) {
                const bw = Math.max(0, f.w - bi * 2);
                const bh = Math.max(0, f.h - bi * 2);
                item.blob.setAttribute('width', String(bw));
                item.blob.setAttribute('height', String(bh));
                const scale = item.baseW > 0 ? f.w / item.baseW : 1;
                item.blob.setAttribute('rx', String(pillRadius(item.radiusPx * scale - bi, bw, bh)));
            }
            item.lastPaint = null;
            item.last = f;
            item.lastBi = bi;
            return true;
        }
        const tcx = f.x + f.w / 2;
        const tcy = f.y + f.h / 2;
        let tr: number;
        if (dyn.evolve) {
            const ow = item.target.offsetWidth;
            const oh = item.target.offsetHeight;
            tr = measureRadius(item.target, ow, oh)[0];
        }
        else {
            tr = item.radiusPx * (item.baseW > 0 ? f.w / item.baseW : 1);
        }
        if (!item.sim) {
            item.sim = { cx: tcx, cy: tcy, w: f.w, h: f.h, r: tr, vcx: 0, vcy: 0, vw: 0, vh: 0, vr: 0 };
        }
        const s = item.sim;
        if (dyn.move) {
            const mo = dyn.moveOpts ?? MOVE_DEFAULTS;
            [s.cx, s.vcx] = springSteps(s.cx, s.vcx, tcx, mo.stiffness, mo.damping, dt);
            [s.cy, s.vcy] = springSteps(s.cy, s.vcy, tcy, mo.stiffness, mo.damping, dt);
        }
        else if (dyn.evolve) {
            const eo = dyn.evolveOpts ?? EVOLVE_DEFAULTS;
            const rawVx = item.tPrev ? (tcx - item.tPrev.cx) / dt : 0;
            const rawVy = item.tPrev ? (tcy - item.tPrev.cy) / dt : 0;
            item.tvx = item.tvx * 0.7 + rawVx * 0.3;
            item.tvy = item.tvy * 0.7 + rawVy * 0.3;
            item.tPrev = { cx: tcx, cy: tcy };
            const remX = tcx - s.cx;
            const remY = tcy - s.cy;
            const rem = Math.hypot(remX, remY);
            const vMag = Math.hypot(item.tvx, item.tvy);
            let dx = 0;
            let dy = 0;
            if (vMag > 1e-3) {
                dx = item.tvx / vMag;
                dy = item.tvy / vMag;
            }
            else if (rem > 1e-3) {
                dx = remX / rem;
                dy = remY / rem;
            }
            const tau = Math.max(0, eo.anticipation) / 1000;
            const k = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;
            item.lead01 += ((rem > 0.5 ? 1 : 0) - item.lead01) * k;
            const reach = Math.min(Math.max(0, eo.travel) * item.lead01, rem);
            const ox = dx * reach;
            const oy = dy * reach;
            [s.cx, s.vcx] = springSteps(s.cx, s.vcx, tcx + ox, eo.massStiffness, eo.massDamping, dt);
            [s.cy, s.vcy] = springSteps(s.cy, s.vcy, tcy + oy, eo.massStiffness, eo.massDamping, dt);
        }
        else {
            s.cx = tcx;
            s.cy = tcy;
            s.vcx = 0;
            s.vcy = 0;
        }
        if (dyn.evolve) {
            const eo = dyn.evolveOpts ?? EVOLVE_DEFAULTS;
            [s.w, s.vw] = springSteps(s.w, s.vw, f.w, eo.sizeStiffness, eo.sizeDamping, dt);
            [s.h, s.vh] = springSteps(s.h, s.vh, f.h, eo.sizeStiffness, eo.sizeDamping, dt);
            [s.r, s.vr] = springSteps(s.r, s.vr, tr, eo.radiusStiffness, eo.radiusDamping, dt);
        }
        else {
            s.w = f.w;
            s.h = f.h;
            s.r = tr;
            s.vw = 0;
            s.vh = 0;
            s.vr = 0;
        }
        let extra = '';
        const speed = Math.hypot(s.vcx, s.vcy);
        if (dyn.move && speed > 2) {
            const st = Math.min((dyn.moveOpts ?? MOVE_DEFAULTS).stretch, speed * 0.0006);
            const a = Math.round(Math.atan2(s.vcy, s.vcx) * 100) / 100;
            extra += ` rotate(${a}rad) scale(${(1 + st).toFixed(3)}, ${(1 / (1 + st * 0.65)).toFixed(3)}) rotate(${-a}rad)`;
        }
        if (dyn.move && item.tailEl) {
            const round = (v: number) => Math.round(v * 10) / 10;
            if (item.tailR === 0 && Math.abs(item.tailX) < 0.001 && Math.abs(item.tailY) < 0.001) {
                item.tailX = s.cx;
                item.tailY = s.cy;
            }
            ;
            [item.tailX, item.tailVx] = springSteps(item.tailX, item.tailVx, s.cx, 170, 22, dt);
            [item.tailY, item.tailVy] = springSteps(item.tailY, item.tailVy, s.cy, 170, 22, dt);
            const bi = item.blobInset ?? 0;
            const ux = speed > 0.001 ? s.vcx / speed : 1;
            const uy = speed > 0.001 ? s.vcy / speed : 0;
            const perp = Math.max(4, Math.abs(ux) * s.h + Math.abs(uy) * s.w - bi * 2);
            const halfAlong = (Math.abs(ux) * s.w + Math.abs(uy) * s.h) / 2;
            const base = perp / 2;
            const lagX = item.tailX - s.cx;
            const lagY = item.tailY - s.cy;
            const lag = Math.hypot(lagX, lagY);
            const mo = dyn.moveOpts ?? MOVE_DEFAULTS;
            const maxLag = halfAlong + base * (0.2 + mo.force * 1.6);
            if (lag > maxLag) {
                item.tailX = s.cx + (lagX / lag) * maxLag;
                item.tailY = s.cy + (lagY / lag) * maxLag;
            }
            const tailK = mo.tail;
            const onset = Math.max(0, Math.min(1, (speed - 20) / 120));
            const targetR = base * tailK * onset;
            item.tailR += (targetR - item.tailR) * Math.min(1, dt * 10);
            if (item.tailR < 0.3) {
                if (item.lastTail !== 'hidden') {
                    item.tailEl.setAttribute('r', '0');
                    item.tailMidA?.setAttribute('r', '0');
                    item.tailMidB?.setAttribute('r', '0');
                    item.lastTail = 'hidden';
                }
            }
            else {
                item.tailPhase += speed * dt * 0.045;
                const wob = item.tailR * 0.16;
                const px = -uy;
                const py = ux;
                const w1 = Math.sin(item.tailPhase) * wob;
                const w2 = Math.sin(item.tailPhase + 2.4) * -wob;
                const aX = s.cx + lagX * 0.45 + px * w1;
                const aY = s.cy + lagY * 0.45 + py * w1;
                const bX = s.cx + lagX * 0.75 + px * w2;
                const bY = s.cy + lagY * 0.75 + py * w2;
                const tail = `${round(item.tailX)},${round(item.tailY)},${round(item.tailR)},` +
                    `${round(aX)},${round(aY)},${round(bX)},${round(bY)}`;
                if (tail !== item.lastTail) {
                    item.tailEl.setAttribute('cx', String(round(item.tailX)));
                    item.tailEl.setAttribute('cy', String(round(item.tailY)));
                    item.tailEl.setAttribute('r', String(round(item.tailR)));
                    if (item.tailMidA) {
                        item.tailMidA.setAttribute('cx', String(round(aX)));
                        item.tailMidA.setAttribute('cy', String(round(aY)));
                        item.tailMidA.setAttribute('r', String(round(item.tailR * 0.62)));
                    }
                    if (item.tailMidB) {
                        item.tailMidB.setAttribute('cx', String(round(bX)));
                        item.tailMidB.setAttribute('cy', String(round(bY)));
                        item.tailMidB.setAttribute('r', String(round(item.tailR * 0.4)));
                    }
                    item.lastTail = tail;
                }
            }
        }
        let renderR = Math.max(0, s.r);
        let cornerActive = false;
        if (dyn.evolve) {
            const eo = dyn.evolveOpts ?? EVOLVE_DEFAULTS;
            const now = performance.now();
            const prevSize = item.lastTargetSize;
            const sizeDelta = prevSize ? Math.abs(f.w - prevSize.w) + Math.abs(f.h - prevSize.h) : 0;
            if (sizeDelta > 0.5) {
                if (!item.morphActive) {
                    item.cornerT0 = now;
                    item.morphActive = true;
                }
                item.lastTargetMoveT = now;
            }
            else if (item.morphActive &&
                now - item.lastTargetMoveT > 150 &&
                now - item.cornerT0 > cornerTotalOf(eo)) {
                item.morphActive = false;
            }
            item.lastTargetSize = { w: f.w, h: f.h };
            const cornerTotal = cornerTotalOf(eo);
            let target01 = 0;
            if (item.cornerT0 > 0 && eo.roundness > 0 && now - item.cornerT0 < cornerTotal) {
                const p = Math.min(1, Math.max(0, (now - item.cornerT0 - Math.max(0, eo.cornerDelay)) / Math.max(1, eo.cornerDuration)));
                const eased = easingFn(eo.cornerEase)(p);
                target01 = Math.min(1, Math.max(0, (1 - eased) * eo.roundness));
            }
            const maxStep = dt * 8;
            item.round01 += Math.max(-maxStep, Math.min(maxStep, target01 - item.round01));
            cornerActive =
                (item.cornerT0 > 0 && now - item.cornerT0 < cornerTotal + 80) ||
                    Math.abs(target01 - item.round01) > 0.004 ||
                    item.round01 > 0.004;
            if (item.round01 > 0.001) {
                const roundTarget = Math.max(Math.min(s.w, s.h) / 2, renderR);
                renderR = renderR + (roundTarget - renderR) * item.round01;
                renderR = Math.max(renderR, tr);
            }
            const motionRaw = Math.min(1, (Math.hypot(s.vcx, s.vcy) + Math.abs(s.vw) + Math.abs(s.vh)) / 420);
            item.motionEnv = Math.max(motionRaw, item.motionEnv - dt * 1.9);
            const motion = item.motionEnv;
            const blurPx = motion * motion * Math.max(0, eo.contentBlur);
            if (blurPx > 0.3) {
                item.target.style.filter = `blur(${blurPx.toFixed(1)}px)`;
                item.contentBlurred = true;
            }
            else if (item.contentBlurred) {
                item.target.style.removeProperty('filter');
                item.contentBlurred = false;
            }
        }
        const bi = item.blobInset ?? 0;
        const bw = Math.max(0, s.w - bi * 2);
        const bh = Math.max(0, s.h - bi * 2);
        const paintRx = pillRadius(renderR - bi, bw, bh);
        let bendD = '';
        if (dyn.move && item.bendPathEl) {
            const mo = dyn.moveOpts ?? MOVE_DEFAULTS;
            const cap = Math.min(bw, bh) * 0.5;
            const bTy = Math.max(-cap, Math.min(cap, s.vcy * 0.05)) * mo.bend;
            const capX = Math.min(bw, bh) * 0.9;
            const bTx = Math.max(-capX, Math.min(capX, s.vcx * 0.09)) * mo.bendX;
            item.bendCur += (bTy - item.bendCur) * Math.min(1, dt * 9);
            item.bendCurX += (bTx - item.bendCurX) * Math.min(1, dt * 9);
            const bvx = Math.round(item.bendCurX * 10) / 10;
            const bvy = Math.round(item.bendCur * 10) / 10;
            const bendVars = `${bvx},${bvy}`;
            if (bendVars !== item.lastBendVars) {
                item.target.style.setProperty('--lg-bend-x', `${bvx}px`);
                item.target.style.setProperty('--lg-bend-y', `${bvy}px`);
                item.target.style.setProperty('--lg-bend-xn', String(bvx));
                item.target.style.setProperty('--lg-bend-yn', String(bvy));
                item.lastBendVars = bendVars;
            }
            const bendActive = Math.abs(item.bendCur) > 0.5 || Math.abs(item.bendCurX) > 0.5;
            if (bendActive && bw > 1 && bh > 1) {
                const r = Math.min(paintRx, bw / 2, bh / 2);
                const cy = Math.round(item.bendCur * 2 * 10) / 10;
                const k = item.bendCurX;
                const rxR = Math.max(r * 0.2, Math.min(r * 3, k > 0 ? r - 0.8 * k : r + 1.6 * -k));
                const rxL = Math.max(r * 0.2, Math.min(r * 3, k > 0 ? r + 1.6 * k : r - 0.8 * -k));
                const K = 0.5523;
                const f = (v: number) => Math.round(v * 10) / 10;
                bendD =
                    `M ${f(rxL)} 0 Q ${f(bw / 2)} ${cy} ${f(bw - rxR)} 0 ` +
                        `C ${f(bw - rxR + K * rxR)} 0 ${f(bw)} ${f(r - K * r)} ${f(bw)} ${f(r)} ` +
                        `L ${f(bw)} ${f(bh - r)} ` +
                        `C ${f(bw)} ${f(bh - r + K * r)} ${f(bw - rxR + K * rxR)} ${f(bh)} ${f(bw - rxR)} ${f(bh)} ` +
                        `Q ${f(bw / 2)} ${f(bh + item.bendCur * 2)} ${f(rxL)} ${f(bh)} ` +
                        `C ${f(rxL - K * rxL)} ${f(bh)} 0 ${f(bh - r + K * r)} 0 ${f(bh - r)} ` +
                        `L 0 ${f(r)} ` +
                        `C 0 ${f(r - K * r)} ${f(rxL - K * rxL)} 0 ${f(rxL)} 0 Z`;
            }
        }
        const bending = bendD !== '';
        const paint = {
            t: `translate(${s.cx - s.w / 2 + bi}px, ${s.cy - s.h / 2 + bi}px)` + extra,
            w: bending ? '0' : String(bw),
            h: String(bh),
            rx: String(paintRx),
        };
        const lp = item.lastPaint;
        if (!lp || lp.t !== paint.t)
            item.blob.style.transform = paint.t;
        if (!lp || lp.w !== paint.w)
            item.blob.setAttribute('width', paint.w);
        if (!lp || lp.h !== paint.h)
            item.blob.setAttribute('height', paint.h);
        if (!lp || lp.rx !== paint.rx)
            item.blob.setAttribute('rx', paint.rx);
        item.lastPaint = paint;
        if (item.bendPathEl) {
            if (bendD !== (item.lastBendD ?? '')) {
                item.bendPathEl.setAttribute('d', bendD);
                item.lastBendD = bendD;
            }
            if (bending)
                item.bendPathEl.style.transform = paint.t;
        }
        item.last = f;
        const settled = Math.abs(s.cx - tcx) < 0.05 &&
            Math.abs(s.cy - tcy) < 0.05 &&
            Math.abs(s.w - f.w) < 0.05 &&
            Math.abs(s.h - f.h) < 0.05 &&
            Math.abs(s.r - tr) < 0.05 &&
            speed < 1 &&
            Math.abs(s.vw) + Math.abs(s.vh) + Math.abs(s.vr) < 1 &&
            item.motionEnv < 0.01 &&
            item.tailR < 0.3 &&
            !cornerActive;
        return !settled;
    }
    private writeBlend(item: Item, dt: number): boolean {
        const f = item.frame!;
        const blend = item.blend!;
        const melt = item.melt;
        if (!melt)
            return false;
        const range = blend.range ?? Math.max(10, this.gooBlur * 2.5);
        let bestGap = Infinity;
        let bestOther: Frame | null = null;
        for (const other of this.items) {
            if (other === item || !other.frame)
                continue;
            const o = other.frame;
            const dx = Math.max(o.x - (f.x + f.w), f.x - (o.x + o.w), 0);
            const dy = Math.max(o.y - (f.y + f.h), f.y - (o.y + o.h), 0);
            const gap = Math.hypot(dx, dy);
            if (gap < bestGap) {
                bestGap = gap;
                bestOther = o;
            }
        }
        let embed = 0;
        let contactSpan = 0;
        if (bestOther && bestGap === 0) {
            const o = bestOther;
            const ox = Math.min(f.x + f.w, o.x + o.w) - Math.max(f.x, o.x);
            const oy = Math.min(f.y + f.h, o.y + o.h) - Math.max(f.y, o.y);
            const span = Math.max(1, Math.min(f.w, f.h, o.w, o.h));
            embed = Math.max(0, Math.min(ox, oy)) / span;
            contactSpan = Math.max(0, Math.max(ox, oy));
        }
        let sTarget = 0;
        if (bestOther && bestGap < range && blend.active !== false) {
            const sRaw = smoothstep(Math.min(1, (1 - bestGap / range) / 0.65));
            const strength = Math.max(0, Math.min(1, blend.strength ?? 1));
            const sink = Math.max(0.01, blend.sink ?? 0.45);
            const sunk = smoothstep(Math.max(0, Math.min(1, (embed - sink * 0.2) / Math.max(0.01, sink * 0.8))));
            sTarget = Math.pow(sRaw, 1.25) * strength * (1 - sunk);
        }
        if (sTarget >= item.meltFade) {
            item.meltFade += (sTarget - item.meltFade) * Math.min(1, dt * 16);
            item.meltRel = null;
        }
        else if (sTarget > 0.02) {
            item.meltFade += (sTarget - item.meltFade) * Math.min(1, dt * 6);
            item.meltRel = null;
        }
        else {
            const relMs = Math.max(40, Math.max(blend.releaseMs ?? 240, blend.fadeMs ?? blend.releaseMs ?? 240));
            if (!item.meltRel)
                item.meltRel = { from: item.meltFade, t: 0 };
            const rel = item.meltRel;
            rel.t += dt * 1000;
            const k = Math.min(1, rel.t / relMs);
            item.meltFade = sTarget + (rel.from - sTarget) * (1 - k) * (1 - k);
        }
        if (sTarget === 0 && item.meltFade < 0.001)
            item.meltFade = 0;
        const s = item.meltFade;
        if (s <= 0.001) {
            if (item.lastBlend && item.lastBlend.s !== 0) {
                this.clearBlend(item);
                item.lastBlend = { cx: 0, cy: 0, s: 0, d: 0, pk: '' };
                return true;
            }
            return false;
        }
        let o = bestOther;
        if ((!o || bestGap >= range) && item.meltGeom)
            o = item.meltGeom.o;
        if (!o)
            return false;
        const cx = f.x + f.w < o.x
            ? (f.x + f.w + o.x) / 2
            : o.x + o.w < f.x
                ? (o.x + o.w + f.x) / 2
                : (Math.max(f.x, o.x) + Math.min(f.x + f.w, o.x + o.w)) / 2;
        const cy = f.y + f.h < o.y
            ? (f.y + f.h + o.y) / 2
            : o.y + o.h < f.y
                ? (o.y + o.h + f.y) / 2
                : (Math.max(f.y, o.y) + Math.min(f.y + f.h, o.y + o.h)) / 2;
        item.meltGeom = { o: { ...o } };
        const rel = item.meltRel;
        const fadeMs = Math.max(40, blend.fadeMs ?? blend.releaseMs ?? 240);
        const fadeK = rel ? Math.min(1, rel.t / fadeMs) : 0;
        const relFade = rel ? (1 - fadeK) * (1 - fadeK) : 1;
        const sStruct = rel ? Math.min(1, rel.from * (0.55 + 0.45 * (1 - fadeK))) : s;
        const eStruct = sStruct * sStruct * (3 - 2 * sStruct);
        item.meltOp =
            relFade < item.meltOp
                ? relFade
                : item.meltOp + (relFade - item.meltOp) * Math.min(1, dt * 16);
        const zone = blend.zone ?? this.gooBlur * 2.2 + 4;
        const d = Math.min(Math.min(f.w, f.h) * 0.9, zone * (0.7 + 0.6 * sStruct));
        const flowSpeed = Math.max(0, blend.flowSpeed ?? 26);
        const prevPos = item.meltPrev;
        const moveSpeed = prevPos
            ? Math.hypot(f.x - prevPos.x, f.y - prevPos.y) / Math.max(1e-3, dt)
            : 0;
        item.meltPrev = { x: f.x, y: f.y };
        const phaseAdv = Math.min(dt, 1 / 24) * flowSpeed * 0.12 * Math.min(1, moveSpeed / 40);
        item.meltPhase += phaseAdv;
        const lb = item.lastBlend;
        const paramKey = `${blend.seamBlur ?? ''}/${blend.strength ?? ''}/${blend.warp}/${blend.blur}/${blend.mix ?? ''}/${blend.gravity ?? ''}`;
        if (phaseAdv < 1e-4 &&
            lb &&
            lb.pk === paramKey &&
            Math.abs(lb.cx - cx) < 0.05 &&
            Math.abs(lb.cy - cy) < 0.05 &&
            Math.abs(lb.s - s) < 0.005 &&
            Math.abs(lb.d - d) < 0.05) {
            return false;
        }
        const nowMs = performance.now();
        if (this.frameEma > 20 && nowMs - item.meltWroteAt < 35)
            return true;
        item.meltWroteAt = nowMs;
        const round = (v: number) => Math.round(v * 10) / 10;
        const host = blend.host;
        const n = melt.layers.length;
        const ncx = o.x + o.w / 2;
        const ncy = o.y + o.h / 2;
        const gdx = ncx - cx;
        const gdy = ncy - cy;
        const gdl = Math.hypot(gdx, gdy) || 1;
        const gux = gdx / gdl;
        const guy = gdy / gdl;
        const gAmt = Math.max(0, blend.gravity ?? 25) * eStruct;
        const gDeg = round((Math.atan2(guy, gux) * 180) / Math.PI);
        const r3 = (v: number) => Math.round(v * 1000) / 1000;
        const taper = Math.max(0, Math.min(1, blend.taper ?? 0.65));
        const freqK = Math.max(0.2, blend.warpFreq ?? 1);
        const zoneBase = blend.zone ?? this.gooBlur * 2.2 + 4;
        const bfBase = Math.min(0.3, Math.max(0.01, freqK / (zoneBase * 1.1)));
        const alongF = (bfBase * 0.35).toFixed(4);
        const acrossF = (bfBase * 1.6).toFixed(4);
        const ax = Math.abs(gux);
        const ay = Math.abs(guy);
        const axis: 'x' | 'y' = item.meltAxis === 'x'
            ? ay > ax * 1.25 ? 'y' : 'x'
            : item.meltAxis === 'y'
                ? ax > ay * 1.25 ? 'x' : 'y'
                : ax >= ay ? 'x' : 'y';
        item.meltAxis = axis;
        const bfStr = axis === 'x' ? `${alongF} ${acrossF}` : `${acrossF} ${alongF}`;
        const bx = cx + gux * d * 0.05;
        const by = cy + guy * d * 0.05;
        const layerVals: string[][] = melt.layers.map((_, i) => {
            const t = n > 1 ? i / (n - 1) : 1;
            const blurK = 0.15 + 0.85 * Math.pow(t, 1.4);
            const warpK = 0.45 + 0.55 * t;
            const pr = 0.7 + 0.45 * t;
            const oa = 6 * Math.sin(item.meltPhase * pr);
            const ob = 2 * Math.sin(item.meltPhase * pr * 1.31 + 1.7);
            return [
                String(q(blend.warp * warpK * eStruct, 0.25)),
                String(q(blend.blur * blurK * eStruct, 0.25)),
                String(q(gux * oa - guy * ob, 0.5)),
                String(q(guy * oa + gux * ob, 0.5)),
                String(q(bx, 0.5)),
                String(q(by, 0.5)),
                String(q(d * (0.95 - 0.55 * t), 0.5)),
                String(q(Math.min(1, eStruct * (0.75 + 0.25 * t)), 0.02)),
            ];
        });
        const anchorX = cx - gux * d;
        const anchorY = cy - guy * d;
        const settle = 1 - 0.45 * smoothstep(Math.min(1, embed * 2.2));
        const kFlow = Math.min(2.2, (gAmt + bestGap) / Math.max(8, 2 * d)) * (0.5 + taper) * settle;
        const flow = (k: number) => {
            const sx = r3(1 + kFlow * k);
            const sy = r3(1 / (1 + kFlow * 0.35 * k));
            return (`translate(${round(anchorX)}, ${round(anchorY)}) rotate(${gDeg}) ` +
                `scale(${sx}, ${sy}) ` +
                `rotate(${-gDeg}) translate(${round(-anchorX)}, ${round(-anchorY)})`);
        };
        const mixAmt = Math.max(0, Math.min(1, blend.mix ?? 0)) * eStruct;
        const erodeRow = (amt: number) => {
            if (amt < 0.002)
                return '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1';
            const k = r3(1 + 4 * amt);
            const c = r3(1 - k * (0.38 + 0.12 * amt));
            return `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${k} 0 0 0 ${c}`;
        };
        const elong = q(1 + Math.min(1.8, bestGap / Math.max(8, 2 * d)), 0.05);
        const zoneT = elong > 1.001
            ? `translate(${round(bx)}, ${round(by)}) rotate(${gDeg}) ` +
                `scale(${r3(elong)}, 1) ` +
                `rotate(${-gDeg}) translate(${round(-bx)}, ${round(-by)})`
            : '';
        const spread = blend.blur * 2.5 + blend.warp + gAmt * 0.5 + kFlow * d + 8;
        const rr = q(d * 1.15 * elong + spread, 8);
        const regionX = String(q(bx - rr, 8));
        const regionY = String(q(by - rr, 8));
        const regionW = String(q(rr * 2, 8));
        melt.layers.forEach((layer, i) => {
            const t = n > 1 ? i / (n - 1) : 1;
            const v = layerVals[i];
            const shiftT = flow(0.4 + 0.6 * t);
            const erodeV = erodeRow(q(mixAmt * (0.15 + 0.85 * t), 0.01));
            const fp = v.join(',') + '|' + bfStr + '|' + shiftT + '|' + erodeV + '|' + zoneT +
                '|' + regionX + ',' + regionY + ',' + regionW;
            if (layer.last === fp)
                return;
            layer.last = fp;
            layer.filter.setAttribute('x', regionX);
            layer.filter.setAttribute('y', regionY);
            layer.filter.setAttribute('width', regionW);
            layer.filter.setAttribute('height', regionW);
            layer.disp.setAttribute('scale', v[0]);
            layer.blurEl.setAttribute('stdDeviation', v[1]);
            if (layer.turb.getAttribute('baseFrequency') !== bfStr) {
                layer.turb.setAttribute('baseFrequency', bfStr);
            }
            layer.noiseOffset.setAttribute('dx', v[2]);
            layer.noiseOffset.setAttribute('dy', v[3]);
            layer.circle.setAttribute('cx', v[4]);
            layer.circle.setAttribute('cy', v[5]);
            layer.circle.setAttribute('r', v[6]);
            if (zoneT)
                layer.circle.setAttribute('transform', zoneT);
            else
                layer.circle.removeAttribute('transform');
            layer.gl.setAttribute('opacity', v[7]);
            layer.shift.setAttribute('transform', shiftT);
            layer.erode.setAttribute('values', erodeV);
        });
        if (melt.seam) {
            const seam = melt.seam;
            const sBlur = q((blend.seamBlur ?? blend.blur * 1.6) * eStruct, 0.25);
            const sOp = q(Math.min(1, eStruct * 1.2) * 0.55, 0.02);
            const sR = q(d * 1.25, 0.5);
            const fp = `${sBlur}|${sOp}|${q(bx, 0.5)},${q(by, 0.5)},${sR}|${zoneT}` +
                `|${regionX},${regionY},${regionW}`;
            if (seam.last !== fp) {
                seam.last = fp;
                seam.filter.setAttribute('x', regionX);
                seam.filter.setAttribute('y', regionY);
                seam.filter.setAttribute('width', regionW);
                seam.filter.setAttribute('height', regionW);
                seam.blurEl.setAttribute('stdDeviation', String(sBlur));
                seam.circle.setAttribute('cx', String(q(bx, 0.5)));
                seam.circle.setAttribute('cy', String(q(by, 0.5)));
                seam.circle.setAttribute('r', String(sR));
                if (zoneT)
                    seam.circle.setAttribute('transform', zoneT);
                else
                    seam.circle.removeAttribute('transform');
                seam.gl.setAttribute('opacity', String(sOp));
            }
        }
        const icx = f.x + f.w / 2;
        const icy = f.y + f.h / 2;
        const ang = Math.atan2(cy - icy, cx - icx);
        const pull = blend.pull * sStruct;
        const hostStr = r3(item.meltOp).toString() +
            '|' +
            `translate(${round(Math.cos(ang) * pull)}px, ${round(Math.sin(ang) * pull)}px)`;
        if (hostStr !== item.meltHostLast) {
            item.meltHostLast = hostStr;
            const parts = hostStr.split('|');
            host.setAttribute('opacity', parts[0]);
            host.style.transform = parts[1];
        }
        const bridgeRange = Math.max(10, this.gooBlur * 2.5);
        const sBridge = bestOther
            ? bestGap < bridgeRange
                ? smoothstep(1 - bestGap / bridgeRange)
                : 0
            : s;
        const holeAlpha = q(Math.max(0, 1 - Math.min(s, sBridge) * 2.2), 0.05).toFixed(2);
        const holeMid = (Math.round(((1 + 2 * Number(holeAlpha)) / 3) * 20) / 20).toFixed(2);
        for (const entry of melt.entries) {
            if (!entry.lowRes) {
                const lo = downscaleHref(entry.el);
                if (lo) {
                    entry.image.setAttribute('href', lo);
                    entry.lowRes = true;
                }
                else if (entry.el.complete && entry.el.naturalWidth) {
                    entry.lowRes = true;
                }
            }
            const ir = entry.measured;
            if (!ir || ir.w < 1 || ir.h < 1)
                continue;
            const ix = ir.x;
            const iy = ir.y;
            const kx = (ir.ow || ir.w) / ir.w;
            const geom = `${round(ix)},${round(iy)},${round(ir.w)},${round(ir.h)},${round(pillRadius(entry.radiusPx / (kx || 1), ir.w, ir.h))}`;
            if (geom !== entry.lastGeom) {
                entry.lastGeom = geom;
                for (const rect of entry.rects) {
                    rect.setAttribute('x', String(round(ix)));
                    rect.setAttribute('y', String(round(iy)));
                    rect.setAttribute('width', String(round(ir.w)));
                    rect.setAttribute('height', String(round(ir.h)));
                    rect.setAttribute('rx', String(round(pillRadius(entry.radiusPx / (kx || 1), ir.w, ir.h))));
                }
                entry.pattern.setAttribute('x', String(round(ix)));
                entry.pattern.setAttribute('y', String(round(iy)));
                entry.pattern.setAttribute('width', String(round(ir.w)));
                entry.pattern.setAttribute('height', String(round(ir.h)));
                entry.image.setAttribute('width', String(round(ir.w)));
                entry.image.setAttribute('height', String(round(ir.h)));
            }
            const ky = (ir.oh || ir.h) / ir.h;
            const gapToImg = Math.hypot(Math.max(ix - cx, cx - (ix + ir.w), 0), Math.max(iy - cy, cy - (iy + ir.h), 0));
            if (gapToImg > d) {
                if (entry.lastHole !== null) {
                    entry.lastHole = null;
                    entry.el.style.removeProperty('mask-image');
                    entry.el.style.removeProperty('-webkit-mask-image');
                    entry.el.style.removeProperty('mask-composite');
                    entry.el.style.removeProperty('-webkit-mask-composite');
                }
                continue;
            }
            const ow = ir.ow || ir.w;
            const oh = ir.oh || ir.h;
            const rim = Math.min(ow, oh) / 2;
            let lx = (cx - ix) * kx;
            let ly = (cy - iy) * ky;
            let vx = lx - ow / 2;
            let vy = ly - oh / 2;
            const vlen = Math.hypot(vx, vy);
            if (vlen < rim) {
                if (vlen < 1e-3) {
                    vx = gux;
                    vy = guy;
                }
                else {
                    vx /= vlen;
                    vy /= vlen;
                }
                lx = ow / 2 + vx * rim;
                ly = oh / 2 + vy * rim;
            }
            const hx = Math.round(lx);
            const hy = Math.round(ly);
            const hd = q(Math.min(Math.max(d, contactSpan * 0.75) * Math.min(kx, ky), rim), 1);
            const far = round(Math.max(Math.hypot(hx, hy), Math.hypot(hx - ow, hy), Math.hypot(hx, hy - oh), Math.hypot(hx - ow, hy - oh))) + 2;
            let hole: string;
            if (bestGap === 0 && contactSpan > 4 && bestOther) {
                const o2 = bestOther;
                const ncx2 = (o2.x + o2.w / 2 - ix) * kx;
                const ncy2 = (o2.y + o2.h / 2 - iy) * ky;
                const ovx0 = (Math.max(f.x, o2.x) - ix) * kx;
                const ovy0 = (Math.max(f.y, o2.y) - iy) * ky;
                const ovx1 = (Math.min(f.x + f.w, o2.x + o2.w) - ix) * kx;
                const ovy1 = (Math.min(f.y + f.h, o2.y + o2.h) - iy) * ky;
                const rEnd = Math.round(Math.max(Math.hypot(ovx0 - ncx2, ovy0 - ncy2), Math.hypot(ovx1 - ncx2, ovy0 - ncy2), Math.hypot(ovx0 - ncx2, ovy1 - ncy2), Math.hypot(ovx1 - ncx2, ovy1 - ncy2)) + 3);
                const band = Math.round(Math.min(rim * 2.6, Math.max(hd, (blend.seamBlur ?? blend.blur * 1.6) * 3.2)));
                const rCore = Math.max(0, rEnd - band);
                const farR = Math.round(Math.max(Math.hypot(ncx2, ncy2), Math.hypot(ncx2 - ow, ncy2), Math.hypot(ncx2, ncy2 - oh), Math.hypot(ncx2 - ow, ncy2 - oh))) + 2;
                hole = `radial-gradient(circle at ${Math.round(ncx2)}px ${Math.round(ncy2)}px, rgba(255,255,255,${holeAlpha}) ${rCore}px, #fff ${rEnd}px, #fff ${farR}px)`;
            }
            else {
                hole = `radial-gradient(circle at ${hx}px ${hy}px, rgba(255,255,255,${holeAlpha}) ${round(hd * 0.2)}px, rgba(255,255,255,${holeMid}) ${round(hd * 0.45)}px, #fff ${round(hd * 0.78)}px, #fff ${far}px)`;
            }
            if (hole !== entry.lastHole) {
                entry.lastHole = hole;
                entry.el.style.setProperty('mask-image', hole);
                entry.el.style.setProperty('-webkit-mask-image', hole);
                entry.el.style.removeProperty('mask-composite');
                entry.el.style.removeProperty('-webkit-mask-composite');
            }
        }
        item.lastBlend = { cx, cy, s, d, pk: paramKey };
        return true;
    }
    private ensureSources(): void {
        if (this.sourcesReady)
            return;
        const group = this.getGroup();
        if (!group)
            return;
        this.sourcesReady = true;
        this.mo = new MutationObserver(muts => {
            for (const m of muts) {
                const t = m.target;
                if (!(t instanceof Element) || !t.closest('[data-gooey-svg], [data-gooey-overlay]')) {
                    this.wake();
                    return;
                }
            }
        });
        this.mo.observe(group, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['style', 'class'],
        });
        const wake = () => this.wake();
        for (const type of ['transitionrun', 'animationstart', 'pointerdown']) {
            group.addEventListener(type, wake, true);
            this.removeListeners.push(() => group.removeEventListener(type, wake, true));
        }
        window.addEventListener('scroll', wake, { capture: true, passive: true });
        this.removeListeners.push(() => window.removeEventListener('scroll', wake, true));
        this.interval = setInterval(() => {
            if (!this.awake && this.measureAll())
                this.wake();
        }, 300);
    }
}
