import { Select } from '@livenui/agent-ui'
import { type Library, libraries } from '../lib/config'
import { content } from '../lib/content'
import type { Example } from '../lib/examples'
import type { Navigate } from '../lib/types'
import { Link } from './link'

export function StudioContext({
  library,
  navigate,
  initialExample,
}: {
  library: Library
  navigate: Navigate
  initialExample?: Example
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
      <span className="context-description">
        {initialExample ? `Starting from ${initialExample.name}` : content[library.id].purpose}
      </span>
      <Link href={`/agents/${library.id}`} navigate={navigate} className="text-button">
        Read the guide ↗
      </Link>
    </div>
  )
}
