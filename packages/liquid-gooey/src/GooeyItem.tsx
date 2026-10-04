import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, } from 'react';
import { createPortal } from 'react-dom';
import { useGooeyContext, type GooeyContextValue } from './context';
import { measureRadius, normalizeRadius, offsetTo, roundedRectPath, type BlobBox, type CornerRadii, } from './geometry';
import { useIsoLayoutEffect, useReducedMotion } from './hooks';
import { EVOLVE_DEFAULTS, MOVE_DEFAULTS, type EvolveOptions, type MoveOptions } from './observer';
import { easingFunction, resolveTransition, type Transition } from './spring';
export type GooeyEffect = 'morph' | 'evolve' | 'move';
export interface DissolveOptions {
    blur?: number;
    warp?: number;
    pull?: number;
    range?: number;
    zone?: number;
    mix?: number;
    gravity?: number;
    taper?: number;
    warpFreq?: number;
    flowSpeed?: number;
    warpStyle?: 'fractalNoise' | 'turbulence';
    detail?: number;
    active?: boolean;
    releaseMs?: number;
    fadeMs?: number;
    strength?: number;
    sink?: number;
    surface?: 'liquid' | 'image';
    seamBlur?: number;
}
export interface GooeyItemProps {
    effect?: GooeyEffect | GooeyEffect[];
    evolve?: EvolveOptions;
    move?: MoveOptions;
    x?: number;
    y?: number;
    scale?: number;
    transition?: Transition;
    delay?: number;
    observe?: boolean;
    contactBlur?: boolean | DissolveOptions;
    radius?: number | CornerRadii;
    blobInset?: number;
    bridgeGrow?: number;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}
function toEffects(effect: GooeyEffect | GooeyEffect[] | undefined): GooeyEffect[] {
    return Array.isArray(effect) ? effect : effect ? [effect] : [];
}
export function GooeyItem(props: GooeyItemProps) {
    const ctx = useGooeyContext();
    const needsEngine = props.observe || toEffects(props.effect).some(e => e !== 'morph');
    return needsEngine ? (<ObservedItem {...props} ctx={ctx}/>) : (<MirroredItem {...props} ctx={ctx}/>);
}
type Internal = GooeyItemProps & {
    ctx: GooeyContextValue;
};
function transitionKey(t: Transition | undefined): string {
    return typeof t === 'string' ? t : JSON.stringify(t ?? null);
}
function sameBox(a: BlobBox | null, b: BlobBox): boolean {
    return (!!a &&
        a.x === b.x &&
        a.y === b.y &&
        a.w === b.w &&
        a.h === b.h &&
        a.r.every((v, i) => v === b.r[i]));
}
function MirroredItem({ x = 0, y = 0, scale = 1, transition = 'smooth', delay = 0, radius, className, style, children, ctx, }: Internal) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const blobRef = useRef<SVGGraphicsElement | null>(null);
    const [box, setBox] = useState<BlobBox | null>(null);
    const reduced = useReducedMotion();
    const tKey = transitionKey(transition);
    const { duration, easing } = useMemo(() => resolveTransition(transition, reduced), [tKey, reduced]);
    const radiusKey = radius == null ? '' : JSON.stringify(radius);
    useIsoLayoutEffect(() => {
        const el = wrapRef.current;
        const group = ctx.getGroup();
        if (!el || !group)
            return;
        const measure = () => {
            const base = offsetTo(el, group);
            const w = el.offsetWidth;
            const h = el.offsetHeight;
            const target = (el.firstElementChild as HTMLElement | null) ?? el;
            const r: CornerRadii = radius != null ? normalizeRadius(radius) : measureRadius(target, w, h);
            const next: BlobBox = { x: base.x, y: base.y, w, h, r };
            setBox(prev => (sameBox(prev, next) ? prev : next));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        ro.observe(group);
        return () => ro.disconnect();
    }, [ctx, radiusKey]);
    const cur = useRef<{
        x: number;
        y: number;
        s: number;
    } | null>(null);
    const writeTransform = (px: number, py: number, ps: number) => {
        const t = `translate(${px}px, ${py}px)` + (ps !== 1 ? ` scale(${ps})` : '');
        if (wrapRef.current)
            wrapRef.current.style.transform = t;
        if (blobRef.current)
            blobRef.current.style.transform = t;
    };
    useIsoLayoutEffect(() => {
        const from = cur.current;
        if (!from ||
            duration <= 0 ||
            (from.x === x && from.y === y && from.s === scale)) {
            cur.current = { x, y, s: scale };
            writeTransform(x, y, scale);
            return;
        }
        const f = { ...from };
        const ease = easingFunction(easing);
        const start = performance.now() + delay;
        let raf = 0;
        const tick = (now: number) => {
            const p = Math.min(1, Math.max(0, (now - start) / duration));
            const e = ease(p);
            const cx = f.x + (x - f.x) * e;
            const cy = f.y + (y - f.y) * e;
            const cs = f.s + (scale - f.s) * e;
            cur.current = { x: cx, y: cy, s: cs };
            writeTransform(cx, cy, cs);
            if (p < 1)
                raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [x, y, scale, duration, easing, delay]);
    return (<>
      <div ref={wrapRef} className={className} style={{
            display: 'inline-block',
            ...style,
            willChange: 'transform',
        }}>
        {children}
      </div>
      {ctx.portal &&
            box &&
            createPortal(renderBlob(box, {
                transformBox: 'fill-box',
                transformOrigin: 'center',
                willChange: 'transform',
            }, el => {
                blobRef.current = el;
                if (el) {
                    const c = cur.current ?? { x, y, s: scale };
                    el.style.transform =
                        `translate(${c.x}px, ${c.y}px)` + (c.s !== 1 ? ` scale(${c.s})` : '');
                }
            }), ctx.portal)}
    </>);
}
function renderBlob(box: BlobBox, style: CSSProperties, setRef: (el: SVGGraphicsElement | null) => void) {
    const [tl, tr, br, bl] = box.r;
    const uniform = tl === tr && tr === br && br === bl;
    if (uniform) {
        const rx = Math.max(0, Math.min(tl, Math.min(box.w, box.h) / 2));
        return (<rect ref={setRef} x={box.x} y={box.y} width={box.w} height={box.h} rx={rx} style={style}/>);
    }
    return (<path ref={setRef} d={roundedRectPath(box.x, box.y, box.w, box.h, box.r)} style={style}/>);
}
function ObservedItem({ radius, blobInset, bridgeGrow, contactBlur, effect, evolve, move, className, style, children, ctx, }: Internal) {
    const hostRef = useRef<HTMLSpanElement | null>(null);
    const blobRef = useRef<SVGRectElement | null>(null);
    const meltRef = useRef<SVGGElement | null>(null);
    const blendRef = useRef<{
        active?: boolean;
        releaseMs?: number;
        fadeMs?: number;
        strength?: number;
        sink?: number;
        seamBlur?: number;
    } | null>(null);
    const opts = typeof contactBlur === 'object' ? contactBlur : {};
    const blendBlur = opts.blur ?? 8;
    const blendWarp = opts.warp ?? 26;
    const blendPull = opts.pull ?? 4;
    const blendRange = opts.range;
    const blendZone = opts.zone;
    const blendMix = opts.mix ?? 0;
    const blendGravity = opts.gravity ?? 60;
    const blendTaper = opts.taper ?? 1;
    const blendWarpFreq = opts.warpFreq ?? 1.7;
    const blendFlowSpeed = opts.flowSpeed ?? 22;
    const blendWarpStyle = opts.warpStyle ?? 'fractalNoise';
    const blendDetail = opts.detail ?? 2;
    const blendActive = opts.active !== false;
    const blendRelease = opts.releaseMs ?? 240;
    const blendFade = opts.fadeMs;
    const blendStrength = opts.strength ?? 1;
    const blendSink = opts.sink;
    const blendSurface = opts.surface;
    const blendSeamBlur = opts.seamBlur;
    const effects = toEffects(effect);
    const dynamics = {
        evolve: effects.includes('evolve'),
        move: effects.includes('move'),
        evolveOpts: { ...EVOLVE_DEFAULTS, ...evolve },
        moveOpts: { ...MOVE_DEFAULTS, ...move },
    };
    const hasDynamics = dynamics.evolve || dynamics.move;
    const radiusKey = radius == null ? '' : JSON.stringify(radius);
    const blendKey = contactBlur
        ? `${blendBlur}/${blendWarp}/${blendPull}/${blendRange ?? 'auto'}/${blendZone ?? 'auto'}/${blendMix}/${blendGravity}/${blendTaper}/${blendWarpFreq}/${blendFlowSpeed}/${blendWarpStyle}/${blendDetail}/${blendSurface ?? 'liquid'}/${(blendSeamBlur ?? 1) > 0 ? 'seam' : 'noseam'}`
        : '';
    const effectKey = effects.join(',') +
        (dynamics.evolve ? JSON.stringify(dynamics.evolveOpts) : '') +
        (dynamics.move ? JSON.stringify(dynamics.moveOpts) : '');
    useIsoLayoutEffect(() => {
        const host = hostRef.current;
        const blob = blobRef.current;
        const target = (host?.firstElementChild as HTMLElement | null) ?? null;
        if (!target || !blob)
            return;
        const blend = contactBlur && meltRef.current
            ? {
                host: meltRef.current,
                blur: blendBlur,
                warp: blendWarp,
                pull: blendPull,
                range: blendRange,
                zone: blendZone,
                mix: blendMix,
                gravity: blendGravity,
                taper: blendTaper,
                warpFreq: blendWarpFreq,
                flowSpeed: blendFlowSpeed,
                warpStyle: blendWarpStyle,
                detail: blendDetail,
                active: blendActive,
                releaseMs: blendRelease,
                fadeMs: blendFade,
                strength: blendStrength,
                sink: blendSink,
                surface: blendSurface,
                seamBlur: blendSeamBlur,
            }
            : undefined;
        blendRef.current = blend ?? null;
        return ctx.engine.add({
            target,
            blob,
            radius: radius == null ? undefined : normalizeRadius(radius)[0],
            blobInset,
            bridgeGrow,
            blend,
            dynamics: hasDynamics ? dynamics : undefined,
        });
    }, [ctx, radiusKey, blendKey, effectKey, blobInset, bridgeGrow]);
    useEffect(() => {
        if (!blendRef.current)
            return;
        blendRef.current.active = blendActive;
        blendRef.current.releaseMs = blendRelease;
        blendRef.current.fadeMs = blendFade;
        blendRef.current.strength = blendStrength;
        blendRef.current.sink = blendSink;
        blendRef.current.seamBlur = blendSeamBlur;
        ctx.engine.wake();
    }, [ctx, blendActive, blendRelease, blendFade, blendStrength, blendSink, blendSeamBlur]);
    return (<>
      <span ref={hostRef} className={className} style={{ display: 'contents', ...style }}>
        {children}
      </span>
      {ctx.portal &&
            createPortal(<rect ref={blobRef} x={0} y={0} width={0} height={0} style={{
                    willChange: 'transform',
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                }}/>, ctx.portal)}
      {contactBlur !== undefined &&
            contactBlur !== false &&
            ctx.meltPortal &&
            createPortal(<g ref={meltRef} opacity={0}/>, ctx.meltPortal)}
    </>);
}
