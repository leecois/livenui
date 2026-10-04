import type { ReactElement } from 'react';
import type { ShadowLayer } from './shadow';
const BINARIZE = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -29.5';
function InsetPass({ i, s }: {
    i: number;
    s: ShadowLayer;
}): ReactElement {
    const parts: ReactElement[] = [];
    let src = 'bin';
    if (s.spread !== 0) {
        parts.push(<feMorphology key="er" in={src} operator={s.spread > 0 ? 'erode' : 'dilate'} radius={Math.abs(s.spread)} result={`s${i}-er`}/>);
        src = `s${i}-er`;
    }
    if (s.x !== 0 || s.y !== 0) {
        parts.push(<feOffset key="o" in={src} dx={s.x} dy={s.y} result={`s${i}-o`}/>);
        src = `s${i}-o`;
    }
    if (s.blur > 0) {
        parts.push(<feGaussianBlur key="b" in={src} stdDeviation={s.blur / 2} result={`s${i}-b`}/>);
        src = `s${i}-b`;
    }
    parts.push(<feComposite key="band" in="bin" in2={src} operator="out" result={`s${i}-band`}/>, <feFlood key="c" floodColor={s.color} result={`s${i}-c`}/>, <feComposite key="f" in={`s${i}-c`} in2={`s${i}-band`} operator="in" result={`s${i}`}/>);
    return <>{parts}</>;
}
function ShadowPass({ i, s }: {
    i: number;
    s: ShadowLayer;
}): ReactElement {
    const parts: ReactElement[] = [];
    let src = 'shape';
    if (s.spread !== 0) {
        parts.push(<feMorphology key="sp" in="bin" operator={s.spread > 0 ? 'dilate' : 'erode'} radius={Math.abs(s.spread)} result={`s${i}-sp`}/>);
        src = `s${i}-sp`;
    }
    if (s.blur > 0) {
        parts.push(<feGaussianBlur key="b" in={src} stdDeviation={s.blur / 2} result={`s${i}-b`}/>);
        src = `s${i}-b`;
    }
    if (s.x !== 0 || s.y !== 0) {
        parts.push(<feOffset key="o" in={src} dx={s.x} dy={s.y} result={`s${i}-o`}/>);
        src = `s${i}-o`;
    }
    parts.push(<feFlood key="c" floodColor={s.color} result={`s${i}-c`}/>, <feComposite key="f" in={`s${i}-c`} in2={src} operator="in" result={`s${i}`}/>);
    return <>{parts}</>;
}
export function GooFilterPrimitives({ blur, contrast, shadows, waviness = 0, wavinessFreq = 0.018, }: {
    blur: number;
    contrast: number;
    shadows: ShadowLayer[];
    waviness?: number;
    wavinessFreq?: number;
}): ReactElement {
    const wavy = waviness > 0;
    const intercept = Math.round((0.5 - contrast * (5 / 12)) * 100) / 100;
    return (<>
      <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur"/>
      <feColorMatrix in="blur" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrast} ${intercept}`} result="goo"/>
      <feComposite in="SourceGraphic" in2="goo" operator="atop" result={wavy ? 'shape-raw' : 'shape'}/>

      {wavy && (<>
          <feTurbulence type="fractalNoise" baseFrequency={wavinessFreq} numOctaves={2} seed="7" result="wave-noise"/>
          <feDisplacementMap in="shape-raw" in2="wave-noise" scale={waviness * 2} xChannelSelector="R" yChannelSelector="G" result="shape"/>
        </>)}

      {shadows.some(s => s.inset || s.spread !== 0) && (<feColorMatrix in="shape" type="matrix" values={BINARIZE} result="bin"/>)}
      {shadows.map((s, i) => s.inset ? <InsetPass key={i} i={i} s={s}/> : <ShadowPass key={i} i={i} s={s}/>)}
      {shadows.length > 0 && (<feMerge>

          {shadows
                .map((s, i) => (!s.inset ? i : -1))
                .filter(i => i >= 0)
                .reverse()
                .map(i => (<feMergeNode key={i} in={`s${i}`}/>))}
          <feMergeNode in="shape"/>
          {shadows.map((s, i) => (s.inset ? <feMergeNode key={i} in={`s${i}`}/> : null))}
        </feMerge>)}
    </>);
}
