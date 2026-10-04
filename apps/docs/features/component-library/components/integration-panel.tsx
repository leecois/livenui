import { Button, Select } from '@livenui/agent-ui'
import { siteUrl } from '../../../lib/site'
import type { PlaygroundState } from '../hooks/use-playground'
import { type Library, prompt } from '../lib/config'
import { installCommand } from '../lib/content'
import type { Navigate } from '../lib/types'
import { Copy } from './copy'
import { Link } from './link'
import { PropsTable } from './props-table'

export function IntegrationPanel({
  library,
  navigate,
  state,
}: {
  library: Library
  navigate: Navigate
  state: PlaygroundState
}) {
  const {
    activeLibrary,
    exportedProps,
    liveCode,
    manager,
    setManager,
    importInput,
    importConfiguration,
    download,
    transferNotice,
  } = state
  return (
    <section className="integration-panel" aria-label="Use in your project">
      <div className="integration-heading">
        <h2>Use in your project</h2>
        <Link href="/agents/integration" navigate={navigate} className="text-button">
          Installation guide ↗
        </Link>
      </div>
      <div className="install-panel">
        <div className="code-heading">
          <h3>1. Add Liven UI source</h3>
          <div className="manager-choice">
            <label htmlFor="package-manager">Package manager</label>
            <Select
              id="package-manager"
              value={manager}
              onChange={(event) => setManager(event.target.value as typeof manager)}
            >
              <option value="npm">npm</option>
              <option value="pnpm">pnpm</option>
              <option value="bun">Bun</option>
            </Select>
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
      <div className="code-panel">
        <div className="code-heading">
          <h3>2. Copy the component</h3>
          <Copy emphasis text={liveCode} />
        </div>
        <pre>
          <code>{liveCode}</code>
        </pre>
      </div>
      <details className="integration-details">
        <summary>
          Save or hand off <span>JSON & coding agent</span>
        </summary>
        <p className="helper-text">
          Export a portable configuration, import one from another device, or give a coding agent
          the component and its API.
        </p>
        <div className="export-actions">
          <Copy emphasis text={prompt(activeLibrary, exportedProps, siteUrl.origin)}>
            Copy agent prompt
          </Copy>
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
    </section>
  )
}
