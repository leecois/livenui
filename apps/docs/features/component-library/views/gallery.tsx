'use client'

import { Button } from '@livenui/agent-ui'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { CardPreview } from '../components/card-preview'
import { Link } from '../components/link'
import { useLibrarySession } from '../hooks/use-library-session'
import { libraries } from '../lib/config'
import { content, fieldLabel, orderExamples, searchExamples } from '../lib/content'
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
        <div className="section-heading">
          <div>
            <h2>Choose a starting point</h2>
            <p className="helper-text" role="status">
              Showing {visible.length} of {matches.length} examples
              {selected !== 'all'
                ? ` · ${libraries.find((library) => library.id === selected)?.name}`
                : ''}
            </p>
          </div>
          <label className="catalog-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search examples"
              placeholder="Search name or use case…"
              value={query}
              onChange={(event) => updateFilters(selected, event.target.value)}
            />
          </label>
        </div>
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
              <article className="library-card example-card" key={example.id}>
                <CardPreview library={library} theme={theme} example={example} />
                <div className="card-info">
                  <span className="card-purpose">{library.name}</span>
                  <h3 className="card-title">
                    <Link
                      href={`/studio?library=${library.id}&example=${example.id}`}
                      navigate={navigate}
                    >
                      {example.name} <span aria-hidden="true">↗</span>
                    </Link>
                  </h3>
                  <p>
                    {content[library.id].purpose} ·{' '}
                    {example.variant === 'ring'
                      ? 'Interactive preview'
                      : `${fieldLabel(example.variant)} preview`}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
        {matches.length === 0 && (
          <div className="empty-state">
            <p>No examples match these filters. Try another name or component.</p>
            <Button onClick={() => updateFilters('all', '', true)}>Clear search & filters</Button>
          </div>
        )}
        {visible.length < matches.length && (
          <div className="gallery-more">
            <Button onClick={() => setLimit(limit + 12)}>
              Show {Math.min(12, matches.length - visible.length)} more examples{' '}
              <span aria-hidden="true">↓</span>
            </Button>
            <p className="helper-text">{matches.length - visible.length} more to explore</p>
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
