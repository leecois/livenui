export type PresetName = 'chromatic' | 'silver' | 'gold';
export type PresetTheme = 'dark' | 'light';
export const SHAPE_NONE = 0;
export const SHAPE_CIRCLE = 1;
export const SHAPE_DAISY = 2;
export const SHAPE_DIAMOND = 3;
export const SHAPE_METABALLS = 4;
export const FIT_NONE = 0;
export const FIT_CONTAIN = 1;
export const FIT_COVER = 2;
export interface PresetMode {
    colorBack: string;
    colorTint: string;
    speed: number;
    repetition: number;
    softness: number;
    shiftRed: number;
    shiftBlue: number;
    distortion: number;
    contour: number;
    angle: number;
    shape: number;
    scale: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
    originX: number;
    originY: number;
    worldWidth: number;
    worldHeight: number;
    fit: number;
    shaderOpacity: number;
}
export interface Preset {
    name: PresetName;
    modes: Record<PresetTheme, PresetMode>;
}
const BASE: Omit<PresetMode, 'colorTint' | 'shaderOpacity'> = {
    colorBack: '#00000000',
    speed: 1,
    repetition: 1.5,
    softness: 0.05,
    shiftRed: 0.3,
    shiftBlue: 0.3,
    distortion: 0.1,
    contour: 0.4,
    angle: 90,
    shape: SHAPE_NONE,
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    originX: 0.5,
    originY: 0.5,
    worldWidth: 0,
    worldHeight: 0,
    fit: FIT_CONTAIN,
};
const CHROMATIC: Preset = {
    name: 'chromatic',
    modes: {
        dark: { ...BASE, colorTint: '#88ccff2e', shiftRed: 0.75, shiftBlue: 0.75, repetition: 2, softness: 0.09, shaderOpacity: 1 },
        light: { ...BASE, colorTint: '#66b0ff99', shiftRed: 0.6, shiftBlue: 0.6, shaderOpacity: 1 },
    },
};
const SILVER: Preset = {
    name: 'silver',
    modes: {
        dark: { ...BASE, colorTint: '#ffffff66', shaderOpacity: 0.88 },
        light: { ...BASE, colorTint: '#ffffff40', shaderOpacity: 1 },
    },
};
const GOLD: Preset = {
    name: 'gold',
    modes: {
        dark: { ...BASE, colorTint: '#ffcc55cc', speed: 0.85, shaderOpacity: 0.92 },
        light: { ...BASE, colorTint: '#f7d488aa', shaderOpacity: 1 },
    },
};
export const PRESETS: Record<PresetName, Preset> = {
    chromatic: CHROMATIC,
    silver: SILVER,
    gold: GOLD,
};
export { hexToRgb, hexToRgba } from './color';
