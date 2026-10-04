import { Check, Copy } from 'lucide-react'
import {
  BEND_DEFAULTS,
  MetalBadge,
  MetalFx,
  type MetalFxProps,
  MetalText,
  useMetalBend,
  useMetalTextReflection,
} from 'metal-fx'
import { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PreviewProps } from '../components/preview'

function RingScene({ props, paused, theme }: PreviewProps) {
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const getBend = useCallback(() => ({ ...BEND_DEFAULTS, enabled: !paused }), [paused])
  const targets = useMemo(() => [label], [])
  useMetalBend(ring, getBend)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])
  const circle = props.variant === 'circle'
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(props, null, 2))
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopyError(true)
    }
  }
  return (
    <div className="metal-composition">
      <div className="metal-action-row">
        <span className="metal-reflection-label" ref={label}>
          Finish
        </span>
        <MetalFx
          {...(props as Omit<MetalFxProps, 'children'>)}
          ref={ring}
          className="metal-ring"
          theme={theme}
          paused={paused}
          normalizeHostStyles={false}
          reflectionTargets={targets}
          style={{ ...(props.style as MetalFxProps['style']), background: 'transparent' }}
        >
          <button
            type="button"
            className={`metal-host${circle ? ' metal-host-circle' : ''}`}
            aria-label={copied ? 'Metal configuration copied' : 'Copy metal configuration'}
            onClick={copy}
          >
            {!circle && <span>{copied ? 'Copied' : 'Copy style'}</span>}
            {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
          </button>
        </MetalFx>
      </div>
      <p className="metal-hint" role="status">
        {copyError ? 'Clipboard unavailable. Use the code panel to copy.' : 'Move around the edge'}
      </p>
    </div>
  )
}

function TextScene({ props, paused, theme }: PreviewProps) {
  const label = useRef<HTMLSpanElement>(null)
  const targets = useMemo(() => [{ ref: label, strength: 0.64 }], [])
  useMetalTextReflection(label)
  return (
    <div className="metal-text-row">
      <span ref={label} className="metal-plan-label">
        Plan
      </span>
      <MetalText
        {...(props as Omit<ComponentProps<typeof MetalText>, 'children'>)}
        font={String(props.font || '500 24px/1.2 system-ui')}
        color={String(props.color || 'var(--foreground)')}
        theme={theme}
        paused={paused}
        strength={Number(props.strength ?? 0.9)}
        reflectionTargets={targets}
      >
        Pro
      </MetalText>
    </div>
  )
}

function BadgeScene({ props, paused, theme }: PreviewProps) {
  return (
    <div className="metal-badge-row">
      <span>Live mode</span>
      <MetalBadge
        {...(props as Omit<ComponentProps<typeof MetalBadge>, 'children'>)}
        theme={theme}
        paused={paused}
        strength={Number(props.strength ?? 0.9)}
        scale={Number(props.scale ?? 1)}
      >
        New
      </MetalBadge>
    </div>
  )
}

export default function MetalPreview({
  variant = 'ring',
  onVariantChange,
  ...preview
}: PreviewProps) {
  return (
    <div className="metal-demo">
      <div className="metal-stage">
        {variant === 'ring' && <RingScene {...preview} />}
        {variant === 'text' && <TextScene {...preview} />}
        {variant === 'badge' && <BadgeScene {...preview} />}
      </div>
      <fieldset className="demo-actions">
        <legend className="sr-only">Metal component</legend>
        {['ring', 'text', 'badge'].map((item) => (
          <button
            type="button"
            className="pill"
            key={item}
            aria-pressed={variant === item}
            onClick={() => onVariantChange?.(item)}
          >
            {item}
          </button>
        ))}
      </fieldset>
    </div>
  )
}
