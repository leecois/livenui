import { hexToRgba } from '../color';
import { FRAME_INTERVAL_MS, GLOW_SKIP_FRAMES, GLOW_READBACK_INTERVAL_MS } from '../perfConfig';
import { PRESETS, type PresetMode, type PresetName, type PresetTheme } from '../presets';
import { SHARED, CANONICAL_PILL_W, CANONICAL_PILL_H, CIRCLE_SHADER_SCALE, PILL_SHADER_SCALE, ensureSharedRenderer, setContextRestoredCallback, teardownSharedRenderer, type DeformFn, type DeformLayers, type MaskFn, type MetalFxInstance, } from './core';
import { ensureGlowPixels } from './sampling';
import { createOutlineBuf, roundRectOutline, type OutlineBuf } from './outline';
setContextRestoredCallback(() => {
    if (SHARED && SHARED.instances.size > 0 && SHARED.pausedAtMs === null) {
        startSharedLoop();
    }
});
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (!SHARED || SHARED.pausedAtMs !== null || SHARED.contextLost)
            return;
        if (document.hidden) {
            stopSharedLoop();
        }
        else if (SHARED.instances.size > 0) {
            startSharedLoop();
        }
    });
}
interface CreateInstanceOptions {
    hostCanvas: HTMLCanvasElement;
    cssWidth: number;
    cssHeight: number;
    cornerRadius: number;
    kind: 'pill' | 'circle';
    preset?: PresetMode;
    shaderScale?: number;
    ringCssPx?: number;
    opacityMul?: number;
    glowGain?: number;
    paused?: boolean;
    scale?: number;
    onAfterFrame?: () => void;
    onComposite?: () => void;
    onFirstCopy?: () => void;
    mask?: MaskFn | null;
}
export function createInstance(opts: CreateInstanceOptions): MetalFxInstance {
    const renderer = ensureSharedRenderer();
    const ctx = opts.hostCanvas.getContext('2d', { alpha: true });
    if (!ctx)
        throw new Error('metal-fx: canvas 2D context unavailable');
    const scale = opts.scale ?? 1;
    const inst: MetalFxInstance = {
        canvas: opts.hostCanvas, ctx,
        cssWidth: opts.cssWidth, cssHeight: opts.cssHeight,
        cornerRadius: opts.cornerRadius,
        kind: opts.kind,
        ringCssPx: opts.ringCssPx ?? (opts.kind === 'circle' ? 2 : 1) * scale,
        shaderScale: opts.shaderScale ?? (opts.kind === 'circle' ? CIRCLE_SHADER_SCALE : PILL_SHADER_SCALE) * scale,
        opacityMul: opts.opacityMul ?? 1,
        glowGain: opts.glowGain ?? 1,
        visible: true,
        paused: opts.paused ?? false,
        everCopied: false,
        frozen: null,
        preset: opts.preset,
        dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        scale,
        onAfterFrame: opts.onAfterFrame,
        onComposite: opts.onComposite,
        onFirstCopy: opts.onFirstCopy,
        mask: opts.mask ?? null,
        deform: null,
        deformLayers: null,
        overscan: 0,
        cursorLight: null,
        glowFast: false,
        rawCanvas: null,
        wantRaw: false,
        ringCanvas: null,
        wantRing: false,
    };
    resizeInstanceCanvas(inst);
    renderer.instances.add(inst);
    if (renderer.rafId === 0 && renderer.pausedAtMs === null)
        startSharedLoop();
    return inst;
}
export function destroyInstance(inst: MetalFxInstance): void {
    if (!SHARED)
        return;
    SHARED.instances.delete(inst);
    const qi = SHARED.glowQueue.indexOf(inst);
    if (qi !== -1)
        SHARED.glowQueue.splice(qi, 1);
    if (SHARED.instances.size === 0) {
        stopSharedLoop();
        teardownSharedRenderer();
    }
}
export function registerGlowInstance(inst: MetalFxInstance): void {
    if (!SHARED)
        return;
    if (!SHARED.glowQueue.includes(inst))
        SHARED.glowQueue.push(inst);
}
export function unregisterGlowInstance(inst: MetalFxInstance): void {
    if (!SHARED)
        return;
    const i = SHARED.glowQueue.indexOf(inst);
    if (i !== -1)
        SHARED.glowQueue.splice(i, 1);
}
export function updateInstance(inst: MetalFxInstance, patch: Partial<Pick<MetalFxInstance, 'cssWidth' | 'cssHeight' | 'cornerRadius' | 'kind' | 'shaderScale' | 'ringCssPx' | 'opacityMul' | 'glowGain' | 'paused' | 'scale' | 'mask' | 'preset'>>): void {
    let dirty = false;
    if (patch.preset !== undefined && patch.preset !== inst.preset) {
        inst.preset = patch.preset;
        inst.frozen = null;
        inst.everCopied = false;
        if (SHARED && SHARED.rafId === 0 && SHARED.pausedAtMs === null && !SHARED.contextLost)
            startSharedLoop();
    }
    if (patch.mask !== undefined)
        inst.mask = patch.mask;
    if (patch.cssWidth !== undefined && patch.cssWidth !== inst.cssWidth) {
        inst.cssWidth = patch.cssWidth;
        dirty = true;
    }
    if (patch.cssHeight !== undefined && patch.cssHeight !== inst.cssHeight) {
        inst.cssHeight = patch.cssHeight;
        dirty = true;
    }
    if (patch.cornerRadius !== undefined)
        inst.cornerRadius = patch.cornerRadius;
    if (patch.scale !== undefined)
        inst.scale = patch.scale;
    if (patch.kind !== undefined && patch.kind !== inst.kind) {
        inst.kind = patch.kind;
        if (patch.shaderScale === undefined)
            inst.shaderScale = (patch.kind === 'circle' ? CIRCLE_SHADER_SCALE : PILL_SHADER_SCALE) * inst.scale;
        if (patch.ringCssPx === undefined)
            inst.ringCssPx = (patch.kind === 'circle' ? 2 : 1) * inst.scale;
    }
    if (patch.shaderScale !== undefined)
        inst.shaderScale = patch.shaderScale;
    if (patch.ringCssPx !== undefined)
        inst.ringCssPx = patch.ringCssPx;
    if (patch.opacityMul !== undefined)
        inst.opacityMul = patch.opacityMul;
    if (patch.glowGain !== undefined)
        inst.glowGain = patch.glowGain;
    if (patch.paused !== undefined && patch.paused !== inst.paused) {
        inst.paused = patch.paused;
        if (patch.paused)
            freezeFrame(inst);
        else
            inst.frozen = null;
        if (!patch.paused && SHARED && SHARED.rafId === 0 && SHARED.pausedAtMs === null && !SHARED.contextLost) {
            startSharedLoop();
        }
    }
    if (dirty)
        resizeInstanceCanvas(inst);
}
export function setInstanceVisible(inst: MetalFxInstance, visible: boolean): void {
    inst.visible = visible;
    if (visible && SHARED && SHARED.rafId === 0 && SHARED.pausedAtMs === null && !SHARED.contextLost) {
        startSharedLoop();
    }
}
export function setInstanceDeform(canvas: HTMLCanvasElement, deform: DeformFn | null, layers: DeformLayers | null = null, overscan = 0): boolean {
    const inst = findInstance(canvas);
    if (!inst)
        return false;
    inst.deform = deform;
    inst.deformLayers = deform ? layers : null;
    const o = deform ? Math.max(0, Math.round(overscan)) : 0;
    if (o !== inst.overscan) {
        inst.overscan = o;
        resizeInstanceCanvas(inst);
    }
    copyShaderToInstance(inst);
    return true;
}
export function refreshInstanceDpr(inst: MetalFxInstance): boolean {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    if (dpr === inst.dpr)
        return false;
    resizeInstanceCanvas(inst);
    copyShaderToInstance(inst);
    return true;
}
export function redrawInstance(canvas: HTMLCanvasElement): void {
    const inst = findInstance(canvas);
    if (inst)
        copyShaderToInstance(inst);
}
function findInstance(canvas: HTMLCanvasElement): MetalFxInstance | null {
    if (!SHARED)
        return null;
    for (const inst of SHARED.instances)
        if (inst.canvas === canvas)
            return inst;
    return null;
}
let presetOverride: PresetMode | null = null;
export function setSharedPreset(name: PresetName, theme: PresetTheme): void {
    const s = ensureSharedRenderer();
    s.preset = presetOverride ?? PRESETS[name].modes[theme];
    s.presetDirty = true;
}
export function setSharedPresetMode(mode: PresetMode | null): void {
    const s = ensureSharedRenderer();
    presetOverride = mode;
    if (mode) {
        s.preset = mode;
        s.presetDirty = true;
    }
}
export function getSharedPreset(): PresetMode | null {
    return SHARED ? { ...SHARED.preset } : null;
}
export function pauseShared(): void {
    if (!SHARED || SHARED.pausedAtMs !== null)
        return;
    SHARED.pausedAtMs = performance.now();
    stopSharedLoop();
}
export function resumeShared(): void {
    if (!SHARED || SHARED.pausedAtMs === null)
        return;
    SHARED.pausedMs += performance.now() - SHARED.pausedAtMs;
    SHARED.pausedAtMs = null;
    if (SHARED.instances.size > 0)
        startSharedLoop();
}
export function getSharedFrameCount(): number {
    return SHARED?.frameCount ?? 0;
}
export type GlowCallback = (inst: MetalFxInstance, nowMs: number) => boolean | void;
let _glowCallback: GlowCallback | null = null;
export function setGlowCallback(cb: GlowCallback | null): void {
    _glowCallback = cb;
}
export function tickInstanceGlow(inst: MetalFxInstance, nowMs: number): void {
    if (!_glowCallback || !SHARED || !inst.visible || inst.paused)
        return;
    if (!SHARED.glowQueue.includes(inst))
        return;
    const shared = SHARED;
    const fast = !!_glowCallback(inst, nowMs);
    if (SHARED === shared && shared.instances.has(inst))
        inst.glowFast = fast;
}
function resizeInstanceCanvas(inst: MetalFxInstance): void {
    inst.dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const o = inst.overscan;
    const w = Math.max(1, Math.round((inst.cssWidth + 2 * o) * inst.dpr));
    const h = Math.max(1, Math.round((inst.cssHeight + 2 * o) * inst.dpr));
    if (inst.canvas.width !== w)
        inst.canvas.width = w;
    if (inst.canvas.height !== h)
        inst.canvas.height = h;
    const st = inst.canvas.style;
    if (o > 0) {
        st.left = `${-o}px`;
        st.top = `${-o}px`;
        st.width = `calc(100% + ${2 * o}px)`;
        st.height = `calc(100% + ${2 * o}px)`;
        st.borderRadius = '0';
    }
    else if (st.left !== '') {
        st.left = '';
        st.top = '';
        st.width = '100%';
        st.height = '100%';
        st.borderRadius = '';
    }
}
function punchInnerHole(inst: MetalFxInstance): void {
    const { ctx, dpr, canvas } = inst;
    const stroke = inst.ringCssPx * dpr;
    const w = canvas.width, h = canvas.height;
    const innerR = Math.max(0, (inst.cornerRadius - inst.ringCssPx) * dpr);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(stroke, stroke, w - 2 * stroke, h - 2 * stroke, innerR);
    ctx.fill();
    ctx.restore();
}
const _outline: OutlineBuf = createOutlineBuf();
function traceDeformedRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, deform: DeformFn, dpr: number): void {
    const { xy, n } = roundRectOutline(x, y, w, h, r, deform, _outline);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
        if (i === 0)
            ctx.moveTo(xy[0] * dpr, xy[1] * dpr);
        else
            ctx.lineTo(xy[i * 2] * dpr, xy[i * 2 + 1] * dpr);
    }
    ctx.closePath();
}
function freezeFrame(inst: MetalFxInstance): HTMLCanvasElement | null {
    if (!SHARED)
        return null;
    const live: CanvasImageSource = inst.shaderFrame ?? SHARED.frameBitmap ?? SHARED.glCanvas;
    const w = SHARED.glCanvas.width, h = SHARED.glCanvas.height;
    if (w < 1 || h < 1)
        return null;
    let fc = inst.frozen;
    if (!fc) {
        fc = document.createElement('canvas');
        inst.frozen = fc;
    }
    if (fc.width !== w || fc.height !== h) {
        fc.width = w;
        fc.height = h;
    }
    const g = fc.getContext('2d');
    if (!g) {
        inst.frozen = null;
        return null;
    }
    g.clearRect(0, 0, w, h);
    g.drawImage(live, 0, 0);
    return fc;
}
function copyShaderToInstance(inst: MetalFxInstance): void {
    if (!SHARED || !SHARED.instances.has(inst))
        return;
    const shared = SHARED;
    const src: CanvasImageSource = (inst.paused ? (inst.frozen ?? freezeFrame(inst)) : null) ?? inst.shaderFrame ?? SHARED.frameBitmap ?? SHARED.glCanvas;
    const dpr = inst.dpr;
    const dw = inst.canvas.width, dh = inst.canvas.height;
    if (dw < 1 || dh < 1)
        return;
    const bw = Math.max(1, Math.round(inst.cssWidth * dpr));
    const bh = Math.max(1, Math.round(inst.cssHeight * dpr));
    const od = inst.overscan * dpr;
    const cw = (src as {
        width: number;
    }).width, ch = (src as {
        height: number;
    }).height;
    const bdW = CANONICAL_PILL_W * dpr, bdH = CANONICAL_PILL_H * dpr;
    let srcW = (bw * (cw / bdW)) / inst.shaderScale;
    let srcH = (bh * (ch / bdH)) / inst.shaderScale;
    if (srcW > cw)
        srcW = cw;
    if (srcH > ch)
        srcH = ch;
    const sx = Math.max(0, (cw - srcW) / 2);
    const sy = Math.max(0, (ch - srcH) / 2);
    const alpha = inst.opacityMul * SHARED.preset.shaderOpacity;
    const ctx = inst.ctx;
    ctx.clearRect(0, 0, dw, dh);
    const deform = inst.deform;
    if (inst.mask) {
        if (alpha < 1)
            ctx.globalAlpha = alpha;
        ctx.drawImage(src, sx, sy, srcW, srcH, 0, 0, dw, dh);
        if (alpha < 1)
            ctx.globalAlpha = 1;
        if (inst.wantRaw) {
            let rc = inst.rawCanvas;
            if (!rc) {
                rc = document.createElement('canvas');
                inst.rawCanvas = rc;
            }
            if (rc.width !== dw || rc.height !== dh) {
                rc.width = dw;
                rc.height = dh;
            }
            const rg = rc.getContext('2d');
            if (rg) {
                rg.clearRect(0, 0, dw, dh);
                rg.drawImage(inst.canvas, 0, 0);
            }
        }
        ctx.save();
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = '#000';
        inst.mask(ctx, dw, dh, dpr);
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
    }
    else if (!deform) {
        if (alpha < 1)
            ctx.globalAlpha = alpha;
        ctx.drawImage(src, sx, sy, srcW, srcH, 0, 0, dw, dh);
        if (alpha < 1)
            ctx.globalAlpha = 1;
        punchInnerHole(inst);
    }
    else {
        const W = inst.cssWidth, H = inst.cssHeight;
        const R = inst.cornerRadius, ring = inst.ringCssPx;
        const layers = inst.deformLayers;
        ctx.save();
        ctx.translate(od, od);
        const scX = bw / srcW, scY = bh / srcH;
        const esW = Math.min(cw, srcW * (bw + 2 * od) / bw);
        const esH = Math.min(ch, srcH * (bh + 2 * od) / bh);
        const esx = Math.max(0, (cw - esW) / 2);
        const esy = Math.max(0, (ch - esH) / 2);
        const dW = esW * scX, dH = esH * scY;
        if (alpha < 1)
            ctx.globalAlpha = alpha;
        ctx.drawImage(src, esx, esy, esW, esH, bw / 2 - dW / 2, bh / 2 - dH / 2, dW, dH);
        if (alpha < 1)
            ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'destination-in';
        traceDeformedRoundRect(ctx, 0, 0, W, H, R, deform, dpr);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        traceDeformedRoundRect(ctx, ring, ring, W - 2 * ring, H - 2 * ring, Math.max(0, R - ring), deform, dpr);
        ctx.fill();
        if (inst.wantRing) {
            let rc = inst.ringCanvas;
            if (!rc) {
                rc = document.createElement('canvas');
                inst.ringCanvas = rc;
            }
            if (rc.width !== dw || rc.height !== dh) {
                rc.width = dw;
                rc.height = dh;
            }
            const rg = rc.getContext('2d');
            if (rg) {
                rg.setTransform(1, 0, 0, 1, 0, 0);
                rg.globalCompositeOperation = 'source-over';
                rg.clearRect(0, 0, dw, dh);
                rg.translate(od, od);
                if (alpha < 1)
                    rg.globalAlpha = alpha;
                rg.drawImage(src, esx, esy, esW, esH, bw / 2 - dW / 2, bh / 2 - dH / 2, dW, dH);
                rg.globalAlpha = 1;
                rg.globalCompositeOperation = 'destination-out';
                traceDeformedRoundRect(rg, ring, ring, W - 2 * ring, H - 2 * ring, Math.max(0, R - ring), deform, dpr);
                rg.fillStyle = '#000';
                rg.fill();
                rg.globalCompositeOperation = 'source-over';
                rg.setTransform(1, 0, 0, 1, 0, 0);
            }
        }
        if (layers?.hairline) {
            const hl = layers.hairline;
            ctx.globalCompositeOperation = 'destination-over';
            traceDeformedRoundRect(ctx, hl.inset, hl.inset, W - 2 * hl.inset, H - 2 * hl.inset, Math.max(0, R - hl.inset), deform, dpr);
            ctx.lineWidth = hl.width * dpr;
            ctx.strokeStyle = hl.color;
            ctx.stroke();
        }
        if (layers?.fill) {
            ctx.globalCompositeOperation = 'destination-over';
            traceDeformedRoundRect(ctx, 0, 0, W, H, R, deform, dpr);
            ctx.fillStyle = layers.fill;
            ctx.fill();
        }
        if (layers?.rim) {
            const rim = layers.rim;
            ctx.globalCompositeOperation = 'source-over';
            ctx.save();
            traceDeformedRoundRect(ctx, 0, 0, W, H, R, deform, dpr);
            ctx.clip();
            const c = rim.inset + rim.width / 2;
            traceDeformedRoundRect(ctx, c, c, W - 2 * c, H - 2 * c, Math.max(0, R - c), deform, dpr);
            ctx.lineWidth = rim.width * dpr;
            ctx.strokeStyle = rim.color;
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
        ctx.globalCompositeOperation = 'source-over';
    }
    inst.onComposite?.();
    if (SHARED !== shared || !shared.instances.has(inst))
        return;
    if (inst.onFirstCopy) {
        const cb = inst.onFirstCopy;
        inst.onFirstCopy = undefined;
        cb();
        if (SHARED !== shared || !shared.instances.has(inst))
            return;
    }
    inst.onAfterFrame?.();
}
function uploadPresetUniforms(): void {
    if (!SHARED)
        return;
    const { gl, uniforms, preset, glCanvas, dpr } = SHARED;
    if (uniforms.u_resolution)
        gl.uniform2f(uniforms.u_resolution, glCanvas.width, glCanvas.height);
    if (uniforms.u_pixelRatio)
        gl.uniform1f(uniforms.u_pixelRatio, dpr);
    if (uniforms.u_colorBack)
        gl.uniform4fv(uniforms.u_colorBack, hexToRgba(preset.colorBack));
    if (uniforms.u_colorTint)
        gl.uniform4fv(uniforms.u_colorTint, hexToRgba(preset.colorTint));
    if (uniforms.u_repetition)
        gl.uniform1f(uniforms.u_repetition, preset.repetition);
    if (uniforms.u_softness)
        gl.uniform1f(uniforms.u_softness, preset.softness);
    if (uniforms.u_shiftRed)
        gl.uniform1f(uniforms.u_shiftRed, preset.shiftRed);
    if (uniforms.u_shiftBlue)
        gl.uniform1f(uniforms.u_shiftBlue, preset.shiftBlue);
    if (uniforms.u_distortion)
        gl.uniform1f(uniforms.u_distortion, preset.distortion);
    if (uniforms.u_contour)
        gl.uniform1f(uniforms.u_contour, preset.contour);
    if (uniforms.u_angle)
        gl.uniform1f(uniforms.u_angle, preset.angle);
    if (uniforms.u_shape)
        gl.uniform1f(uniforms.u_shape, preset.shape);
    if (uniforms.u_isImage)
        gl.uniform1i(uniforms.u_isImage, 0);
    if (uniforms.u_imageAspectRatio)
        gl.uniform1f(uniforms.u_imageAspectRatio, 1);
    if (uniforms.u_originX)
        gl.uniform1f(uniforms.u_originX, preset.originX);
    if (uniforms.u_originY)
        gl.uniform1f(uniforms.u_originY, preset.originY);
    if (uniforms.u_worldWidth)
        gl.uniform1f(uniforms.u_worldWidth, preset.worldWidth);
    if (uniforms.u_worldHeight)
        gl.uniform1f(uniforms.u_worldHeight, preset.worldHeight);
    if (uniforms.u_fit)
        gl.uniform1f(uniforms.u_fit, preset.fit);
    if (uniforms.u_scale)
        gl.uniform1f(uniforms.u_scale, preset.scale);
    if (uniforms.u_rotation)
        gl.uniform1f(uniforms.u_rotation, preset.rotation);
    if (uniforms.u_offsetX)
        gl.uniform1f(uniforms.u_offsetX, preset.offsetX);
    if (uniforms.u_offsetY)
        gl.uniform1f(uniforms.u_offsetY, preset.offsetY);
    SHARED.presetDirty = false;
}
function renderSharedFrame(now: number, mode: PresetMode): void {
    if (!SHARED)
        return;
    const configuredPreset = SHARED.preset;
    SHARED.preset = mode;
    SHARED.presetDirty = true;
    const { gl, uniforms, preset, glCanvas } = SHARED;
    const t = ((now - SHARED.startMs - SHARED.pausedMs) / 1000) * preset.speed;
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (SHARED.presetDirty)
        uploadPresetUniforms();
    if (uniforms.u_time)
        gl.uniform1f(uniforms.u_time, t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    SHARED.frameCount++;
    SHARED.preset = configuredPreset;
    SHARED.presetDirty = true;
}
type ShaderFrame = { canvas: HTMLCanvasElement; pixels: Uint8Array; sampledAt: number };
const shaderFrames = new WeakMap<NonNullable<typeof SHARED>, Map<PresetMode, ShaderFrame>>();
let lastFrameMs = 0;
function tick(now: number): void {
    if (!SHARED)
        return;
    const shared = SHARED;
    if (SHARED.contextLost) {
        SHARED.rafId = 0;
        return;
    }
    let anyWork = false;
    for (const inst of SHARED.instances) {
        if (inst.visible && (!inst.paused || !inst.everCopied)) {
            anyWork = true;
            break;
        }
    }
    if (!anyWork) {
        SHARED.rafId = 0;
        return;
    }
    SHARED.rafId = requestAnimationFrame(tick);
    if (now - lastFrameMs < FRAME_INTERVAL_MS) {
        if (_glowCallback) {
            for (const inst of [...shared.glowQueue]) {
                if (inst.glowFast)
                    tickInstanceGlow(inst, now);
                if (SHARED !== shared)
                    return;
            }
        }
        return;
    }
    lastFrameMs = now;
    const groups = new Map<PresetMode, MetalFxInstance[]>();
    for (const inst of SHARED.instances) {
        if (!inst.visible || (inst.paused && inst.everCopied))
            continue;
        const mode = presetOverride ?? inst.preset ?? SHARED.preset;
        const group = groups.get(mode);
        if (group)
            group.push(inst);
        else
            groups.set(mode, [inst]);
    }
    let frames = shaderFrames.get(SHARED);
    if (!frames) {
        frames = new Map();
        shaderFrames.set(SHARED, frames);
    }
    for (const mode of frames.keys()) {
        if (!groups.has(mode))
            frames.delete(mode);
    }
    for (const [mode, instances] of groups) {
        renderSharedFrame(now, mode);
        let frame = frames.get(mode);
        if (!frame) {
            const canvas = document.createElement('canvas');
            canvas.width = SHARED.glCanvas.width;
            canvas.height = SHARED.glCanvas.height;
            frame = { canvas, pixels: new Uint8Array(canvas.width * canvas.height * 4), sampledAt: -Infinity };
            frames.set(mode, frame);
        }
        if (now - frame.sampledAt >= GLOW_READBACK_INTERVAL_MS) {
            ensureGlowPixels(true);
            frame.pixels.set(SHARED.glowPixels);
            frame.sampledAt = now;
        }
        if (SHARED.useOffscreen) {
            SHARED.frameBitmap?.close();
            SHARED.frameBitmap = (SHARED.glCanvas as OffscreenCanvas).transferToImageBitmap();
        }
        const ctx = frame.canvas.getContext('2d');
        ctx?.clearRect(0, 0, frame.canvas.width, frame.canvas.height);
        ctx?.drawImage(SHARED.frameBitmap ?? SHARED.glCanvas, 0, 0);
        for (const inst of instances) {
            if (!shared.instances.has(inst))
                continue;
            inst.shaderFrame = frame.canvas;
            inst.glowPixels = frame.pixels;
            copyShaderToInstance(inst);
            if (SHARED !== shared)
                return;
            if (shared.instances.has(inst))
                inst.everCopied = true;
        }
    }
    if (_glowCallback && SHARED.glowQueue.length > 0 && ++SHARED.glowSkip % GLOW_SKIP_FRAMES === 0) {
        for (const inst of [...shared.glowQueue]) {
            tickInstanceGlow(inst, now);
            if (SHARED !== shared)
                return;
        }
    }
}
function startSharedLoop(): void {
    if (!SHARED || SHARED.rafId !== 0)
        return;
    SHARED.rafId = requestAnimationFrame(tick);
}
function stopSharedLoop(): void {
    if (!SHARED)
        return;
    if (SHARED.rafId !== 0)
        cancelAnimationFrame(SHARED.rafId);
    SHARED.rafId = 0;
}
