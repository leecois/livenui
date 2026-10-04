export interface GlowConfig {
    haloOpMul: number;
    extraIntensity: number;
    peakOp: number;
    baseOp: number;
    inset: number;
    extraOutward: number;
    wanderRange: number;
    wanderLerp: number;
    fadeRate: number;
    lumLo: number;
    lumHi: number;
    minDwellMs: number;
    relocFadeMs: number;
    relocFadeOutMs: number;
    pointGain: number;
    haloHalfLen: number;
    extraHalfLen: number;
    haloStrokeXl: number;
    haloStrokeLg: number;
    haloStrokeMd: number;
    haloStrokeSm: number;
    haloBlurXl: number;
    haloBlurLg: number;
    haloBlurMd: number;
    haloBlurSm: number;
    haloOpXl: number;
    haloOpLg: number;
    haloOpMd: number;
    haloOpSm: number;
    extraStrokeOuter: number;
    extraStrokeCore: number;
    extraBlurOuter: number;
    extraBlurCore: number;
    extraFadeR: number;
    extraOpOuter: number;
}
export const GLOW_MARKUP_KEYS: ReadonlySet<keyof GlowConfig> = new Set<keyof GlowConfig>([
    'haloHalfLen', 'extraHalfLen',
    'haloStrokeXl', 'haloStrokeLg', 'haloStrokeMd', 'haloStrokeSm',
    'haloBlurXl', 'haloBlurLg', 'haloBlurMd', 'haloBlurSm',
    'haloOpXl', 'haloOpLg', 'haloOpMd', 'haloOpSm',
    'extraStrokeOuter', 'extraStrokeCore', 'extraBlurOuter', 'extraBlurCore',
    'extraFadeR', 'extraOpOuter',
]);
export const GLOW_DEFAULTS: Readonly<GlowConfig> = Object.freeze({
    haloOpMul: 2.0,
    extraIntensity: 3.51,
    peakOp: 0.85,
    baseOp: 0.34,
    inset: 1.5,
    extraOutward: 1.0,
    wanderRange: 15,
    wanderLerp: 0.0075,
    fadeRate: 0.00875,
    lumLo: 0.08,
    lumHi: 0.32,
    minDwellMs: 1500,
    relocFadeMs: 300,
    relocFadeOutMs: 450,
    pointGain: 2.5,
    haloHalfLen: 7.8,
    extraHalfLen: 9.13952 / 3,
    haloStrokeXl: 26.4,
    haloStrokeLg: 15.6,
    haloStrokeMd: 7.2,
    haloStrokeSm: 3.0,
    haloBlurXl: 8.4,
    haloBlurLg: 4.8,
    haloBlurMd: 2.1,
    haloBlurSm: 0.9,
    haloOpXl: 0.385,
    haloOpLg: 0.595,
    haloOpMd: 0.70,
    haloOpSm: 0.70,
    extraStrokeOuter: 4.0 / 3,
    extraStrokeCore: 2.0 / 3,
    extraBlurOuter: 2.0 / 3,
    extraBlurCore: 1.35 / 3,
    extraFadeR: 13.0 / 3,
    extraOpOuter: 0.85,
});
export const GLOW: GlowConfig = { ...GLOW_DEFAULTS };
type Listener = (markupChanged: boolean) => void;
const listeners = new Set<Listener>();
export function setGlowConfig(patch: Partial<GlowConfig>): void {
    let markupChanged = false;
    for (const k of Object.keys(patch) as Array<keyof GlowConfig>) {
        const v = patch[k];
        if (v === undefined || GLOW[k] === v)
            continue;
        GLOW[k] = v;
        if (GLOW_MARKUP_KEYS.has(k))
            markupChanged = true;
    }
    for (const fn of listeners)
        fn(markupChanged);
}
export function resetGlowConfig(): void {
    setGlowConfig({ ...GLOW_DEFAULTS });
}
export function subscribeGlowConfig(fn: Listener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}
