import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { CycleEvent } from './engine';
import type { PresetName } from './presets';
export type ImageGenerationTheme = 'auto' | 'dark' | 'light';
export type ImageGenerationPreset = PresetName;
export type ImageGenerationCycleEvent = CycleEvent;
export interface ImageGenerationHandle {
    element: HTMLDivElement | null;
    triggerReveal: (opts?: {
        hold?: 'auto' | 'manual';
    }) => void;
    triggerHide: () => void;
    triggerRegenerate: (opts?: {
        durationMs?: number;
        tintFromImage?: boolean;
        autoReveal?: boolean;
    }) => void;
    isImageActive: () => boolean;
}
export interface ImageGenerationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    children: ReactNode;
    preset?: ImageGenerationPreset;
    theme?: ImageGenerationTheme;
    strength?: number;
    speed?: number;
    pixelScale?: number;
    cardBg?: string;
    colors?: (string | null | undefined)[];
    images?: string | string[];
    autoReveal?: boolean;
    revealDelayRange?: [
        number,
        number
    ];
    revealInitialDelay?: number | [
        number,
        number
    ];
    revealHoldMs?: number | [
        number,
        number
    ];
    revealFadeOutMs?: number;
    borderRadius?: number;
    paused?: boolean;
    fragmentShader?: string;
    onCycle?: (event: ImageGenerationCycleEvent) => void;
    excludeSrcs?: () => string[] | Set<string> | null | undefined;
    className?: string;
    style?: CSSProperties;
}
