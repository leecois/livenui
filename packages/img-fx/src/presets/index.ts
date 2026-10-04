import { PIXELS_MECHANIC } from './pixels-mechanic';
import { PIXELS_ORGANIC } from './pixels-organic';
import { SWEEP_GRADIENT } from './sweep-gradient';
export type PresetName = 'pixels-organic' | 'pixels-mechanic' | 'sweep-gradient';
export type PresetTheme = 'dark' | 'light';
export interface MosaicConfig {
    cellSize: number;
    gap: number;
    hlScale: number;
    fillOpacity: number;
    edgeFade: number;
    fadeStr: number;
}
export interface RevealConfig {
    duration: number;
    easing: EasingKey;
    maskShape: MaskShape;
    softness: number;
    blur: number;
    pixDuration: number;
    pixEasing: EasingKey;
}
export type EasingKey = 'linear' | 'smoothstep' | 'easeOutCubic' | 'easeOutQuint' | 'easeInOutCubic' | 'easeOutExpo' | 'easeOutBack';
export type MaskShape = 'shader' | 'shaderHighlight' | 'shaderColor1' | 'shaderColor2' | 'shaderColor3' | 'shaderColor4' | 'shaderColor5' | 'radialCenter' | 'radialCorner' | 'linearTop' | 'linearBottom' | 'linearLeft' | 'linearRight' | 'diagonalTL' | 'diagonalBR' | 'diamond' | 'blindsH' | 'blindsV' | 'gradientSweep';
export interface PresetMode {
    theme: PresetTheme;
    effectIndex: number;
    colors: [
        string,
        string,
        string,
        string,
        string,
        string,
        string
    ];
    alphas: [
        number,
        number,
        number,
        number,
        number,
        number,
        number
    ];
    cardBg: string;
    dotMode: 0 | 1;
    pixelConfig: MosaicConfig;
    direction: number;
    speed: number;
    intensity: number;
    scale: number;
    softness: number;
    distortion: number;
    flicker?: number;
    complexity: number;
    shape: number;
    blur: number;
    highlight: number;
    vignette: number;
    vigOpacity: number;
    shaderOpacity: number;
    sweepEase?: number;
    revealConfig: RevealConfig;
    effect: string;
}
export interface Preset {
    name: PresetName;
    modes: Record<PresetTheme, PresetMode>;
}
export interface EngineMosaicConfig extends MosaicConfig {
    dotOpacity: number;
    dotSize: number;
    dotSoftness: number;
}
export interface EngineRevealConfig extends RevealConfig {
    dotDuration: number;
    dotEasing: EasingKey;
}
export interface EnginePresetMode extends Omit<PresetMode, 'dotMode' | 'pixelConfig' | 'revealConfig'> {
    dotMode: 0 | 1 | 2;
    pixelConfig: EngineMosaicConfig;
    dotConfig: EngineMosaicConfig;
    revealConfig: EngineRevealConfig;
}
export interface EnginePreset {
    name: PresetName;
    modes: Record<PresetTheme, EnginePresetMode>;
}
const _PRESETS_INTERNAL: Record<PresetName, EnginePreset> = {
    'pixels-organic': PIXELS_ORGANIC,
    'pixels-mechanic': PIXELS_MECHANIC,
    'sweep-gradient': SWEEP_GRADIENT
};
export const PRESETS = _PRESETS_INTERNAL as unknown as Record<PresetName, Preset>;
export function _getEnginePreset(name: PresetName): EnginePreset {
    return _PRESETS_INTERNAL[name];
}
export function hexToRgb(hex: string): [
    number,
    number,
    number
] {
    let h = hex.replace('#', '');
    if (h.length === 3)
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [
        parseInt(h.slice(0, 2), 16) / 255,
        parseInt(h.slice(2, 4), 16) / 255,
        parseInt(h.slice(4, 6), 16) / 255
    ];
}
let _colorCtx: CanvasRenderingContext2D | null | undefined;
function getColorCtx(): CanvasRenderingContext2D | null {
    if (_colorCtx !== undefined)
        return _colorCtx;
    if (typeof document === 'undefined') {
        _colorCtx = null;
        return null;
    }
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    _colorCtx = c.getContext('2d');
    return _colorCtx;
}
export function parseCssColor(input: string): [
    number,
    number,
    number
] {
    if (typeof input !== 'string' || input.length === 0)
        return [0, 0, 0];
    if (input[0] === '#') {
        let h = input.slice(1);
        if (h.length === 3)
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        if ((h.length === 6 || h.length === 8) && /^[0-9a-fA-F]+$/.test(h)) {
            return [
                parseInt(h.slice(0, 2), 16) / 255,
                parseInt(h.slice(2, 4), 16) / 255,
                parseInt(h.slice(4, 6), 16) / 255
            ];
        }
    }
    const ctx = getColorCtx();
    if (!ctx)
        return [0, 0, 0];
    ctx.fillStyle = '#000000';
    ctx.fillStyle = input;
    const after1 = ctx.fillStyle as string;
    ctx.fillStyle = '#ffffff';
    ctx.fillStyle = input;
    const after2 = ctx.fillStyle as string;
    if (after1 !== after2) {
        return [0, 0, 0];
    }
    const out = after1;
    if (out[0] === '#') {
        return [
            parseInt(out.slice(1, 3), 16) / 255,
            parseInt(out.slice(3, 5), 16) / 255,
            parseInt(out.slice(5, 7), 16) / 255
        ];
    }
    const m = out.match(/^rgba?\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)/);
    if (m) {
        const clamp = (n: number): number => Math.max(0, Math.min(255, n)) / 255;
        return [clamp(parseFloat(m[1])), clamp(parseFloat(m[2])), clamp(parseFloat(m[3]))];
    }
    return [0, 0, 0];
}
export { PIXELS_ORGANIC, PIXELS_MECHANIC, SWEEP_GRADIENT };
