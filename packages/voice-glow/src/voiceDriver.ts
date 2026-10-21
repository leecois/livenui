import { acquireAnalyser } from './audio';
import { voiceLobes, LOBE_SPAN } from './styles';
import { createSurfaceState, drawSurface, type SurfaceState } from './surface';
export interface VoiceDriverConfig {
    id: string;
    sensitivity: number;
    threshold: number;
    attack: number;
    release: number;
    idle: number;
    breatheDuration: number;
    reach: number;
    spread: number;
    bands: boolean;
    flow: number;
    lobeSpacing: number;
    bend: number;
    bandStrength: number;
    bandWidth: number;
    bandPosition: number;
    bandCurve: number;
    bandSpread: number;
    bandSkew: number;
    bandOffset: number;
    bandTail: number;
    bandTailPosition: number;
    bandTailCurve: number;
    bandTailOverflow: number;
    bandAberration: number;
    rangeWidth: number;
    rangeHeight: number;
    theme: 'dark' | 'light';
    bandColors: {
        core: string;
        above: string;
        mid: string;
        below: string;
    };
    distortion: number;
    coreLight: number;
    scale: number;
    radius: number;
    processing: boolean;
    processingDuration: number;
    processingEase: number;
    processingTravel: number;
    processingCurve: number;
    cornerFollow: number;
    processingLevel: number;
    hueRange: number;
    hueDuration: number;
    staticColors: boolean;
    reducedMotion: boolean;
    paused: boolean;
    look: 'glow' | 'dots' | 'lines';
    dotSize: number;
    dotGap: number;
    dotShape: 'round' | 'square';
    lineWidth: number;
    lineGap: number;
    linePattern: 'rows' | 'columns' | 'grid';
    seeThrough: boolean;
    texture: number;
    gravity: number;
    surfaceHeight: number;
    surfaceCurve: number;
    surfaceTail: number;
    surfaceTailPosition: number;
    surfaceTailCurve: number;
    surfaceFade: number;
    layers: {
        glowWidth: number;
        glowHeight: number;
        innerScale: number;
        innerHeight: number;
        bloomScale: number;
        bloomHeight: number;
        strokeScale: number;
        softness: number;
        coreSize: number;
        innerOpacity: number;
        bloomOpacity: number;
        strokeOpacity: number;
        brightness: number;
    };
}
export interface VoiceSource {
    stream?: MediaStream | null;
    getLevel?: () => number;
}
interface VoiceState {
    level: number;
    bands: [
        number,
        number,
        number
    ];
    phase: number;
    scanA: number;
    scanT: number;
    t: number;
    lastTs: number;
    warp: number;
    drift: number;
    fast: number;
    fastBands: [
        number,
        number,
        number
    ];
}
interface VoiceInstance {
    el: HTMLElement;
    config: VoiceDriverConfig;
    source: VoiceSource;
    onLevel?: (level: number) => void;
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    haloCanvas: HTMLCanvasElement | null;
    haloCtx: CanvasRenderingContext2D | null;
    displace: SVGFEDisplacementMapElement | null;
    noiseShift: SVGFEOffsetElement | null;
    filter: SVGFilterElement | null;
    filterTop: number;
    analyser: AnalyserNode | null;
    releaseAnalyser: (() => void) | null;
    time: Float32Array<ArrayBuffer> | null;
    freq: Uint8Array<ArrayBuffer> | null;
    s: VoiceState;
    paintedConfig: VoiceDriverConfig | null;
    cssBlur: string | null;
    warpOff: boolean;
    surface: SurfaceState | null;
}
const stateByElement = new WeakMap<HTMLElement, VoiceState>();
function stateFor(el: HTMLElement): VoiceState {
    let s = stateByElement.get(el);
    if (!s) {
        s = { level: 0, bands: [0, 0, 0], phase: 0, scanA: 0, scanT: 0, t: 0, lastTs: 0, warp: 1, drift: 0, fast: 0, fastBands: [0, 0, 0] };
        stateByElement.set(el, s);
    }
    return s;
}
const instances = new Set<VoiceInstance>();
const surfaceLobeX = new Float32Array(voiceLobes.length);
const surfaceLobeL = new Float32Array(voiceLobes.length);
let rafId: number | null = null;
let lastFrame = 0;
const FRAME_INTERVAL = 1000 / 60 - 2;
const PACE_SLOW_GAP = 22;
const PACE_SLOW_FOR = 500;
const PACE_PROBE_EVERY = 4000;
let lastRaf = 0;
let paceHalf = false;
let paceSkip = false;
let slowSince = 0;
let probeAt = 0;
const TWO_PI = Math.PI * 2;
const BASE_GAIN = 5;
const BAND_GAIN = 1.7;
const BANDS: ReadonlyArray<readonly [
    number,
    number
]> = [
    [80, 300],
    [300, 2000],
    [2000, 6000],
];
function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
}
function wrapX(x: number, span: number): number {
    const half = span / 2;
    return ((((x + half) % span) + span) % span) - half;
}
function edgeEnvelope(x: number, span: number): number {
    const t = x / (span / 2 + 4);
    return Math.max(0, 1 - t * t);
}
function shape(raw: number, threshold: number): number {
    if (raw <= threshold)
        return 0;
    const t = (raw - threshold) / Math.max(0.001, 1 - threshold);
    return clamp01((1 - Math.exp(-3 * t)) / (1 - Math.exp(-3)));
}
function follow(prev: number, target: number, dt: number, attack: number, release: number): number {
    const tau = target > prev ? attack : release;
    const a = 1 - Math.exp(-dt / Math.max(0.001, tau));
    return prev + (target - prev) * a;
}
const BAND_DPR_MAX = 2;
const WARP_OUT_TAU = 0.06;
const WARP_IN_TAU = 0.35;
const WARP_OFF_BELOW = 0.03;
const FAST_RELEASE = 0.03;
const FILTER_REGION_OK = !(typeof navigator !== 'undefined' &&
    /AppleWebKit/.test(navigator.userAgent) &&
    !/Chrome\/|Chromium\/|Edg\/|OPR\//.test(navigator.userAgent));
const FILTER_TOP_STEP = 0.05;
const FILTER_TOP_MARGIN = 6;
const FILTER_BOTTOM_MARGIN = 12;
const FILTER_BOTTOM_FRACTION = 0.1;
const FILTER_SIDE = 0.1;
const CEILING_HALF_WIDTH = 170;
const CEILING_HEIGHT = 64;
const BAND_SAMPLES = 56;
function bell(t: number, p: number, sigma: number, skew: number): number {
    const side = t < 0 ? 1 - skew : 1 + skew;
    const s = Math.max(0.05, sigma * side);
    const v = Math.exp(-Math.pow(Math.abs(t) / s, p));
    const tail = Math.exp(-Math.pow(1 / s, p));
    return Math.max(0, (v - tail) / (1 - tail));
}
function tailLift(dist: number, edge: number, lift: number, position: number, curve: number): number {
    if (lift <= 0 || edge <= 0)
        return 0;
    const start = edge * Math.max(0, Math.min(0.98, position));
    if (dist <= start)
        return 0;
    const u = Math.min(1, (dist - start) / Math.max(1, edge - start));
    return lift * Math.pow(u, Math.max(0.5, curve));
}
interface BandFrame {
    cx: number;
    w: number;
    h: number;
    mw: number;
    lift: number;
    strength: number;
    level: number;
    corner: number;
}
function paintedRadius(radius: number, cw: number, ch: number): number {
    return Math.max(0, Math.min(radius, cw / 2, ch / 2));
}
function cornerLift(x: number, cw: number, radius: number, influence = 0): number {
    if (radius <= 0)
        return 0;
    const d = Math.min(x, cw - x) - influence;
    if (d >= radius)
        return 0;
    if (d <= 0)
        return radius;
    const dx = radius - d;
    return radius - Math.sqrt(Math.max(0, radius * radius - dx * dx));
}
function bandPoints(config: VoiceDriverConfig, f: BandFrame, cw: number, ch: number): Array<[
    number,
    number
]> {
    const centre = cw / 2 + f.cx * f.w;
    const half = CEILING_HALF_WIDTH * config.rangeWidth * f.w * f.mw;
    const apexCap = ch * 0.82 * Math.min(1, config.scale);
    const apex = Math.min(apexCap, (CEILING_HEIGHT * config.rangeHeight * f.h + f.lift) * config.bandPosition);
    const base = ch - config.bandOffset;
    const tailT = Math.min(1, f.corner * 4);
    const tail = config.bandTail * (1 - tailT * tailT * (3 - 2 * tailT));
    const withTail = tail > 0.001;
    const over = withTail ? config.bandTailOverflow : 0;
    const x0 = withTail ? -over : centre - half;
    const x1 = withTail ? cw + over : centre + half;
    const pts: Array<[
        number,
        number
    ]> = [];
    for (let i = 0; i <= BAND_SAMPLES; i++) {
        const x = x0 + ((x1 - x0) * i) / BAND_SAMPLES;
        const t = Math.max(-1, Math.min(1, (x - centre) / Math.max(1, half)));
        const edge = (x < centre ? centre : cw - centre) + over;
        const y = bell(t, config.bandCurve, config.bandSpread, config.bandSkew) +
            tailLift(Math.abs(x - centre), edge, tail, config.bandTailPosition, config.bandTailCurve);
        const arc = f.corner > 0 ? cornerLift(x, cw, paintedRadius(config.radius, cw, ch)) * f.corner : 0;
        pts.push([x, base - apex * y - arc]);
    }
    return pts;
}
function writeClips(el: HTMLElement, id: string, pts: Array<[
    number,
    number
]>, cw: number, ch: number): void {
    for (const [suffix, k] of [['', 1], ['-z', 0.5]] as const) {
        const px = (v: number) => (v * k).toFixed(1) + 'px';
        const line = pts.map(([x, y]) => `${px(x)} ${px(y)}`);
        const below = `polygon(0 ${px(ch)}, ${line.join(', ')}, ${px(cw)} ${px(ch)})`;
        const above = `polygon(0 0, ${px(cw)} 0, ${px(cw)} ${px(ch)}, ${line.slice().reverse().join(', ')}, 0 ${px(ch)})`;
        el.style.setProperty(`--vb-clip-below${suffix}-${id}`, below);
        el.style.setProperty(`--vb-clip-above${suffix}-${id}`, above);
    }
}
function fitFilterRegion(inst: VoiceInstance, pts: Array<[
    number,
    number
]>, ch: number): void {
    let minY = ch;
    for (let i = 0; i < pts.length; i++)
        if (pts[i][1] < minY)
            minY = pts[i][1];
    const top = Math.max(0, Math.min(0.9, Math.floor((minY - FILTER_TOP_MARGIN) / ch / FILTER_TOP_STEP) * FILTER_TOP_STEP));
    if (top === inst.filterTop)
        return;
    inst.filterTop = top;
    const bottom = 1 + Math.max(FILTER_BOTTOM_FRACTION, FILTER_BOTTOM_MARGIN / ch);
    const f = inst.filter as SVGFilterElement;
    f.setAttribute('x', `${-FILTER_SIDE * 100}%`);
    f.setAttribute('width', `${(1 + 2 * FILTER_SIDE) * 100}%`);
    f.setAttribute('y', `${(top * 100).toFixed(0)}%`);
    f.setAttribute('height', `${((bottom - top) * 100).toFixed(1)}%`);
}
function drawBand(inst: VoiceInstance, f: BandFrame, pts: Array<[
    number,
    number
]>): void {
    const { canvas, ctx, el, config } = inst;
    if (!canvas || !ctx)
        return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (!cw || !ch)
        return;
    const dpr = Math.min(BAND_DPR_MAX, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const pw = Math.round(cw * dpr);
    const ph = Math.round(ch * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const haloCanvas = inst.haloCanvas;
    const haloCtx = inst.haloCtx;
    if (haloCanvas && haloCtx) {
        if (haloCanvas.width !== pw || haloCanvas.height !== ph) {
            haloCanvas.width = pw;
            haloCanvas.height = ph;
        }
        haloCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        haloCtx.clearRect(0, 0, cw, ch);
    }
    const alpha = Math.min(1, 0.6 * config.bandStrength * f.strength);
    if (alpha < 0.005 || config.bandWidth <= 0)
        return;
    const isDark = config.theme === 'dark';
    const bw = config.bandWidth * (1 + 0.35 * f.level);
    const split = config.bandAberration * (0.35 + 0.65 * f.level);
    const dy = (4 + 12 * split) * config.scale;
    const dx = 4 * split * config.scale;
    const trace = (ox: number, oy: number) => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0] + ox, pts[0][1] + oy);
        for (let i = 1; i < pts.length; i++)
            ctx.lineTo(pts[i][0] + ox, pts[i][1] + oy);
    };
    const colours = { r: config.bandColors.above, g: config.bandColors.mid, c: config.bandColors.core, b: config.bandColors.below };
    const base = (isDark ? 0.42 : 0.4) * alpha;
    const thickness = 14 * bw;
    const blurCss = (3.5 * config.bandWidth) / 2;
    const blurPx = blurCss * dpr;
    const canBlur: boolean = typeof (ctx as {
        filter?: unknown;
    }).filter === 'string';
    const cssBlur = canBlur ? '0px' : `${blurCss.toFixed(2)}px`;
    if (inst.cssBlur !== cssBlur) {
        el.style.setProperty(`--vb-band-blur-${config.id}`, cssBlur);
        el.style.setProperty(`--vb-band-halo-blur-${config.id}`, canBlur ? '0px' : `${(blurCss * 3).toFixed(2)}px`);
        inst.cssBlur = cssBlur;
    }
    const ramp: ReadonlyArray<readonly [
        number,
        number
    ]> = [
        [1, 0.16],
        [0.72, 0.2],
        [0.46, 0.26],
        [0.22, 0.34],
    ];
    type Ridge = {
        rgb: string;
        a: number;
        ox: number;
        oy: number;
    };
    const ridges: Ridge[] = [
        { rgb: colours.r, a: 1, ox: dx, oy: -dy },
        { rgb: colours.g, a: 0.55, ox: dx * 0.35, oy: -dy * 0.35 },
        { rgb: colours.b, a: 1, ox: -dx, oy: dy },
        { rgb: colours.c, a: 0.9, ox: 0, oy: 0 },
    ];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    const x0 = pts[0][0];
    const x1 = pts[pts.length - 1][0];
    const endsFaded = (rgb: string, a: number) => {
        const grad = ctx.createLinearGradient(x0, 0, x1, 0);
        const fade = config.bandTail > 0 ? 0.015 : 0.18;
        grad.addColorStop(0, `rgba(${rgb}, 0)`);
        grad.addColorStop(fade, `rgba(${rgb}, ${a.toFixed(3)})`);
        grad.addColorStop(1 - fade, `rgba(${rgb}, ${a.toFixed(3)})`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        return grad;
    };
    const hc = !canBlur && haloCtx ? haloCtx : ctx;
    if (canBlur)
        ctx.filter = `blur(${(blurPx * 3).toFixed(1)}px)`;
    hc.lineCap = 'round';
    hc.lineJoin = 'round';
    hc.strokeStyle = endsFaded(colours.c, base * 0.3);
    hc.lineWidth = thickness * 2.2;
    hc.beginPath();
    hc.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++)
        hc.lineTo(pts[i][0], pts[i][1]);
    hc.stroke();
    if (canBlur)
        ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
    for (const ridge of ridges) {
        for (const [widthMul, alphaMul] of ramp) {
            ctx.strokeStyle = endsFaded(ridge.rgb, base * ridge.a * alphaMul);
            ctx.lineWidth = Math.max(0.6, thickness * widthMul);
            trace(ridge.ox, ridge.oy);
            ctx.stroke();
        }
    }
    if (canBlur)
        ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
}
function pingPong(phase: number): number {
    return (1 - Math.cos(TWO_PI * phase)) / 2;
}
function readAnalyser(inst: VoiceInstance, out: {
    level: number;
    bands: [
        number,
        number,
        number
    ];
}): void {
    const analyser = inst.analyser!;
    const time = inst.time!;
    const freq = inst.freq!;
    analyser.getFloatTimeDomainData(time);
    let sum = 0;
    for (let i = 0; i < time.length; i++)
        sum += time[i] * time[i];
    out.level = Math.sqrt(sum / time.length) * BASE_GAIN * inst.config.sensitivity;
    analyser.getByteFrequencyData(freq);
    const binHz = analyser.context.sampleRate / analyser.fftSize;
    for (let b = 0; b < 3; b++) {
        const [lo, hi] = BANDS[b];
        const from = Math.max(0, Math.floor(lo / binHz));
        const to = Math.min(freq.length - 1, Math.ceil(hi / binHz));
        let acc = 0;
        for (let i = from; i <= to; i++)
            acc += freq[i];
        const avg = to >= from ? acc / (to - from + 1) / 255 : 0;
        out.bands[b] = avg * BAND_GAIN * inst.config.sensitivity;
    }
}
const scratch = { level: 0, bands: [0, 0, 0] as [
        number,
        number,
        number
    ] };
function frame(ts: number): void {
    rafId = requestAnimationFrame(frame);
    const gap = lastRaf ? ts - lastRaf : 0;
    lastRaf = ts;
    if (paceHalf) {
        paceSkip = !paceSkip;
        if (paceSkip)
            return;
        if (ts >= probeAt) {
            paceHalf = false;
            slowSince = 0;
        }
    }
    else if (gap > PACE_SLOW_GAP) {
        if (!slowSince)
            slowSince = ts;
        else if (ts - slowSince > PACE_SLOW_FOR) {
            paceHalf = true;
            paceSkip = false;
            probeAt = ts + PACE_PROBE_EVERY;
        }
    }
    else {
        slowSince = 0;
    }
    if (ts - lastFrame < FRAME_INTERVAL)
        return;
    lastFrame = ts;
    instances.forEach((inst) => {
        const { el, config, source, s } = inst;
        const paused = config.paused;
        if (paused && inst.paintedConfig === config)
            return;
        const dt = paused ? 0 : s.lastTs ? Math.min(0.05, (ts - s.lastTs) / 1000) : 1 / 60;
        s.lastTs = ts;
        s.t += dt;
        const tSec = s.t;
        if (paused) {
        }
        else if (inst.analyser) {
            readAnalyser(inst, scratch);
        }
        else {
            const raw = source.getLevel ? clamp01(source.getLevel()) : 0;
            scratch.level = raw;
            scratch.bands[0] = raw;
            scratch.bands[1] = raw * (0.72 + 0.28 * Math.sin(tSec * 9.1));
            scratch.bands[2] = raw * (0.6 + 0.4 * Math.sin(tSec * 13.7 + 2));
        }
        const target = shape(scratch.level, config.threshold);
        s.level = follow(s.level, target, dt, config.attack, config.release);
        for (let b = 0; b < 3; b++) {
            const bt = shape(scratch.bands[b], config.threshold * 0.6);
            s.bands[b] = follow(s.bands[b], bt, dt, config.attack, config.release * 1.15);
            if (inst.surface)
                s.fastBands[b] = follow(s.fastBands[b], bt, dt, config.attack * 0.6, FAST_RELEASE);
        }
        if (inst.surface)
            s.fast = follow(s.fast, target, dt, config.attack * 0.6, FAST_RELEASE);
        const span = LOBE_SPAN * config.lobeSpacing;
        const fresh = config.processing && s.scanA < 0.001 && s.scanT === 0;
        if (fresh)
            s.scanT = Math.max(0.05, config.processingDuration) / 2;
        const ease = Math.max(0.05, config.processingEase);
        s.scanA = follow(s.scanA, config.processing ? 1 : 0, dt, ease * 0.9, ease * 0.8);
        if (config.processing)
            s.scanT += dt;
        else if (s.scanA < 0.001)
            s.scanT = 0;
        const morph = s.scanA * s.scanA * (3 - 2 * s.scanA);
        const cw = el.clientWidth;
        const ch = el.clientHeight;
        const travel = (span / 2) * config.processingTravel;
        const passes = s.scanT / Math.max(0.05, config.processingDuration);
        const passIndex = Math.floor(passes);
        const u = passes - passIndex;
        const k = Math.max(1, config.processingCurve);
        const eased = u < 0.5 ? 0.5 * Math.pow(2 * u, k) : 1 - 0.5 * Math.pow(2 - 2 * u, k);
        const pass = config.reducedMotion ? 0 : passIndex % 2 === 0 ? 2 * eased - 1 : 1 - 2 * eased;
        const cx = morph * travel * pass;
        const gather = 1 - morph * 0.6;
        const maskWidth = 1 - morph * 0.45;
        const passWidth = 1 + morph * 0.3 * (1 - pass * pass);
        const breathe = config.reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin((TWO_PI * tSec) / config.breatheDuration);
        const voiced = s.level + (1 - s.level) * config.idle * breathe;
        const heldT = Math.max(0, Math.min(1, (morph - 0.25) / 0.75));
        const held = heldT * heldT * (3 - 2 * heldT);
        const eff = Math.max(voiced, config.processingLevel * held);
        const glow = 0.15 + 0.85 * eff;
        const h = 0.5 + config.reach * eff;
        const w = (0.85 + config.spread * eff) * passWidth;
        if (config.flow !== 0 && !config.reducedMotion) {
            s.phase = (((s.phase + config.flow * eff * dt) % span) + span) % span;
            s.drift += config.flow * eff * dt;
        }
        if (inst.surface) {
            for (let i = 0; i < voiceLobes.length; i++) {
                const lobe = voiceLobes[i];
                const x = wrapX(lobe.x * config.lobeSpacing + s.phase, span);
                surfaceLobeX[i] = cw / 2 + (cx + x * gather) * w;
                const bandAmp = config.bands ? 0.6 + 0.7 * s.fastBands[lobe.band] : 1;
                surfaceLobeL[i] = (bandAmp + (1 - bandAmp) * morph) * edgeEnvelope(x, span);
            }
            const fastVoiced = s.fast + (1 - s.fast) * config.idle * breathe;
            if (cw && ch) {
                drawSurface(inst.surface, config, {
                    cw,
                    ch,
                    lobeX: surfaceLobeX,
                    lobeL: surfaceLobeL,
                    w,
                    lift: Math.max(fastVoiced, config.processingLevel * held),
                    glow,
                    t: tSec,
                    dt,
                    drift: s.drift,
                });
            }
            el.style.setProperty(`--vb-level-${config.id}`, s.level.toFixed(3));
            el.style.setProperty(`--vb-glow-${config.id}`, glow.toFixed(3));
            inst.onLevel?.(s.level);
            inst.paintedConfig = config;
            return;
        }
        el.style.setProperty(`--vb-level-${config.id}`, s.level.toFixed(3));
        el.style.setProperty(`--vb-cx-${config.id}`, `${cx.toFixed(1)}px`);
        el.style.setProperty(`--vb-mw-${config.id}`, maskWidth.toFixed(3));
        const lift = config.bend * eff;
        el.style.setProperty(`--vb-bh-${config.id}`, `${Math.max(0, lift).toFixed(1)}px`);
        const bendA = config.bend > 0 ? Math.min(1, lift / config.bend) : 0;
        el.style.setProperty(`--vb-bendA-${config.id}`, bendA.toFixed(3));
        const frame: BandFrame = { cx, w, h, mw: maskWidth, lift, strength: bendA, level: s.level, corner: morph };
        const beamAbsX = cw / 2 + cx * w;
        const lobeReach = 30 * config.scale * w;
        const arcRadius = paintedRadius(config.radius, cw, ch);
        const cornerBlend = morph * config.cornerFollow;
        el.style.setProperty(`--vb-cy-${config.id}`, `${(-cornerLift(beamAbsX, cw, arcRadius, lobeReach * 1.4) * cornerBlend).toFixed(1)}px`);
        s.warp = follow(s.warp, config.processing ? 0 : 1, dt, WARP_IN_TAU, WARP_OUT_TAU);
        const warp = s.warp;
        const warpOff = inst.displace != null && warp < WARP_OFF_BELOW;
        if (warpOff !== inst.warpOff) {
            inst.warpOff = warpOff;
            if (warpOff)
                el.setAttribute('data-voice-warp', 'off');
            else
                el.removeAttribute('data-voice-warp');
        }
        if (cw && ch && (inst.ctx || inst.displace)) {
            const pts = bandPoints(config, frame, cw, ch);
            if ((inst.displace && !warpOff) || config.coreLight > 0)
                writeClips(el, config.id, pts, cw, ch);
            if (inst.filter && !warpOff && FILTER_REGION_OK)
                fitFilterRegion(inst, pts, ch);
            if (inst.ctx)
                drawBand(inst, frame, pts);
        }
        if (inst.displace && !warpOff) {
            const amount = config.reducedMotion ? 0 : config.distortion * 120 * config.scale * (0.15 + 0.85 * eff) * warp;
            inst.displace.scale.baseVal = amount;
            if (inst.noiseShift) {
                inst.noiseShift.dx.baseVal = 8 * config.scale * Math.sin(tSec * 0.9);
                inst.noiseShift.dy.baseVal = 4 * config.scale * Math.sin(tSec * 0.6 + 1.3);
            }
        }
        el.style.setProperty(`--vb-glow-${config.id}`, glow.toFixed(3));
        el.style.setProperty(`--vb-h-${config.id}`, h.toFixed(3));
        el.style.setProperty(`--vb-w-${config.id}`, w.toFixed(3));
        for (let i = 0; i < voiceLobes.length; i++) {
            const lobe = voiceLobes[i];
            const x = wrapX(lobe.x * config.lobeSpacing + s.phase, span);
            const bandLift = config.bands ? 0.6 + 0.7 * s.bands[lobe.band] : 1;
            el.style.setProperty(`--vb-x${i}-${config.id}`, `${(x * gather).toFixed(1)}px`);
            el.style.setProperty(`--vb-l${i}-${config.id}`, (bandLift * edgeEnvelope(x, span)).toFixed(3));
            const lobeAbsX = cw / 2 + (cx + x * gather) * w;
            el.style.setProperty(`--vb-y${i}-${config.id}`, `${(-cornerLift(lobeAbsX, cw, arcRadius, lobeReach) * cornerBlend).toFixed(1)}px`);
        }
        const hue = config.staticColors || config.reducedMotion || config.hueRange === 0
            ? 0
            : -config.hueRange + 2 * config.hueRange * pingPong(tSec / config.hueDuration);
        el.style.setProperty(`--vb-hue-${config.id}`, `${hue.toFixed(2)}deg`);
        inst.onLevel?.(s.level);
        inst.paintedConfig = config;
    });
    stopLoopIfIdle();
}
function startLoop(): void {
    if (rafId == null) {
        lastFrame = 0;
        lastRaf = 0;
        slowSince = 0;
        rafId = requestAnimationFrame(frame);
    }
}
function stopLoopIfIdle(): void {
    if (rafId == null)
        return;
    for (const inst of instances) {
        if (!inst.config.paused || inst.paintedConfig !== inst.config)
            return;
    }
    cancelAnimationFrame(rafId);
    rafId = null;
}
export function registerVoiceInstance(el: HTMLElement, config: VoiceDriverConfig, source: VoiceSource, onLevel?: (level: number) => void): () => void {
    const inst: VoiceInstance = {
        el,
        config,
        source,
        onLevel,
        analyser: null,
        releaseAnalyser: null,
        time: null,
        freq: null,
        canvas: null,
        ctx: null,
        haloCanvas: null,
        haloCtx: null,
        displace: null,
        noiseShift: null,
        filter: null,
        filterTop: -1,
        s: stateFor(el),
        paintedConfig: null,
        cssBlur: null,
        warpOff: el.hasAttribute('data-voice-warp'),
        surface: null,
    };
    if (config.look !== 'glow') {
        const surfaceCanvas = el.querySelector<HTMLCanvasElement>(':scope > [data-voice-beam-surface]');
        if (surfaceCanvas)
            inst.surface = createSurfaceState(surfaceCanvas);
    }
    if (config.distortion > 0) {
        inst.displace = el.querySelector<SVGFEDisplacementMapElement>(':scope > svg feDisplacementMap');
        inst.noiseShift = el.querySelector<SVGFEOffsetElement>(':scope > svg feOffset');
        inst.filter = el.querySelector<SVGFilterElement>(':scope > svg filter');
    }
    const canvas = el.querySelector<HTMLCanvasElement>(':scope > [data-voice-beam-band]');
    if (canvas) {
        inst.canvas = canvas;
        inst.ctx = canvas.getContext('2d');
        const halo = el.querySelector<HTMLCanvasElement>(':scope > [data-voice-beam-band-halo]');
        if (halo) {
            inst.haloCanvas = halo;
            inst.haloCtx = halo.getContext('2d');
        }
    }
    inst.s.lastTs = 0;
    if (source.stream) {
        const lease = acquireAnalyser(source.stream);
        if (lease) {
            inst.analyser = lease.analyser;
            inst.releaseAnalyser = lease.release;
            inst.time = new Float32Array(lease.analyser.fftSize);
            inst.freq = new Uint8Array(lease.analyser.frequencyBinCount);
        }
    }
    instances.add(inst);
    let width = el.clientWidth;
    let height = el.clientHeight;
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
        if (!instances.has(inst) || (width === el.clientWidth && height === el.clientHeight))
            return;
        width = el.clientWidth;
        height = el.clientHeight;
        inst.paintedConfig = null;
        startLoop();
    }) : null;
    observer?.observe(el);
    startLoop();
    return () => {
        instances.delete(inst);
        observer?.disconnect();
        inst.releaseAnalyser?.();
        stopLoopIfIdle();
    };
}
