import { ThinkingOrb, type ThinkingOrbProps } from 'thinking-orbs'
import type { PreviewProps } from '../components/preview'

export default function Renderer({ props, paused, theme }: PreviewProps) {
  return (
    <div className="orb-demo">
      <ThinkingOrb
        {...(props as ThinkingOrbProps)}
        theme={theme}
        paused={paused}
        aria-label={`${String(props.state ?? 'working')} agent indicator`}
      />
      <p>
        {String(props.state ?? 'working')}
        <span className="dots">…</span>
      </p>
    </div>
  )
}
