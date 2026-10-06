import type { ImageResponseOptions } from '@takumi-rs/image-response'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReactNode } from 'react'

const brandImage = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), 'public/logo.svg')).toString('base64')}`

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
          <img
            width="56"
            height="56"
            src={brandImage}
            alt=""
          />
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
