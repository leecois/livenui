import { Pencil } from 'lucide-react'
import type { PlaygroundState } from '../hooks/use-playground'
import { type Library, libraries } from '../lib/config'
import { startingPointLabel } from '../lib/content'
import { examples } from '../lib/examples'
import type { Navigate } from '../lib/types'
import { ChoiceField } from './choice-field'
import { Link } from './link'
import { StatusLabel } from './status-label'

export function StudioContext({
  library,
  navigate,
  state,
  onExample,
}: {
  library: Library
  navigate: Navigate
  state?: PlaygroundState
  onExample?: () => void
}) {
  return (
    <div className="studio-context">
      <nav className="studio-choice" aria-label="Component">
        <div className="studio-library-options">
          {libraries.map((item) => (
            <Link
              key={item.id}
              href={`/studio?library=${item.id}`}
              navigate={navigate}
              className="pill"
              aria-current={library.id === item.id ? 'page' : undefined}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
      {state && (
        <div className="studio-starting-point">
          <ChoiceField
            label="Starting point"
            layout="list"
            value={state.startingPoint}
            onChange={(value) => {
              state.selectExample(String(value))
              onExample?.()
            }}
            options={examples
              .filter((example) => example.library === library.id)
              .map((example) => ({
                value: example.id,
                label: startingPointLabel(example),
                accessibleLabel: example.name,
              }))}
            limit={6}
          >
            {!state.startingPoint && (
              <p className="helper-text field-status">
                <StatusLabel icon={Pencil} title="Custom configuration">
                  Custom
                </StatusLabel>
              </p>
            )}
          </ChoiceField>
          <Link
            href={`/agents/gallery?library=${library.id}`}
            navigate={navigate}
            className="text-button"
          >
            Gallery ↗
          </Link>
        </div>
      )}
    </div>
  )
}
