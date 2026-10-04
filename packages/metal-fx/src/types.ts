import type { CSSProperties, ReactNode, HTMLAttributes, RefObject } from 'react';
import type { MaskFn } from './engine/renderer/core';
export type MetalFxVariant = 'button' | 'circle';
export type MetalFxTheme = 'dark' | 'light' | 'auto';
export type MetalFxPreset = 'chromatic' | 'silver' | 'gold';
export type MetalFxReflectionTarget = RefObject<HTMLElement | null> | {
    ref: RefObject<HTMLElement | null>;
    strength?: number;
};
export interface MetalFxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    children: ReactNode;
    variant?: MetalFxVariant;
    preset?: MetalFxPreset;
    theme?: MetalFxTheme;
    strength?: number;
    glowGain?: number;
    paused?: boolean;
    borderRadius?: number;
    normalizeHostStyles?: boolean;
    reflectionTargets?: ReadonlyArray<MetalFxReflectionTarget>;
    disableGlow?: boolean;
    innerShadow?: boolean | {
        offsetY?: number;
        blur?: number;
        alpha?: number;
        color?: string;
    };
    shaderScale?: number;
    ringCssPx?: number;
    scale?: number;
    mask?: MaskFn;
    glowMode?: 'mask' | 'ring';
    className?: string;
    style?: CSSProperties;
}
