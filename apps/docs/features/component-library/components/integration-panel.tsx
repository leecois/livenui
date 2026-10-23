import { Button } from '@livenui/agent-ui'
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
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

function IntegrationDetails({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="integration-details">
      <summary>
        <span>{title}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className="integration-details-content">{children}</div>
    </details>
  )
}

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
  const command = installCommand(library, manager, siteUrl.origin)
  return (
    <section className="integration-panel" aria-label="Use in your project">
      <div className="integration-heading">
        <h2>Install</h2>
        <Link
          href="/agents/integration"
          navigate={navigate}
          className="text-button"
          aria-label="Installation guide"
        >
          Guide <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <div className="install-panel">
        <div className="install-toolbar">
          <ChoiceField
            className="manager-choice"
            label="Package manager"
            layout="grid"
            value={manager}
            options={['npm', 'pnpm', 'bun'].map((value) => ({
              value,
              label: value === 'bun' ? 'Bun' : value,
            }))}
            onChange={(value) => setManager(value as typeof manager)}
          />
          <Copy iconOnly text={command}>
            Copy command
          </Copy>
        </div>
        <pre className="install-command">
          <code>{command}</code>
        </pre>
      </div>
      <CodePanel state={state} copyLabel={details ? undefined : 'Copy snippet'} />
      <IntegrationDetails title="Integration notes">
        <p className="helper-text">
          React 18+{library.id === 'image' ? ' · Three.js included' : ''}. Adjust the import to your
          component alias.
        </p>
        {content[library.id].integration && (
          <p className="helper-text integration-guidance">{content[library.id].integration}</p>
        )}
      </IntegrationDetails>
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
        <IntegrationDetails title="Import & export">
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
              Import JSON <ArrowUpFromLine size={18} aria-hidden="true" />
            </Button>
            <Button onClick={download}>
              Export JSON <ArrowDownToLine size={18} aria-hidden="true" />
            </Button>
          </div>
          <p className="transfer-notice" role="status" aria-atomic="true">
            {transferNotice}
          </p>
        </IntegrationDetails>
      )}
      <IntegrationDetails title="API reference">
        <PropsTable library={activeLibrary} />
        {library.itemFields.length > 0 && (
          <>
            <h3 className="item-api-title">Liquid.Item props</h3>
            <PropsTable library={{ ...library, fields: library.itemFields }} />
          </>
        )}
      </IntegrationDetails>
    </div>
  )
}
