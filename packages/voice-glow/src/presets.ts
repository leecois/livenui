import type { VoiceBeamType } from './types';
export interface VoiceGeometry {
    scale: number;
    glowSize: number;
    processingDuration: number;
    processingLevel: number;
    processingTravel: number;
    processingCurve: number;
    cornerFollow: number;
    strokeOpacity: number;
    innerOpacity: number;
    bloomOpacity: number;
    idle: number;
    reach: number;
    spread: number;
    flow: number;
    bend: number;
    bandStrength: number;
    bandWidth: number;
    bandPosition: number;
    bandCurve: number;
    bandSpread: number;
    bandSkew: number;
    bandOffset: number;
    bandTail: number;
    bandTailPosition: number;
    bandTailCurve: number;
    bandTailOverflow: number;
    bandAberration: number;
    distortion: number;
    distortionDetail: number;
    glowWidth: number;
    glowHeight: number;
    lobeSpacing: number;
    rangeWidth: number;
    rangeHeight: number;
    softness: number;
    coreSize: number;
    coreLight: number;
    coreLightWidth: number;
    coreLightHeight: number;
    strokeScale: number;
    innerScale: number;
    innerHeight: number;
    bloomScale: number;
    bloomHeight: number;
}
export const voiceDefaults: VoiceGeometry = {
    scale: 1,
    glowSize: 1,
    processingDuration: 1.1,
    processingLevel: 0.55,
    processingTravel: 1.55,
    processingCurve: 2.1,
    cornerFollow: 0.45,
    strokeOpacity: 1,
    innerOpacity: 1,
    bloomOpacity: 1,
    idle: 0.18,
    reach: 1.2,
    spread: 1.05,
    flow: 48,
    bend: 60,
    bandStrength: 1.55,
    bandWidth: 2.15,
    bandPosition: 0.35,
    bandCurve: 1.75,
    bandSpread: 0.87,
    bandSkew: 0.12,
    bandOffset: -27,
    bandTail: 0.59,
    bandTailPosition: 0.67,
    bandTailCurve: 2.4,
    bandTailOverflow: 15,
    bandAberration: 0.89,
    distortion: 0.62,
    distortionDetail: 2.3,
    glowWidth: 0.65,
    glowHeight: 1.25,
    lobeSpacing: 0.85,
    rangeWidth: 0.75,
    rangeHeight: 1,
    softness: 1.07,
    coreSize: 1,
    coreLight: 0,
    coreLightWidth: 1,
    coreLightHeight: 1,
    strokeScale: 1,
    innerScale: 1,
    innerHeight: 1,
    bloomScale: 1,
    bloomHeight: 1,
};
export const voiceTypePresets: Record<VoiceBeamType, Partial<VoiceGeometry>> = {
    default: {},
    pill: {
        scale: 0.45,
        glowSize: 0.95,
        strokeOpacity: 1.2,
        innerOpacity: 0.85,
        reach: 1.35,
        spread: 1.1,
        flow: 0,
        bend: 23,
        bandStrength: 1.55,
        bandWidth: 1.85,
        bandCurve: 1.95,
        bandSpread: 0.38,
        bandOffset: -16,
        bandTail: 0,
        processingTravel: 2,
        cornerFollow: 0,
        distortion: 0.45,
        distortionDetail: 3,
        glowWidth: 0.65,
        glowHeight: 0.95,
        lobeSpacing: 0.45,
        rangeWidth: 0.8,
        rangeHeight: 0.7,
        softness: 0.88,
        coreSize: 0.25,
        strokeScale: 1.25,
        innerScale: 0.95,
        bloomScale: 1.05,
        bloomHeight: 2.25,
    },
    mobile: {
        scale: 1.25,
        spread: 0.45,
        reach: 3,
        flow: 60,
        bend: 70,
        bandWidth: 2.4,
        bandCurve: 1.55,
        bandSpread: 0.9,
        bandOffset: -50,
        bandTail: 0.62,
        bandTailPosition: 0.42,
        bandTailCurve: 2.7,
        bandTailOverflow: 22,
        processingDuration: 1.05,
        processingLevel: 0.35,
        processingTravel: 1,
        cornerFollow: 0.4,
        bandStrength: 1.8,
        distortionDetail: 2,
        glowWidth: 1.15,
        glowHeight: 2.1,
        lobeSpacing: 1.35,
        rangeWidth: 1.25,
        rangeHeight: 1.2,
        softness: 1.1,
    },
};
export type VoiceTypeStyle = {
    brightness?: number;
    saturation?: number;
    strength?: number;
};
export const voiceTypeStyle: Record<VoiceBeamType, VoiceTypeStyle> = {
    default: { brightness: 1.15 },
    pill: { brightness: 1.35, saturation: 1.5 },
    mobile: { strength: 1, brightness: 1.2, saturation: 1.5 },
};
const voiceTypeStyleLight: Partial<Record<VoiceBeamType, VoiceTypeStyle>> = {
    default: {},
    pill: {},
    mobile: { strength: 1 },
};
export function resolveVoiceStyle(type: VoiceBeamType = 'default', theme: 'dark' | 'light' = 'dark'): VoiceTypeStyle {
    const light = theme === 'light' ? voiceTypeStyleLight[type] : undefined;
    return light ?? voiceTypeStyle[type];
}
const lightTypeOverrides: Partial<Record<VoiceBeamType, Partial<VoiceGeometry>>> = {
    default: { bandStrength: 1.7 },
    pill: { bandStrength: 2 },
    mobile: { bandStrength: 1.7 },
};
export function resolveVoiceDefaults(type: VoiceBeamType = 'default', theme: 'dark' | 'light' = 'dark'): VoiceGeometry {
    const typePreset = voiceTypePresets[type];
    const themeOverrides: Partial<VoiceGeometry> = {};
    if (theme === 'light') {
        if (typePreset.reach === undefined)
            themeOverrides.reach = 1.8;
        if (typePreset.spread === undefined)
            themeOverrides.spread = 0.8;
        if (typePreset.coreLight === undefined)
            themeOverrides.coreLight = 1.8;
    }
    return { ...voiceDefaults, ...themeOverrides, ...typePreset, ...(theme === 'light' ? lightTypeOverrides[type] : undefined) };
}
