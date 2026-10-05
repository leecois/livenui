import type { Form, Relief } from './plastic';

export function reliefContours(form: Form, relief: Relief, span: number, pad: number): number[][][] {
    const { N, h, sd } = form;
    const u = span / N;
    return Array.from(relief.z, (z) => {
        const threshold = relief.top * Math.pow(z / relief.top, 1 / relief.q);
        const values = Float32Array.from(h, (v, i) => z === 0 ? sd[i] : Math.min(sd[i], v - threshold));
        const points = new Map<number, [number, number]>();
        const links = new Map<number, number[]>();
        const join = (a: number, b: number) => {
            links.set(a, [...(links.get(a) ?? []), b]);
            links.set(b, [...(links.get(b) ?? []), a]);
        };
        for (let y = 0; y < N - 1; y++) {
            for (let x = 0; x < N - 1; x++) {
                const i = y * N + x;
                const corners = [i, i + 1, i + N + 1, i + N];
                const edges = [i, N * N + i + 1, i + N, N * N + i];
                const crossing: number[] = [];
                for (let e = 0; e < 4; e++) {
                    const a = corners[e], b = corners[(e + 1) % 4];
                    if ((values[a] >= 0) === (values[b] >= 0))
                        continue;
                    const t = values[a] / (values[a] - values[b]);
                    const ax = a % N, ay = Math.floor(a / N), bx = b % N, by = Math.floor(b / N);
                    points.set(edges[e], [(ax + (bx - ax) * t + 0.5) * u - pad, (ay + (by - ay) * t + 0.5) * u - pad]);
                    crossing.push(e);
                }
                if (crossing.length === 2)
                    join(edges[crossing[0]], edges[crossing[1]]);
                else if (crossing.length === 4) {
                    const center = corners.reduce((sum, c) => sum + values[c], 0) >= 0;
                    if (center === (values[i] >= 0)) {
                        join(edges[0], edges[1]);
                        join(edges[2], edges[3]);
                    }
                    else {
                        join(edges[0], edges[3]);
                        join(edges[1], edges[2]);
                    }
                }
            }
        }
        const loops: number[][] = [];
        const seen = new Set<number>();
        for (const first of links.keys()) {
            if (seen.has(first))
                continue;
            const loop: number[] = [];
            let current = first, previous = -1;
            do {
                seen.add(current);
                loop.push(...points.get(current)!);
                const next = links.get(current)!.find((edge) => edge !== previous);
                if (next === undefined)
                    break;
                previous = current;
                current = next;
            } while (current !== first && !seen.has(current));
            if (current === first && loop.length >= 6)
                loops.push(loop);
        }
        return loops;
    });
}
