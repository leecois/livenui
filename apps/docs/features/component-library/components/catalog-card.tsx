import type { Library } from '../lib/config'
import type { Example } from '../lib/examples'
import type { Navigate, Theme } from '../lib/types'
import { CardPreview } from './card-preview'
import { Link } from './link'

export function CatalogCard({
  library,
  example,
  theme,
  navigate,
}: {
  library: Library
  example?: Example
  theme: Theme
  navigate: Navigate
}) {
  const title = example?.name ?? library.name
  return (
    <article className="library-card" data-library={library.id}>
      <CardPreview library={library} theme={theme} example={example} />
      <div className="card-info">
        <h2 className="card-title">
          <Link
            className="catalog-card-link"
            href={
              example
                ? `/studio?library=${library.id}&example=${example.id}`
                : `/agents/${library.id}`
            }
            navigate={navigate}
            aria-label={example ? `${title} — ${library.name}` : title}
          >
            {title}
          </Link>
        </h2>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M7 17 17 7M7 7h10v10" />
        </svg>
      </div>
    </article>
  )
}
