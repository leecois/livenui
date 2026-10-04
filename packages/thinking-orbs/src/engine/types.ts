import type { ModeOpts } from './profiles';
export type { Dot, Line, OrbFrame } from './core';
import type { OrbFrame } from './core';
export type ModeFrame = (size: number, t: number, opts: ModeOpts) => OrbFrame;
export type ModeDraw = (ctx: CanvasRenderingContext2D, size: number, t: number, dark: boolean, opts: ModeOpts) => void;
