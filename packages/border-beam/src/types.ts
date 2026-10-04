import type { CSSProperties, ReactNode, HTMLAttributes } from 'react';
export type BorderBeamSize = 'sm' | 'md' | 'line' | 'pulse-outside' | 'pulse-inner';
export type BorderBeamTheme = 'dark' | 'light' | 'auto';
export type BorderBeamColorVariant = 'colorful' | 'mono' | 'ocean' | 'sunset' | 'forest' | 'candy' | 'ice' | 'gold';
export interface SizeConfig {
    borderRadius: number;
    borderWidth: number;
    width?: number;
    height?: number;
}
export interface ThemeColors {
    strokeOpacity: number;
    innerOpacity: number;
    bloomOpacity: number;
    innerShadow: string;
    saturation: number;
    brightness?: number;
    hairlineOpacity?: number;
}
export interface BorderBeamProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    children: ReactNode;
    size?: BorderBeamSize;
    colorVariant?: BorderBeamColorVariant;
    theme?: BorderBeamTheme;
    staticColors?: boolean;
    duration?: number;
    active?: boolean;
    borderRadius?: number;
    brightness?: number;
    saturation?: number;
    glowSize?: number;
    hueRange?: number;
    strength?: number;
    className?: string;
    style?: CSSProperties;
    css?: string;
    onActivate?: () => void;
    onDeactivate?: () => void;
}
