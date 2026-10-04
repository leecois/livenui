import { parseCssColor } from '../presets';
export interface SampledPalette {
    colors: string[];
    cardBg: string;
}
const lum = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;
const hex = (r: number, g: number, b: number): string => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const GRID = 24;
let scratch: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;
function getScratchCtx(): CanvasRenderingContext2D | null {
    if (scratchCtx)
        return scratchCtx;
    if (typeof document === 'undefined')
        return null;
    scratch = document.createElement('canvas');
    scratch.width = GRID;
    scratch.height = GRID;
    scratchCtx = scratch.getContext('2d', { willReadFrequently: true });
    return scratchCtx;
}
export function samplePaletteFromCanvas(src: HTMLCanvasElement, presetColors: readonly string[]): SampledPalette | null {
    if (src.width === 0 || src.height === 0)
        return null;
    const ctx = getScratchCtx();
    if (!ctx)
        return null;
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, GRID, GRID);
    ctx.drawImage(src, 0, 0, GRID, GRID);
    let data: Uint8ClampedArray;
    try {
        data = ctx.getImageData(0, 0, GRID, GRID).data;
    }
    catch {
        return null;
    }
    const px: Array<{
        r: number;
        g: number;
        b: number;
        lum: number;
    }> = [];
    let ar = 0;
    let ag = 0;
    let ab = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 8)
            continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        px.push({ r, g, b, lum: lum(r, g, b) });
        ar += r;
        ag += g;
        ab += b;
    }
    if (px.length === 0)
        return null;
    px.sort((a, b) => a.lum - b.lum);
    const cardBg = hex(ar / px.length, ag / px.length, ab / px.length);
    const ranked = presetColors
        .map((color, slot) => {
        const [r, g, b] = parseCssColor(color);
        return { slot, lum: lum(r, g, b) };
    })
        .sort((a, b) => a.lum - b.lum);
    const colors: string[] = new Array(ranked.length);
    for (let rank = 0; rank < ranked.length; rank++) {
        const q = 0.05 + (0.9 * rank) / Math.max(1, ranked.length - 1);
        const p = px[Math.min(px.length - 1, Math.round(q * (px.length - 1)))];
        colors[ranked[rank].slot] = hex(p.r, p.g, p.b);
    }
    return { colors, cardBg };
}
