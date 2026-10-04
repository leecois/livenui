import React, { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { MetalFx } from './MetalFx';
import type { MetalFxReflectionTarget, MetalFxTheme } from './types';
import type { MaskFn } from './engine/renderer/core';
import { gaussBlur } from './engine/glow/bake';
import { paintTextRun } from './engine/textMask';
export interface TextInnerShadow {
    offsetY: number;
    blur: number;
    alpha: number;
}
const FIGMA_INNER_SHADOW: TextInnerShadow = { offsetY: 1, blur: 0.5, alpha: 0.9 };
export const METAL_TEXT_DEFAULTS = Object.freeze({ metalOpacity: 0.62, shaderScale: 2.8, glowGain: 2.5, innerShadow: FIGMA_INNER_SHADOW });
function drawInnerShadow(cv: HTMLCanvasElement, root: HTMLElement, textEl: HTMLElement, sh: TextInnerShadow): void {
    const dpr = window.devicePixelRatio || 1;
    const rr = root.getBoundingClientRect();
    const w = Math.max(1, Math.round(rr.width * dpr)), h = Math.max(1, Math.round(rr.height * dpr));
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const og = off.getContext('2d', { willReadFrequently: true });
    const g = cv.getContext('2d');
    if (!og || !g)
        return;
    og.fillStyle = '#fff';
    paintTextRun(og, root, textEl, dpr);
    const d = og.getImageData(0, 0, w, h).data;
    const n = w * h;
    const a = new Float32Array(n);
    for (let i = 0, j = 3; i < n; i++, j += 4)
        a[i] = d[j] / 255;
    const shift = Math.max(1, Math.round(sh.offsetY * dpr)) * w;
    const rim = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const above = i >= shift ? a[i - shift] : 0;
        rim[i] = Math.max(0, a[i] - above);
    }
    const blurred = gaussBlur(rim, w, h, sh.blur * dpr);
    cv.width = w;
    cv.height = h;
    cv.style.width = `${rr.width}px`;
    cv.style.height = `${rr.height}px`;
    const img = g.createImageData(w, h);
    const o = img.data;
    for (let i = 0, j = 0; i < n; i++, j += 4) {
        o[j] = 255;
        o[j + 1] = 255;
        o[j + 2] = 255;
        o[j + 3] = Math.round(Math.min(1, blurred[i] * a[i] * sh.alpha) * 255);
    }
    g.putImageData(img, 0, 0);
}
const BARE_STYLE_ID = 'mfx-bare-style';
const BARE_CSS = '.metal-fx-root[data-mfx-bare]{background:transparent!important}' +
    '.metal-fx-root[data-mfx-bare]::before,.metal-fx-root[data-mfx-bare]::after{box-shadow:none!important}' +
    '.metal-fx-root[data-mfx-bare] .metal-fx-inner{display:none!important}';
export function MetalText({ children, font, color, strength = 1, theme, paused = false, reflectionTargets, className, innerShadow = FIGMA_INNER_SHADOW, glow = false, glowGain = METAL_TEXT_DEFAULTS.glowGain, metalOpacity = METAL_TEXT_DEFAULTS.metalOpacity, shaderScale = METAL_TEXT_DEFAULTS.shaderScale, }: {
    children: string;
    font: string;
    color: string;
    strength?: number;
    theme?: MetalFxTheme;
    paused?: boolean;
    reflectionTargets?: ReadonlyArray<MetalFxReflectionTarget>;
    className?: string;
    innerShadow?: TextInnerShadow | null;
    glow?: boolean;
    glowGain?: number;
    metalOpacity?: number;
    shaderScale?: number;
}) {
    const rootRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        if (!document.getElementById(BARE_STYLE_ID)) {
            const st = document.createElement('style');
            st.id = BARE_STYLE_ID;
            st.textContent = BARE_CSS;
            document.head.appendChild(st);
        }
        rootRef.current?.setAttribute('data-mfx-bare', '');
        const cv = rootRef.current?.querySelector<HTMLCanvasElement>('canvas.metal-fx-canvas');
        if (cv)
            cv.style.zIndex = '6';
        const host = rootRef.current?.querySelector<HTMLElement>('.metal-fx-glow-svg')?.parentElement;
        if (host)
            host.style.zIndex = '7';
    }, []);
    useEffect(() => {
        const root = rootRef.current, t = textRef.current;
        if (!root || !t || !innerShadow)
            return;
        const cv = document.createElement('canvas');
        cv.className = 'metal-fx-text-rim';
        cv.setAttribute('aria-hidden', 'true');
        cv.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:8';
        root.appendChild(cv);
        const draw = () => drawInnerShadow(cv, root, t, innerShadow);
        draw();
        let alive = true;
        document.fonts?.ready.then(() => { if (alive)
            draw(); });
        const ro = new ResizeObserver(draw);
        ro.observe(root);
        let mql: MediaQueryList | null = null;
        const watchDpr = () => {
            mql?.removeEventListener('change', onDpr);
            mql = typeof window.matchMedia === 'function' ? window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`) : null;
            mql?.addEventListener('change', onDpr);
        };
        const onDpr = () => { if (!alive)
            return; draw(); watchDpr(); };
        watchDpr();
        return () => { alive = false; ro.disconnect(); mql?.removeEventListener('change', onDpr); cv.remove(); };
    }, [innerShadow]);
    const mask = useCallback<MaskFn>((ctx, _w, _h, dpr) => {
        const root = rootRef.current, t = textRef.current;
        if (root && t)
            paintTextRun(ctx, root, t, dpr);
    }, []);
    const style: CSSProperties = { font, color, letterSpacing: 0, whiteSpace: 'nowrap' };
    return (<MetalFx ref={rootRef} preset="chromatic" theme={theme} paused={paused} strength={strength * metalOpacity} glowGain={glowGain} disableGlow={!glow} mask={mask} reflectionTargets={reflectionTargets} shaderScale={shaderScale} borderRadius={4} style={{ background: 'transparent', borderRadius: 4 }}>
      <span ref={textRef} className={className} style={style} aria-label={children}>
        {children}
      </span>
    </MetalFx>);
}
