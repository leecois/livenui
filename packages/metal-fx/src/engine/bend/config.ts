export interface BendConfig {
    enabled: boolean;
    applyTo: 'ring' | 'all';
    strength: number;
    fadeInMs: number;
    fadeOutMs: number;
    smoothMs: number;
    reach: number;
    blob: number;
    liquidBlob: number;
    maxDisp: number;
    gain: number;
    pressGain: number;
    pullGain: number;
    press: number;
    liquid: number;
    liquidReach: number;
    liquidStiffness: number;
    liquidDamping: number;
    stiffness: number;
    damping: number;
    mass: number;
    follow: number;
    mapRes: number;
    smooth: number;
}
export const BEND_DEFAULTS: Readonly<BendConfig> = Object.freeze({
    enabled: true,
    applyTo: 'ring',
    strength: 0.74,
    fadeInMs: 200,
    fadeOutMs: 350,
    smoothMs: 140,
    reach: 36,
    blob: 13,
    liquidBlob: 10,
    maxDisp: 9,
    gain: 0.6,
    pressGain: 0.55,
    pullGain: 0.49,
    press: 5,
    liquid: 7.5,
    liquidReach: 8,
    liquidStiffness: 53,
    liquidDamping: 9,
    stiffness: 260,
    damping: 13,
    mass: 1,
    follow: 0.32,
    mapRes: 2,
    smooth: 0.25,
});
export const BEND: BendConfig = { ...BEND_DEFAULTS };
export function setBendConfig(patch: Partial<BendConfig>): void {
    Object.assign(BEND, patch);
}
export function resetBendConfig(): void {
    Object.assign(BEND, BEND_DEFAULTS);
}
