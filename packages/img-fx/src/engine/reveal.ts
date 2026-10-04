import { parseCssColor, type EnginePresetMode, type MaskShape } from '../presets';
import { ease } from './tween';
import { effectiveCardBg, effectiveCellSize, effectivePaletteColor, type Instance, type SharedRenderer } from './renderer';
const MASK_SIZE = 64;
const DOT_MASK_SIZE = 96;
const REVEAL_REF_DIM = 320;
const COVER_EDGE_INSET_FRAC = 0.006;
function computeCoverSourceRect(img: HTMLImageElement, targetW: number, targetH: number): {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
} {
    const targetAspect = targetW / Math.max(1, targetH);
    const imgAspect = img.width / Math.max(1, img.height);
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    if (imgAspect > targetAspect) {
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
    }
    else {
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
    }
    const inset = Math.min(sw, sh) * COVER_EDGE_INSET_FRAC;
    if (sw - 2 * inset > 1 && sh - 2 * inset > 1) {
        sx += inset;
        sy += inset;
        sw -= 2 * inset;
        sh -= 2 * inset;
    }
    return { sx, sy, sw, sh };
}
const IMAGE_CACHE = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
    let entry = IMAGE_CACHE.get(src);
    if (entry)
        return entry;
    entry = new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        const done = (): void => resolve(img);
        img.onerror = (e) => {
            IMAGE_CACHE.delete(src);
            reject(e);
        };
        if (typeof img.decode === 'function') {
            img.src = src;
            img.decode().then(done, () => {
                if (img.complete && img.naturalWidth > 0)
                    done();
                else
                    img.onload = done;
            });
        }
        else {
            img.onload = done;
            img.src = src;
        }
    });
    IMAGE_CACHE.set(src, entry);
    return entry;
}
export interface RevealStartOptions {
    image: HTMLImageElement;
    cssWidth: number;
    cssHeight: number;
    onRevealComplete?: () => void;
}
export interface RevealState {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    afterShaderFrame: (s: SharedRenderer, inst: Instance, nowMs: number) => void;
    startReveal: (opts: RevealStartOptions) => void;
    startHide: (durationMs?: number) => void;
    startBoil: () => void;
    clear: () => void;
    isActive: () => boolean;
    dispose: () => void;
}
interface RevealInternals {
    active: boolean;
    phase: 'idle' | 'reveal' | 'hold' | 'hide' | 'boil';
    revealStartMs: number;
    hideStartMs: number;
    hideDurationMs: number;
    boilStartMs: number;
    boilPattern: Float32Array | null;
    boilPatternW: number;
    boilPatternH: number;
    boilField: Float32Array | null;
    boilHandoffStartMs: number;
    pendingReveal: RevealStartOptions | null;
    image: HTMLImageElement | null;
    onRevealComplete?: () => void;
    cssWidth: number;
    cssHeight: number;
    sampleCanvas: HTMLCanvasElement | null;
    sampleCtx: CanvasRenderingContext2D | null;
    sampleImgData: ImageData | null;
    sampleDataCache: Uint8ClampedArray | null;
    sampleFrameCounter: number;
    maskGrad: HTMLCanvasElement | null;
    maskGradCtx: CanvasRenderingContext2D | null;
    maskImgData: ImageData | null;
    gsFlickerTable: Float32Array | null;
    pixCanvas: HTMLCanvasElement | null;
    pixCtx: CanvasRenderingContext2D | null;
    pixDrop: HTMLCanvasElement | null;
    pixDropCtx: CanvasRenderingContext2D | null;
    pixDropImgData: ImageData | null;
    pixDropPattern: Float32Array | null;
    pixDropPatternW: number;
    pixDropPatternH: number;
    pixDropRevealStart: number;
    coverA: CoverBitmap | null;
    coverB: CoverBitmap | null;
    holdPaintedImg: HTMLImageElement | null;
    holdPaintedW: number;
    holdPaintedH: number;
    sampleGpuCanvas: HTMLCanvasElement | null;
    sampleGpuCtx: CanvasRenderingContext2D | null;
}
interface CoverBitmap {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    img: HTMLImageElement | null;
    w: number;
    h: number;
}
function getCoverBitmap(state: RevealInternals, slot: 'a' | 'b', img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
    let cb = slot === 'a' ? state.coverA : state.coverB;
    if (!cb) {
        const canvas = document.createElement('canvas');
        const c = canvas.getContext('2d');
        if (!c)
            throw new Error('img-fx: 2D context unavailable for cover bitmap');
        cb = { canvas, ctx: c, img: null, w: 0, h: 0 };
        if (slot === 'a')
            state.coverA = cb;
        else
            state.coverB = cb;
    }
    if (cb.img !== img || cb.w !== w || cb.h !== h) {
        cb.canvas.width = w;
        cb.canvas.height = h;
        cb.w = w;
        cb.h = h;
        cb.img = img;
        const { sx, sy, sw, sh } = computeCoverSourceRect(img, w, h);
        cb.ctx.clearRect(0, 0, w, h);
        cb.ctx.imageSmoothingEnabled = true;
        cb.ctx.imageSmoothingQuality = 'high';
        cb.ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    }
    return cb.canvas;
}
function getMaskSize(p: EnginePresetMode): number {
    return p.dotMode === 2 ? DOT_MASK_SIZE : MASK_SIZE;
}
function getActiveRevealTiming(p: EnginePresetMode): {
    duration: number;
    easingKey: EnginePresetMode['revealConfig']['easing'];
} {
    const r = p.revealConfig;
    if (p.dotMode === 2) {
        return { duration: Math.max(0.05, r.dotDuration), easingKey: r.dotEasing };
    }
    return { duration: Math.max(0.05, r.duration), easingKey: r.easing };
}
function getMaskValue(shape: MaskShape, r: number, c: number, size: number): number {
    const nx = c / (size - 1);
    const ny = r / (size - 1);
    const cx = nx - 0.5;
    const cy = ny - 0.5;
    switch (shape) {
        case 'radialCenter':
            return 1 - Math.sqrt(cx * cx + cy * cy) * 2;
        case 'radialCorner':
            return 1 - Math.sqrt(nx * nx + ny * ny) / 1.414;
        case 'linearTop':
            return 1 - ny;
        case 'linearBottom':
            return ny;
        case 'linearLeft':
            return 1 - nx;
        case 'linearRight':
            return nx;
        case 'diagonalTL':
            return 1 - (nx + ny) / 2;
        case 'diagonalBR':
            return (nx + ny) / 2;
        case 'diamond':
            return 1 - (Math.abs(cx) + Math.abs(cy));
        case 'blindsH':
            return 1 - ((ny * 8) % 1);
        case 'blindsV':
            return 1 - ((nx * 8) % 1);
        default:
            return -1;
    }
}
function sampleShaderField(state: RevealInternals, s: SharedRenderer, inst: Instance, scratchCtx: CanvasRenderingContext2D, maskSize: number): Uint8ClampedArray {
    const origDotMode = s.uniforms.u_dotMode.value as number;
    const origFillOpacity = s.uniforms.u_fillOpacity.value as number;
    const presetDotMode = inst.preset.dotMode;
    const sampleDotMode = presetDotMode < 1.5 ? 0 : 1;
    s.uniforms.u_dotMode.value = sampleDotMode;
    s.uniforms.u_fillOpacity.value =
        sampleDotMode > 0.5
            ? presetDotMode === 1
                ? inst.preset.pixelConfig.fillOpacity
                : inst.preset.dotConfig.fillOpacity
            : 0;
    s.renderer.render(s.scene, s.camera);
    const iw = Math.max(1, Math.floor(inst.cssWidth * inst.dpr));
    const ih = Math.max(1, Math.floor(inst.cssHeight * inst.dpr));
    const sy = Math.max(0, s.glCanvas.height - ih);
    if (!state.sampleGpuCanvas) {
        state.sampleGpuCanvas = document.createElement('canvas');
        state.sampleGpuCtx = state.sampleGpuCanvas.getContext('2d');
    }
    const gpuCanvas = state.sampleGpuCanvas;
    const gpuCtx = state.sampleGpuCtx as CanvasRenderingContext2D;
    if (gpuCanvas.width !== maskSize || gpuCanvas.height !== maskSize) {
        gpuCanvas.width = maskSize;
        gpuCanvas.height = maskSize;
    }
    gpuCtx.clearRect(0, 0, maskSize, maskSize);
    gpuCtx.drawImage(s.glCanvas, 0, sy, iw, ih, 0, 0, maskSize, maskSize);
    scratchCtx.clearRect(0, 0, maskSize, maskSize);
    scratchCtx.drawImage(gpuCanvas, 0, 0);
    s.uniforms.u_dotMode.value = origDotMode;
    s.uniforms.u_fillOpacity.value = origFillOpacity;
    state.sampleImgData = scratchCtx.getImageData(0, 0, maskSize, maskSize);
    state.sampleDataCache = state.sampleImgData.data;
    return state.sampleDataCache;
}
function ensureScratch(state: RevealInternals, maskSize: number): void {
    if (!state.sampleCanvas) {
        state.sampleCanvas = document.createElement('canvas');
        state.sampleCtx = state.sampleCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (state.sampleCanvas.width !== maskSize || state.sampleCanvas.height !== maskSize) {
        state.sampleCanvas.width = maskSize;
        state.sampleCanvas.height = maskSize;
        state.sampleImgData = null;
        state.sampleDataCache = null;
        state.sampleFrameCounter = 0;
    }
    if (!state.maskGrad) {
        state.maskGrad = document.createElement('canvas');
        state.maskGradCtx = state.maskGrad.getContext('2d');
    }
    if (state.maskGrad.width !== maskSize || state.maskGrad.height !== maskSize) {
        state.maskGrad.width = maskSize;
        state.maskGrad.height = maskSize;
        state.maskImgData = null;
    }
    if (!state.maskImgData && state.maskGradCtx) {
        state.maskImgData = state.maskGradCtx.createImageData(maskSize, maskSize);
    }
}
function paintMaskedFrame(state: RevealInternals, s: SharedRenderer, inst: Instance, ctx: CanvasRenderingContext2D): void {
    if (!state.image)
        return;
    const preset = inst.preset;
    const targetW = inst.canvas.width;
    const targetH = inst.canvas.height;
    if (ctx.canvas.width !== targetW || ctx.canvas.height !== targetH) {
        ctx.canvas.width = targetW;
        ctx.canvas.height = targetH;
    }
    ctx.clearRect(0, 0, targetW, targetH);
    const { duration, easingKey } = getActiveRevealTiming(preset);
    const elapsed = (performance.now() - state.revealStartMs) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    const eased = ease(easingKey, progress);
    const img = state.image;
    const { sx, sy, sw, sh } = computeCoverSourceRect(img, targetW, targetH);
    const maxBlur = preset.revealConfig.blur;
    if (progress < 1 && maxBlur > 0) {
        const b = maxBlur * (1 - eased);
        ctx.canvas.style.filter = b > 0.1 ? `blur(${b.toFixed(1)}px)` : 'none';
    }
    else {
        ctx.canvas.style.filter = 'none';
    }
    if (progress >= 1) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(getCoverBitmap(state, 'a', img, targetW, targetH), 0, 0);
        return;
    }
    const maskSize = getMaskSize(preset);
    ensureScratch(state, maskSize);
    const sampleCtx = state.sampleCtx as CanvasRenderingContext2D;
    const maskGrad = state.maskGrad as HTMLCanvasElement;
    const maskGradCtx = state.maskGradCtx as CanvasRenderingContext2D;
    const maskShape = preset.revealConfig.maskShape;
    const softBand = preset.revealConfig.softness;
    const useShader = maskShape.startsWith('shader');
    let sampleData: Uint8ClampedArray | null = null;
    let targetColor: [
        number,
        number,
        number
    ] | null = null;
    let highlightColors: Array<[
        number,
        number,
        number
    ]> | null = null;
    if (useShader) {
        const counter = state.sampleFrameCounter++;
        const shouldSample = state.sampleDataCache == null || (counter & 1) === 0;
        if (shouldSample) {
            sampleData = sampleShaderField(state, s, inst, sampleCtx, maskSize);
        }
        else {
            sampleData = state.sampleDataCache;
        }
        const colorMap: Record<string, number> = {
            shaderColor1: 0,
            shaderColor2: 1,
            shaderColor3: 2,
            shaderColor4: 3,
            shaderColor5: 4
        };
        if (colorMap[maskShape] != null) {
            targetColor = effectivePaletteColor(inst, colorMap[maskShape]);
        }
        if (maskShape === 'shaderHighlight') {
            const bg = parseCssColor(effectiveCardBg(inst));
            highlightColors = [];
            for (let i = 0; i < 5; i++) {
                const c = effectivePaletteColor(inst, i);
                const dr = c[0] - bg[0];
                const dg = c[1] - bg[1];
                const db = c[2] - bg[2];
                const distC = Math.sqrt(dr * dr + dg * dg + db * db);
                if (distC > 0.15)
                    highlightColors.push(c);
            }
            if (highlightColors.length === 0)
                highlightColors = [effectivePaletteColor(inst, 0)];
        }
    }
    const threshold = 1 - eased * (1 + softBand);
    const isGradientSweep = maskShape === 'gradientSweep';
    let gsW = 0;
    let gsPos = 0;
    let gsGrid = 2;
    const gsAmp = preset.flicker ?? 0;
    let gsTable: Float32Array | null = null;
    let gsHashFn: ((i: number, s: number) => number) | null = null;
    let gsStep = 0;
    let gsStep1 = 0;
    let gsFz = 0;
    if (gsAmp > 0.003) {
        gsGrid = Math.max(2, Math.floor(6 + effectiveCellSize(preset.pixelConfig.cellSize, inst.pixelScale) * 74));
        const gsT = inst.accumulatedTime * Math.max(preset.speed, 2) * 1.6;
        const rawStep = Math.floor(gsT);
        gsStep = rawStep % 1024;
        gsStep1 = (gsStep + 1) % 1024;
        gsFz = gsT - rawStep;
        gsFz = gsFz * gsFz * (3 - 2 * gsFz);
        const gsHash = (i: number, s: number): number => {
            const x = Math.sin(i * 127.1 + s * 17.23) * 43758.5453;
            return x - Math.floor(x);
        };
        gsHashFn = gsHash;
        const cellCount = gsGrid * gsGrid;
        if (!state.gsFlickerTable || state.gsFlickerTable.length !== cellCount) {
            state.gsFlickerTable = new Float32Array(cellCount);
        }
        gsTable = state.gsFlickerTable;
        for (let i = 0; i < cellCount; i++) {
            const rnd = gsHash(i, gsStep) * (1 - gsFz) + gsHash(i, gsStep1) * gsFz;
            gsTable[i] = (rnd - 0.5) * gsAmp * 1.6;
        }
    }
    if (isGradientSweep) {
        gsW = 0.9 / Math.max(preset.scale, 0.25);
        gsPos = -gsW + eased * (1 + 2 * gsW);
    }
    const maskImgData = state.maskImgData as ImageData;
    const md = maskImgData.data;
    for (let r = 0; r < maskSize; r++) {
        for (let c = 0; c < maskSize; c++) {
            let val: number;
            if (useShader && sampleData) {
                const i = (r * maskSize + c) * 4;
                const pr = sampleData[i] / 255;
                const pg = sampleData[i + 1] / 255;
                const pb = sampleData[i + 2] / 255;
                if (highlightColors) {
                    let maxProx = 0;
                    for (const hc of highlightColors) {
                        const dr = pr - hc[0];
                        const dg = pg - hc[1];
                        const db = pb - hc[2];
                        const prox = Math.exp(-10 * (dr * dr + dg * dg + db * db));
                        if (prox > maxProx)
                            maxProx = prox;
                    }
                    val = maxProx;
                }
                else if (targetColor) {
                    const dr = pr - targetColor[0];
                    const dg = pg - targetColor[1];
                    const db = pb - targetColor[2];
                    val = Math.exp(-8 * (dr * dr + dg * dg + db * db));
                }
                else {
                    val = (sampleData[i] * 0.299 + sampleData[i + 1] * 0.587 + sampleData[i + 2] * 0.114) / 255;
                }
            }
            else if (!isGradientSweep) {
                val = getMaskValue(maskShape, r, c, maskSize);
            }
            else {
                val = 0;
            }
            let a: number;
            if (isGradientSweep) {
                const nx = c / (maskSize - 1);
                const ny = r / (maskSize - 1);
                const dd = (nx + ny) * 0.5;
                a = (gsPos + gsW - dd) / (2 * gsW);
            }
            else {
                a = (val - threshold) / softBand;
            }
            if (gsTable && a > -0.5 && a < 1.5) {
                const at = a < 0 ? 0 : a > 1 ? 1 : a;
                const edge = at * (1 - at) * 4;
                if (edge > 0.001) {
                    const nx = c / (maskSize - 1);
                    const ny = r / (maskSize - 1);
                    const ci = Math.floor(ny * gsGrid) * gsGrid + Math.floor(nx * gsGrid);
                    a += gsTable[ci] * edge;
                }
            }
            if (a < 0)
                a = 0;
            else if (a > 1)
                a = 1;
            a = a * a * (3 - 2 * a);
            const idx = (r * maskSize + c) * 4;
            md[idx] = 255;
            md[idx + 1] = 255;
            md[idx + 2] = 255;
            md[idx + 3] = (a * 255 + 0.5) | 0;
        }
    }
    maskGradCtx.putImageData(maskImgData, 0, 0);
    if (preset.dotMode === 1) {
        paintPixelMasked(state, ctx, img, sx, sy, sw, sh, preset, elapsed, targetW, targetH, inst, isGradientSweep ? 0 : gsAmp, gsHashFn, gsStep, gsStep1, gsFz);
    }
    else {
        if (preset.dotMode === 2) {
            paintPixelatedDropLayer(state, ctx, img, sx, sy, sw, sh, effectiveCellSize(preset.pixelConfig.cellSize, inst.pixelScale), elapsed, preset.revealConfig.pixDuration, preset.revealConfig.pixEasing, inst, targetW, targetH);
        }
        else {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(getCoverBitmap(state, 'a', img, targetW, targetH), 0, 0);
        }
        ctx.globalCompositeOperation = 'destination-in';
        const sharpMask = preset.dotMode === 2 && useShader;
        if (sharpMask)
            ctx.imageSmoothingEnabled = false;
        ctx.drawImage(maskGrad, 0, 0, targetW, targetH);
        if (sharpMask)
            ctx.imageSmoothingEnabled = true;
        ctx.globalCompositeOperation = 'source-over';
    }
}
function paintPixelatedDropLayer(state: RevealInternals, ctx: CanvasRenderingContext2D, img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, cellSize: number, elapsed: number, pixDuration: number, pixEasing: EnginePresetMode['revealConfig']['pixEasing'], inst: Instance, targetW: number, targetH: number): void {
    const baseCount = 6 + cellSize * 74;
    const cssW = Math.max(1, inst.cssWidth);
    const cssH = Math.max(1, inst.cssHeight);
    const gridX = Math.max(2, Math.floor((baseCount * cssW) / REVEAL_REF_DIM));
    const gridY = Math.max(2, Math.floor((baseCount * cssH) / REVEAL_REF_DIM));
    const cellCount = gridX * gridY;
    const pixDur = Math.max(0.05, pixDuration);
    const fadeRaw = Math.max(0, Math.min(1, elapsed / pixDur));
    const fadeT = ease(pixEasing, fadeRaw);
    if (!state.pixCanvas) {
        state.pixCanvas = document.createElement('canvas');
        state.pixCtx = state.pixCanvas.getContext('2d');
    }
    const pixCanvas = state.pixCanvas as HTMLCanvasElement;
    const pixCtx = state.pixCtx as CanvasRenderingContext2D;
    if (pixCanvas.width !== gridX || pixCanvas.height !== gridY) {
        pixCanvas.width = gridX;
        pixCanvas.height = gridY;
    }
    if (!state.pixDrop) {
        state.pixDrop = document.createElement('canvas');
        state.pixDropCtx = state.pixDrop.getContext('2d');
    }
    const pixDrop = state.pixDrop as HTMLCanvasElement;
    const pixDropCtx = state.pixDropCtx as CanvasRenderingContext2D;
    if (pixDrop.width !== gridX || pixDrop.height !== gridY) {
        pixDrop.width = gridX;
        pixDrop.height = gridY;
        state.pixDropImgData = pixDropCtx.createImageData(gridX, gridY);
        const dd0 = state.pixDropImgData.data;
        for (let i = 0; i < dd0.length; i += 4) {
            dd0[i] = 255;
            dd0[i + 1] = 255;
            dd0[i + 2] = 255;
        }
    }
    const softBand = 0.07;
    const invBand2 = 1 / (2 * softBand);
    if (!state.pixDropPattern ||
        state.pixDropPatternW !== gridX ||
        state.pixDropPatternH !== gridY ||
        state.pixDropRevealStart !== state.revealStartMs) {
        state.pixDropPattern = new Float32Array(cellCount);
        const lo = softBand;
        const span = 1 - 2 * softBand;
        for (let i = 0; i < state.pixDropPattern.length; i++) {
            state.pixDropPattern[i] = lo + Math.random() * span;
        }
        state.pixDropPatternW = gridX;
        state.pixDropPatternH = gridY;
        state.pixDropRevealStart = state.revealStartMs;
    }
    const dd = (state.pixDropImgData as ImageData).data;
    const pattern = state.pixDropPattern;
    for (let i = 0; i < pattern.length; i++) {
        const dt = pattern[i];
        let a = 0.5 + (dt - fadeT) * invBand2;
        if (a < 0)
            a = 0;
        else if (a > 1)
            a = 1;
        dd[i * 4 + 3] = (a * 255 + 0.5) | 0;
    }
    pixDropCtx.putImageData(state.pixDropImgData as ImageData, 0, 0);
    pixCtx.globalCompositeOperation = 'source-over';
    pixCtx.clearRect(0, 0, gridX, gridY);
    pixCtx.imageSmoothingEnabled = true;
    pixCtx.imageSmoothingQuality = 'high';
    pixCtx.drawImage(getCoverBitmap(state, 'a', img, targetW, targetH), 0, 0, targetW, targetH, 0, 0, gridX, gridY);
    pixCtx.globalCompositeOperation = 'destination-in';
    pixCtx.imageSmoothingEnabled = false;
    pixCtx.drawImage(pixDrop, 0, 0);
    pixCtx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(getCoverBitmap(state, 'a', img, targetW, targetH), 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixCanvas, 0, 0, gridX, gridY, 0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
}
function paintPixelMasked(state: RevealInternals, ctx: CanvasRenderingContext2D, img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, preset: EnginePresetMode, elapsed: number, targetW: number, targetH: number, inst: Instance, flickerAmp: number, flickerHash: ((i: number, s: number) => number) | null, flickerStep: number, flickerStep1: number, flickerFz: number): void {
    const cellSize = effectiveCellSize(preset.pixelConfig.cellSize, inst.pixelScale);
    const baseCount = 6 + cellSize * 74;
    const cssW = Math.max(1, inst.cssWidth);
    const cssH = Math.max(1, inst.cssHeight);
    const gridX = Math.max(2, Math.floor((baseCount * cssW) / REVEAL_REF_DIM));
    const gridY = Math.max(2, Math.floor((baseCount * cssH) / REVEAL_REF_DIM));
    const cellCount = gridX * gridY;
    const pixDur = Math.max(0.05, preset.revealConfig.pixDuration);
    const fadeRaw = Math.max(0, Math.min(1, elapsed / pixDur));
    const fadeT = ease(preset.revealConfig.pixEasing, fadeRaw);
    if (!state.pixCanvas) {
        state.pixCanvas = document.createElement('canvas');
        state.pixCtx = state.pixCanvas.getContext('2d');
    }
    const pixCanvas = state.pixCanvas as HTMLCanvasElement;
    const pixCtx = state.pixCtx as CanvasRenderingContext2D;
    if (pixCanvas.width !== gridX || pixCanvas.height !== gridY) {
        pixCanvas.width = gridX;
        pixCanvas.height = gridY;
    }
    if (!state.pixDrop) {
        state.pixDrop = document.createElement('canvas');
        state.pixDropCtx = state.pixDrop.getContext('2d');
    }
    const pixDrop = state.pixDrop as HTMLCanvasElement;
    const pixDropCtx = state.pixDropCtx as CanvasRenderingContext2D;
    if (pixDrop.width !== gridX || pixDrop.height !== gridY) {
        pixDrop.width = gridX;
        pixDrop.height = gridY;
        state.pixDropImgData = pixDropCtx.createImageData(gridX, gridY);
        const dd0 = state.pixDropImgData.data;
        for (let i = 0; i < dd0.length; i += 4) {
            dd0[i] = 255;
            dd0[i + 1] = 255;
            dd0[i + 2] = 255;
        }
    }
    const softBand = 0.07;
    const invBand2 = 1 / (2 * softBand);
    if (!state.pixDropPattern ||
        state.pixDropPatternW !== gridX ||
        state.pixDropPatternH !== gridY ||
        state.pixDropRevealStart !== state.revealStartMs) {
        state.pixDropPattern = new Float32Array(cellCount);
        const lo = softBand;
        const span = 1 - 2 * softBand;
        for (let i = 0; i < state.pixDropPattern.length; i++) {
            state.pixDropPattern[i] = lo + Math.random() * span;
        }
        state.pixDropPatternW = gridX;
        state.pixDropPatternH = gridY;
        state.pixDropRevealStart = state.revealStartMs;
    }
    const dd = (state.pixDropImgData as ImageData).data;
    const pattern = state.pixDropPattern;
    const useFlicker = flickerAmp > 0.003 && flickerHash != null;
    for (let i = 0; i < pattern.length; i++) {
        const dt = pattern[i];
        let a = 0.5 + (dt - fadeT) * invBand2;
        if (a < 0)
            a = 0;
        else if (a > 1)
            a = 1;
        if (useFlicker) {
            const prox = 1 - Math.abs(fadeT - dt) * 6.25;
            if (prox > 0) {
                const rnd = flickerHash!(i, flickerStep) * (1 - flickerFz) + flickerHash!(i, flickerStep1) * flickerFz;
                a += (rnd - 0.5) * flickerAmp * 1.6 * prox;
                if (a < 0)
                    a = 0;
                else if (a > 1)
                    a = 1;
            }
        }
        dd[i * 4 + 3] = (a * 255 + 0.5) | 0;
    }
    pixDropCtx.putImageData(state.pixDropImgData as ImageData, 0, 0);
    pixCtx.globalCompositeOperation = 'source-over';
    pixCtx.clearRect(0, 0, gridX, gridY);
    pixCtx.imageSmoothingEnabled = true;
    pixCtx.imageSmoothingQuality = 'high';
    pixCtx.drawImage(getCoverBitmap(state, 'a', img, targetW, targetH), 0, 0, targetW, targetH, 0, 0, gridX, gridY);
    pixCtx.globalCompositeOperation = 'destination-in';
    pixCtx.imageSmoothingEnabled = false;
    pixCtx.drawImage(pixDrop, 0, 0);
    pixCtx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(getCoverBitmap(state, 'a', img, targetW, targetH), 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixCanvas, 0, 0, gridX, gridY, 0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    pixCtx.globalCompositeOperation = 'source-over';
    pixCtx.clearRect(0, 0, gridX, gridY);
    pixCtx.imageSmoothingEnabled = true;
    pixCtx.imageSmoothingQuality = 'high';
    pixCtx.drawImage(state.maskGrad as HTMLCanvasElement, 0, 0, gridX, gridY);
    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(pixCanvas, 0, 0, gridX, gridY, 0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'source-over';
}
const BOIL_PIX_IN_MS = 800;
const BOIL_PIX_OVERLAP_MS = 300;
const BOIL_RAMP_S = 1.0;
const BOIL_LEVEL = 0.5;
const BOIL_BAND = 0.03;
const BOIL_FIELD_W = 0.6;
const BOIL_BLEND_MS = 800;
const BOIL_BASE_MS = 400;
const BOIL_SHARPEN_MS = 1200;
function paintBoilFrame(state: RevealInternals, s: SharedRenderer, inst: Instance, ctx: CanvasRenderingContext2D, shaderCanvas: HTMLCanvasElement, nowMs: number): void {
    const img = state.image;
    if (!img)
        return;
    const preset = inst.preset;
    const targetW = inst.canvas.width;
    const targetH = inst.canvas.height;
    if (ctx.canvas.width !== targetW || ctx.canvas.height !== targetH) {
        ctx.canvas.width = targetW;
        ctx.canvas.height = targetH;
    }
    ctx.canvas.style.filter = 'none';
    const cellSize = effectiveCellSize(preset.pixelConfig.cellSize, inst.pixelScale);
    const baseCount = 6 + cellSize * 74;
    const cssW = Math.max(1, inst.cssWidth);
    const cssH = Math.max(1, inst.cssHeight);
    const gridX = Math.max(2, Math.floor((baseCount * cssW) / REVEAL_REF_DIM));
    const gridY = Math.max(2, Math.floor((baseCount * cssH) / REVEAL_REF_DIM));
    const cellCount = gridX * gridY;
    const pending = state.pendingReveal;
    const hand = pending && state.boilHandoffStartMs > 0 ? nowMs - state.boilHandoffStartMs : -1;
    const smooth = (t: number): number => t * t * (3 - 2 * t);
    const blendT = hand < 0 ? 0 : smooth(Math.min(1, hand / BOIL_BLEND_MS));
    const rt = hand < 0 ? -1 : hand - BOIL_BLEND_MS;
    const baseT = rt <= 0 ? 0 : smooth(Math.min(1, rt / BOIL_BASE_MS));
    const sharpRaw = rt <= 0 ? 0 : Math.min(1, rt / BOIL_SHARPEN_MS);
    const resolving = pending != null && rt > 0;
    const sinceStart = nowMs - state.boilStartMs;
    const inRaw = Math.min(1, sinceStart / BOIL_PIX_IN_MS);
    const inT = inRaw * inRaw * (3 - 2 * inRaw);
    const pixelatingIn = inRaw < 1;
    const baseOutRaw = Math.min(1, Math.max(0, sinceStart - (BOIL_PIX_IN_MS - BOIL_PIX_OVERLAP_MS)) / BOIL_PIX_OVERLAP_MS);
    const pixInBaseAlpha = 1 - baseOutRaw * baseOutRaw * (3 - 2 * baseOutRaw);
    const rampRaw = Math.min(1, Math.max(0, sinceStart - (BOIL_PIX_IN_MS - BOIL_PIX_OVERLAP_MS)) / (BOIL_RAMP_S * 1000));
    const ramp = rampRaw * rampRaw * (3 - 2 * rampRaw);
    const boilT = ramp * BOIL_LEVEL;
    shaderCanvas.style.opacity = String(ramp);
    if (!state.pixCanvas) {
        state.pixCanvas = document.createElement('canvas');
        state.pixCtx = state.pixCanvas.getContext('2d');
    }
    const pixCanvas = state.pixCanvas as HTMLCanvasElement;
    const pixCtx = state.pixCtx as CanvasRenderingContext2D;
    if (pixCanvas.width !== gridX || pixCanvas.height !== gridY) {
        pixCanvas.width = gridX;
        pixCanvas.height = gridY;
    }
    if (!state.pixDrop) {
        state.pixDrop = document.createElement('canvas');
        state.pixDropCtx = state.pixDrop.getContext('2d');
    }
    const pixDrop = state.pixDrop as HTMLCanvasElement;
    const pixDropCtx = state.pixDropCtx as CanvasRenderingContext2D;
    if (pixDrop.width !== gridX || pixDrop.height !== gridY || !state.pixDropImgData) {
        pixDrop.width = gridX;
        pixDrop.height = gridY;
        state.pixDropImgData = pixDropCtx.createImageData(gridX, gridY);
        const dd0 = state.pixDropImgData.data;
        for (let i = 0; i < dd0.length; i += 4) {
            dd0[i] = 255;
            dd0[i + 1] = 255;
            dd0[i + 2] = 255;
        }
    }
    if (!state.boilPattern || state.boilPatternW !== gridX || state.boilPatternH !== gridY) {
        state.boilPattern = new Float32Array(cellCount);
        for (let i = 0; i < cellCount; i++)
            state.boilPattern[i] = Math.random();
        state.boilPatternW = gridX;
        state.boilPatternH = gridY;
    }
    const amp = Math.max(preset.flicker ?? 0, 0.5);
    const gsT = inst.accumulatedTime * Math.max(preset.speed, 2) * 1.6;
    const rawStep = Math.floor(gsT);
    const step = rawStep % 1024;
    const step1 = (step + 1) % 1024;
    let fz = gsT - rawStep;
    fz = fz * fz * (3 - 2 * fz);
    const hash = (i: number, st: number): number => {
        const x = Math.sin(i * 127.1 + st * 17.23) * 43758.5453;
        return x - Math.floor(x);
    };
    const dd = (state.pixDropImgData as ImageData).data;
    const pattern = state.boilPattern;
    const maskSize = getMaskSize(preset);
    ensureScratch(state, maskSize);
    const counter = state.sampleFrameCounter++;
    const shouldSample = state.sampleDataCache == null || counter % 3 === 0;
    const fieldStale = !state.boilField || state.boilField.length !== cellCount;
    const sampleData = shouldSample
        ? sampleShaderField(state, s, inst, state.sampleCtx as CanvasRenderingContext2D, maskSize)
        : (state.sampleDataCache as Uint8ClampedArray);
    if (shouldSample || fieldStale) {
        if (fieldStale)
            state.boilField = new Float32Array(cellCount);
        const f = state.boilField as Float32Array;
        let fMin = 1;
        let fMax = 0;
        for (let cy = 0; cy < gridY; cy++) {
            const my = Math.min(maskSize - 1, ((cy + 0.5) * maskSize / gridY) | 0);
            for (let cx = 0; cx < gridX; cx++) {
                const mx = Math.min(maskSize - 1, ((cx + 0.5) * maskSize / gridX) | 0);
                const si = (my * maskSize + mx) * 4;
                const lum = (sampleData[si] * 0.299 + sampleData[si + 1] * 0.587 + sampleData[si + 2] * 0.114) / 255;
                f[cy * gridX + cx] = lum;
                if (lum < fMin)
                    fMin = lum;
                if (lum > fMax)
                    fMax = lum;
            }
        }
        const fSpan = fMax - fMin > 0.001 ? 1 / (fMax - fMin) : 0;
        for (let i = 0; i < cellCount; i++) {
            f[i] = fSpan > 0 ? (f[i] - fMin) * fSpan : 0.5;
        }
    }
    const field = state.boilField as Float32Array;
    const invBand2 = 1 / (2 * BOIL_BAND);
    const churn = amp * 0.6 * (1 - sharpRaw);
    const patW = 1 - BOIL_FIELD_W;
    const fadeT = resolving ? ease(preset.revealConfig.pixEasing, sharpRaw) : 0;
    const softBand = 0.07;
    const invBandS = 1 / (2 * softBand);
    const sAmp = preset.flicker ?? 0;
    for (let i = 0; i < cellCount; i++) {
        const rnd = hash(i, step) * (1 - fz) + hash(i, step1) * fz;
        const dtEff = field[i] * BOIL_FIELD_W + pattern[i] * patW + (rnd - 0.5) * churn;
        let a = 0.5 + (dtEff - boilT) * invBand2;
        if (a < 0)
            a = 0;
        else if (a > 1)
            a = 1;
        if (pixelatingIn) {
            const dt = pattern[i];
            let aIn = 0.5 + (inT - dt) * invBandS;
            if (aIn < 0)
                aIn = 0;
            else if (aIn > 1)
                aIn = 1;
            const prox = 1 - Math.abs(inT - dt) * 6.25;
            if (prox > 0) {
                aIn += (rnd - 0.5) * amp * 1.6 * prox;
                if (aIn < 0)
                    aIn = 0;
                else if (aIn > 1)
                    aIn = 1;
            }
            if (aIn < a)
                a = aIn;
        }
        if (resolving) {
            const dt = pattern[i];
            let a2 = 0.5 + (dt - fadeT) * invBandS;
            if (a2 < 0)
                a2 = 0;
            else if (a2 > 1)
                a2 = 1;
            if (sAmp > 0.003) {
                const prox = 1 - Math.abs(fadeT - dt) * 6.25;
                if (prox > 0) {
                    a2 += (rnd - 0.5) * sAmp * 1.6 * prox;
                    if (a2 < 0)
                        a2 = 0;
                    else if (a2 > 1)
                        a2 = 1;
                }
            }
            if (a2 < a)
                a = a2;
        }
        dd[i * 4 + 3] = (a * 255 + 0.5) | 0;
    }
    pixDropCtx.putImageData(state.pixDropImgData as ImageData, 0, 0);
    const { sx, sy, sw, sh } = computeCoverSourceRect(img, targetW, targetH);
    pixCtx.globalCompositeOperation = 'source-over';
    pixCtx.clearRect(0, 0, gridX, gridY);
    pixCtx.imageSmoothingEnabled = true;
    pixCtx.imageSmoothingQuality = 'high';
    if (blendT < 1) {
        pixCtx.drawImage(getCoverBitmap(state, 'a', img, targetW, targetH), 0, 0, targetW, targetH, 0, 0, gridX, gridY);
    }
    if (pending && blendT > 0) {
        pixCtx.globalAlpha = blendT;
        pixCtx.drawImage(getCoverBitmap(state, 'b', pending.image, targetW, targetH), 0, 0, targetW, targetH, 0, 0, gridX, gridY);
        pixCtx.globalAlpha = 1;
    }
    pixCtx.globalCompositeOperation = 'destination-in';
    pixCtx.imageSmoothingEnabled = false;
    pixCtx.drawImage(pixDrop, 0, 0);
    pixCtx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, targetW, targetH);
    if (pixelatingIn && pixInBaseAlpha > 0) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.globalAlpha = pixInBaseAlpha;
        ctx.drawImage(getCoverBitmap(state, 'a', img, targetW, targetH), 0, 0);
        ctx.globalAlpha = 1;
    }
    else if (resolving && pending && baseT > 0) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.globalAlpha = baseT;
        ctx.drawImage(getCoverBitmap(state, 'b', pending.image, targetW, targetH), 0, 0);
        ctx.globalAlpha = 1;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixCanvas, 0, 0, gridX, gridY, 0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    if (resolving && pending && sharpRaw >= 1 && baseT >= 1) {
        state.image = pending.image;
        state.pendingReveal = null;
        state.boilHandoffStartMs = 0;
        state.holdPaintedImg = null;
        state.phase = 'hold';
        shaderCanvas.style.opacity = '0';
        state.onRevealComplete?.();
    }
}
export interface CreateRevealOptions {
    canvas: HTMLCanvasElement;
    cssWidth: number;
    cssHeight: number;
    shaderCanvas: HTMLCanvasElement;
}
export function createReveal(opts: CreateRevealOptions): RevealState {
    const ctx = opts.canvas.getContext('2d');
    if (!ctx)
        throw new Error('img-fx: 2D context unavailable for reveal canvas');
    const state: RevealInternals = {
        active: false,
        phase: 'idle',
        revealStartMs: 0,
        hideStartMs: 0,
        hideDurationMs: 300,
        boilStartMs: 0,
        boilPattern: null,
        boilPatternW: 0,
        boilPatternH: 0,
        boilField: null,
        boilHandoffStartMs: 0,
        pendingReveal: null,
        image: null,
        cssWidth: opts.cssWidth,
        cssHeight: opts.cssHeight,
        sampleCanvas: null,
        sampleCtx: null,
        sampleImgData: null,
        sampleDataCache: null,
        sampleFrameCounter: 0,
        maskGrad: null,
        maskGradCtx: null,
        maskImgData: null,
        gsFlickerTable: null,
        pixCanvas: null,
        pixCtx: null,
        pixDrop: null,
        pixDropCtx: null,
        pixDropImgData: null,
        pixDropPattern: null,
        pixDropPatternW: 0,
        pixDropPatternH: 0,
        pixDropRevealStart: -1,
        coverA: null,
        coverB: null,
        holdPaintedImg: null,
        holdPaintedW: 0,
        holdPaintedH: 0,
        sampleGpuCanvas: null,
        sampleGpuCtx: null
    };
    const shaderCanvas = opts.shaderCanvas;
    function beginReveal(revealOpts: RevealStartOptions): void {
        state.image = revealOpts.image;
        state.cssWidth = revealOpts.cssWidth;
        state.cssHeight = revealOpts.cssHeight;
        state.onRevealComplete = revealOpts.onRevealComplete;
        state.revealStartMs = performance.now();
        state.phase = 'reveal';
        state.active = true;
        state.boilHandoffStartMs = 0;
        state.pendingReveal = null;
        state.sampleFrameCounter = 0;
        state.sampleDataCache = null;
        state.holdPaintedImg = null;
        ctx!.canvas.style.opacity = '1';
    }
    const handle: RevealState = {
        canvas: opts.canvas,
        ctx,
        afterShaderFrame(s, inst, nowMs) {
            state.cssWidth = inst.cssWidth;
            state.cssHeight = inst.cssHeight;
            if (!state.active) {
                ctx.canvas.style.filter = 'none';
                return;
            }
            const { duration, easingKey } = getActiveRevealTiming(inst.preset);
            if (state.phase === 'reveal' && state.image) {
                const elapsed = (nowMs - state.revealStartMs) / 1000;
                const t = Math.min(elapsed / duration, 1);
                const eased = ease(easingKey, t);
                shaderCanvas.style.opacity = String(1 - eased);
                paintMaskedFrame(state, s, inst, ctx);
                if (t >= 1) {
                    state.phase = 'hold';
                    shaderCanvas.style.opacity = '0';
                    state.onRevealComplete?.();
                }
            }
            else if (state.phase === 'hold' && state.image) {
                ctx.canvas.style.filter = 'none';
                const img = state.image;
                const w = inst.canvas.width;
                const h = inst.canvas.height;
                if (ctx.canvas.width !== w || ctx.canvas.height !== h) {
                    ctx.canvas.width = w;
                    ctx.canvas.height = h;
                    state.holdPaintedImg = null;
                }
                if (state.holdPaintedImg !== img || state.holdPaintedW !== w || state.holdPaintedH !== h) {
                    ctx.clearRect(0, 0, w, h);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(getCoverBitmap(state, 'a', img, w, h), 0, 0);
                    state.holdPaintedImg = img;
                    state.holdPaintedW = w;
                    state.holdPaintedH = h;
                }
                shaderCanvas.style.opacity = '0';
            }
            else if (state.phase === 'boil' && state.image) {
                paintBoilFrame(state, s, inst, ctx, shaderCanvas, nowMs);
            }
            else if (state.phase === 'hide') {
                const elapsed = nowMs - state.hideStartMs;
                const t = Math.min(elapsed / Math.max(1, state.hideDurationMs), 1);
                const overlayAlpha = 1 - t;
                ctx.canvas.style.opacity = String(overlayAlpha);
                shaderCanvas.style.opacity = String(t);
                if (t >= 1) {
                    state.active = false;
                    state.phase = 'idle';
                    ctx.canvas.style.opacity = '1';
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    shaderCanvas.style.opacity = '1';
                    state.image = null;
                }
            }
        },
        startReveal(opts) {
            if (state.phase === 'boil' && state.active) {
                state.pendingReveal = opts;
                state.onRevealComplete = opts.onRevealComplete;
                state.cssWidth = opts.cssWidth;
                state.cssHeight = opts.cssHeight;
                if (state.boilHandoffStartMs === 0)
                    state.boilHandoffStartMs = performance.now();
                return;
            }
            beginReveal(opts);
        },
        startHide(durationMs = 300) {
            if (!state.active || state.phase === 'hide')
                return;
            state.phase = 'hide';
            state.hideStartMs = performance.now();
            state.hideDurationMs = durationMs;
        },
        startBoil() {
            if (!state.active || !state.image)
                return;
            if (state.phase !== 'hold' && state.phase !== 'reveal')
                return;
            state.phase = 'boil';
            state.boilStartMs = performance.now();
            state.boilHandoffStartMs = 0;
            state.pendingReveal = null;
            state.boilPattern = null;
            state.sampleFrameCounter = 0;
            state.sampleDataCache = null;
            state.holdPaintedImg = null;
            ctx.canvas.style.opacity = '1';
        },
        clear() {
            const wasActive = state.active;
            state.active = false;
            state.phase = 'idle';
            state.image = null;
            state.boilHandoffStartMs = 0;
            state.pendingReveal = null;
            state.holdPaintedImg = null;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            if (wasActive) {
                ctx.canvas.style.filter = 'none';
                ctx.canvas.style.opacity = '1';
                shaderCanvas.style.opacity = '1';
            }
        },
        isActive() {
            return state.active;
        },
        dispose() {
            state.image = null;
            state.sampleCanvas = null;
            state.sampleCtx = null;
            state.sampleImgData = null;
            state.sampleDataCache = null;
            state.sampleFrameCounter = 0;
            state.maskGrad = null;
            state.maskGradCtx = null;
            state.maskImgData = null;
            state.gsFlickerTable = null;
            state.pixCanvas = null;
            state.pixCtx = null;
            state.pixDrop = null;
            state.pixDropCtx = null;
            state.pixDropImgData = null;
            state.pixDropPattern = null;
            state.boilPattern = null;
            state.boilField = null;
            state.pendingReveal = null;
            state.coverA = null;
            state.coverB = null;
            state.holdPaintedImg = null;
            state.sampleGpuCanvas = null;
            state.sampleGpuCtx = null;
        }
    };
    return handle;
}
export function pickRandomImage(pool: string[], lastIdx: number): {
    src: string;
    idx: number;
} | null {
    if (pool.length === 0)
        return null;
    if (pool.length === 1)
        return { src: pool[0], idx: 0 };
    let idx: number;
    do {
        idx = Math.floor(Math.random() * pool.length);
    } while (idx === lastIdx);
    return { src: pool[idx], idx };
}
