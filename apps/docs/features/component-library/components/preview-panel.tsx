import type { PlaygroundState } from '../hooks/use-playground'
import type { Library } from '../lib/config'
import { content } from '../lib/content'
import type { Theme } from '../lib/types'
import { Preview, PreviewBoundary } from './preview'

export function PreviewPanel({
  library,
  theme,
  state,
}: {
  library: Library
  theme: Theme
  state: PlaygroundState
}) {
  const { paused, setPaused, revision, props, variant, chooseVariant, update, replay } = state
  return (
    <div className="playground-column">
      <div className="preview-toolbar">
        <span className="eyebrow">{paused ? 'PREVIEW PAUSED' : 'LIVE PREVIEW'}</span>
        <div>
          <button
            type="button"
            className="pill"
            onClick={() => setPaused(!paused)}
            aria-pressed={paused}
          >
            {paused ? '▶ Play' : 'Ⅱ Pause'}
          </button>
          <button type="button" className="pill" onClick={() => replay()}>
            ↻ Replay
          </button>
        </div>
      </div>
      <div className={`preview-stage stage-${library.id}`}>
        <PreviewBoundary key={revision}>
          <Preview
            id={library.id}
            props={props}
            paused={paused}
            theme={theme}
            variant={variant}
            onVariantChange={chooseVariant}
            onPropsChange={update}
          />
        </PreviewBoundary>
      </div>
      <div className="preview-caption">
        <span>{content[library.id].hint}</span>
      </div>
    </div>
  )
}
