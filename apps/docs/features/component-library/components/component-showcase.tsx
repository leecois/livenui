import type { PlaygroundState } from '../hooks/use-playground'
import type { Library } from '../lib/config'
import { content } from '../lib/content'
import { avatarContexts, findExample } from '../lib/examples'
import type { Navigate, Theme } from '../lib/types'
import { CardPreview } from './card-preview'
import { Link } from './link'

export function ComponentShowcase({
  library,
  theme,
  navigate,
  state,
  onSelect,
}: {
  library: Library
  theme: Theme
  navigate: Navigate
  state: PlaygroundState
  onSelect: (example: string) => void
}) {
  return (
    <section className="component-showcase" aria-label="Component starting examples">
      <div className="showcase-heading">
        <h2>Examples</h2>
        <Link
          href={`/agents/gallery?library=${library.id}`}
          navigate={navigate}
          className="text-button"
        >
          All examples <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className={`showcase-grid showcase-${library.id}`}>
        {content[library.id].featured.map((id) => {
          const example = findExample(library.id, id)
          if (!example) return null
          const selected = state.startingPoint === example.id
          return (
            <article className="showcase-example" key={example.id}>
              <CardPreview library={library} theme={theme} example={example} />
              <div className="showcase-example-footer">
                <h3>{example.name}</h3>
                <button
                  type="button"
                  className="pill"
                  aria-pressed={selected}
                  aria-label={`Try ${example.name}`}
                  onClick={() => onSelect(example.id)}
                >
                  {selected ? 'Selected' : 'Try this'} <span aria-hidden="true">↘</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>
      {library.id === 'avatars' && (
        <section className="avatar-context" aria-label="Agent sidebar example">
          <div>
            <h3>A face for each agent</h3>
            <p className="helper-text">
              Use shape and activity to make an agent list easy to scan.
            </p>
          </div>
          <ul className="avatar-context-list">
            {avatarContexts.map(({ example, description, status }) => (
              <li key={example.id}>
                <div className="context-avatar">
                  <CardPreview library={library} theme={theme} example={example} />
                </div>
                <div>
                  <strong>{example.name}</strong>
                  <p className="helper-text">{description}</p>
                </div>
                <span className="context-status">{status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}
