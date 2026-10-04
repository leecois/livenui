import type { CSSProperties, CanvasHTMLAttributes } from 'react';
import type { ModeOpts } from './engine/profiles';
import type { ModeFrame } from './engine/types';
import type { GravityOptions } from './gravity';
export type OrbState = 'working' | 'searching' | 'solving' | 'listening' | 'connecting' | 'weaving' | 'composing' | 'breathing' | 'shaping';
export type OrbSize = 64 | 32 | 20;
export type OrbTheme = 'auto' | 'dark' | 'light';
export interface ThinkingOrbProps extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'style'> {
    state?: OrbState;
    size?: OrbSize;
    theme?: OrbTheme;
    speed?: number;
    paused?: boolean;
    color?: string;
    dots?: number;
    dotSize?: number;
    opts?: ModeOpts;
    frame?: ModeFrame;
    gravity?: boolean | GravityOptions;
    style?: CSSProperties;
}
