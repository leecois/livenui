import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { type Preset, readPresets } from '../lib/config'

export function useLibrarySession() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [presets, setPresets] = useState<Preset[]>([])
  useEffect(() => {
    try {
      setPresets(readPresets(localStorage))
    } catch {}
  }, [])
  const savePresets = (next: Preset[]) => {
    try {
      localStorage.setItem('livenui-presets', JSON.stringify(next))
      setPresets(next)
      return true
    } catch {
      return false
    }
  }
  const navigate = (path: string) => router.push(path)
  return {
    theme: mounted && resolvedTheme === 'dark' ? ('dark' as const) : ('light' as const),
    navigate,
    presets,
    savePresets,
  }
}
