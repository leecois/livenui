import { isDevelopment } from './development';
import type { CSSProperties, ReactNode } from 'react';
import type { CornerRadii } from './geometry';
import { GooeyItem, type DissolveOptions } from './GooeyItem';
import { useGooeyContext } from './context';
import { IMAGE_MELT_DEFAULTS, ImageMeltItem, type ImageMeltOptions } from './imageMelt';
import { EVOLVE_DEFAULTS, MOVE_DEFAULTS, type EvolveOptions, type MoveOptions, } from './observer';
import type { Transition } from './spring';
export type LiquidEffect = 'morph' | 'move' | 'melt' | 'bend';
export interface BendTuning {
    vertical?: number;
    horizontal?: number;
    advanced?: MoveOptions;
}
export interface MorphTuning {
    shape?: boolean;
    speed?: number;
    bounce?: number;
    contentBlur?: number;
    advanced?: {
        evolve?: EvolveOptions;
        blobInset?: number;
        bridgeGrow?: number;
    };
}
export interface MoveTuning {
    springiness?: number;
    wobble?: number;
    stretch?: number;
    trail?: number;
    advanced?: MoveOptions;
}
export interface LiquidItemProps {
    effect?: LiquidEffect;
    morph?: MorphTuning;
    move?: MoveTuning;
    bend?: BendTuning;
    melt?: ImageMeltOptions & {
        src?: string;
    };
    dissolve?: boolean | number | DissolveOptions;
    x?: number;
    y?: number;
    scale?: number;
    transition?: Transition;
    delay?: number;
    observe?: boolean;
    radius?: number | CornerRadii;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}
function zeta(bounce: number): number {
    return Math.max(0.12, 1 - 1.1 * Math.min(1, Math.max(0, bounce)));
}
function mapMorphSprings(t: MorphTuning | undefined): EvolveOptions {
    const s = Math.max(0.25, t?.speed ?? 1);
    const k = zeta(t?.bounce ?? 0.5) / zeta(0.5);
    return {
        massStiffness: EVOLVE_DEFAULTS.massStiffness * s * s,
        massDamping: EVOLVE_DEFAULTS.massDamping * s * k,
        sizeStiffness: EVOLVE_DEFAULTS.sizeStiffness * s * s,
        sizeDamping: EVOLVE_DEFAULTS.sizeDamping * s * k,
        radiusStiffness: EVOLVE_DEFAULTS.radiusStiffness * s * s,
        radiusDamping: EVOLVE_DEFAULTS.radiusDamping * s,
        cornerDuration: EVOLVE_DEFAULTS.cornerDuration / s,
        contentBlur: t?.contentBlur ?? EVOLVE_DEFAULTS.contentBlur,
    };
}
function mapDissolve(d: boolean | number): DissolveOptions {
    const k = typeof d === 'number' ? Math.min(1, Math.max(0, d)) : 1;
    return {
        warp: 26,
        blur: 8,
        mix: 0.7,
        gravity: 60,
        taper: 1,
        warpFreq: 1.7,
        flowSpeed: 22,
        detail: 2,
        zone: 18,
        range: 49,
        releaseMs: 110,
        strength: k,
    };
}
function mapMove(t: MoveTuning | undefined): MoveOptions {
    const p = Math.min(1, Math.max(0, t?.springiness ?? 0.5));
    const stiffness = MOVE_DEFAULTS.stiffness * Math.pow(10, p - 0.5);
    const damping = MOVE_DEFAULTS.damping *
        Math.sqrt(stiffness / MOVE_DEFAULTS.stiffness) *
        (zeta(t?.wobble ?? 0.5) / zeta(0.5));
    return {
        stiffness,
        damping,
        stretch: 0.5 * Math.min(1, Math.max(0, t?.stretch ?? 0.36)),
        tail: 0.8 * Math.min(1, Math.max(0, t?.trail ?? 0.575)),
        ...t?.advanced,
    };
}
function mapBend(t: BendTuning | undefined): MoveOptions {
    return {
        ...mapMove({ springiness: 1, stretch: 0, trail: 0 }),
        bend: Math.min(1, Math.max(0, t?.vertical ?? 0.6)),
        bendX: Math.min(1, Math.max(0, t?.horizontal ?? 0.35)),
        ...t?.advanced,
    };
}
function MeltItem({ melt, children, }: {
    melt?: ImageMeltOptions & {
        src?: string;
    };
    children?: ReactNode;
}) {
    const { imageMelt } = useGooeyContext();
    const { src, ...tuning } = melt ?? {};
    return (<ImageMeltItem src={src} opts={{ ...IMAGE_MELT_DEFAULTS, ...tuning }} registry={imageMelt}>
      {children}
    </ImageMeltItem>);
}
export function LiquidItem(props: LiquidItemProps) {
    const { effect = 'morph', morph, move, bend, melt, dissolve, observe, ...rest } = props;
    if (effect === 'melt') {
        return <MeltItem melt={melt}>{rest.children}</MeltItem>;
    }
    if (effect === 'bend') {
        return <GooeyItem {...rest} observe effect="move" move={mapBend(bend)}/>;
    }
    if (effect === 'move') {
        if (isDevelopment() && dissolve !== undefined && dissolve !== false) {
            console.warn('[liquid-gooey] `dissolve` is ignored with effect="move": the melt ' +
                'follows the element while the liquid lags on its spring, so the two ' +
                'would visibly disagree. Use it on a morph item.');
        }
        return <GooeyItem {...rest} observe effect="move" move={mapMove(move)}/>;
    }
    const adv = morph?.advanced;
    const shape = !!morph?.shape;
    const wantsDissolve = dissolve !== undefined && dissolve !== false;
    const contactBlur = wantsDissolve
        ? typeof dissolve === 'object'
            ? { ...mapDissolve(true), ...dissolve }
            : mapDissolve(dissolve!)
        : undefined;
    const evolve = shape ? { ...mapMorphSprings(morph), ...adv?.evolve } : undefined;
    return (<GooeyItem {...rest} observe={observe || shape || !!contactBlur || undefined} effect={shape ? 'evolve' : undefined} evolve={evolve} contactBlur={contactBlur} blobInset={adv?.blobInset} bridgeGrow={adv?.bridgeGrow}/>);
}
