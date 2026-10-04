import type { VoiceThemeColors, VoiceBeamColorVariant } from './types';
import { toRgb } from './color';
export const themePresets: Record<'dark' | 'light', VoiceThemeColors> = {
    dark: {
        strokeOpacity: 1.16,
        innerOpacity: 0.47,
        bloomOpacity: 0.89,
        innerShadow: 'rgba(255, 255, 255, 0.1)',
        saturation: 1.2,
        brightness: 1.1,
    },
    light: {
        strokeOpacity: 1.2,
        innerOpacity: 0.85,
        bloomOpacity: 0.5,
        innerShadow: 'rgba(0, 0, 0, 0.08)',
        saturation: 1.6,
        brightness: 0.95,
        hueRange: 40,
        hueDuration: 8.5,
        hueBase: 5,
        strength: 0.8,
        bandStrength: 1.7,
    },
};
export interface VoiceLobe {
    x: number;
    w: number;
    h: number;
    band: 0 | 1 | 2;
}
export const voiceLobes: readonly VoiceLobe[] = [
    { x: 0, w: 74, h: 46, band: 0 },
    { x: -36, w: 54, h: 40, band: 1 },
    { x: 36, w: 54, h: 40, band: 1 },
    { x: -72, w: 48, h: 32, band: 2 },
    { x: 72, w: 48, h: 32, band: 2 },
    { x: -108, w: 42, h: 26, band: 1 },
    { x: 108, w: 42, h: 26, band: 1 },
];
export const LOBE_SPACING = 36;
export const LOBE_SPAN = LOBE_SPACING * voiceLobes.length;
export const voicePalettes: Record<VoiceBeamColorVariant, {
    dark: string[];
    light: string[];
}> = {
    colorful: {
        dark: [
            'rgb(255, 70, 120)',
            'rgb(60, 190, 255)',
            'rgb(175, 70, 255)',
            'rgb(60, 220, 130)',
            'rgb(255, 150, 40)',
            'rgb(90, 100, 255)',
            'rgb(40, 200, 190)',
        ],
        light: [
            'rgb(255, 201, 21)',
            'rgb(126, 196, 255)',
            'rgb(180, 40, 230)',
            'rgb(235, 100, 160)',
            'rgb(255, 176, 122)',
            'rgb(154, 160, 255)',
            'rgb(127, 217, 238)',
        ],
    },
    mono: {
        dark: [
            'rgb(215, 215, 215)',
            'rgb(180, 180, 180)',
            'rgb(190, 190, 190)',
            'rgb(160, 160, 160)',
            'rgb(170, 170, 170)',
            'rgb(150, 150, 150)',
            'rgb(155, 155, 155)',
        ],
        light: [
            'rgb(60, 60, 60)',
            'rgb(90, 90, 90)',
            'rgb(85, 85, 85)',
            'rgb(110, 110, 110)',
            'rgb(105, 105, 105)',
            'rgb(125, 125, 125)',
            'rgb(120, 120, 120)',
        ],
    },
    ocean: {
        dark: [
            'rgb(80, 140, 255)',
            'rgb(40, 200, 230)',
            'rgb(120, 90, 255)',
            'rgb(30, 170, 210)',
            'rgb(160, 80, 240)',
            'rgb(60, 110, 255)',
            'rgb(40, 190, 180)',
        ],
        light: [
            'rgb(40, 100, 240)',
            'rgb(20, 160, 200)',
            'rgb(90, 60, 230)',
            'rgb(20, 130, 180)',
            'rgb(130, 50, 220)',
            'rgb(40, 80, 230)',
            'rgb(20, 150, 150)',
        ],
    },
    sunset: {
        dark: [
            'rgb(255, 110, 60)',
            'rgb(255, 180, 40)',
            'rgb(255, 60, 90)',
            'rgb(255, 210, 80)',
            'rgb(240, 70, 140)',
            'rgb(255, 140, 50)',
            'rgb(230, 50, 110)',
        ],
        light: [
            'rgb(235, 80, 30)',
            'rgb(230, 150, 10)',
            'rgb(230, 30, 70)',
            'rgb(225, 175, 30)',
            'rgb(215, 40, 110)',
            'rgb(235, 110, 20)',
            'rgb(205, 30, 90)',
        ],
    },
    forest: {
        dark: [
            'rgb(70, 220, 120)',
            'rgb(40, 200, 180)',
            'rgb(140, 230, 80)',
            'rgb(30, 170, 140)',
            'rgb(190, 235, 70)',
            'rgb(50, 190, 110)',
            'rgb(30, 150, 120)',
        ],
        light: [
            'rgb(30, 170, 80)',
            'rgb(20, 150, 130)',
            'rgb(90, 180, 30)',
            'rgb(20, 130, 100)',
            'rgb(130, 180, 20)',
            'rgb(30, 150, 80)',
            'rgb(20, 120, 90)',
        ],
    },
    candy: {
        dark: [
            'rgb(255, 90, 170)',
            'rgb(255, 120, 220)',
            'rgb(210, 80, 255)',
            'rgb(255, 150, 190)',
            'rgb(180, 110, 255)',
            'rgb(255, 70, 140)',
            'rgb(230, 100, 240)',
        ],
        light: [
            'rgb(235, 40, 140)',
            'rgb(230, 70, 190)',
            'rgb(180, 40, 230)',
            'rgb(235, 100, 160)',
            'rgb(150, 70, 230)',
            'rgb(230, 30, 110)',
            'rgb(200, 60, 210)',
        ],
    },
    ice: {
        dark: [
            'rgb(150, 230, 255)',
            'rgb(90, 200, 255)',
            'rgb(190, 240, 255)',
            'rgb(120, 190, 255)',
            'rgb(160, 220, 250)',
            'rgb(80, 170, 255)',
            'rgb(200, 235, 255)',
        ],
        light: [
            'rgb(30, 160, 220)',
            'rgb(20, 130, 210)',
            'rgb(60, 180, 230)',
            'rgb(40, 120, 220)',
            'rgb(50, 160, 220)',
            'rgb(20, 110, 220)',
            'rgb(70, 170, 230)',
        ],
    },
    gold: {
        dark: [
            'rgb(255, 200, 70)',
            'rgb(255, 170, 40)',
            'rgb(255, 220, 110)',
            'rgb(240, 150, 30)',
            'rgb(255, 235, 140)',
            'rgb(230, 160, 40)',
            'rgb(250, 210, 90)',
        ],
        light: [
            'rgb(200, 140, 10)',
            'rgb(190, 120, 0)',
            'rgb(210, 160, 30)',
            'rgb(180, 110, 0)',
            'rgb(205, 170, 40)',
            'rgb(175, 115, 5)',
            'rgb(195, 150, 20)',
        ],
    },
};
function withAlpha(color: string, alpha: number): string {
    const m = color.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);
    if (!m)
        return color;
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha.toFixed(2)})`;
}
function scaleBlur(px: number, glowSize = 1): number {
    return Math.max(0.5, Math.round(px * glowSize * 100) / 100);
}
function lobeX(index: number, id: string): string {
    return `calc(50% + (var(--vb-cx-${id}) + var(--vb-x${index}-${id})) * var(--vb-w-${id}) * var(--vb-z-${id}, 1))`;
}
interface LobeLayerOptions {
    id: string;
    colors: string[];
    alpha: number;
    sw: number;
    sh: number;
    y: number;
    fade: number;
    count?: number;
}
function lobeGradients({ id, colors, alpha, sw, sh, y, fade, count }: LobeLayerOptions): string {
    const lobes = count ? voiceLobes.slice(0, count) : voiceLobes;
    return lobes
        .map((lobe, i) => {
        const color = alpha >= 1 ? colors[i % colors.length] : withAlpha(colors[i % colors.length], alpha);
        const w = `calc(${Math.round(lobe.w * sw)}px * var(--vb-w-${id}) * var(--vb-z-${id}, 1))`;
        const h = `calc(${Math.round(lobe.h * sh)}px * var(--vb-h-${id}) * var(--vb-l${i}-${id}) * var(--vb-z-${id}, 1))`;
        const yStr = `calc(100% + (${y}px + var(--vb-y${i}-${id})) * var(--vb-z-${id}, 1))`;
        return `radial-gradient(ellipse ${w} ${h} at ${lobeX(i, id)} ${yStr}, ${color} 0%, transparent ${fade}%)`;
    })
        .join(',\n    ');
}
export interface GenerateVoiceStylesOptions {
    id: string;
    borderRadius: number;
    borderWidth: number;
    strokeOpacity: number;
    innerOpacity: number;
    bloomOpacity: number;
    innerShadow: string;
    colorVariant: VoiceBeamColorVariant;
    colors?: string[];
    brightness: number;
    saturation: number;
    theme: 'dark' | 'light';
    hueBase?: number;
    glowSize?: number;
    glowWidth?: number;
    glowHeight?: number;
    strokeScale?: number;
    innerScale?: number;
    innerHeight?: number;
    bloomScale?: number;
    bloomHeight?: number;
    coreSize?: number;
    coreLight?: number;
    coreLightWidth?: number;
    coreLightHeight?: number;
    rangeWidth?: number;
    rangeHeight?: number;
    softness?: number;
    distortion?: boolean;
    scale?: number;
    look?: 'glow' | 'dots' | 'lines';
}
function generateSurfaceCSS(id: string, borderRadius: number): string {
    return `
@property --vb-opacity-${id} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

[data-voice-beam="${id}"] {
  position: relative;
  border-radius: ${borderRadius}px;
  overflow: hidden;
  --vb-level-${id}: 0;
  --vb-glow-${id}: 0.4;
}

[data-voice-beam="${id}"][data-active] {
  animation: vb-fade-in-${id} 0.6s ease forwards;
}

[data-voice-beam="${id}"][data-fading] {
  animation: vb-fade-out-${id} 0.5s ease forwards;
}


[data-voice-beam="${id}"] [data-voice-beam-surface] {
  display: none;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  pointer-events: none;
  z-index: 4;
}

[data-voice-beam="${id}"][data-active] [data-voice-beam-surface],
[data-voice-beam="${id}"][data-fading] [data-voice-beam-surface] {
  display: block;
  opacity: calc(var(--vb-opacity-${id}, 1) * var(--voice-strength, 1));
}

@keyframes vb-fade-in-${id} {
  to { --vb-opacity-${id}: 1; }
}

@keyframes vb-fade-out-${id} {
  from { --vb-opacity-${id}: 1; }
  to { --vb-opacity-${id}: 0; }
}

[data-voice-beam="${id}"][data-paused] {
  animation-play-state: paused !important;
}
`;
}
export function generateVoiceBeamCSS(options: GenerateVoiceStylesOptions): string {
    if (options.look === 'dots' || options.look === 'lines')
        return generateSurfaceCSS(options.id, options.borderRadius);
    const { id, borderRadius, borderWidth, strokeOpacity, innerOpacity, bloomOpacity, innerShadow, colorVariant, colors: customColors, brightness, saturation, theme, hueBase = 0, glowSize = 1, glowWidth = 1, glowHeight = 1, strokeScale = 1, innerScale = 1, innerHeight = 1, bloomScale = 1, bloomHeight = 1, coreSize = 1, coreLight = 0, coreLightWidth = 1, coreLightHeight = 1, rangeWidth = 1, rangeHeight = 1, softness = 1, distortion = false, scale = 1, } = options;
    const cornerFade = Math.round(28 * scale * 10) / 10;
    const insetBlur = Math.round(9 * scale * 10) / 10;
    const innerRadius = Math.max(0, borderRadius - borderWidth);
    const fade = Math.round(Math.max(40, Math.min(95, 70 * softness)));
    const gw = (m: number) => glowWidth * m;
    const gh = (m: number) => glowHeight * m;
    const px = (v: number) => Math.round(v * 10) / 10;
    const Z = `var(--vb-z-${id}, 1)`;
    const zpx = (v: number) => `calc(${px(v)}px * ${Z})`;
    const isDark = theme === 'dark';
    const paletteColors = voicePalettes[colorVariant][isDark ? 'dark' : 'light'];
    const colors = paletteColors.map((c, i) => {
        const custom = customColors?.[i];
        return (custom && toRgb(custom)) || c;
    });
    const isMono = colorVariant === 'mono';
    const monoMul = isMono ? 0.6 : 1;
    const sStroke = (strokeOpacity * monoMul).toFixed(2);
    const sInner = (innerOpacity * monoMul).toFixed(2);
    const sBloom = (bloomOpacity * monoMul).toFixed(2);
    const b = brightness.toFixed(2);
    const s = saturation.toFixed(2);
    const hue = `hue-rotate(calc(var(--voice-hue-base, ${hueBase}deg) + var(--vb-hue-${id})))`;
    const warp = distortion ? ` url(#vb-distort-${id})` : '';
    const layerFilter = `filter: ${hue} brightness(${b}) saturate(${s});`;
    const innerFilter = `filter: ${hue} brightness(${b}) saturate(${s})${warp};`;
    const bloomFilter = `filter: blur(${zpx(scaleBlur(10, glowSize))}) ${hue} brightness(${b}) saturate(${s});`;
    const bloomWarpFilter = `filter: blur(${zpx(scaleBlur(10, glowSize))}) ${hue} brightness(${b}) saturate(${s})${warp};`;
    const beamX = `calc(50% + var(--vb-cx-${id}) * var(--vb-w-${id}) * ${Z})`;
    const coreY = `calc(100% + (2px + var(--vb-cy-${id})) * ${Z})`;
    const highlight = isDark
        ? `radial-gradient(ellipse calc(${px(30 * coreSize)}px * var(--vb-w-${id}) * ${Z}) calc(${px(30 * coreSize)}px * var(--vb-h-${id}) * ${Z}) at ${beamX} ${coreY}, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.14) 30%, transparent 65%)`
        : `radial-gradient(ellipse calc(${px(40 * coreSize)}px * var(--vb-w-${id}) * ${Z}) calc(${px(30 * coreSize)}px * var(--vb-h-${id}) * ${Z}) at ${beamX} ${coreY}, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.22) 35%, transparent 70%)`;
    const strokeGradients = lobeGradients({ id, colors, alpha: 1, sw: gw(strokeScale), sh: gh(strokeScale), y: 2, fade });
    const innerGradients = lobeGradients({ id, colors, alpha: 0.46, sw: gw(0.9 * innerScale), sh: gh(0.9 * innerScale * innerHeight), y: 0, fade });
    const bloomGradients = lobeGradients({ id, colors, alpha: isDark ? 0.9 : 0.7, sw: gw(1.15 * bloomScale), sh: gh(1.5 * bloomScale * bloomHeight), y: 0, fade: Math.min(95, fade + 2) });
    const edgeMask = (w: number, h: number, mid: number, tail = 0) => `radial-gradient(ellipse calc(${px(w * rangeWidth)}px * var(--vb-w-${id}) * var(--vb-mw-${id}) * ${Z}) calc((${px(h * rangeHeight)}px * var(--vb-h-${id}) + var(--vb-bh-${id})) * ${Z}) at ${beamX} calc(100% + var(--vb-cy-${id}) * ${Z}), white 0%, rgba(255, 255, 255, 0.5) ${mid}%${tail > 0 ? `, rgba(255, 255, 255, ${tail}) 85%` : ''}, transparent 100%)`;
    const opacity = (layer: string, preset: string) => `opacity: calc(var(--vb-opacity-${id}, 1) * var(--vb-glow-${id}) * ${preset} * var(--voice-${layer}-opacity, 1) * var(--voice-strength, 1));`;
    const innerRule = (selector: string, head: string, clip: string, filter: string) => `${selector} {
  ${head}
  position: absolute;
  inset: 0;
  border-radius: ${zpx(borderRadius)};
  background: ${innerGradients};
  box-shadow: inset 0 0 ${zpx(insetBlur)} 1px ${innerShadow};
  -webkit-mask-image:
    ${edgeMask(170, 64, 45, 0.3)},
    linear-gradient(white, transparent ${zpx(cornerFade)}, transparent calc(100% - ${cornerFade}px * ${Z}), white),
    linear-gradient(to right, white, transparent ${zpx(cornerFade)}, transparent calc(100% - ${cornerFade}px * ${Z}), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image:
    ${edgeMask(170, 64, 45, 0.3)},
    linear-gradient(white, transparent ${zpx(cornerFade)}, transparent calc(100% - ${cornerFade}px * ${Z}), white),
    linear-gradient(to right, white, transparent ${zpx(cornerFade)}, transparent calc(100% - ${cornerFade}px * ${Z}), white);
  mask-composite: intersect, add;
  pointer-events: none;

  will-change: transform;
  z-index: 1;
  ${clip}
  ${opacity('inner', sInner)}
  ${filter}
}`;
    return `
@property --vb-opacity-${id} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

[data-voice-beam="${id}"] {
  position: relative;
  border-radius: ${borderRadius}px;
  overflow: hidden;
  --vb-h-${id}: 0.8;
  --vb-w-${id}: 1;
${voiceLobes.map((lobe, i) => `  --vb-x${i}-${id}: ${lobe.x}px;
  --vb-l${i}-${id}: 1;
  --vb-y${i}-${id}: 0px;`).join('\n')}
  --vb-glow-${id}: 0.4;
  --vb-z-${id}: 1;
  --vb-cx-${id}: 0px;
  --vb-cy-${id}: 0px;
  --vb-bh-${id}: 0px;
  --vb-bendA-${id}: 0;
  --vb-mw-${id}: 1;
  --vb-hue-${id}: 0deg;
  --vb-level-${id}: 0;
}

[data-voice-beam="${id}"][data-active] {
  animation: vb-fade-in-${id} 0.6s ease forwards;
}

[data-voice-beam="${id}"][data-fading] {
  animation: vb-fade-out-${id} 0.5s ease forwards;
}


[data-voice-beam="${id}"][data-active]::after,
[data-voice-beam="${id}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${zpx(innerRadius)};
  padding: ${zpx(borderWidth)};
  clip-path: inset(0 round ${zpx(borderRadius)});
  background:
    ${highlight},
    ${strokeGradients};
  -webkit-mask:
    ${edgeMask(170, 64, 45)},
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask:
    ${edgeMask(170, 64, 45)},
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none;

  will-change: transform;
  z-index: 2;
  ${opacity('stroke', sStroke)}
  ${layerFilter}
}


${innerRule(`[data-voice-beam="${id}"][data-active]::before,
[data-voice-beam="${id}"][data-fading]::before`, `content: "";`, distortion ? `clip-path: var(--vb-clip-above-${id}, inset(0 round ${borderRadius}px));` : `clip-path: inset(0 round ${borderRadius}px);`, layerFilter)}
${distortion ? innerRule(`[data-voice-beam="${id}"][data-active] [data-voice-beam-warp="inner"],
[data-voice-beam="${id}"][data-fading] [data-voice-beam-warp="inner"]`, 'display: block;', `clip-path: var(--vb-clip-below-${id}, inset(0 round ${borderRadius}px));`, innerFilter) : ''}


[data-voice-beam="${id}"] [data-voice-beam-bloom],
[data-voice-beam="${id}"] [data-voice-beam-warp] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${zpx(innerRadius)};
  pointer-events: none;

  will-change: transform;
  opacity: 0;
}

[data-voice-beam="${id}"] [data-voice-beam-bloom],
[data-voice-beam="${id}"] [data-voice-beam-warp="bloom"] {
  -webkit-mask: ${edgeMask(200, 130, 35)};
  mask: ${edgeMask(200, 130, 35)};
  background: ${bloomGradients};
  z-index: 3;
}

[data-voice-beam="${id}"][data-active] [data-voice-beam-bloom],
[data-voice-beam="${id}"][data-fading] [data-voice-beam-bloom] {
  display: block;
  clip-path: ${distortion ? `var(--vb-clip-above-${id}, inset(0 round ${borderRadius}px))` : `inset(0 round ${borderRadius}px)`};
  ${opacity('bloom', sBloom)}
  ${bloomFilter}
}
${distortion ? `
[data-voice-beam="${id}"][data-active] [data-voice-beam-warp="bloom"],
[data-voice-beam="${id}"][data-fading] [data-voice-beam-warp="bloom"] {
  display: block;
  clip-path: var(--vb-clip-below-${id}, inset(0 round ${borderRadius}px));
  ${opacity('bloom', sBloom)}
  ${bloomWarpFilter}
}


[data-voice-beam="${id}"][data-voice-warp="off"]::before,
[data-voice-beam="${id}"][data-voice-warp="off"] [data-voice-beam-bloom] {
  clip-path: inset(0 round ${borderRadius}px);
}

[data-voice-beam="${id}"][data-voice-warp="off"] [data-voice-beam-warp] {
  display: none;
}` : ''}


${coreLight > 0 ? (() => {
        const boost = Math.max(0, Math.min(2, coreLight - 1));
        const b1 = Math.min(1, boost);
        const b2 = Math.max(0, boost - 1);
        const grow = 1 + 0.3 * boost;
        const solid = px(45 * b1 + 27 * b2);
        const midStop = px(40 + 25 * b1 + 15 * b2);
        const midAlpha = Math.min(1, 0.55 + 0.35 * b1 + 0.1 * b2).toFixed(2);
        const endStop = px(72 + 14 * b1 + 8 * b2);
        return `[data-voice-beam="${id}"] [data-voice-beam-core] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${zpx(innerRadius)};
  overflow: hidden;
  pointer-events: none;

  will-change: transform;

  filter: blur(${zpx(scaleBlur(8, glowSize))});
  z-index: 4;
}

[data-voice-beam="${id}"] [data-voice-beam-core] > div {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse calc(${px(120 * coreLightWidth * grow * scale)}px * var(--vb-w-${id}) * ${Z}) calc((${px(70 * coreLightHeight * grow * scale)}px * var(--vb-h-${id}) + var(--vb-bh-${id})) * ${Z}) at ${beamX} calc(100% + var(--vb-cy-${id}) * ${Z}), white 0%, white ${solid}%, rgba(255, 255, 255, ${midAlpha}) ${midStop}%, transparent ${endStop}%);
  clip-path: var(--vb-clip-below-${id}, none);
}

[data-voice-beam="${id}"][data-active] [data-voice-beam-core],
[data-voice-beam="${id}"][data-fading] [data-voice-beam-core] {
  display: block;
  opacity: calc(var(--vb-opacity-${id}, 1) * min(1, var(--vb-glow-${id}) * ${Math.min(1, coreLight).toFixed(2)} * ${(1.6 + 1.4 * boost).toFixed(2)}) * var(--voice-core-light-opacity, 1));
}
`;
    })() : ''}

[data-voice-beam="${id}"] [data-voice-beam-band],
[data-voice-beam="${id}"] [data-voice-beam-band-halo] {
  display: none;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  will-change: transform;
  z-index: 4;
}

[data-voice-beam="${id}"][data-active] [data-voice-beam-band],
[data-voice-beam="${id}"][data-fading] [data-voice-beam-band],
[data-voice-beam="${id}"][data-active] [data-voice-beam-band-halo],
[data-voice-beam="${id}"][data-fading] [data-voice-beam-band-halo] {
  display: block;
  opacity: calc(var(--vb-opacity-${id}, 1) * var(--voice-band-opacity, 1) * var(--voice-strength, 1));

  filter: blur(var(--vb-band-blur-${id}, 0px)) ${hue} brightness(${b}) saturate(${s});
}

[data-voice-beam="${id}"][data-active] [data-voice-beam-band-halo],
[data-voice-beam="${id}"][data-fading] [data-voice-beam-band-halo] {
  filter: blur(var(--vb-band-halo-blur-${id}, 0px)) ${hue} brightness(${b}) saturate(${s});
}


[data-voice-beam="${id}"][data-voice-halfres]::before,
[data-voice-beam="${id}"][data-voice-halfres] [data-voice-beam-warp],
[data-voice-beam="${id}"][data-voice-halfres] [data-voice-beam-bloom],
[data-voice-beam="${id}"][data-voice-halfres] [data-voice-beam-core] {
  --vb-z-${id}: 0.5;
  inset: auto;
  left: 0;
  top: 0;
  width: 50%;
  height: 50%;
  transform: translateZ(0) scale(2);
  transform-origin: 0 0;
}
${distortion ? `[data-voice-beam="${id}"][data-voice-halfres][data-active]::before,
[data-voice-beam="${id}"][data-voice-halfres][data-fading]::before,
[data-voice-beam="${id}"][data-voice-halfres][data-active] [data-voice-beam-bloom],
[data-voice-beam="${id}"][data-voice-halfres][data-fading] [data-voice-beam-bloom] {
  clip-path: var(--vb-clip-above-z-${id}, inset(0 round ${zpx(borderRadius)}));
}
[data-voice-beam="${id}"][data-voice-halfres][data-active] [data-voice-beam-warp],
[data-voice-beam="${id}"][data-voice-halfres][data-fading] [data-voice-beam-warp] {
  clip-path: var(--vb-clip-below-z-${id}, inset(0 round ${zpx(borderRadius)}));
}

[data-voice-beam="${id}"][data-voice-halfres][data-voice-warp="off"]::before,
[data-voice-beam="${id}"][data-voice-halfres][data-voice-warp="off"] [data-voice-beam-bloom] {
  clip-path: inset(0 round ${zpx(borderRadius)});
}` : `[data-voice-beam="${id}"][data-voice-halfres][data-active]::before,
[data-voice-beam="${id}"][data-voice-halfres][data-fading]::before,
[data-voice-beam="${id}"][data-voice-halfres][data-active] [data-voice-beam-bloom],
[data-voice-beam="${id}"][data-voice-halfres][data-fading] [data-voice-beam-bloom] {
  clip-path: inset(0 round ${zpx(borderRadius)});
}`}
[data-voice-beam="${id}"][data-voice-halfres] [data-voice-beam-core] > div {
  clip-path: var(--vb-clip-below-z-${id}, none);
}
@keyframes vb-fade-in-${id} {
  to { --vb-opacity-${id}: 1; }
}

@keyframes vb-fade-out-${id} {
  from { --vb-opacity-${id}: 1; }
  to { --vb-opacity-${id}: 0; }
}

[data-voice-beam="${id}"][data-paused],
[data-voice-beam="${id}"][data-paused]::after,
[data-voice-beam="${id}"][data-paused]::before,
[data-voice-beam="${id}"][data-paused] [data-voice-beam-bloom] {
  animation-play-state: paused !important;
}
`;
}
