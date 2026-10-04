export { ThinkingOrb } from './ThinkingOrb';
export type { ThinkingOrbProps, OrbState, OrbSize, OrbTheme } from './types';
export { resolvePreset, STATE_TO_MODE, type ModeKey, type Resolved } from './presets';
export { MODE_DRAWS, MODE_FRAMES } from './engine/registry';
export { countDots, scaleCounts, scaleRadii } from './engine/profiles';
export { finalizeFrame, makeProj, radiusScale, fibDir, hashD, vnoise, lerp, frac, angleDelta, } from './engine/core';
export type { ModeFrame, ModeOpts, OrbFrame, Dot, Line } from './engine/index';
export { attachGravity, setGravitySprite, setGravityConfig, getGravityConfig, getGravityStatus, resetGravity, GRAVITY_DEFAULTS } from './gravity';
export type { GravityOptions, CursorSprite } from './gravity';
