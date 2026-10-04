import { useEffect, type RefObject } from 'react';
import { textMaskDataUrl } from './engine/textMask';
export function useMetalTextReflection(ref: RefObject<HTMLElement | null>): void {
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        el.setAttribute('data-metal-fx-text', '');
        let raf = 0;
        let disposed = false;
        let tries = 0;
        const apply = () => {
            if (disposed)
                return;
            const wrap = el.querySelector<HTMLElement>(':scope > [data-metal-fx-reflection]');
            if (!wrap) {
                if (tries++ < 300)
                    raf = requestAnimationFrame(apply);
                return;
            }
            tries = 0;
            const url = textMaskDataUrl(el, el);
            if (!url)
                return;
            const v = `url("${url}")`;
            wrap.style.maskImage = v;
            wrap.style.webkitMaskImage = v;
            wrap.style.maskRepeat = 'no-repeat';
            wrap.style.webkitMaskRepeat = 'no-repeat';
            wrap.style.maskSize = '100% 100%';
            wrap.style.webkitMaskSize = '100% 100%';
            wrap.style.mixBlendMode = 'normal';
        };
        apply();
        const ro = new ResizeObserver(() => apply());
        ro.observe(el);
        document.fonts?.ready.then(() => apply());
        const mo = new MutationObserver((recs) => {
            for (const r of recs) {
                for (const n of Array.from(r.addedNodes)) {
                    if (n instanceof HTMLElement && n.hasAttribute('data-metal-fx-reflection')) {
                        apply();
                        return;
                    }
                }
            }
        });
        mo.observe(el, { childList: true });
        return () => {
            disposed = true;
            if (raf)
                cancelAnimationFrame(raf);
            ro.disconnect();
            mo.disconnect();
        };
    }, [ref]);
}
