'use client'

import dynamic from 'next/dynamic'
import { Component, type ReactNode, Suspense, useEffect, useState } from 'react'
import type { Props } from '../lib/config'

export class PreviewBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  render() {
    if (this.state.error)
      return <p role="alert">This configuration could not render. Reset the props to try again.</p>
    return this.props.children
  }
}

export type PreviewProps = {
  props: Props
  paused: boolean
  theme: 'light' | 'dark'
  variant?: string
  showcase?: boolean
  onVariantChange?: (variant: string) => void
  onPropsChange?: (name: string, value: unknown) => void
}

function LoadingPreview() {
  return (
    <span className="demo-note" role="status">
      Preparing preview…
    </span>
  )
}

const renderers = {
  beam: dynamic(() => import('../previews/beam'), { ssr: false, loading: LoadingPreview }),
  orbs: dynamic(() => import('../previews/orbs'), { ssr: false, loading: LoadingPreview }),
  metal: dynamic(() => import('../previews/metal'), { ssr: false, loading: LoadingPreview }),
  gooey: dynamic(() => import('../previews/gooey'), { ssr: false, loading: LoadingPreview }),
  voice: dynamic(() => import('../previews/voice'), { ssr: false, loading: LoadingPreview }),
  image: dynamic(() => import('../previews/image'), { ssr: false, loading: LoadingPreview }),
  avatars: dynamic(() => import('../previews/avatars'), { ssr: false, loading: LoadingPreview }),
}

export function Preview({
  id,
  props,
  paused,
  theme,
  variant,
  showcase,
  onVariantChange,
  onPropsChange,
}: {
  id: string
  props: Props
  paused?: boolean
  theme: 'light' | 'dark'
  variant?: string
  showcase?: boolean
  onVariantChange?: (variant: string) => void
  onPropsChange?: (name: string, value: unknown) => void
}) {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    change()
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  const Renderer = renderers[id as keyof typeof renderers]
  if (!Renderer) return null
  return (
    <Suspense
      fallback={
        <span className="demo-note" role="status">
          Preparing preview…
        </span>
      }
    >
      <Renderer
        props={props}
        paused={paused ?? reduced}
        theme={props.theme === 'light' || props.theme === 'dark' ? props.theme : theme}
        variant={variant}
        showcase={showcase}
        onVariantChange={onVariantChange}
        onPropsChange={onPropsChange}
      />
    </Suspense>
  )
}
