import type { ImageResponseOptions } from '@takumi-rs/image-response'
import type { ReactNode } from 'react'

export interface GenerateProps {
  title: ReactNode
  description?: ReactNode
}

export async function getImageResponseOptions(): Promise<ImageResponseOptions> {
  return {
    format: 'webp',
    width: 1200,
    height: 630,
  }
}

export function generate({ title, description }: GenerateProps) {
  const siteName = 'Liven UI'
  const brandDark = '#1d2515'
  const brandLight = '#ebe4d6'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        color: brandDark,
        backgroundColor: brandLight,
        backgroundImage:
          'radial-gradient(circle at 85% 15%, rgba(29,37,21,0.12), transparent 40%), radial-gradient(circle at 15% 85%, rgba(29,37,21,0.08), transparent 35%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '56px 64px',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: '72px',
            lineHeight: 1.08,
            letterSpacing: '-1.5px',
            maxWidth: '92%',
          }}
        >
          {title}
        </span>
        <p
          style={{
            marginTop: '14px',
            marginBottom: 0,
            fontSize: '34px',
            lineHeight: 1.25,
            color: 'rgba(29,37,21,0.78)',
            maxWidth: '90%',
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '18px',
            marginTop: 'auto',
            color: brandDark,
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="-4 -4 133 136"
            fill="none"
            role="img"
            aria-label="Liven UI logo"
          >
            <path
              d="M20 24 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M62 24 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M0 60 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M20 96 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M62 96 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0"
              stroke={brandDark}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: '42px',
              fontWeight: 700,
              letterSpacing: '-0.8px',
            }}
          >
            {siteName}
          </span>
        </div>
      </div>
    </div>
  )
}
