import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type Ref, } from 'react';
import { GooeyContext, type GooeyContextValue } from './context';
import { GooFilterPrimitives } from './filter';
import { ImageMeltLayer, createImageMeltRegistry } from './imageMelt';
import { useIsoLayoutEffect } from './hooks';
import { ObserveEngine } from './observer';
import { parseShadow } from './shadow';
export interface GooeyProps extends HTMLAttributes<HTMLDivElement> {
    blur?: number;
    contrast?: number;
    fill?: string;
    shadow?: string;
    filterPadding?: number;
    waviness?: number;
    wavinessFreq?: number;
    filter?: string;
}
export const GooeyRoot = forwardRef<HTMLDivElement, GooeyProps>(function Gooey({ blur = 6, contrast = 18, fill = '#fff', shadow, filterPadding = 24, waviness = 0, wavinessFreq = 0.018, filter: customFilter, className, style, children, ...rest }, fwd: Ref<HTMLDivElement>) {
    const groupRef = useRef<HTMLDivElement | null>(null);
    const [portal, setPortal] = useState<SVGGElement | null>(null);
    const [meltPortal, setMeltPortal] = useState<SVGGElement | null>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });
    const setRefs = useCallback((node: HTMLDivElement | null) => {
        groupRef.current = node;
        if (typeof fwd === 'function')
            fwd(node);
        else if (fwd)
            (fwd as {
                current: HTMLDivElement | null;
            }).current = node;
    }, [fwd]);
    const filterId = `gooey-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const shadows = useMemo(() => parseShadow(shadow), [shadow]);
    useIsoLayoutEffect(() => {
        const el = groupRef.current;
        if (!el)
            return;
        const measure = () => setSize(prev => prev.w === el.offsetWidth && prev.h === el.offsetHeight
            ? prev
            : { w: el.offsetWidth, h: el.offsetHeight });
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const engine = useMemo(() => new ObserveEngine(() => groupRef.current), []);
    const imageMelt = useMemo(() => createImageMeltRegistry(), []);
    useEffect(() => () => engine.dispose(), [engine]);
    useEffect(() => {
        engine.gooBlur = blur;
    }, [engine, blur]);
    const ctx = useMemo<GooeyContextValue>(() => ({ portal, meltPortal, fill, getGroup: () => groupRef.current, engine, imageMelt }), [portal, meltPortal, fill, engine, imageMelt]);
    const svgShadows = shadows.filter(s => s.inset || s.spread !== 0);
    const cssShadowFilter = shadows
        .filter(s => !s.inset && s.spread === 0)
        .map(s => `drop-shadow(${s.x}px ${s.y}px ${s.blur}px ${s.color})`)
        .join(' ');
    const shadowExtent = svgShadows.reduce((m, s) => Math.max(m, Math.max(Math.abs(s.x), Math.abs(s.y)) + s.blur * 1.5 + Math.max(0, s.spread)), 0);
    const pad = Math.ceil(blur * 3 + shadowExtent + filterPadding);
    return (<div {...rest} ref={setRefs} className={className} style={{ position: 'relative', isolation: 'isolate', ...style }}>

      <svg aria-hidden="true" focusable="false" data-gooey-svg="" style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: -1,
            filter: cssShadowFilter || undefined,
            willChange: 'filter, transform',
        }}>
        <defs>
          {customFilter ? (<filter id={filterId} filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={size.w + pad * 2} height={size.h + pad * 2} colorInterpolationFilters="sRGB" dangerouslySetInnerHTML={{ __html: customFilter }}/>) : (<filter id={filterId} filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={size.w + pad * 2} height={size.h + pad * 2} colorInterpolationFilters="sRGB">
              <GooFilterPrimitives blur={blur} contrast={contrast} shadows={svgShadows} waviness={waviness} wavinessFreq={wavinessFreq}/>
            </filter>)}
        </defs>
        <g id={`${filterId}-sil`} ref={setPortal} filter={`url(#${filterId})`} style={{ fill }}/>
      </svg>

      <svg aria-hidden="true" focusable="false" data-gooey-overlay="" style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: 9999,
        }}>
        <defs>

          <mask id={`${filterId}-meltmask`} maskUnits="userSpaceOnUse" x={-pad} y={-pad} width={size.w + pad * 2} height={size.h + pad * 2}>
            <use href={`#${filterId}-sil`}/>
          </mask>
        </defs>
        <g mask={`url(#${filterId}-meltmask)`}>
          <g ref={setMeltPortal}/>
        </g>
      </svg>
      <GooeyContext.Provider value={ctx}>
        {children}
        <ImageMeltLayer registry={imageMelt}/>
      </GooeyContext.Provider>
    </div>);
});
