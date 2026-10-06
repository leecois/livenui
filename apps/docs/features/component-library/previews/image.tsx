import { ImageGeneration, type ImageGenerationHandle, type ImageGenerationProps } from 'img-fx'
import { useRef, useState } from 'react'
import type { Props } from '../lib/config'
import { imageDemoSources } from '../lib/media'

export default function ImagePreview({
  props,
  paused,
  theme,
}: {
  props: Props
  paused: boolean
  theme: 'light' | 'dark'
}) {
  const ref = useRef<ImageGenerationHandle>(null)
  const [cycle, setCycle] = useState('Ready')
  return (
    <div className="image-demo">
      <ImageGeneration
        {...(props as Omit<ImageGenerationProps, 'children'>)}
        ref={ref}
        theme={theme}
        paused={paused}
        images={(props.images as string[] | undefined) ?? imageDemoSources}
        borderRadius={typeof props.borderRadius === 'number' ? props.borderRadius : 24}
        onCycle={(event) => setCycle(event.phase)}
      >
        <div
          className="image-host"
          style={{ borderRadius: typeof props.borderRadius === 'number' ? props.borderRadius : 24 }}
        />
      </ImageGeneration>
      <div className="demo-actions">
        <button
          type="button"
          className="pill"
          onClick={() => ref.current?.triggerReveal({ hold: 'manual' })}
        >
          Reveal
        </button>
        <button type="button" className="pill" onClick={() => ref.current?.triggerHide()}>
          Hide
        </button>
        <button type="button" className="pill" onClick={() => ref.current?.triggerRegenerate()}>
          Regenerate
        </button>
      </div>
      <span className="demo-note" role="status">
        {cycle}
      </span>
    </div>
  )
}
