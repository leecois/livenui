import type { PlaygroundState } from '../hooks/use-playground'
import { Copy } from './copy'

export function CodePanel({
  state,
  onInstall,
  copyLabel,
}: {
  state: PlaygroundState
  onInstall?: () => void
  copyLabel?: string
}) {
  return (
    <section className="code-panel" aria-label="React integration code">
      <div className="code-heading">
        <h3>React code</h3>
        <Copy emphasis text={state.liveCode}>
          {copyLabel}
        </Copy>
      </div>
      <pre>
        <code>{state.liveCode}</code>
      </pre>
      {onInstall && (
        <div className="code-next-step">
          <button type="button" className="text-button" onClick={onInstall}>
            Get installation steps <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
    </section>
  )
}
