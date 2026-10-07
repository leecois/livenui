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
        <div>
          <h2>Use in your project</h2>
          <p className="helper-text">Install the source, then copy the code you just configured.</p>
        </div>
        <Link href="/agents/integration" navigate={navigate} className="text-button">
          Installation guide ↗
        </Link>
      </div>
      <div className="install-panel">
        <div className="code-heading">
          <h3>1. Add Liven UI source</h3>
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
        <p className="helper-text">
          Copies editable component source into your project. React 18+
          {library.id === 'image' ? ' · Three.js included' : ''}. Use your configured component
          alias in the import below.
        </p>
      </div>
      <CodePanel state={state} installation copyLabel={details ? undefined : 'Copy snippet'} />
      {content[library.id].integration && (
        <p className="helper-text integration-guidance">{content[library.id].integration}</p>
      )}
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
          <summary>
            Import & export <span>Portable JSON</span>
          </summary>
          <p className="helper-text">
            Export a configuration to keep a portable copy, or import one from another device.
          </p>
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
        <summary>
          API reference <span>All props and types</span>
        </summary>
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
