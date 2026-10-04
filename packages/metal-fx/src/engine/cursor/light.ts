import { SHARED, type MetalFxInstance } from '../renderer/core';
import { sampleShaderLumAt, sampleShaderPeakAt, sampleShaderRGBAt } from '../renderer/sampling';
import { tickInstanceGlow } from '../renderer/loop';
import { hsvToRgb, rgbToHsv } from '../color';
export interface CursorLightConfig {
    enabled: boolean;
    reach: number;
    fadeMs: number;
    cursor: boolean;
    cursorDistance: number;
    cursorStrength: number;
    cursorDiffuse: number;
    cursorFalloff: number;
    cursorDepth: number;
    cursorEdge: number;
    cursorReach: number;
    cursorBlur: number;
    cursorZoom: number;
    spill: boolean;
    spillRadius: number;
    spillStrength: number;
    spillOffset: number;
    spillLumGain: number;
    spillSaturation: number;
    spillInside: number;
    spillBlur: number;
    catchLight: boolean;
    catchFollow: number;
    catchGain: number;
}
export const CURSOR_LIGHT_DEFAULTS: Readonly<CursorLightConfig> = Object.freeze({
    enabled: true,
    reach: 56,
    fadeMs: 200,
    cursor: true,
    cursorDistance: 186,
    cursorStrength: 3.35,
    cursorDiffuse: 1.4,
    cursorFalloff: 37,
    cursorDepth: 0.4,
    cursorEdge: 0,
    cursorReach: 11.5,
    cursorBlur: 0.5,
    cursorZoom: 3,
    spill: false,
    spillRadius: 48,
    spillStrength: 0.55,
    spillOffset: 0.35,
    spillLumGain: 0.7,
    spillSaturation: 1.3,
    spillInside: 0.5,
    spillBlur: 0,
    catchLight: false,
    catchFollow: 0.25,
    catchGain: 1,
});
export const CURSOR_LIGHT: CursorLightConfig = { ...CURSOR_LIGHT_DEFAULTS };
export function setCursorLightConfig(patch: Partial<CursorLightConfig>): void {
    Object.assign(CURSOR_LIGHT, patch);
    if (!CURSOR_LIGHT.spill && spillEl)
        hideSpill();
    if (!CURSOR_LIGHT.cursor)
        hideCursor();
    kick();
}
export function resetCursorLightConfig(): void {
    setCursorLightConfig({ ...CURSOR_LIGHT_DEFAULTS });
}
export interface CursorSprite {
    src: string;
    width: number;
    height: number;
    hotX: number;
    hotY: number;
    centerX?: number;
    centerY?: number;
}
let sprite: CursorSprite | null = null;
let spriteImg: HTMLImageElement | null = null;
let spriteDpr = 0;
function zoomScale(): number {
    const dpr = window.devicePixelRatio || 1;
    return spriteDpr > 0 ? spriteDpr / dpr : 1;
}
function placeCursor(x: number, y: number): void {
    if (!curEl || !sprite)
        return;
    const k = zoomScale();
    const tx = (x - sprite.hotX * k).toFixed(2), ty = (y - sprite.hotY * k).toFixed(2);
    curEl.style.transform = k === 1 ? `translate3d(${tx}px,${ty}px,0)` : `translate3d(${tx}px,${ty}px,0) scale(${k.toFixed(4)})`;
}
let cursorDisabled = false;
let disabledUntil = 0;
let slowFrames = 0;
let bodyPts: Float32Array | null = null;
const bodyC = { x: 0, y: 0 };
let bodyMask: HTMLCanvasElement | null = null;
let bodyAlpha: Uint8ClampedArray | null = null;
let bodyAlphaDpr = 0;
function bodyAlphaFor(img: HTMLImageElement, sp: CursorSprite, dpr: number, w: number, h: number): Uint8ClampedArray | null {
    if (bodyAlpha && bodyAlphaDpr === dpr && bodyAlpha.length === w * h)
        return bodyAlpha;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g)
        return null;
    g.scale(dpr, dpr);
    g.drawImage(img, 0, 0, sp.width, sp.height);
    const d = g.getImageData(0, 0, w, h).data;
    const a = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 3; i < a.length; i++, j += 4)
        a[i] = d[j] >= 128 ? 255 : 0;
    bodyAlpha = a;
    bodyAlphaDpr = dpr;
    return a;
}
function alphaPass(g: CanvasRenderingContext2D, w: number, h: number, factor: (x: number, y: number, i: number) => number): void {
    const img = g.getImageData(0, 0, w, h);
    const px = img.data;
    for (let y = 0, i = 0, j = 3; y < h; y++) {
        for (let x = 0; x < w; x++, i++, j += 4) {
            const a = px[j];
            if (a === 0)
                continue;
            const f = factor(x, y, i);
            px[j] = f >= 1 ? a : f <= 0 ? 0 : a * f;
        }
    }
    g.putImageData(img, 0, 0);
}
function analyseSprite(img: HTMLImageElement, sp: CursorSprite): void {
    const S = 2;
    const c = document.createElement('canvas');
    c.width = Math.ceil(sp.width * S);
    c.height = Math.ceil(sp.height * S);
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g)
        return;
    g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const pts: number[] = [];
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
            const a = d[(y * c.width + x) * 4 + 3];
            if (a < 128)
                continue;
            const px = (x + 0.5) / S, py = (y + 0.5) / S;
            pts.push(px, py);
            sx += px;
            sy += py;
            n++;
        }
    }
    if (n === 0)
        return;
    bodyC.x = sp.centerX ?? sx / n;
    bodyC.y = sp.centerY ?? sy / n;
    const arr = new Float32Array(pts.length);
    for (let i = 0; i < pts.length; i += 2) {
        arr[i] = pts[i] - bodyC.x;
        arr[i + 1] = pts[i + 1] - bodyC.y;
    }
    bodyPts = arr;
    const m = document.createElement('canvas');
    m.width = c.width;
    m.height = c.height;
    const mg = m.getContext('2d');
    if (mg) {
        const id = mg.createImageData(c.width, c.height);
        for (let i = 3; i < d.length; i += 4)
            if (d[i] >= 128) {
                id.data[i - 3] = 255;
                id.data[i - 2] = 255;
                id.data[i - 1] = 255;
                id.data[i] = 255;
            }
        mg.putImageData(id, 0, 0);
    }
    bodyMask = m;
}
function bodyExtent(ux: number, uy: number): number {
    if (!bodyPts)
        return 0;
    let best = -Infinity;
    for (let i = 0; i < bodyPts.length; i += 2) {
        const dot = bodyPts[i] * ux + bodyPts[i + 1] * uy;
        if (dot > best)
            best = dot;
    }
    return best === -Infinity ? 0 : best;
}
export function setCursorSprite(next: CursorSprite | null): void {
    sprite = next;
    spriteImg = null;
    bodyPts = null;
    bodyMask = null;
    bodyAlpha = null;
    cursorDisabled = false;
    disabledUntil = 0;
    slowFrames = 0;
    const dprNow = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    spriteDpr = dprNow >= 1.5 ? 2 : 1;
    hideCursor();
    if (!next || typeof Image === 'undefined')
        return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { if (sprite === next) {
        analyseSprite(img, next);
        spriteImg = img;
        kick();
    } };
    img.src = next.src;
}
let attached = 0;
let tracking = false;
let raf = 0;
let last = 0;
let px = Number.NaN, py = Number.NaN;
let lpx = 0, lpy = 0;
let uS = 0;
let uCS = 0;
let near: MetalFxInstance | null = null;
const _near = { d: 0, nx: 0, ny: 0, k: 1, left: 0, top: 0 };
const _pt = { x: 0, y: 0 };
const _sc = { r: 255, g: 255, b: 255 };
let spillEl: HTMLDivElement | null = null;
let spillBg = '';
let spillSize = -1;
let spillBlur = -1;
let spillShown = false;
export function attachCursorLight(): void {
    attached++;
    ensureTracking();
}
export function detachCursorLight(): void {
    attached = Math.max(0, attached - 1);
    if (attached === 0)
        stopTracking();
}
const mq = (q: string): boolean => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
function cursorSwapAllowed(): boolean {
    if (cursorDisabled || performance.now() < disabledUntil || !sprite || !spriteImg)
        return false;
    if (mq('(prefers-reduced-motion: reduce)') || mq('(forced-colors: active)'))
        return false;
    if (!mq('(pointer: fine)') || !mq('(hover: hover)'))
        return false;
    const vv = window.visualViewport;
    if (vv && Math.abs(vv.scale - 1) > 0.001)
        return false;
    return true;
}
function ensureTracking(): void {
    if (tracking || attached === 0 || typeof document === 'undefined')
        return;
    if (!mq('(pointer: fine)'))
        return;
    tracking = true;
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointercancel', onLeave);
    document.addEventListener('keydown', onKey, { passive: true });
    document.addEventListener('visibilitychange', onLeave);
    window.addEventListener('blur', onLeave);
}
function stopTracking(): void {
    if (!tracking)
        return;
    tracking = false;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('pointercancel', onLeave);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onLeave);
    window.removeEventListener('blur', onLeave);
    if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
    }
    if (near) {
        near.cursorLight = null;
        near = null;
    }
    uS = 0;
    uCS = 0;
    if (spillEl) {
        spillEl.remove();
        spillEl = null;
        spillBg = '';
        spillSize = -1;
        spillBlur = -1;
        spillShown = false;
    }
    hideCursor();
    if (curEl) {
        curEl.remove();
        curEl = null;
    }
}
let pointerIsMouse = true;
let typing = false;
function onMove(e: PointerEvent): void {
    pointerIsMouse = e.pointerType === 'mouse' || e.pointerType === '';
    typing = false;
    px = lpx = e.clientX;
    py = lpy = e.clientY;
    if (curShown && curEl) {
        if (pointerIsMouse && claimCursor(px, py)) {
            placeCursor(px, py);
        }
        else {
            hideCursor();
        }
    }
    kick();
}
function onKey(): void {
    typing = true;
    hideCursor();
}
function onLeave(): void {
    px = py = Number.NaN;
    kick();
}
function kick(): void {
    if (!tracking || raf !== 0)
        return;
    last = performance.now();
    raf = requestAnimationFrame(step);
}
function nearestOutlinePoint(lx: number, ly: number, W: number, H: number, R: number, kind: 'pill' | 'circle', out: {
    x: number;
    y: number;
}): number {
    const rr = kind === 'circle' ? Math.min(W, H) / 2 : Math.max(0, Math.min(R, Math.min(W, H) / 2));
    const cx = W / 2, cy = H / 2;
    const hx = Math.max(0, W / 2 - rr), hy = Math.max(0, H / 2 - rr);
    const qx = Math.max(-hx, Math.min(hx, lx - cx));
    const qy = Math.max(-hy, Math.min(hy, ly - cy));
    const dx = lx - cx - qx, dy = ly - cy - qy;
    const len = Math.hypot(dx, dy);
    if (len > 1e-6) {
        out.x = cx + qx + (dx / len) * rr;
        out.y = cy + qy + (dy / len) * rr;
        return len - rr;
    }
    const dl = lx, dr = W - lx, dt = ly, db = H - ly;
    const m = Math.min(dl, dr, dt, db);
    if (m === dl) {
        out.x = 0;
        out.y = ly;
    }
    else if (m === dr) {
        out.x = W;
        out.y = ly;
    }
    else if (m === dt) {
        out.x = lx;
        out.y = 0;
    }
    else {
        out.x = lx;
        out.y = H;
    }
    return -m;
}
let curEl: HTMLDivElement | null = null;
let curCanvas: HTMLCanvasElement | null = null;
let curCtx: CanvasRenderingContext2D | null = null;
let refCanvas: HTMLCanvasElement | null = null;
let refCtx: CanvasRenderingContext2D | null = null;
let refCtxReadable = false;
let curDpr = 0, curW = 0, curH = 0;
let curShown = false;
let rootHidden = false;
let rootPrev = '';
let hiddenEl: HTMLElement | null = null;
let hiddenPrev = '';
const TEXTY = /^(INPUT|TEXTAREA|SELECT)$/;
let verdicts = new WeakMap<HTMLElement, boolean>();
let lastClaimMs = 0;
let lastTarget: HTMLElement | null = null;
function isTextTarget(el: HTMLElement): boolean {
    let n: HTMLElement | null = el;
    while (n && n !== document.body) {
        if (TEXTY.test(n.tagName) || n.isContentEditable)
            return true;
        n = n.parentElement;
    }
    return false;
}
function ensureCursor(): boolean {
    if (curEl)
        return true;
    const el = document.createElement('div');
    el.className = 'metal-fx-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:2147483001;will-change:transform;transform-origin:0 0;display:none';
    const c = document.createElement('canvas');
    c.style.display = 'block';
    el.appendChild(c);
    document.body.appendChild(el);
    const ctx = c.getContext('2d');
    const rc = document.createElement('canvas');
    const rctx = rc.getContext('2d');
    if (!ctx || !rctx) {
        el.remove();
        return false;
    }
    curEl = el;
    curCanvas = c;
    curCtx = ctx;
    refCanvas = rc;
    refCtx = rctx;
    return true;
}
function claimCursor(x: number, y: number, force = false): boolean {
    const now = performance.now();
    if (!force && rootHidden && now - lastClaimMs < 12)
        return true;
    lastClaimMs = now;
    const target = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!target) {
        releaseCursor();
        return false;
    }
    if (target === lastTarget && rootHidden)
        return true;
    lastTarget = target;
    let ok = verdicts.get(target);
    if (ok === undefined) {
        ok = !isTextTarget(target);
        if (ok) {
            const cur = getComputedStyle(target).cursor;
            ok = cur === 'auto' || cur === 'default' || cur === 'none';
        }
        verdicts.set(target, ok);
    }
    if (!ok) {
        releaseCursor();
        return false;
    }
    if (!rootHidden) {
        const root = document.documentElement;
        rootPrev = root.style.cursor;
        root.style.cursor = 'none';
        rootHidden = true;
    }
    if (target !== hiddenEl) {
        if (hiddenEl) {
            hiddenEl.style.cursor = hiddenPrev;
            hiddenEl = null;
            hiddenPrev = '';
        }
        if (getComputedStyle(target).cursor !== 'none') {
            hiddenEl = target;
            hiddenPrev = target.style.cursor;
            target.style.cursor = 'none';
        }
    }
    return true;
}
function releaseCursor(): void {
    if (hiddenEl) {
        if (hiddenEl.isConnected)
            hiddenEl.style.cursor = hiddenPrev;
        hiddenEl = null;
        hiddenPrev = '';
    }
    if (rootHidden) {
        document.documentElement.style.cursor = rootPrev;
        rootHidden = false;
        rootPrev = '';
    }
    lastTarget = null;
    verdicts = new WeakMap();
}
function hideCursor(): void {
    releaseCursor();
    if (curEl && curShown) {
        curEl.style.display = 'none';
        curShown = false;
    }
}
function drawCursor(inst: MetalFxInstance, cfg: CursorLightConfig, env: number): void {
    if (!curCtx || !refCtx || !curCanvas || !refCanvas || !curEl || !sprite || !spriteImg)
        return;
    const sp = sprite;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    if (dpr !== curDpr || sp.width !== curW || sp.height !== curH) {
        curDpr = dpr;
        curW = sp.width;
        curH = sp.height;
        curCanvas.width = refCanvas.width = Math.ceil(sp.width * dpr);
        curCanvas.height = refCanvas.height = Math.ceil(sp.height * dpr);
        curCanvas.style.width = `${sp.width}px`;
        curCanvas.style.height = `${sp.height}px`;
    }
    if (!refCtxReadable) {
        refCtx = refCanvas.getContext('2d', { willReadFrequently: true });
        refCtxReadable = true;
        if (!refCtx)
            return;
    }
    const ctx = curCtx, rctx = refCtx;
    const W = sp.width, H = sp.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, curCanvas.width, curCanvas.height);
    ctx.scale(dpr, dpr);
    ctx.drawImage(spriteImg, 0, 0, W, H);
    const rx = _near.left + _near.nx * _near.k, ry = _near.top + _near.ny * _near.k;
    const ccx = lpx - sp.hotX + bodyC.x, ccy = lpy - sp.hotY + bodyC.y;
    const dx = rx - ccx, dy = ry - ccy;
    const dist = Math.hypot(dx, dy);
    const ux0 = dist > 0.01 ? dx / dist : 1, uy0 = dist > 0.01 ? dy / dist : 0;
    const e = bodyExtent(ux0, uy0) + cfg.cursorEdge;
    const dEdge = Math.max(0, dist - e);
    const f0 = Math.max(1, cfg.cursorFalloff);
    const falloff = 1 / (1 + (dEdge / f0) * (dEdge / f0));
    const bcx = inst.cssWidth / 2, bcy = inst.cssHeight / 2;
    const inx = bcx - _near.nx, iny = bcy - _near.ny, inl = Math.hypot(inx, iny) || 1;
    const ins = inst.mask ? 0 : inst.ringCssPx * 0.5 + 1;
    const sxp = _near.nx + (inx / inl) * ins, syp = _near.ny + (iny / inl) * ins;
    const pk = sampleShaderPeakAt(inst, sxp, syp, 4);
    const lum = pk.lum;
    const pr = pk.r, pg = pk.g, pb = pk.b;
    const spec = cfg.cursorStrength * falloff * env;
    const diff = cfg.cursorDiffuse * falloff * (0.5 + 0.5 * Math.min(1, lum / 0.5)) * env;
    if (dist > 0.01 && spec + diff > 0.005) {
        const ux = dx / dist, uy = dy / dist, a = Math.atan2(uy, ux);
        const sdepth = Math.max(0.1, Math.min(1, cfg.cursorDepth));
        const mx = bodyC.x + e * ux, my = bodyC.y + e * uy;
        const fl = Math.max(1, cfg.cursorReach);
        rctx.setTransform(1, 0, 0, 1, 0, 0);
        rctx.clearRect(0, 0, refCanvas.width, refCanvas.height);
        rctx.scale(dpr, dpr);
        if (spec > 0.005) {
            rctx.save();
            rctx.filter = cfg.cursorBlur > 0 ? `blur(${cfg.cursorBlur}px)` : 'none';
            const zoom = Math.max(1, cfg.cursorZoom);
            rctx.translate(mx, my);
            rctx.rotate(a);
            rctx.scale(-1, 1);
            rctx.translate((dist - e) * sdepth, 0);
            rctx.rotate(-a);
            rctx.scale(zoom, zoom);
            const o = inst.overscan, k = _near.k;
            const passes = Math.max(1, Math.ceil(spec));
            rctx.globalAlpha = Math.min(1, spec / passes);
            rctx.globalCompositeOperation = 'lighter';
            const srcCanvas = inst.mask && inst.rawCanvas ? inst.rawCanvas : inst.canvas;
            for (let i = 0; i < passes; i++) {
                rctx.drawImage(srcCanvas, -(_near.nx + o) * k, -(_near.ny + o) * k, (inst.cssWidth + 2 * o) * k, (inst.cssHeight + 2 * o) * k);
            }
            rctx.restore();
            const inv = 1 / dpr, fl1 = 1 / fl;
            alphaPass(rctx, refCanvas.width, refCanvas.height, (x, y) => {
                const behind = -(((x + 0.5) * inv - mx) * ux + ((y + 0.5) * inv - my) * uy);
                return behind <= 0 ? 1 : 1 - behind * fl1;
            });
        }
        if (diff > 0.005) {
            const peak = Math.max(pr, pg, pb) || 1;
            const cr = Math.round((pr * 255) / peak), cg = Math.round((pg * 255) / peak), cb = Math.round((pb * 255) / peak);
            const dl = fl * 1.2;
            const g = rctx.createLinearGradient(mx + 0.5 * ux, my + 0.5 * uy, mx - dl * ux, my - dl * uy);
            const a0 = Math.min(1, diff);
            g.addColorStop(0, `rgba(${cr},${cg},${cb},${a0.toFixed(3)})`);
            g.addColorStop(0.45, `rgba(${cr},${cg},${cb},${(a0 * 0.4).toFixed(3)})`);
            g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
            rctx.globalCompositeOperation = 'lighter';
            rctx.fillStyle = g;
            rctx.fillRect(0, 0, W, H);
            rctx.globalCompositeOperation = 'source-over';
        }
        const body = bodyAlphaFor(spriteImg, sp, dpr, refCanvas.width, refCanvas.height);
        if (body)
            alphaPass(rctx, refCanvas.width, refCanvas.height, (_x, _y, i) => body[i] === 0 ? 0 : 1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(refCanvas, 0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
    }
    placeCursor(lpx, lpy);
    if (!curShown) {
        curEl.style.display = '';
        curShown = true;
    }
}
function ensureSpill(): HTMLDivElement {
    if (spillEl)
        return spillEl;
    const el = document.createElement('div');
    el.className = 'metal-fx-cursor-spill';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText =
        'position:fixed;left:0;top:0;pointer-events:none;z-index:2147483000;border-radius:50%;' +
            'mix-blend-mode:plus-lighter;will-change:transform,opacity;opacity:0;display:none';
    document.body.appendChild(el);
    spillEl = el;
    return el;
}
function hideSpill(): void {
    if (!spillEl || !spillShown)
        return;
    spillEl.style.display = 'none';
    spillEl.style.opacity = '0';
    spillShown = false;
}
function step(now: number): void {
    raf = 0;
    if (!tracking)
        return;
    const t0 = performance.now();
    try {
        stepInner(now);
    }
    catch (err) {
        cursorDisabled = true;
        hideCursor();
        hideSpill();
        if (near) {
            near.cursorLight = null;
            near = null;
        }
        if (typeof console !== 'undefined')
            console.warn('metal-fx: cursor light disabled after error', err);
        return;
    }
    const took = performance.now() - t0;
    if (took > 6) {
        if (++slowFrames >= 20) {
            slowFrames = 0;
            disabledUntil = performance.now() + 5000;
            hideCursor();
        }
    }
    else if (slowFrames > 0)
        slowFrames--;
}
function stepInner(now: number): void {
    const cfg = CURSOR_LIGHT;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    let best: MetalFxInstance | null = null;
    let u = 0, uC = 0;
    if (cfg.enabled && SHARED && !Number.isNaN(px)) {
        let bestAbs = Number.POSITIVE_INFINITY;
        const reachA = Math.max(1, cfg.reach);
        const reachC = cfg.cursor && cursorSwapAllowed() ? Math.max(1, cfg.cursorDistance) : 0;
        const reach = Math.max(reachA, reachC);
        for (const inst of SHARED.instances) {
            if (!inst.visible || !inst.canvas.isConnected)
                continue;
            const r = inst.canvas.getBoundingClientRect();
            if (r.width <= 0)
                continue;
            const o = inst.overscan;
            const k = r.width / (inst.cssWidth + 2 * o);
            const left = r.left + o * k, top = r.top + o * k;
            const rk = reach * k;
            if (px < left - rk || px > left + inst.cssWidth * k + rk || py < top - rk || py > top + inst.cssHeight * k + rk)
                continue;
            const lx = (px - left) / k, ly = (py - top) / k;
            const d = nearestOutlinePoint(lx, ly, inst.cssWidth, inst.cssHeight, inst.cornerRadius, inst.kind, _pt);
            const ad = Math.abs(d);
            if (ad <= reach && ad < bestAbs) {
                bestAbs = ad;
                best = inst;
                _near.d = d;
                _near.nx = _pt.x;
                _near.ny = _pt.y;
                _near.k = k;
                _near.left = left;
                _near.top = top;
            }
        }
        if (best) {
            if (bestAbs <= reachA) {
                const t = 1 - bestAbs / reachA;
                u = t * t * (3 - 2 * t);
            }
            if (bestAbs <= reachC)
                uC = Math.min(1, (1 - bestAbs / reachC) * 3);
            if (best.mask) {
                _near.nx = best.cssWidth / 2;
                _near.ny = best.cssHeight / 2;
                best.wantRaw = true;
            }
        }
    }
    const a = 1 - Math.exp(-(dt * 1000) / (Math.max(1, cfg.fadeMs) / 3));
    uS += (u - uS) * a;
    uCS += (uC - uCS) * a;
    if (best && best !== near) {
        if (near) {
            near.cursorLight = null;
            tickInstanceGlow(near, now);
        }
        near = best;
    }
    if (!best && uS < 0.002 && uCS < 0.002) {
        uS = 0;
        uCS = 0;
        if (near) {
            near.cursorLight = null;
            tickInstanceGlow(near, now);
            near = null;
        }
        hideSpill();
        hideCursor();
        return;
    }
    if (!near)
        return;
    if (cfg.catchLight) {
        const cl = near.cursorLight ?? (near.cursorLight = { x: 0, y: 0, w: 0 });
        cl.x = _near.nx;
        cl.y = _near.ny;
        cl.w = uS;
    }
    else if (near.cursorLight) {
        near.cursorLight = null;
    }
    tickInstanceGlow(near, now);
    if (cfg.cursor && uCS > 0.002 && pointerIsMouse && !typing && !Number.isNaN(px) && cursorSwapAllowed() && ensureCursor() && claimCursor(px, py)) {
        drawCursor(near, cfg, uCS);
    }
    else {
        hideCursor();
    }
    if (cfg.spill) {
        const el = ensureSpill();
        const rgb = sampleShaderRGBAt(near, _near.nx, _near.ny, 2);
        const lum = sampleShaderLumAt(near, _near.nx, _near.ny, 3);
        const peak = Math.max(rgb.r, rgb.g, rgb.b) || 1;
        const hsv = rgbToHsv((rgb.r * 255) / peak, (rgb.g * 255) / peak, (rgb.b * 255) / peak);
        const [cr, cg, cb] = hsvToRgb(hsv[0], Math.min(1, hsv[1] * cfg.spillSaturation), 1);
        _sc.r += (cr - _sc.r) * 0.15;
        _sc.g += (cg - _sc.g) * 0.15;
        _sc.b += (cb - _sc.b) * 0.15;
        const qr = Math.round(_sc.r / 6) * 6, qg = Math.round(_sc.g / 6) * 6, qb = Math.round(_sc.b / 6) * 6;
        const bg = `radial-gradient(closest-side, rgba(${qr},${qg},${qb},1) 0%, rgba(${qr},${qg},${qb},0.35) 45%, rgba(${qr},${qg},${qb},0) 100%)`;
        if (bg !== spillBg) {
            spillBg = bg;
            el.style.background = bg;
        }
        const R = Math.max(1, cfg.spillRadius * _near.k);
        if (R !== spillSize) {
            spillSize = R;
            el.style.width = `${(2 * R).toFixed(1)}px`;
            el.style.height = `${(2 * R).toFixed(1)}px`;
        }
        if (cfg.spillBlur !== spillBlur) {
            spillBlur = cfg.spillBlur;
            el.style.filter = cfg.spillBlur > 0 ? `blur(${cfg.spillBlur}px)` : '';
        }
        const rx = _near.left + _near.nx * _near.k, ry = _near.top + _near.ny * _near.k;
        const sx = lpx + (rx - lpx) * cfg.spillOffset, sy = lpy + (ry - lpy) * cfg.spillOffset;
        el.style.transform = `translate3d(${(sx - R).toFixed(2)}px,${(sy - R).toFixed(2)}px,0)`;
        const lf = Math.min(1, Math.max(0, lum / 0.3));
        const lumMix = 1 - cfg.spillLumGain + cfg.spillLumGain * lf;
        const insideMul = _near.d < 0 ? cfg.spillInside : 1;
        const op = Math.max(0, Math.min(1, cfg.spillStrength * uS * lumMix * insideMul));
        if (!spillShown) {
            el.style.display = '';
            spillShown = true;
        }
        el.style.opacity = op.toFixed(3);
    }
    else {
        hideSpill();
    }
    raf = requestAnimationFrame(step);
}
