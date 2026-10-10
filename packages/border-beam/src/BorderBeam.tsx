'use client'

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import {
  type BorderBeamProps,
  beamPath,
  bounded,
  palettes,
  sizePresets,
  sizeThemePresets,
} from './model'
import { animateBeam, fadeBeam } from './motion'

export const BorderBeam = forwardRef<HTMLDivElement, BorderBeamProps>(function BorderBeam(
  {
    children,
    size = 'md',
    colorVariant = 'colorful',
    theme = 'dark',
    active = true,
    duration,
    borderRadius,
    brightness,
    saturation = 1.2,
    glowSize = 1,
    hueRange = 30,
    strength = 1,
    staticColors = false,
    css,
    style,
    onActivate,
    onDeactivate,
    ...attributes
  },
  forwardedRef
) {
  const identity = `liven-beam-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const host = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLSpanElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const controller = useRef<ReturnType<typeof animateBeam> | null>(null)
  const callbacks = useRef({ onActivate, onDeactivate })
  callbacks.current = { onActivate, onDeactivate }
  const enabled = useRef(active)
  enabled.current = active
  const [systemDark, setSystemDark] = useState(true)
  const [box, setBox] = useState({ width: 0, height: 0, radius: sizePresets[size].borderRadius })
  useImperativeHandle(forwardedRef, () => host.current as HTMLDivElement, [])

  useEffect(() => {
    if (theme !== 'auto') return
    const preference = matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(preference.matches)
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [theme])

  useEffect(() => {
    const node = host.current
    if (!node) return
    let child: Element | undefined
    const update = () => {
      const width = node.clientWidth
      const height = node.clientHeight
      const value = child ? getComputedStyle(child).borderTopLeftRadius : ''
      const inferred = value.includes('%')
        ? (Number.parseFloat(value) * Math.min(width, height)) / 100
        : Number.parseFloat(value)
      const radius = bounded(
        borderRadius,
        Number.isFinite(inferred) ? inferred : sizePresets[size].borderRadius,
        0,
        Math.min(width, height) / 2
      )
      setBox((previous) =>
        previous.width === width && previous.height === height && previous.radius === radius
          ? previous
          : { width, height, radius }
      )
    }
    const attributes = new MutationObserver(update)
    const resize = new ResizeObserver(update)
    const observeChild = () => {
      if (child) resize.unobserve(child)
      attributes.disconnect()
      child = Array.from(node.children).find(
        (item) => item !== surface.current && item.tagName !== 'STYLE'
      )
      if (child) {
        attributes.observe(child, { attributes: true, attributeFilter: ['class', 'style'] })
        resize.observe(child)
      }
      update()
    }
    const childrenObserver = new MutationObserver(observeChild)
    childrenObserver.observe(node, { childList: true })
    resize.observe(node)
    observeChild()
    return () => {
      attributes.disconnect()
      resize.disconnect()
      childrenObserver.disconnect()
    }
  }, [borderRadius, size])

  useEffect(() => {
    if (!svg.current) return
    const motion = animateBeam(svg.current, {
      size,
      duration,
      hueRange: bounded(hueRange, 30, -3600, 3600),
      shiftColors: !staticColors && colorVariant !== 'mono',
    })
    controller.current = motion
    motion.setActive(enabled.current)
    return () => {
      motion.destroy()
      controller.current = null
    }
  }, [size, duration, hueRange, staticColors, colorVariant])

  useEffect(() => {
    controller.current?.setActive(active)
  }, [active])

  useEffect(() => {
    if (!surface.current) return
    return fadeBeam(surface.current, active, () => {
      if (active) callbacks.current.onActivate?.()
      else callbacks.current.onDeactivate?.()
    })
  }, [active])

  const resolvedTheme = theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme
  const colors = sizeThemePresets[size][resolvedTheme]
  const palette =
    colorVariant === 'mono' && resolvedTheme === 'light'
      ? ['#52525b', '#18181b', '#71717a']
      : palettes[colorVariant]
  const pulse = size.startsWith('pulse-')
  const halo = bounded(glowSize, 1, 0, 20)
  const stroke = sizePresets[size].borderWidth
  const path = beamPath(box.width, box.height, box.radius, size === 'line')
  const common = {
    d: path,
    pathLength: 100,
    fill: 'none',
    stroke: `url(#${identity}-paint)`,
    strokeLinecap: 'round' as const,
  }
  return (
    <div
      {...attributes}
      ref={host}
      data-beam={identity}
      data-active={active ? '' : undefined}
      data-beam-size={size}
      data-beam-theme={resolvedTheme}
      style={{
        position: 'relative',
        display: 'inline-block',
        maxWidth: '100%',
        isolation: 'isolate',
        ...style,
      }}
    >
      {children}
      <span
        ref={surface}
        aria-hidden="true"
        data-beam-surface=""
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0,
          borderRadius: box.radius,
        }}
      >
        <svg
          ref={svg}
          aria-hidden="true"
          focusable="false"
          width="100%"
          height="100%"
          viewBox={`0 0 ${Math.max(1, box.width)} ${Math.max(1, box.height)}`}
          style={{
            display: 'block',
            overflow: 'visible',
            visibility: box.width && box.height ? 'visible' : 'hidden',
            opacity: bounded(strength, 1, 0, 1),
            filter: `brightness(${bounded(brightness, colors.brightness || 1, 0, 10)}) saturate(${bounded(saturation, 1.2, 0, 10)})`,
          }}
        >
          <defs>
            <linearGradient
              id={`${identity}-paint`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={box.width}
              y2={box.height}
            >
              {palette.map((color, index) => (
                <stop
                  key={color}
                  offset={`${(index / (palette.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </linearGradient>
            <filter
              id={`${identity}-soft`}
              filterUnits="userSpaceOnUse"
              x="-120"
              y="-120"
              width={box.width + 240}
              height={box.height + 240}
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation={Math.min(24, halo * (size === 'sm' ? 2 : 4))} />
            </filter>
            <filter
              id={`${identity}-bloom`}
              filterUnits="userSpaceOnUse"
              x="-120"
              y="-120"
              width={box.width + 240}
              height={box.height + 240}
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                stdDeviation={Math.min(40, halo * (size === 'pulse-outside' ? 12 : 7))}
              />
            </filter>
            <clipPath id={`${identity}-clip`}>
              <rect width={box.width} height={box.height} rx={box.radius} />
            </clipPath>
          </defs>
          <g clipPath={size === 'pulse-inner' ? `url(#${identity}-clip)` : undefined}>
            <g data-beam-color="">
              <path {...common} strokeWidth={stroke} opacity={colors.hairlineOpacity} />
              <g
                data-beam-motion=""
                strokeDasharray={pulse ? undefined : size === 'sm' ? '12 88' : '28 72'}
              >
                <path
                  {...common}
                  data-beam-bloom=""
                  strokeWidth={size === 'pulse-outside' ? 10 : 5}
                  opacity={colors.bloomOpacity}
                  filter={`url(#${identity}-bloom)`}
                />
                <path
                  {...common}
                  data-beam-glow=""
                  strokeWidth={size === 'pulse-inner' ? 6 : 3}
                  opacity={colors.innerOpacity}
                  filter={`url(#${identity}-soft)`}
                />
                <path
                  {...common}
                  data-beam-stroke=""
                  strokeWidth={stroke}
                  opacity={colors.strokeOpacity}
                />
              </g>
            </g>
          </g>
        </svg>
      </span>
      {css ? <style>{css.replaceAll('{id}', identity)}</style> : null}
    </div>
  )
})
