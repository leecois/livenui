import { useCallback, useEffect, useRef, useState } from 'react'
import { getAudioContext } from './audio'

export type MicrophoneState = 'idle' | 'requesting' | 'live' | 'denied' | 'unsupported' | 'error'
export interface UseMicrophoneOptions {
  constraints?: MediaTrackConstraints
  autoStart?: boolean
}
export interface UseMicrophoneResult {
  stream: MediaStream | null
  state: MicrophoneState
  error: Error | null
  supported: boolean
  start: () => Promise<MediaStream | null>
  stop: () => void
}
const DEFAULT_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
}
function isSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}
export function useMicrophone(options: UseMicrophoneOptions = {}): UseMicrophoneResult {
  const { constraints, autoStart = false } = options
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [state, setState] = useState<MicrophoneState>(() =>
    isSupported() ? 'idle' : 'unsupported'
  )
  const [error, setError] = useState<Error | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mounted = useRef(false)
  const generation = useRef(0)
  const pending = useRef<Promise<MediaStream | null> | null>(null)
  const detach = useRef<(() => void) | null>(null)
  const constraintsRef = useRef(constraints)
  constraintsRef.current = constraints
  const release = useCallback(() => {
    generation.current += 1
    pending.current = null
    detach.current?.()
    detach.current = null
    const current = streamRef.current
    streamRef.current = null
    for (const track of current?.getTracks() ?? []) track.stop()
  }, [])
  const stop = useCallback(() => {
    release()
    if (!mounted.current) return
    setStream(null)
    setError(null)
    setState(isSupported() ? 'idle' : 'unsupported')
  }, [release])
  const start = useCallback((): Promise<MediaStream | null> => {
    if (!mounted.current) return Promise.resolve(null)
    if (!isSupported()) {
      setState('unsupported')
      return Promise.resolve(null)
    }
    if (streamRef.current) return Promise.resolve(streamRef.current)
    if (pending.current) return pending.current
    const request = ++generation.current
    setState('requesting')
    setError(null)
    const currentRequest = () => mounted.current && generation.current === request
    const promise = Promise.resolve().then(async () => {
      try {
        if (!currentRequest()) return null
        getAudioContext()
        const next = await navigator.mediaDevices.getUserMedia({
          audio: { ...DEFAULT_CONSTRAINTS, ...(constraintsRef.current ?? {}) },
        })
        if (!currentRequest()) {
          for (const track of next.getTracks()) track.stop()
          return null
        }
        streamRef.current = next
        const onEnded = () => {
          if (streamRef.current === next) stop()
        }
        const tracks = next.getAudioTracks()
        for (const track of tracks) track.addEventListener('ended', onEnded)
        detach.current = () => {
          for (const track of tracks) track.removeEventListener('ended', onEnded)
        }
        setStream(next)
        setState('live')
        return next
      } catch (cause) {
        if (currentRequest()) {
          const nextError = cause instanceof Error ? cause : new Error(String(cause))
          setError(nextError)
          setState(
            nextError.name === 'NotAllowedError' || nextError.name === 'SecurityError'
              ? 'denied'
              : 'error'
          )
        }
        return null
      } finally {
        if (generation.current === request) pending.current = null
      }
    })
    pending.current = promise
    return promise
  }, [stop])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      release()
    }
  }, [release])
  useEffect(() => {
    if (autoStart) void start()
  }, [autoStart, start])
  return { stream, state, error, supported: isSupported(), start, stop }
}
