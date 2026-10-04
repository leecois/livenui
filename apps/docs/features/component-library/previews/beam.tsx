import { BorderBeam, type BorderBeamProps } from 'border-beam'
import type { PreviewProps } from '../components/preview'

export default function Renderer({ props, paused, theme }: PreviewProps) {
  return (
    <BorderBeam
      {...(props as Omit<BorderBeamProps, 'children'>)}
      theme={theme}
      active={!paused}
      borderRadius={typeof props.borderRadius === 'number' ? props.borderRadius : 24}
    >
      <div
        className="beam-host"
        style={{ borderRadius: typeof props.borderRadius === 'number' ? props.borderRadius : 24 }}
      >
        <span className="demo-eyebrow">YOUR NEXT IDEA</span>
        <strong>Good things start with a spark.</strong>
        <div className="beam-lines">
          <span />
          <span />
        </div>
        <span className="beam-footer">
          <span className="status-dot" /> Ready when you are <span>↗</span>
        </span>
      </div>
    </BorderBeam>
  )
}
