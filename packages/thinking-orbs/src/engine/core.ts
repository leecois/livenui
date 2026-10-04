export interface Dot {
    x: number;
    y: number;
    z: number;
    r: number;
    white: number;
    a?: number;
}
export interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    white: number;
    a?: number;
    w: number;
}
export interface OrbFrame {
    dots: Dot[];
    lines: Line[];
}
export type Projector = (x: number, y: number, z: number) => [
    number,
    number,
    number
];
export function lerp(a: number, b: number, f: number): number {
    return a + (b - a) * f;
}
export function frac(x: number): number {
    return x - Math.floor(x);
}
export function vnoise(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    let fx = x - xi;
    let fy = y - yi;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const a = hashD(xi, yi);
    const b = hashD(xi + 1, yi);
    const c = hashD(xi, yi + 1);
    const d = hashD(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
export function hashD(a: number, b: number): number {
    const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return h - Math.floor(h);
}
export function fibDir(i: number, n: number): [
    number,
    number,
    number
] {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (2 * (i + 0.5)) / n;
    const rad = Math.sqrt(1 - y * y);
    const a = i * golden;
    return [rad * Math.cos(a), y, rad * Math.sin(a)];
}
export function angleDelta(a: number, b: number): number {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}
export function makeProj(yaw: number, tilt: number, cx: number, cy: number, scale: number): Projector {
    const st = Math.sin(tilt);
    const ct = Math.cos(tilt);
    const sy = Math.sin(yaw);
    const cyw = Math.cos(yaw);
    return (x, y, z) => {
        const x1 = x * cyw + z * sy;
        const z1 = -x * sy + z * cyw;
        const y1 = y * ct - z1 * st;
        const z2 = y * st + z1 * ct;
        return [cx + x1 * scale, cy - y1 * scale, z2];
    };
}
export interface OrbTint {
    r: number;
    g: number;
    b: number;
}
function inkColor(w: number, alpha: number, dark: boolean, tint?: OrbTint): string {
    if (!tint) {
        const g = Math.round((dark ? 1 - w : w) * 255);
        return `rgba(${g},${g},${g},${alpha})`;
    }
    const ramp = (c: number) => Math.round(dark ? c * (1 - w) : c + (255 - c) * w);
    return `rgba(${ramp(tint.r)},${ramp(tint.g)},${ramp(tint.b)},${alpha})`;
}
export function paint(ctx: CanvasRenderingContext2D, dots: Dot[], dark: boolean, rMin = 0.3, tint?: OrbTint): void {
    for (const d of dots) {
        const alpha = d.a ?? 1;
        const w = Math.min(1, Math.max(0, d.white));
        ctx.fillStyle = inkColor(w, alpha, dark, tint);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
    }
}
export function paintLines(ctx: CanvasRenderingContext2D, lines: Line[], dark: boolean, tint?: OrbTint): void {
    for (const l of lines) {
        const alpha = l.a ?? 1;
        const w = Math.min(1, Math.max(0, l.white));
        ctx.strokeStyle = inkColor(w, alpha, dark, tint);
        ctx.lineWidth = l.w;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
    }
}
export function finalizeFrame(dots: Dot[], lines: Line[], rMin = 0.3): OrbFrame {
    const visible: Dot[] = [];
    for (const d of dots) {
        if ((d.a ?? 1) < 0.02)
            continue;
        d.r = Math.max(rMin, d.r);
        visible.push(d);
    }
    visible.sort((a, b) => a.z - b.z);
    return { dots: visible, lines: lines.filter((l) => (l.a ?? 1) >= 0.02) };
}
export function paintFrame(ctx: CanvasRenderingContext2D, frame: OrbFrame, dark: boolean, tint?: OrbTint): void {
    if (frame.lines.length)
        paintLines(ctx, frame.lines, dark, tint);
    paint(ctx, frame.dots, dark, 0.3, tint);
}
export function radiusScale(size: number, pow: number): number {
    return (size / 300) ** pow;
}
