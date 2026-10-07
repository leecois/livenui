import type { PlaygroundState } from '../hooks/use-playground'
import { Copy } from './copy'

export function CodePanel({
  state,
  installation = false,
  onInstall,
  copyLabel,
}: {
  state: PlaygroundState
  installation?: boolean
  onInstall?: () => void
  copyLabel?: string
}) {
  return (
    <section className="code-panel" aria-label="React integration code">
      <div className="code-heading">
        <div>
          <h3>{installation ? '2. Add it to your app' : 'Your React code'}</h3>
          <p className="helper-text">Matches your current settings and playback.</p>
        </div>
        <Copy emphasis text={state.liveCode}>
          {copyLabel}
        </Copy>
      </div>
      <pre>
        <code>{state.liveCode}</code>
      </pre>
      {onInstall && (
        <div className="code-next-step">
          <p className="helper-text">Ready to use it in your project?</p>
          <button type="button" className="text-button" onClick={onInstall}>
            Get installation steps <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
    </section>
  )
}
