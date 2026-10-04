import { createContext, useContext } from 'react';
import type { ImageMeltRegistry } from './imageMelt';
import type { ObserveEngine } from './observer';
export interface GooeyContextValue {
    portal: SVGGElement | null;
    meltPortal: SVGGElement | null;
    fill: string;
    getGroup: () => HTMLDivElement | null;
    engine: ObserveEngine;
    imageMelt: ImageMeltRegistry;
}
export const GooeyContext = createContext<GooeyContextValue | null>(null);
export function useGooeyContext(): GooeyContextValue {
    const ctx = useContext(GooeyContext);
    if (!ctx)
        throw new Error('<Gooey.Item> must be rendered inside a <Gooey> group.');
    return ctx;
}
