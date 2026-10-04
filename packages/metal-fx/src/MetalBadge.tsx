import React, { useCallback, useRef } from 'react';
import { MetalFx } from './MetalFx';
import type { MetalFxReflectionTarget, MetalFxTheme } from './types';
import type { MaskFn } from './engine/renderer/core';
const RADIUS = 55.556;
const W = 45, H = 25;
const TEXT_W = 26.667, TEXT_H = 13.333;
const PAD_X = (W - TEXT_W) / 2;
const LAYER: React.CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };
const shadowFor = (k: number, glow: number) => `inset 0px 0px ${8.333 * k}px 0px rgba(255,255,255,${glow}), ` +
    `inset 0px 0px ${8.333 * k}px 0px rgba(255,255,255,${glow}), ` +
    `inset 0px 0px 0px ${0.833 * k}px rgba(255,255,255,0.5), ` +
    `inset 0px ${0.833 * k}px 0px 0px rgba(255,255,255,0.78)`;
export const METAL_BADGE_DEFAULTS = Object.freeze({
    metalOpacity: 0.8,
    shaderScale: 1.6,
    core: Object.freeze({ r: 46, blur: 100, a: 0.94, size: 49 }),
    gradient: 0,
    glow: 0.41,
});
export interface MetalBadgeCore {
    r: number;
    blur: number;
    a: number;
    size: number;
}
export function MetalBadge({ children = 'New', strength = 1, theme, paused = false, scale = 1, reflectionTargets, metalOpacity = METAL_BADGE_DEFAULTS.metalOpacity, shaderScale = METAL_BADGE_DEFAULTS.shaderScale, core = METAL_BADGE_DEFAULTS.core, gradient = METAL_BADGE_DEFAULTS.gradient, glow = METAL_BADGE_DEFAULTS.glow, textColor = '#323232', }: {
    children?: string;
    strength?: number;
    theme?: MetalFxTheme;
    paused?: boolean;
    scale?: number;
    reflectionTargets?: ReadonlyArray<MetalFxReflectionTarget>;
    metalOpacity?: number;
    shaderScale?: number;
    core?: MetalBadgeCore;
    gradient?: number;
    glow?: number;
    textColor?: string;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const opacity = metalOpacity;
    const mask = useCallback<MaskFn>((ctx, w, h, dpr) => {
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, RADIUS * dpr);
        ctx.fill();
    }, []);
    return (<MetalFx ref={rootRef} preset="chromatic" theme={theme} paused={paused} strength={strength * opacity} shaderScale={shaderScale} mask={mask} glowMode="ring" reflectionTargets={reflectionTargets} borderRadius={RADIUS * scale} style={{ background: '#ffffff', borderRadius: RADIUS * scale }}>

      <div style={{ position: 'relative', width: W * scale, height: H * scale, borderRadius: RADIUS * scale }}>

        <div aria-hidden="true" style={{
            ...LAYER,
            borderRadius: RADIUS * scale,
            background: `radial-gradient(ellipse ${core.size}% ${core.size}% at 50% 50%, rgba(255,255,255,1) ${core.r}%, rgba(255,255,255,0) ${Math.min(100, core.r + core.blur)}%)`,
            opacity: core.a,
        }}/>

        <div aria-hidden="true" style={{
            ...LAYER,
            borderRadius: RADIUS * scale,
            background: `linear-gradient(to bottom, rgba(255,255,255,${gradient}), rgba(255,255,255,0))`,
            boxShadow: shadowFor(scale, glow),
        }}/>
        <span style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            width: W * scale,
            height: H * scale,
            paddingLeft: PAD_X * scale,
            paddingRight: PAD_X * scale,
            font: `600 ${12.222 * scale}px/1.4 Inter, sans-serif`,
            color: textColor,
            letterSpacing: 0,
            whiteSpace: 'nowrap',
        }} aria-label={children}>
          {children}
        </span>
      </div>
    </MetalFx>);
}
