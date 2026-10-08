import { Button } from '@livenui/agent-ui'
import { siteUrl } from '../../../lib/site'
import type { PlaygroundState } from '../hooks/use-playground'
import type { Library } from '../lib/config'
import { content, installCommand } from '../lib/content'
import type { Navigate } from '../lib/types'
import { ChoiceField } from './choice-field'
import { CodePanel } from './code-panel'
import { Copy } from './copy'
import { Link } from './link'
import { PropsTable } from './props-table'

export function IntegrationPanel({
  library,
  navigate,
  state,
  studio = true,
  details = true,
}: {
  library: Library
  navigate: Navigate
  state: PlaygroundState
  studio?: boolean
  details?: boolean
}) {
  const { manager, setManager } = state
  return (
    <section className="integration-panel" aria-label="Use in your project">
      <div className="integration-heading">
        <h2>Install</h2>
        <Link href="/agents/integration" navigate={navigate} className="text-button">
          Installation guide ↗
        </Link>
      </div>
      <div className="install-panel">
        <div className="code-heading">
          <div className="manager-choice">
            <ChoiceField
              label="Package manager"
              value={manager}
              options={['npm', 'pnpm', 'bun'].map((value) => ({
                value,
                label: value === 'bun' ? 'Bun' : value,
              }))}
              onChange={(value) => setManager(value as typeof manager)}
            />
          </div>
        </div>
        <div className="install-command">
          <code>{installCommand(library, manager, siteUrl.origin)}</code>
          <Copy text={installCommand(library, manager, siteUrl.origin)}>Copy command</Copy>
        </div>
      </div>
      <CodePanel state={state} copyLabel={details ? undefined : 'Copy snippet'} />
      <details className="integration-details">
        <summary>Integration notes</summary>
        <p className="helper-text">
          React 18+{library.id === 'image' ? ' · Three.js included' : ''}. Adjust the import to your
          component alias.
        </p>
        {content[library.id].integration && (
          <p className="helper-text integration-guidance">{content[library.id].integration}</p>
        )}
      </details>
      {details && <ConfigurationDetails library={library} state={state} transfer={studio} />}
    </section>
  )
}

export function ConfigurationDetails({
  library,
  state,
  transfer = true,
}: {
  library: Library
  state: PlaygroundState
  transfer?: boolean
}) {
  const { activeLibrary, importInput, importConfiguration, download, transferNotice } = state
  return (
    <div className="configuration-details">
      {transfer && (
        <details className="integration-details">
          <summary>Import & export</summary>
          <div className="export-actions">
            <input
              className="sr-only"
              tabIndex={-1}
              ref={importInput}
              type="file"
              accept="application/json,.json"
              aria-label="Import configuration file"
              onChange={(event) => void importConfiguration(event.target.files?.[0])}
            />
            <Button onClick={() => importInput.current?.click()}>
              Import JSON <span aria-hidden="true">↑</span>
            </Button>
            <Button onClick={download}>
              Export JSON <span aria-hidden="true">↓</span>
            </Button>
          </div>
        </details>
      )}
      <details className="integration-details">
        <summary>API reference</summary>
        <PropsTable library={activeLibrary} />
        {library.itemFields.length > 0 && (
          <>
            <h3 className="item-api-title">Liquid.Item props</h3>
            <PropsTable library={{ ...library, fields: library.itemFields }} />
          </>
        )}
      </details>
      <p className="transfer-notice" role="status">
        {transferNotice}
      </p>
    </div>
  )
}
