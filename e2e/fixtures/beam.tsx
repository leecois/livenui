import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BorderBeam, type BorderBeamProps } from '../../packages/border-beam/src'

declare global {
  interface Window {
    beamProbe: {
      configure: (props: Partial<BorderBeamProps>) => void
      resize: (width: number, radius: number) => void
      replaceChild: () => void
      unmount: () => void
      callbacks: string[]
      animations: Animation[]
      references: HTMLElement[]
    }
  }
}

function Fixture() {
  const [props, setProps] = useState<Partial<BorderBeamProps>>({ theme: 'auto', duration: 1 })
  const [width, setWidth] = useState(280)
  const [radius, setRadius] = useState(24)
  const [replacement, setReplacement] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  window.beamProbe.configure = (next) => setProps((previous) => ({ ...previous, ...next }))
  window.beamProbe.resize = (nextWidth, nextRadius) => {
    setWidth(nextWidth)
    setRadius(nextRadius)
  }
  window.beamProbe.replaceChild = () => setReplacement((value) => !value)
  const childStyle = {
    width,
    height: 144,
    borderRadius: radius,
    border: '1px solid #8884',
    padding: 24,
  }
  const child = replacement ? (
    <section style={childStyle}>
      <button type="button">Replacement action</button>
    </section>
  ) : (
    <article style={childStyle}>
      <h1>Make room for ideas.</h1>
      <button type="button" onClick={() => window.beamProbe.callbacks.push('content-click')}>
        Try the action
      </button>
    </article>
  )
  return (
    <main>
      <div id="primary">
        <BorderBeam
          {...props}
          ref={ref}
          aria-label="Decorated card"
          onActivate={() => window.beamProbe.callbacks.push('active')}
          onDeactivate={() => window.beamProbe.callbacks.push('inactive')}
        >
          {child}
        </BorderBeam>
      </div>
      <div id="secondary">
        <BorderBeam colorVariant="sunset" size="pulse-outside" duration={2} theme="auto">
          <article style={{ ...childStyle, width: 220 }}>Independent instance</article>
        </BorderBeam>
      </div>
      <button
        type="button"
        onClick={() => {
          if (ref.current) window.beamProbe.references.push(ref.current)
        }}
      >
        Inspect forwarded ref
      </button>
      <div style={{ height: 1600 }} />
      <p id="bottom">Offscreen checkpoint</p>
    </main>
  )
}

window.beamProbe = {
  configure: () => {},
  resize: () => {},
  replaceChild: () => {},
  unmount: () => {},
  callbacks: [],
  animations: [],
  references: [],
}
const root = createRoot(document.getElementById('root') as HTMLElement)
window.beamProbe.unmount = () => root.unmount()
root.render(
  <StrictMode>
    <Fixture />
  </StrictMode>
)
