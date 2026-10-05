'use client'

import { Button } from '@livenui/agent-ui'
import { useState } from 'react'
import { CardPreview } from '../components/card-preview'
import { Link } from '../components/link'
import { useLibrarySession } from '../hooks/use-library-session'
import { libraries } from '../lib/config'
import { content, libraryOrder, matchesSearch } from '../lib/content'
import { examples } from '../lib/examples'

export function AgentCollection() {
  const { theme, navigate } = useLibrarySession()
  const [query, setQuery] = useState('')
  const matches = libraryOrder
    .flatMap((id) => libraries.filter((item) => item.id === id))
    .filter((item) =>
      matchesSearch(
        query,
        item.name,
        item.package,
        item.component,
        ...item.variants.map((variant) => variant.component),
        content[item.id].purpose,
        content[item.id].description
      )
    )
  return (
    <div className="agent-libraries not-prose">
      <div className="collection-actions">
        <Link href="/agents/gallery" navigate={navigate} className="button button-accent">
          Explore {examples.length} examples <span aria-hidden="true">↗</span>
        </Link>
        <Link href="/agents/integration" navigate={navigate} className="button">
          Get started <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <section className="catalog" aria-label="Components">
        <div className="section-heading">
          <div>
            <h2>Find a component</h2>
            <p className="helper-text" role="status">
              {matches.length} of {libraries.length} libraries · Interactive previews, controls and
              React code
            </p>
          </div>
          <label className="catalog-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search components"
              placeholder="Search name or use case…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="library-grid">
          {matches.map((library) => (
            <article className="library-card" key={library.id}>
              <CardPreview library={library} theme={theme} />
              <div className="card-info">
                <span className="card-purpose">{content[library.id].purpose}</span>
                <h3 className="card-title">
                  <Link href={`/agents/${library.id}`} navigate={navigate}>
                    {library.name} <span aria-hidden="true">↗</span>
                  </Link>
                </h3>
                <p>{content[library.id].description}</p>
                <div className="card-meta">
                  <Link href={`/agents/${library.id}`} navigate={navigate}>
                    Try & get code <span aria-hidden="true">↗</span>
                  </Link>
                  <Link href={`/agents/gallery?library=${library.id}`} navigate={navigate}>
                    {examples.filter((example) => example.library === library.id).length} examples
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        {matches.length === 0 && (
          <div className="empty-state">
            <p>
              No components match “{query}”. Try a name or use case such as audio, progress or
              images.
            </p>
            <Button onClick={() => setQuery('')}>Clear search</Button>
          </div>
        )}
      </section>
      <ol className="workflow" aria-label="From component to project">
        <li>
          <span>1</span>
          <div>
            <h3>Find your interaction</h3>
            <p>Choose a component by what it does, or start with a ready-made example.</p>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <h3>Try it in context</h3>
            <p>Change states, materials and motion. Preview your choices in light or dark mode.</p>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <h3>Bring it to your app</h3>
            <p>
              Install the component source and copy the code. Keep your own content and design
              tokens.
            </p>
          </div>
        </li>
      </ol>
    </div>
  )
}
