export function paintTextRun(ctx: CanvasRenderingContext2D, root: HTMLElement, textEl: HTMLElement, dpr: number): void {
    const cs = getComputedStyle(textEl);
    const rr = root.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(textEl);
    const tr = range.getBoundingClientRect();
    range.detach();
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const text = textEl.textContent ?? '';
    const m = ctx.measureText(text);
    const asc = m.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * 0.9;
    const desc = m.fontBoundingBoxDescent ?? parseFloat(cs.fontSize) * 0.2;
    const x = tr.left - rr.left;
    const baseline = tr.top - rr.top + (tr.height - (asc + desc)) / 2 + asc;
    ctx.fillText(text, x, baseline);
    ctx.restore();
}
export function textMaskDataUrl(root: HTMLElement, textEl: HTMLElement): string | null {
    const dpr = window.devicePixelRatio || 1;
    const rr = root.getBoundingClientRect();
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(rr.width * dpr));
    c.height = Math.max(1, Math.round(rr.height * dpr));
    const g = c.getContext('2d');
    if (!g)
        return null;
    g.fillStyle = '#fff';
    paintTextRun(g, root, textEl, dpr);
    return c.toDataURL('image/png');
}
