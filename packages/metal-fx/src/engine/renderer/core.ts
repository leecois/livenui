import { CANONICAL_GL_SIZE, GL_DPR_CAP } from '../perfConfig';
import { PRESETS, type PresetMode, type PresetName, type PresetTheme } from '../presets';
import { compileShader, FRAG_SHADER_SRC, linkProgram, VERT_SHADER_SRC } from '../shaders';
export const CANONICAL_PILL_W = 140;
export const CANONICAL_PILL_H = 40;
export const PILL_SHADER_SCALE = 1.6;
export const CIRCLE_SHADER_SCALE = 1.3;
export interface ShaderRGB {
    r: number;
    g: number;
    b: number;
}
export type DeformFn = (x: number, y: number, out: {
    x: number;
    y: number;
}) => void;
export interface DeformLayers {
    fill?: string | null;
    rim?: {
        inset: number;
        width: number;
        color: string;
    } | null;
    hairline?: {
        inset: number;
        width: number;
        color: string;
    } | null;
}
export type MaskFn = (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number) => void;
export interface MetalFxInstance {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    cssWidth: number;
    cssHeight: number;
    cornerRadius: number;
    kind: 'pill' | 'circle';
    ringCssPx: number;
    shaderScale: number;
    opacityMul: number;
    glowGain: number;
    visible: boolean;
    paused: boolean;
    everCopied: boolean;
    frozen: HTMLCanvasElement | null;
    preset?: PresetMode;
    shaderFrame?: HTMLCanvasElement;
    glowPixels?: Uint8Array;
    dpr: number;
    scale: number;
    onAfterFrame?: () => void;
    onComposite?: () => void;
    onFirstCopy?: () => void;
    mask: MaskFn | null;
    rawCanvas: HTMLCanvasElement | null;
    wantRaw: boolean;
    ringCanvas: HTMLCanvasElement | null;
    wantRing: boolean;
    deform: DeformFn | null;
    deformLayers: DeformLayers | null;
    overscan: number;
    cursorLight: {
        x: number;
        y: number;
        w: number;
    } | null;
    glowFast: boolean;
}
export interface SharedRenderer {
    glCanvas: HTMLCanvasElement | OffscreenCanvas;
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    buffer: WebGLBuffer;
    uniforms: Record<string, WebGLUniformLocation | null>;
    dummyTexture: WebGLTexture | null;
    preset: PresetMode;
    presetDirty: boolean;
    contextLost: boolean;
    useOffscreen: boolean;
    frameBitmap: ImageBitmap | null;
    startMs: number;
    pausedMs: number;
    pausedAtMs: number | null;
    rafId: number;
    dpr: number;
    instances: Set<MetalFxInstance>;
    frameCount: number;
    glowQueue: MetalFxInstance[];
    glowIdx: number;
    glowSkip: number;
    glowPixels: Uint8Array;
    glowPixelsW: number;
    glowPixelsH: number;
}
export let SHARED: SharedRenderer | null = null;
let _supported: boolean | null = null;
export function isMetalFxSupported(): boolean {
    if (_supported !== null)
        return _supported;
    if (typeof document === 'undefined')
        return (_supported = false);
    try {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl2') as WebGL2RenderingContext | null;
        _supported = !!gl;
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
    }
    catch {
        _supported = false;
    }
    return _supported;
}
let _onContextRestored: (() => void) | null = null;
export function setContextRestoredCallback(cb: (() => void) | null): void {
    _onContextRestored = cb;
}
const UNIFORM_NAMES = [
    'u_resolution', 'u_time', 'u_pixelRatio',
    'u_colorBack', 'u_colorTint',
    'u_repetition', 'u_softness', 'u_shiftRed', 'u_shiftBlue',
    'u_distortion', 'u_contour', 'u_angle', 'u_shape', 'u_isImage', 'u_image',
    'u_originX', 'u_originY', 'u_worldWidth', 'u_worldHeight',
    'u_fit', 'u_scale', 'u_rotation', 'u_offsetX', 'u_offsetY',
    'u_imageAspectRatio',
];
function buildGLPipeline(gl: WebGL2RenderingContext): {
    program: WebGLProgram;
    buffer: WebGLBuffer;
    uniforms: Record<string, WebGLUniformLocation | null>;
    dummyTexture: WebGLTexture | null;
} {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SHADER_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER_SRC);
    const program = linkProgram(gl, vert, frag);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    if (!buffer)
        throw new Error('metal-fx: gl.createBuffer returned null');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const n of UNIFORM_NAMES)
        uniforms[n] = gl.getUniformLocation(program, n);
    const dummyTexture = gl.createTexture();
    if (dummyTexture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dummyTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (uniforms.u_image)
            gl.uniform1i(uniforms.u_image, 0);
    }
    return { program, buffer, uniforms, dummyTexture };
}
export function ensureSharedRenderer(): SharedRenderer {
    if (SHARED)
        return SHARED;
    const dpr = Math.min(GL_DPR_CAP, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    const size = Math.round(CANONICAL_GL_SIZE * dpr);
    const useOffscreen = typeof OffscreenCanvas !== 'undefined';
    let glCanvas: HTMLCanvasElement | OffscreenCanvas;
    let gl: WebGL2RenderingContext | null;
    if (useOffscreen) {
        glCanvas = new OffscreenCanvas(size, size);
        gl = glCanvas.getContext('webgl2', {
            alpha: true, premultipliedAlpha: true, antialias: false,
        }) as WebGL2RenderingContext | null;
    }
    else {
        const htmlCanvas = document.createElement('canvas');
        htmlCanvas.width = size;
        htmlCanvas.height = size;
        gl = htmlCanvas.getContext('webgl2', {
            alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true,
        }) as WebGL2RenderingContext | null;
        glCanvas = htmlCanvas;
    }
    if (!gl)
        throw new Error('metal-fx: WebGL2 not supported');
    const { program, buffer, uniforms, dummyTexture } = buildGLPipeline(gl);
    const onContextLost = (e: Event) => { e.preventDefault(); if (SHARED?.glCanvas === glCanvas)
        SHARED.contextLost = true; };
    const onContextRestored = () => {
        if (!SHARED || SHARED.glCanvas !== glCanvas)
            return;
        const rebuilt = buildGLPipeline(SHARED.gl);
        SHARED.program = rebuilt.program;
        SHARED.buffer = rebuilt.buffer;
        SHARED.uniforms = rebuilt.uniforms;
        SHARED.dummyTexture = rebuilt.dummyTexture;
        SHARED.presetDirty = true;
        SHARED.contextLost = false;
        _onContextRestored?.();
    };
    glCanvas.addEventListener('webglcontextlost', onContextLost as EventListener, false);
    glCanvas.addEventListener('webglcontextrestored', onContextRestored as EventListener, false);
    SHARED = {
        glCanvas, gl, program, buffer, uniforms, dummyTexture,
        preset: PRESETS.chromatic.modes.dark, presetDirty: true,
        contextLost: false, useOffscreen, frameBitmap: null,
        startMs: performance.now(), pausedMs: 0, pausedAtMs: null,
        rafId: 0, dpr, instances: new Set(), frameCount: 0,
        glowQueue: [], glowIdx: 0, glowSkip: 0,
        glowPixels: new Uint8Array(size * size * 4),
        glowPixelsW: size, glowPixelsH: size,
    };
    return SHARED;
}
export function teardownSharedRenderer(): void {
    if (!SHARED)
        return;
    const { gl, program, buffer, frameBitmap, dummyTexture } = SHARED;
    try {
        frameBitmap?.close();
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        if (dummyTexture)
            gl.deleteTexture(dummyTexture);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    catch { }
    SHARED = null;
}
