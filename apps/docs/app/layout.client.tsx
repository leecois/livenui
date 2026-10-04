'use client'

import { useParams } from 'next/navigation'
import type React from 'react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/cn'

export function Body({
  children,
}: {
  children: ReactNode
}): React.ReactElement {
  const mode = useMode()

  return (
    <body className={cn(mode, 'relative flex min-h-screen flex-col')}>
      {children}
    </body>
  )
}

export function useMode(): string | undefined {
  const { slug } = useParams()
  return Array.isArray(slug) && slug.length > 0 ? slug[0] : undefined
}

export function LivenUIIconMinimal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="160"
      height="160"
      viewBox="-4 -4 133 136"
      fill="none"
      role="img"
      aria-label="Liven UI logo"
      {...props}
    >
      <title>Liven UI logo</title>
      <path
        d="M20 24 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M62 24 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M0 60 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M20 96 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M62 96 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0"
        stroke="#e3e4d8"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
