import * as THREE from 'three';
import { parseCssColor, type EnginePresetMode, type PresetMode } from '../presets';
import { FRAG_SRC, VERT_SRC } from './shaders';
import type { RevealState } from './reveal';
let frameIntervalMs = 1000 / 10;
let maxDpr = 1.25;
const MAX_CANVAS_DPR = 2;
function resolveCanvasDpr(): number {
    if (typeof window === 'undefined')
        return 1;
    return Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
}
export interface Instance {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    cssWidth: number;
    cssHeight: number;
    dpr: number;
    canvasDpr: number;
    preset: EnginePresetMode;
    cardBgOverride: string | null;
    colorsOverride: (string | null | undefined)[] | null;
    strength: number;
    speedMul: number;
    pixelScale: number;
    visible: boolean;
    paused: boolean;
    uniformsDirty: boolean;
    reveal: RevealState | null;
    accumulatedTime: number;
    startedAtMs: number;
}
interface SharedRenderer {
    glCanvas: HTMLCanvasElement;
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    material: THREE.ShaderMaterial;
    geometry: THREE.PlaneGeometry;
    mesh: THREE.Mesh;
    uniforms: Record<string, THREE.IUniform>;
    instances: Set<Instance>;
    rafId: number;
    lastFrameMs: number;
    lastTickMs: number;
    lastInstance: Instance | null;
    onContextLost: ((e: Event) => void) | null;
    onContextRestored: (() => void) | null;
    contextLost: boolean;
}
let SHARED: SharedRenderer | null = null;
function createUniforms(): Record<string, THREE.IUniform> {
    return {
        u_resolution: { value: new THREE.Vector2(1, 1) },
        u_dpr: { value: 1 },
        u_time: { value: 0 },
        u_color1: { value: new THREE.Color(0x1a1a1a) },
        u_color2: { value: new THREE.Color(0x808080) },
        u_color3: { value: new THREE.Color(0xd9d9d9) },
        u_color4: { value: new THREE.Color(0x404040) },
        u_color5: { value: new THREE.Color(0xc0c0c0) },
        u_color6: { value: new THREE.Color(0x606060) },
        u_color7: { value: new THREE.Color(0xa0a0a0) },
        u_cardBg: { value: new THREE.Color(0x0f0f0f) },
        u_alpha1: { value: 1 },
        u_alpha2: { value: 1 },
        u_alpha3: { value: 1 },
        u_alpha4: { value: 1 },
        u_alpha5: { value: 1 },
        u_alpha6: { value: 1 },
        u_alpha7: { value: 1 },
        u_speed: { value: 1 },
        u_intensity: { value: 1 },
        u_scale: { value: 1.5 },
        u_direction: { value: 0 },
        u_softness: { value: 0.75 },
        u_distortion: { value: 0.3 },
        u_complexity: { value: 0.2 },
        u_shape: { value: 0.5 },
        u_flicker: { value: 0 },
        u_vignette: { value: 0.25 },
        u_vigOpacity: { value: 1 },
        u_blur: { value: 0 },
        u_highlight: { value: 0.4 },
        u_shaderOpacity: { value: 1 },
        u_cellSize: { value: 0.5 },
        u_gap: { value: 0.3 },
        u_dotSize: { value: 0.8 },
        u_dotSoftness: { value: 0.1 },
        u_dotOpacity: { value: 1 },
        u_hlScale: { value: 0 },
        u_fillOpacity: { value: 0 },
        u_edgeFade: { value: 16 },
        u_fadeStr: { value: 1 },
        u_dotMode: { value: 2 },
        u_effect: { value: 4 },
        u_sweepEase: { value: 0 }
    };
}
function ensureShared(): SharedRenderer {
    if (SHARED)
        return SHARED;
    const glCanvas = document.createElement('canvas');
    glCanvas.width = 8;
    glCanvas.height = 8;
    const renderer = new THREE.WebGLRenderer({
        canvas: glCanvas,
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        antialias: false,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, maxDpr));
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = true;
    const gl = renderer.getContext();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = createUniforms();
    const material = new THREE.ShaderMaterial({
        vertexShader: VERT_SRC,
        fragmentShader: FRAG_SRC,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.NormalBlending
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    SHARED = {
        glCanvas,
        gl,
        renderer,
        scene,
        camera,
        material,
        geometry,
        mesh,
        uniforms,
        instances: new Set(),
        rafId: 0,
        lastFrameMs: 0,
        lastTickMs: performance.now(),
        lastInstance: null,
        onContextLost: null,
        onContextRestored: null,
        contextLost: false
    };
    const onLost = (e: Event): void => {
        e.preventDefault();
        if (!SHARED)
            return;
        SHARED.contextLost = true;
        if (SHARED.rafId !== 0) {
            cancelAnimationFrame(SHARED.rafId);
            SHARED.rafId = 0;
        }
    };
    const onRestored = (): void => {
        if (!SHARED)
            return;
        SHARED.contextLost = false;
        SHARED.lastInstance = null;
        for (const inst of SHARED.instances)
            inst.uniformsDirty = true;
        wakeLoop();
    };
    glCanvas.addEventListener('webglcontextlost', onLost as EventListener, false);
    glCanvas.addEventListener('webglcontextrestored', onRestored, false);
    SHARED.onContextLost = onLost;
    SHARED.onContextRestored = onRestored;
    wakeLoop();
    return SHARED;
}
function destroyShared(): void {
    if (!SHARED)
        return;
    if (SHARED.rafId !== 0)
        cancelAnimationFrame(SHARED.rafId);
    if (SHARED.onContextLost) {
        SHARED.glCanvas.removeEventListener('webglcontextlost', SHARED.onContextLost as EventListener, false);
    }
    if (SHARED.onContextRestored) {
        SHARED.glCanvas.removeEventListener('webglcontextrestored', SHARED.onContextRestored, false);
    }
    SHARED.geometry.dispose();
    SHARED.material.dispose();
    SHARED.renderer.dispose();
    SHARED = null;
}
function uploadInstanceUniforms(s: SharedRenderer, inst: Instance): void {
    const p = inst.preset;
    const u = s.uniforms;
    u.u_effect.value = p.effectIndex;
    u.u_speed.value = p.speed;
    const boost = 1 + Math.max(0, inst.strength - 1) * 2.2;
    u.u_intensity.value = p.intensity * boost;
    u.u_scale.value = p.scale;
    u.u_direction.value = (p.direction * Math.PI) / 180;
    u.u_softness.value = p.softness;
    u.u_distortion.value = p.distortion;
    u.u_complexity.value = p.complexity;
    u.u_shape.value = p.shape;
    u.u_flicker.value = p.flicker ?? 0;
    u.u_vignette.value = p.vignette;
    u.u_vigOpacity.value = p.vigOpacity;
    u.u_blur.value = p.blur;
    u.u_highlight.value = p.highlight * boost;
    u.u_shaderOpacity.value = p.shaderOpacity;
    u.u_dotMode.value = p.dotMode;
    u.u_sweepEase.value = p.sweepEase != null ? Math.floor(p.sweepEase) : 0;
    const mosaic = p.dotMode === 1 ? p.pixelConfig : p.dotConfig;
    u.u_cellSize.value = effectiveCellSize(mosaic.cellSize, inst.pixelScale);
    u.u_gap.value = mosaic.gap;
    u.u_dotSize.value = mosaic.dotSize;
    u.u_dotSoftness.value = mosaic.dotSoftness;
    u.u_dotOpacity.value = mosaic.dotOpacity;
    u.u_hlScale.value = mosaic.hlScale;
    u.u_fillOpacity.value = mosaic.fillOpacity;
    u.u_edgeFade.value = mosaic.edgeFade;
    u.u_fadeStr.value = mosaic.fadeStr;
    const [br, bg, bb] = parseCssColor(inst.cardBgOverride ?? p.cardBg);
    for (let i = 0; i < 7; i++) {
        const override = inst.colorsOverride?.[i];
        const [r, g, b] = override != null ? parseCssColor(override) : effectivePaletteColor(inst, i);
        (u[`u_color${i + 1}`].value as THREE.Color).setRGB(r, g, b);
        u[`u_alpha${i + 1}`].value = p.alphas[i];
    }
    (u.u_cardBg.value as THREE.Color).setRGB(br, bg, bb);
    inst.uniformsDirty = false;
}
export function effectiveCardBg(inst: Instance): string {
    return inst.cardBgOverride ?? inst.preset.cardBg;
}
export function effectivePaletteColor(inst: Instance, index: number): [
    number,
    number,
    number
] {
    const p = inst.preset;
    const [r, g, b] = parseCssColor(p.colors[index]);
    if (inst.cardBgOverride == null)
        return [r, g, b];
    const [pbr, pbg, pbb] = parseCssColor(p.cardBg);
    const chan = (v: number): number => Math.round(v * 255);
    if (chan(r) === chan(pbr) && chan(g) === chan(pbg) && chan(b) === chan(pbb)) {
        return parseCssColor(inst.cardBgOverride);
    }
    return [r, g, b];
}
function instancePixelSize(inst: Instance): {
    iw: number;
    ih: number;
} {
    return {
        iw: Math.max(1, Math.floor(inst.cssWidth * inst.dpr)),
        ih: Math.max(1, Math.floor(inst.cssHeight * inst.dpr))
    };
}
function maybeGrowGlCanvas(s: SharedRenderer): void {
    let needCssW = 0;
    let needCssH = 0;
    for (const inst of s.instances) {
        if (!inst.visible || inst.paused)
            continue;
        if (inst.cssWidth > needCssW)
            needCssW = inst.cssWidth;
        if (inst.cssHeight > needCssH)
            needCssH = inst.cssHeight;
    }
    if (needCssW <= 0 || needCssH <= 0)
        return;
    const dpr = s.renderer.getPixelRatio();
    const needPxW = Math.max(1, Math.floor(needCssW * dpr));
    const needPxH = Math.max(1, Math.floor(needCssH * dpr));
    const curW = s.glCanvas.width;
    const curH = s.glCanvas.height;
    if (needPxW <= curW && needPxH <= curH)
        return;
    const targetCssW = Math.max(needCssW, curW / Math.max(dpr, 0.0001));
    const targetCssH = Math.max(needCssH, curH / Math.max(dpr, 0.0001));
    s.renderer.setSize(targetCssW, targetCssH, false);
}
function paintInstance(s: SharedRenderer, inst: Instance, nowMs: number): void {
    if (s.contextLost)
        return;
    const { iw, ih } = instancePixelSize(inst);
    const cssW = Math.max(1, inst.cssWidth);
    const cssH = Math.max(1, inst.cssHeight);
    s.renderer.setViewport(0, 0, cssW, cssH);
    s.renderer.setScissor(0, 0, cssW, cssH);
    s.renderer.setScissorTest(true);
    (s.uniforms.u_resolution.value as THREE.Vector2).set(iw, ih);
    s.uniforms.u_dpr.value = inst.dpr || 1;
    const canReuseUniforms = s.lastInstance === inst && !inst.uniformsDirty;
    if (!canReuseUniforms) {
        uploadInstanceUniforms(s, inst);
        s.lastInstance = inst;
    }
    s.uniforms.u_time.value = inst.accumulatedTime;
    s.renderer.render(s.scene, s.camera);
    const dispW = Math.max(1, Math.floor(inst.cssWidth * inst.canvasDpr));
    const dispH = Math.max(1, Math.floor(inst.cssHeight * inst.canvasDpr));
    if (inst.canvas.width !== dispW || inst.canvas.height !== dispH) {
        inst.canvas.width = dispW;
        inst.canvas.height = dispH;
    }
    inst.ctx.clearRect(0, 0, dispW, dispH);
    const sy = s.glCanvas.height - ih;
    inst.ctx.imageSmoothingEnabled = false;
    inst.ctx.drawImage(s.glCanvas, 0, sy, iw, ih, 0, 0, dispW, dispH);
    inst.reveal?.afterShaderFrame(s, inst, nowMs);
    if (inst.reveal && inst.reveal.isActive()) {
        s.lastInstance = null;
    }
}
function renderInstance(s: SharedRenderer, inst: Instance, nowMs: number): void {
    if (!inst.visible || inst.paused)
        return;
    if (inst.cssWidth < 1 || inst.cssHeight < 1)
        return;
    paintInstance(s, inst, nowMs);
}
export function renderInstanceOnce(inst: Instance): void {
    if (!SHARED)
        return;
    if (SHARED.contextLost)
        return;
    if (!inst.visible)
        return;
    if (inst.cssWidth < 1 || inst.cssHeight < 1)
        return;
    maybeGrowGlCanvas(SHARED);
    paintInstance(SHARED, inst, performance.now());
}
let onAfterTick: (() => void) | null = null;
export function setAfterTick(cb: (() => void) | null): void {
    onAfterTick = cb;
}
function hasActiveInstances(s: SharedRenderer): boolean {
    for (const inst of s.instances) {
        if (inst.visible && !inst.paused)
            return true;
    }
    return false;
}
const tick = (now: number): void => {
    if (!SHARED)
        return;
    if (SHARED.contextLost) {
        SHARED.rafId = 0;
        return;
    }
    if (!hasActiveInstances(SHARED)) {
        SHARED.rafId = 0;
        onAfterTick?.();
        return;
    }
    SHARED.rafId = requestAnimationFrame(tick);
    const elapsed = now - SHARED.lastFrameMs;
    if (elapsed < frameIntervalMs)
        return;
    SHARED.lastFrameMs = now - (elapsed % frameIntervalMs);
    const deltaSec = (now - SHARED.lastTickMs) / 1000;
    SHARED.lastTickMs = now;
    for (const inst of SHARED.instances) {
        if (inst.visible && !inst.paused) {
            inst.accumulatedTime += deltaSec * inst.speedMul;
        }
    }
    maybeGrowGlCanvas(SHARED);
    for (const inst of SHARED.instances) {
        renderInstance(SHARED, inst, now);
    }
    onAfterTick?.();
};
function wakeLoop(): void {
    if (!SHARED)
        return;
    if (SHARED.contextLost)
        return;
    if (SHARED.rafId !== 0)
        return;
    SHARED.lastTickMs = performance.now();
    SHARED.lastFrameMs = SHARED.lastTickMs;
    SHARED.rafId = requestAnimationFrame(tick);
}
export interface CreateInstanceOptions {
    canvas: HTMLCanvasElement;
    cssWidth: number;
    cssHeight: number;
    preset: PresetMode;
    strength?: number;
    speed?: number;
    cardBg?: string | null;
    pixelScale?: number;
}
export function effectiveCellSize(cellSize: number, pixelScale: number): number {
    if (!(pixelScale > 0) || pixelScale === 1)
        return cellSize;
    const baseCount = (6 + cellSize * 74) / pixelScale;
    return (baseCount - 6) / 74;
}
export function createInstance(opts: CreateInstanceOptions): Instance {
    const s = ensureShared();
    const ctx = opts.canvas.getContext('2d');
    if (!ctx)
        throw new Error('img-fx: 2D context unavailable');
    const inst: Instance = {
        canvas: opts.canvas,
        ctx,
        cssWidth: opts.cssWidth,
        cssHeight: opts.cssHeight,
        dpr: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, maxDpr),
        canvasDpr: resolveCanvasDpr(),
        preset: opts.preset as EnginePresetMode,
        cardBgOverride: opts.cardBg ?? null,
        colorsOverride: null,
        strength: Math.max(0, Math.min(2, opts.strength ?? 1)),
        speedMul: opts.speed != null && opts.speed > 0 ? opts.speed : 1,
        pixelScale: opts.pixelScale != null && opts.pixelScale > 0 ? opts.pixelScale : 1,
        visible: true,
        paused: false,
        uniformsDirty: true,
        reveal: null,
        accumulatedTime: Math.random() * 1000,
        startedAtMs: performance.now()
    };
    s.instances.add(inst);
    wakeLoop();
    return inst;
}
export function destroyInstance(inst: Instance): void {
    if (!SHARED)
        return;
    SHARED.instances.delete(inst);
    if (SHARED.lastInstance === inst)
        SHARED.lastInstance = null;
    inst.reveal?.dispose();
    inst.reveal = null;
    if (SHARED.instances.size === 0)
        destroyShared();
}
export function updateInstanceSize(inst: Instance, cssWidth: number, cssHeight: number): void {
    inst.cssWidth = cssWidth;
    inst.cssHeight = cssHeight;
    if (typeof window !== 'undefined') {
        inst.dpr = Math.min(window.devicePixelRatio, maxDpr);
        inst.canvasDpr = resolveCanvasDpr();
    }
}
export function setInstancePreset(inst: Instance, preset: PresetMode): void {
    inst.preset = preset as EnginePresetMode;
    inst.uniformsDirty = true;
}
export function setInstanceCardBg(inst: Instance, cardBg: string | null): void {
    inst.cardBgOverride = cardBg;
    inst.uniformsDirty = true;
}
export function setInstanceColors(inst: Instance, colors: (string | null | undefined)[] | null): void {
    inst.colorsOverride = colors && colors.length > 0 ? colors.slice(0, 7) : null;
    inst.uniformsDirty = true;
}
export function setInstanceVisible(inst: Instance, visible: boolean): void {
    inst.visible = visible;
    if (visible)
        wakeLoop();
}
export function setInstancePaused(inst: Instance, paused: boolean): void {
    inst.paused = paused;
    if (!paused)
        wakeLoop();
}
export function setInstanceStrength(inst: Instance, strength: number): void {
    inst.strength = Math.max(0, Math.min(2, strength));
    inst.uniformsDirty = true;
}
export function setInstanceSpeed(inst: Instance, speed: number): void {
    inst.speedMul = speed > 0 ? speed : 1;
}
export function setInstancePixelScale(inst: Instance, pixelScale: number): void {
    inst.pixelScale = pixelScale > 0 ? pixelScale : 1;
    inst.uniformsDirty = true;
}
export function setFrameRate(fps: number): void {
    const safe = Math.max(1, Math.min(60, fps));
    frameIntervalMs = 1000 / safe;
}
export function setMaxDpr(dpr: number): void {
    maxDpr = Math.max(1, Math.min(4, dpr));
    if (!SHARED)
        return;
    const next = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, maxDpr);
    SHARED.renderer.setPixelRatio(next);
    for (const inst of SHARED.instances) {
        inst.dpr = next;
        inst.uniformsDirty = true;
    }
    SHARED.lastInstance = null;
}
export function getFrameRate(): number {
    return 1000 / frameIntervalMs;
}
export function getMaxDpr(): number {
    return maxDpr;
}
export function setSharedFragmentShader(src: string | null): void {
    const s = ensureShared();
    const next = src ?? FRAG_SRC;
    if (s.material.fragmentShader === next)
        return;
    s.material.fragmentShader = next;
    s.material.needsUpdate = true;
    for (const inst of s.instances)
        inst.uniformsDirty = true;
    wakeLoop();
}
export function withSharedRenderer<T>(fn: (s: SharedRenderer) => T): T {
    return fn(ensureShared());
}
export type { SharedRenderer };
