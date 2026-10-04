import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createCycle, createInstance, createReveal, destroyInstance, renderInstanceOnce, samplePaletteFromCanvas, setInstanceCardBg, setInstanceColors, setInstancePaused, setInstancePixelScale, setInstancePreset, setInstanceSpeed, setInstanceStrength, setInstanceVisible, setSharedFragmentShader, updateInstanceSize, type Cycle, type Instance, type RevealState, type SampledPalette } from './engine';
import { PRESETS } from './presets';
import { ensureStylesInjected } from './styles';
import type { ImageGenerationHandle, ImageGenerationPreset, ImageGenerationProps, ImageGenerationTheme } from './types';
ensureStylesInjected();
function detectTheme(): 'dark' | 'light' {
    if (typeof document === 'undefined')
        return 'dark';
    const html = document.documentElement;
    const dataTheme = html.getAttribute('data-theme');
    if (dataTheme === 'dark' || dataTheme === 'light')
        return dataTheme;
    if (html.classList.contains('dark'))
        return 'dark';
    if (html.classList.contains('light'))
        return 'light';
    const colorScheme = html.style.colorScheme || getComputedStyle(html).colorScheme;
    if (colorScheme === 'dark')
        return 'dark';
    if (colorScheme === 'light')
        return 'light';
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
}
function useResolvedTheme(theme: ImageGenerationTheme): 'dark' | 'light' {
    const [resolved, setResolved] = useState<'dark' | 'light'>(() => {
        if (theme !== 'auto')
            return theme;
        return detectTheme();
    });
    useEffect(() => {
        if (theme !== 'auto') {
            setResolved(theme);
            return;
        }
        if (typeof window === 'undefined')
            return;
        const update = (): void => setResolved(detectTheme());
        update();
        const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        mql?.addEventListener('change', update);
        let mo: MutationObserver | null = null;
        if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
            mo = new MutationObserver(update);
            mo.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'style', 'data-theme']
            });
        }
        return () => {
            mql?.removeEventListener('change', update);
            mo?.disconnect();
        };
    }, [theme]);
    return resolved;
}
function normaliseImages(input: string | string[] | undefined): string[] {
    if (!input)
        return [];
    if (typeof input === 'string')
        return [input];
    return input.slice();
}
const PIXEL_CHURN_PRESETS = ['pixels-mechanic', 'pixels-organic'] as const;
type PixelChurnPreset = (typeof PIXEL_CHURN_PRESETS)[number];
function isPixelChurnPreset(name: ImageGenerationPreset): name is PixelChurnPreset {
    return (PIXEL_CHURN_PRESETS as readonly string[]).includes(name);
}
export const ImageGeneration = forwardRef<ImageGenerationHandle, ImageGenerationProps>(function ImageGeneration({ children, preset = 'pixels-organic', theme = 'auto', strength = 1, speed = 1, pixelScale = 1, cardBg: cardBgProp, colors, images, autoReveal = false, revealDelayRange = [2, 4], revealInitialDelay, revealHoldMs = 2000, revealFadeOutMs = 300, borderRadius, paused = false, fragmentShader, onCycle, excludeSrcs, className, style, ...rest }, forwardedRef) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const shaderCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<Instance | null>(null);
    const revealRef = useRef<RevealState | null>(null);
    const cycleRef = useRef<Cycle | null>(null);
    const onCycleRef = useRef(onCycle);
    const excludeSrcsRef = useRef(excludeSrcs);
    const [regenTint, setRegenTint] = useState<SampledPalette | null>(null);
    const [regenPresetName, setRegenPresetName] = useState<ImageGenerationPreset | null>(null);
    useImperativeHandle(forwardedRef, () => ({
        get element() {
            return rootRef.current;
        },
        triggerReveal(opts) {
            cycleRef.current?.triggerOnce(opts);
        },
        triggerHide() {
            cycleRef.current?.triggerHide();
        },
        triggerRegenerate(opts) {
            const cycle = cycleRef.current;
            if (!cycle || pausedRef.current)
                return;
            const phase = cycle.getPhase();
            if (phase !== 'reveal' && phase !== 'visible')
                return;
            const activePreset = presetRef.current;
            const churnName = isPixelChurnPreset(activePreset)
                ? null
                : PIXEL_CHURN_PRESETS[Math.floor(Math.random() * PIXEL_CHURN_PRESETS.length)];
            if (opts?.tintFromImage ?? true) {
                const overlay = overlayCanvasRef.current;
                if (overlay) {
                    const churnColors = churnName
                        ? PRESETS[churnName].modes[resolvedThemeRef.current].colors
                        : presetModeRef.current.colors;
                    const sampled = samplePaletteFromCanvas(overlay, churnColors);
                    if (sampled)
                        setRegenTint(sampled);
                }
            }
            if (churnName)
                setRegenPresetName(churnName);
            const autoReveal = opts?.autoReveal ?? true;
            cycle.triggerBoil(autoReveal ? { autoRevealAfterMs: opts?.durationMs ?? 4000 } : undefined);
        },
        isImageActive() {
            const phase = cycleRef.current?.getPhase() ?? 'idle';
            return phase === 'reveal' || phase === 'visible' || phase === 'hide';
        }
    }), []);
    useLayoutEffect(() => {
        ensureStylesInjected();
    }, []);
    useEffect(() => {
        onCycleRef.current = onCycle;
    }, [onCycle]);
    useEffect(() => {
        excludeSrcsRef.current = excludeSrcs;
    }, [excludeSrcs]);
    const resolvedTheme = useResolvedTheme(theme);
    const presetMode = useMemo(() => PRESETS[preset].modes[resolvedTheme], [preset, resolvedTheme]);
    const cardBg = cardBgProp ?? presetMode.cardBg;
    const presetModeRef = useRef(presetMode);
    presetModeRef.current = presetMode;
    const presetRef = useRef(preset);
    presetRef.current = preset;
    const resolvedThemeRef = useRef(resolvedTheme);
    resolvedThemeRef.current = resolvedTheme;
    const pausedRef = useRef(paused);
    pausedRef.current = paused;
    const imagesArr = useMemo(() => normaliseImages(images), [images]);
    const imagesArrRef = useRef(imagesArr);
    const revealDelayRangeRef = useRef(revealDelayRange);
    const revealHoldMsRef = useRef(revealHoldMs);
    const revealFadeOutMsRef = useRef(revealFadeOutMs);
    imagesArrRef.current = imagesArr;
    revealDelayRangeRef.current = revealDelayRange;
    revealHoldMsRef.current = revealHoldMs;
    revealFadeOutMsRef.current = revealFadeOutMs;
    const initialDelayMsRef = useRef<number | undefined>(useMemo(() => {
        if (revealInitialDelay == null)
            return undefined;
        if (typeof revealInitialDelay === 'number') {
            return Math.max(0, revealInitialDelay) * 1000;
        }
        const [min, max] = revealInitialDelay;
        const lo = Math.max(0, Math.min(min, max));
        const hi = Math.max(0, Math.max(min, max));
        return (lo + Math.random() * (hi - lo)) * 1000;
    }, []));
    useLayoutEffect(() => {
        const root = rootRef.current;
        const shader = shaderCanvasRef.current;
        const overlay = overlayCanvasRef.current;
        if (!root || !shader || !overlay)
            return;
        const measure = (): {
            w: number;
            h: number;
            r: number;
        } => {
            const rect = root.getBoundingClientRect();
            const w = Math.max(1, Math.round(rect.width));
            const h = Math.max(1, Math.round(rect.height));
            let r = 0;
            if (typeof borderRadius === 'number') {
                r = borderRadius;
            }
            else {
                const childEl = contentRef.current?.firstElementChild as HTMLElement | null;
                if (childEl) {
                    const parsed = parseFloat(getComputedStyle(childEl).borderTopLeftRadius);
                    if (Number.isFinite(parsed) && parsed > 0)
                        r = parsed;
                }
                if (r === 0) {
                    const parsed = parseFloat(getComputedStyle(root).borderTopLeftRadius);
                    if (Number.isFinite(parsed) && parsed > 0)
                        r = parsed;
                }
            }
            return { w, h, r };
        };
        const initial = measure();
        const inst = createInstance({
            canvas: shader,
            cssWidth: initial.w,
            cssHeight: initial.h,
            preset: presetMode,
            strength,
            speed,
            cardBg: cardBgProp ?? null,
            pixelScale
        });
        instanceRef.current = inst;
        inst.canvas.style.opacity = String(Math.max(0, Math.min(1, strength)));
        const reveal = createReveal({
            canvas: overlay,
            cssWidth: initial.w,
            cssHeight: initial.h,
            shaderCanvas: shader
        });
        inst.reveal = reveal;
        revealRef.current = reveal;
        const cycle = createCycle({
            reveal,
            images: imagesArrRef.current,
            delayRange: revealDelayRangeRef.current,
            holdMs: revealHoldMsRef.current,
            fadeOutMs: revealFadeOutMsRef.current,
            initialDelayMs: initialDelayMsRef.current,
            onPhase: (e) => {
                if (e.phase === 'visible') {
                    setRegenTint(null);
                    setRegenPresetName(null);
                }
                onCycleRef.current?.(e);
            },
            excludeSrcs: () => excludeSrcsRef.current?.() ?? null
        });
        cycleRef.current = cycle;
        if (paused)
            cycle.setPaused(true);
        root.style.setProperty('--image-gen-radius', `${initial.r}px`);
        root.style.borderRadius = `${initial.r}px`;
        let resizeRaf = 0;
        let lastW = -1;
        let lastH = -1;
        let lastR = -1;
        const applyMeasure = (): void => {
            resizeRaf = 0;
            const i = instanceRef.current;
            if (!i)
                return;
            const next = measure();
            if (next.w !== lastW || next.h !== lastH) {
                updateInstanceSize(i, next.w, next.h);
                lastW = next.w;
                lastH = next.h;
            }
            if (next.r !== lastR) {
                root.style.setProperty('--image-gen-radius', `${next.r}px`);
                root.style.borderRadius = `${next.r}px`;
                lastR = next.r;
            }
        };
        const scheduleMeasure = (): void => {
            if (resizeRaf !== 0)
                return;
            resizeRaf = requestAnimationFrame(applyMeasure);
        };
        const ro = new ResizeObserver(scheduleMeasure);
        ro.observe(root);
        const childEl = contentRef.current?.firstElementChild as HTMLElement | null;
        if (childEl)
            ro.observe(childEl);
        let mo: MutationObserver | null = null;
        if (childEl && typeof MutationObserver !== 'undefined') {
            mo = new MutationObserver(scheduleMeasure);
            mo.observe(childEl, {
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        }
        lastW = initial.w;
        lastH = initial.h;
        lastR = initial.r;
        let io: IntersectionObserver | null = null;
        if (typeof IntersectionObserver !== 'undefined') {
            io = new IntersectionObserver((entries) => {
                const i = instanceRef.current;
                if (!i)
                    return;
                for (const e of entries)
                    setInstanceVisible(i, e.isIntersecting);
            }, { rootMargin: '64px' });
            io.observe(root);
        }
        return () => {
            ro.disconnect();
            mo?.disconnect();
            io?.disconnect();
            if (resizeRaf !== 0)
                cancelAnimationFrame(resizeRaf);
            cycleRef.current?.dispose();
            cycleRef.current = null;
            reveal.dispose();
            revealRef.current = null;
            const i = instanceRef.current;
            if (i)
                destroyInstance(i);
            instanceRef.current = null;
        };
    }, []);
    useEffect(() => {
        const i = instanceRef.current;
        if (!i)
            return;
        const effectiveMode = regenPresetName
            ? PRESETS[regenPresetName].modes[resolvedTheme]
            : presetMode;
        setInstancePreset(i, effectiveMode);
        renderInstanceOnce(i);
    }, [presetMode, regenPresetName, resolvedTheme]);
    useEffect(() => {
        const i = instanceRef.current;
        if (!i)
            return;
        setInstanceCardBg(i, regenTint?.cardBg ?? cardBgProp ?? null);
        renderInstanceOnce(i);
    }, [cardBgProp, regenTint]);
    useEffect(() => {
        const i = instanceRef.current;
        if (!i)
            return;
        setInstanceColors(i, regenTint?.colors ?? colors ?? null);
        renderInstanceOnce(i);
    }, [colors, regenTint]);
    useEffect(() => {
        const i = instanceRef.current;
        if (!i)
            return;
        setInstanceStrength(i, strength);
        if (i.canvas) {
            i.canvas.style.opacity = String(Math.max(0, Math.min(1, strength)));
        }
    }, [strength]);
    useEffect(() => {
        const i = instanceRef.current;
        if (!i)
            return;
        setInstanceSpeed(i, speed);
    }, [speed]);
    useEffect(() => {
        const i = instanceRef.current;
        if (!i)
            return;
        setInstancePixelScale(i, pixelScale);
        renderInstanceOnce(i);
    }, [pixelScale]);
    useEffect(() => {
        if (!fragmentShader)
            return;
        setSharedFragmentShader(fragmentShader);
        return () => setSharedFragmentShader(null);
    }, [fragmentShader]);
    useEffect(() => {
        const i = instanceRef.current;
        if (i)
            setInstancePaused(i, paused);
        cycleRef.current?.setPaused(paused);
    }, [paused]);
    useEffect(() => {
        cycleRef.current?.setImages(imagesArr);
    }, [imagesArr]);
    useEffect(() => {
        cycleRef.current?.setOptions({
            delayRange: revealDelayRange,
            holdMs: revealHoldMs,
            fadeOutMs: revealFadeOutMs
        });
    }, [revealDelayRange, revealHoldMs, revealFadeOutMs]);
    useEffect(() => {
        const cycle = cycleRef.current;
        if (!cycle)
            return;
        if (autoReveal) {
            cycle.start();
            return () => cycle.stop();
        }
        cycle.stop();
        return undefined;
    }, [autoReveal]);
    const wrapperStyle = useMemo<CSSProperties>(() => {
        return {
            background: regenTint?.cardBg ?? cardBg,
            ...style
        };
    }, [cardBg, regenTint, style]);
    return (<div {...rest} ref={rootRef} className={['image-gen-root', className].filter(Boolean).join(' ')} data-preset={preset} data-theme={resolvedTheme} data-paused={paused ? 'true' : undefined} style={wrapperStyle}>
      <canvas ref={shaderCanvasRef} className="image-gen-shader" aria-hidden="true"/>
      <canvas ref={overlayCanvasRef} className="image-gen-overlay" aria-hidden="true"/>
      <div ref={contentRef} className="image-gen-child">
        {children}
      </div>
    </div>);
});
ImageGeneration.displayName = 'ImageGeneration';
