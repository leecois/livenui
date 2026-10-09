import { ArrowRight } from 'lucide-react'
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
        <Copy emphasis text={state.liveCode} label={copyLabel || 'Copy code'}>
          Copy
        </Copy>
      </div>
      <pre>
        <code>{state.liveCode}</code>
      </pre>
      {onInstall && (
        <div className="code-next-step">
          <button
            type="button"
            className="text-button"
            aria-label="Get installation steps"
            onClick={onInstall}
          >
            Installation <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  )
}
