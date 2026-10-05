import type { ReactNode } from 'react'

const drawings: Record<string, ReactNode> = {
  components: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
      <rect className="navigation-icon-detail" x="14" y="3" width="7" height="7" rx="2" />
    </>
  ),
  examples: (
    <>
      <path d="m3 11 9 5 9-5M3 16l9 5 9-5" />
      <path className="navigation-icon-detail" d="m3 6 9-4 9 4-9 5Z" />
    </>
  ),
  studio: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <g className="navigation-icon-detail" fill="var(--color-fd-popover)">
        <circle cx="8" cy="6" r="2" />
        <circle cx="16" cy="12" r="2" />
        <circle cx="10" cy="18" r="2" />
      </g>
    </>
  ),
  beam: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="6" opacity="0.4" />
      <rect
        className="navigation-icon-detail"
        x="3"
        y="3"
        width="18"
        height="18"
        rx="6"
        pathLength="100"
        strokeDasharray="24 76"
      />
    </>
  ),
  orbs: (
    <>
      <circle cx="12" cy="12" r="8" opacity="0.4" />
      <circle cx="12" cy="12" r="3" />
      <g className="navigation-icon-detail">
        <circle cx="20" cy="12" r="2" fill="currentColor" stroke="none" />
      </g>
    </>
  ),
  metal: (
    <>
      <path d="m12 3 9 9-9 9-9-9Z" />
      <path className="navigation-icon-detail" d="m8 12 4-4m0 8 4-4" />
    </>
  ),
  gooey: (
    <>
      <circle cx="8" cy="9" r="4" />
      <circle className="navigation-icon-detail" cx="16" cy="15" r="5" />
    </>
  ),
  voice: (
    <g className="navigation-icon-wave">
      <path d="M4 10v4" />
      <path d="M8 6v12" />
      <path d="M12 3v18" />
      <path d="M16 7v10" />
      <path d="M20 10v4" />
    </g>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="m4 17 5-5 4 4 3-3 4 4" />
      <circle className="navigation-icon-detail" cx="16" cy="8" r="2" />
    </>
  ),
  avatars: (
    <>
      <path d="M12 3v3M10 3h4M8 6h8a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-4a5 5 0 0 1 5-5Z" />
      <path className="navigation-icon-detail" d="M8 11v3m8-3v3" />
      <path d="M10 17h4" />
    </>
  ),
  integration: (
    <>
      <path d="M6 3h14v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM3 18a3 3 0 0 1 3-3h14" />
      <path className="navigation-icon-detail" d="M8 9h8m-3-3 3 3-3 3" />
    </>
  ),
}

export function navigationIcon(url: string) {
  const id =
    url === '/agents'
      ? 'components'
      : url === '/studio'
        ? 'studio'
        : url === '/agents/gallery'
          ? 'examples'
          : url.startsWith('/agents/')
            ? url.slice('/agents/'.length)
            : ''
  if (!drawings[id]) return undefined
  return (
    <svg
      className="navigation-icon"
      data-navigation-icon={id}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {drawings[id]}
    </svg>
  )
}
