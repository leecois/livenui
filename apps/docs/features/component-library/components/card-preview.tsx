import { useEffect, useRef, useState } from 'react'
import type { Library } from '../lib/config'
import { defaults } from '../lib/config'
import type { Example } from '../lib/examples'
import type { Theme } from '../lib/types'
import { Preview, PreviewBoundary } from './preview'

export function CardPreview({
  library,
  theme,
  example,
}: {
  library: Library
  theme: Theme
  example?: Example
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting)
        if (entry.isIntersecting) setSeen(true)
      },
      {
        rootMargin: '60px',
      }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className={`card-preview card-${library.id}`} aria-hidden="true" inert>
      <div className="card-preview-inner">
        {(example ? visible : seen) && (
          <PreviewBoundary>
            <Preview
              id={library.id}
              props={example?.props || defaults[library.id]}
              variant={example?.variant}
              showcase
              paused={visible ? undefined : true}
              theme={theme}
            />
          </PreviewBoundary>
        )}
      </div>
    </div>
  )
}
