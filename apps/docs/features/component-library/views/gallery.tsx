'use client'

import { Button } from '@livenui/agent-ui'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { CatalogCard } from '../components/catalog-card'
import { useLibrarySession } from '../hooks/use-library-session'
import { libraries } from '../lib/config'
import { orderExamples, searchExamples } from '../lib/content'
import { examples } from '../lib/examples'

const galleryExamples = orderExamples(examples)

function Gallery() {
  const { theme, navigate } = useLibrarySession()
  const params = useSearchParams()
  const selected = libraries.some((library) => library.id === params.get('library'))
    ? params.get('library') || 'all'
    : 'all'
  const query = params.get('q') || ''
  const [limit, setLimit] = useState(12)
  const matches = searchExamples(galleryExamples, libraries, selected, query)
  const visible = matches.slice(0, limit)
  const updateFilters = (library: string, search: string, addHistory = false) => {
    const next = new URLSearchParams(params.toString())
    if (library === 'all') next.delete('library')
    else next.set('library', library)
    if (search) next.set('q', search)
    else next.delete('q')
    const url = `${window.location.pathname}${next.size ? `?${next}` : ''}${window.location.hash}`
    if (addHistory) window.history.pushState(null, '', url)
    else window.history.replaceState(null, '', url)
    setLimit(12)
  }
  return (
    <div className="agent-libraries not-prose">
      <section className="catalog example-gallery" aria-label="Component examples">
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
              aria-label="Search examples"
              placeholder="Search examples"
              value={query}
              onChange={(event) => updateFilters(selected, event.target.value)}
            />
          </label>
        </div>
        <p className="sr-only" role="status">
          Showing {visible.length} of {matches.length} examples
        </p>
        <fieldset className="gallery-filters" aria-label="Filter examples by library">
          {[{ id: 'all', name: 'All components' }, ...libraries].map((library) => (
            <button
              type="button"
              key={library.id}
              className="pill"
              aria-pressed={selected === library.id}
              onClick={() => updateFilters(library.id, query, true)}
            >
              {library.name}
            </button>
          ))}
        </fieldset>
        {(query || selected !== 'all') && (
          <button
            type="button"
            className="text-button clear-filters"
            onClick={() => updateFilters('all', '', true)}
          >
            Reset filters
          </button>
        )}
        <div className="library-grid">
          {visible.map((example) => {
            const library = libraries.find((library) => library.id === example.library)
            if (!library) return null
            return (
              <CatalogCard
                key={example.id}
                library={library}
                example={example}
                theme={theme}
                navigate={navigate}
              />
            )
          })}
        </div>
        {matches.length === 0 && (
          <div className="empty-state">
            <p>No examples found.</p>
            <Button onClick={() => updateFilters('all', '', true)}>Clear search & filters</Button>
          </div>
        )}
        {visible.length < matches.length && (
          <div className="gallery-more">
            <Button onClick={() => setLimit(limit + 12)}>
              Show {Math.min(12, matches.length - visible.length)} more examples{' '}
              <span aria-hidden="true">↓</span>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

export function AgentGallery() {
  return (
    <Suspense fallback={<p role="status">Loading examples…</p>}>
      <Gallery />
    </Suspense>
  )
}
