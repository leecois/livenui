'use client'

import { Button } from '@livenui/agent-ui'
import { useState } from 'react'
import { CatalogCard } from '../components/catalog-card'
import { Link } from '../components/link'
import { useLibrarySession } from '../hooks/use-library-session'
import { libraries } from '../lib/config'
import { content, libraryOrder, matchesSearch } from '../lib/content'

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
      <section className="catalog" aria-label="Components">
        <div className="catalog-toolbar">
          <label className="catalog-search">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              aria-label="Search components"
              placeholder="Search components"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Link href="/agents/gallery" navigate={navigate} className="button button-accent">
            Examples
          </Link>
        </div>
        <p className="sr-only" role="status">
          {matches.length} components
        </p>
        <div className="library-grid">
          {matches.map((library) => (
            <CatalogCard key={library.id} library={library} theme={theme} navigate={navigate} />
          ))}
        </div>
        {matches.length === 0 && (
          <div className="empty-state">
            <p>No components found.</p>
            <Button onClick={() => setQuery('')}>Clear search</Button>
          </div>
        )}
      </section>
    </div>
  )
}
