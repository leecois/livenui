import { useEffect, useState } from 'react'
import { useMicrophone, VoiceBeam, type VoiceBeamProps } from 'voice-glow'
import type { Props } from '../lib/config'

export default function VoicePreview({
  props,
  paused,
  theme,
}: {
  props: Props
  paused: boolean
  theme: 'light' | 'dark'
}) {
  const mic = useMicrophone()
  const [simulate, setSimulate] = useState(false)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const level = () => {
    if (paused) return 0
    if (simulate && !reduced) return 0.4 + Math.sin(performance.now() / 260) * 0.28
    return Number(props.level ?? 0.5)
  }
  useEffect(() => {
    if (paused) mic.stop()
  }, [paused, mic.stop])
  return (
    <div className="voice-demo">
      <VoiceBeam
        {...(props as Omit<VoiceBeamProps, 'children'>)}
        theme={theme}
        active={!paused}
        level={level}
        stream={mic.stream}
      >
        <div className="voice-host">
          <span className="status-dot" />
          {mic.state === 'live' ? 'Listening to your voice' : 'A space for your next thought'}
          <span className="host-icon">↗</span>
        </div>
      </VoiceBeam>
      <div className="demo-actions">
        <button
          type="button"
          className="pill"
          onClick={() => setSimulate(!simulate)}
          aria-pressed={simulate}
        >
          Simulate voice
        </button>
        <button
          type="button"
          className="pill"
          disabled={paused || !mic.supported || mic.state === 'requesting'}
          onClick={() => (mic.state === 'live' ? mic.stop() : void mic.start())}
        >
          {mic.state === 'live' ? 'Stop microphone' : 'Use microphone'}
        </button>
      </div>
      <p className="demo-note" role="status">
        {mic.state === 'denied'
          ? 'Microphone permission was denied. You can use the simulation instead.'
          : 'Your audio stays on this device.'}
      </p>
    </div>
  )
}
