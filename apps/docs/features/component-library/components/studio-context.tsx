import { Select } from '@livenui/agent-ui'
import type { PlaygroundState } from '../hooks/use-playground'
import { type Library, libraries } from '../lib/config'
import { content } from '../lib/content'
import { examples } from '../lib/examples'
import type { Navigate } from '../lib/types'
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
      <div className="studio-choice">
        <label htmlFor="studio-library">Component</label>
        <Select
          id="studio-library"
          value={library.id}
          onChange={(event) => navigate(`/studio?library=${event.target.value}`)}
        >
          {libraries.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </div>
      <span className="context-description">{content[library.id].purpose}</span>
      <Link href={`/agents/${library.id}`} navigate={navigate} className="text-button">
        Read the guide ↗
      </Link>
      <div className="studio-starting-point">
        <label htmlFor="starting-example">Starting point</label>
        <Select
          id="starting-example"
          value={state.startingPoint}
          onChange={(event) => state.selectExample(event.target.value)}
        >
          <option value="" disabled>
            Your configuration
          </option>
          {examples
            .filter((example) => example.library === library.id)
            .map((example) => (
              <option key={example.id} value={example.id}>
                {example.name}
              </option>
            ))}
        </Select>
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
