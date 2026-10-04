import type { ModeKey } from '../presets';
import type { ModeDraw, ModeFrame } from './types';
import { paintFrame } from './core';
import { frameBraid } from './braid';
import { frameGlobe, frameRubik, frameWave } from './lattice';
import { frameMorph } from './morph';
import { frameOrbits } from './orbits';
import { frameRibbon } from './ribbon';
import { frameWeb } from './web';
export const MODE_FRAMES: Record<ModeKey, ModeFrame> = {
    orbits: frameOrbits,
    globe: frameGlobe,
    rubik: frameRubik,
    wave: frameWave,
    web: frameWeb,
    braid: frameBraid,
    ribbon: frameRibbon,
    ring: frameRibbon,
    morph: frameMorph
};
export const MODE_DRAWS: Record<ModeKey, ModeDraw> = Object.fromEntries(Object.entries(MODE_FRAMES).map(([key, frame]) => [
    key,
    ((ctx, size, t, dark, opts) => paintFrame(ctx, frame(size, t, opts), dark)) as ModeDraw
])) as Record<ModeKey, ModeDraw>;
