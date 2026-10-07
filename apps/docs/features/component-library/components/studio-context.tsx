import type { PlaygroundState } from '../hooks/use-playground'
import { type Library, libraries } from '../lib/config'
import { content } from '../lib/content'
import { examples } from '../lib/examples'
import type { Navigate } from '../lib/types'
import { ChoiceField } from './choice-field'
import { Link } from './link'

export function StudioContext({
  library,
  navigate,
  state,
}: {
  library: Library
  navigate: Navigate
  state: PlaygroundState
}) {
  return (
    <div className="studio-context">
      <nav className="studio-choice" aria-label="Component">
        <span className="field-heading">Component</span>
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
      <span className="context-description">{content[library.id].purpose}</span>
      <Link href={`/agents/${library.id}`} navigate={navigate} className="text-button">
        Read the guide ↗
      </Link>
      <div className="studio-starting-point">
        <ChoiceField
          label="Starting point"
          value={state.startingPoint}
          onChange={(value) => state.selectExample(String(value))}
          options={examples
            .filter((example) => example.library === library.id)
            .map((example) => ({ value: example.id, label: example.name }))}
          limit={6}
        >
          {!state.startingPoint && <p className="helper-text">Your configuration</p>}
        </ChoiceField>
        <Link
          href={`/agents/gallery?library=${library.id}`}
          navigate={navigate}
          className="text-button"
        >
          Compare examples ↗
        </Link>
      </div>
    </div>
  )
}
