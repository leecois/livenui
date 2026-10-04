import { useEffect, useRef, useState } from 'react'
import {
  configuredLibrary,
  defaults,
  type Library,
  type Preset,
  type Props,
  parseProps,
  snippet,
  variantDefaults,
} from '../lib/config'
import { content, fieldLabel, matchesSearch } from '../lib/content'
import { type Example, findExample } from '../lib/examples'
import type { Theme } from '../lib/types'

function playbackPaused(library: string, props: Props, fallback: boolean) {
  if (library === 'beam' || library === 'voice')
    return typeof props.active === 'boolean' ? !props.active : fallback
  if (library !== 'gooey') return typeof props.paused === 'boolean' ? props.paused : fallback
  return fallback
}

export function usePlayground({
  library,
  theme,
  presets,
  savePresets,
  initialExample,
}: {
  library: Library
  theme: Theme
  presets: Preset[]
  savePresets: (presets: Preset[]) => boolean
  initialExample?: Example
}) {
  const [variant, setVariant] = useState(initialExample?.variant || 'ring')
  const activeLibrary = configuredLibrary(library, variant)
  const [props, setProps] = useState<Props>({ ...(initialExample?.props || defaults[library.id]) })
  const [tab, setTab] = useState('controls')
  const [query, setQuery] = useState('')
  const [all, setAll] = useState(false)
  const [paused, setPaused] = useState(false)
  const initialPlayback = playbackPaused(
    library.id,
    initialExample?.props || defaults[library.id],
    false
  )
  useEffect(() => {
    setPaused(matchMedia('(prefers-reduced-motion: reduce)').matches || initialPlayback)
  }, [initialPlayback])
  const [draft, setDraft] = useState(JSON.stringify(props, null, 2))
  const [notice, setNotice] = useState('')
  const [transferNotice, setTransferNotice] = useState('')
  const [startingPoint, setStartingPoint] = useState(initialExample?.id || '')
  const [presetName, setPresetName] = useState('')
  const [revision, setRevision] = useState(0)
  const [manager, setManager] = useState<'npm' | 'pnpm' | 'bun'>('npm')
  const importInput = useRef<HTMLInputElement>(null)
  const playbackProps = (values: Props, playback = paused): Props => ({
    ...values,
    ...(library.id === 'beam' || library.id === 'voice'
      ? { active: !playback }
      : library.id !== 'gooey'
        ? { paused: playback }
        : {}),
  })
  const configurationPlayback = (values: Props) => playbackPaused(library.id, values, paused)
  const effectiveProps = playbackProps(props)
  const exportedProps = {
    ...effectiveProps,
    theme: props.theme === 'light' || props.theme === 'dark' ? props.theme : theme,
  }
  const liveCode = snippet(activeLibrary, exportedProps)
  const chooseVariant = (next: string) => {
    setStartingPoint('')
    setVariant(next)
    const nextProps = variantDefaults(library, next)
    setProps(nextProps)
    setDraft(JSON.stringify(playbackProps(nextProps), null, 2))
    setRevision((value) => value + 1)
    setNotice('')
  }
  const controls = activeLibrary.fields.filter(
    (field) =>
      field.kind !== 'json' &&
      field.name !== 'theme' &&
      (all || query.trim() || content[library.id].controls.includes(field.name)) &&
      matchesSearch(query, field.name, fieldLabel(field.name), field.description)
  )
  const update = (name: string, value: unknown) => {
    setStartingPoint('')
    if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > 10000)) {
      setNotice('Use a finite value within the playground limit of 10000.')
      return
    }
    if (name === 'paused' || name === 'active') setPaused(configurationPlayback({ [name]: value }))
    setProps((current) => {
      const next = { ...current }
      if (value === undefined) delete next[name]
      else next[name] = value
      return next
    })
  }
  const apply = () => {
    try {
      const next = parseProps(draft, activeLibrary)
      setStartingPoint('')
      setProps(next)
      setPaused(configurationPlayback(next))
      setNotice('Configuration applied.')
      setRevision((value) => value + 1)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Invalid configuration.')
    }
  }
  const save = () => {
    const name = presetName.trim()
    if (!name) {
      setNotice('Give your preset a name first.')
      return
    }
    const next = presets.filter(
      (preset) => !(preset.library === library.id && preset.name === name)
    )
    next.push({
      id: crypto.randomUUID(),
      library: library.id,
      name: name.slice(0, 80),
      props: effectiveProps,
      variant,
    })
    if (savePresets(next)) {
      setNotice('Preset saved on this device.')
      setPresetName('')
    } else setNotice('This browser could not save your preset. Export the JSON to keep it.')
  }
  const selectTab = (next: string) => {
    if (next === 'json') setDraft(JSON.stringify(effectiveProps, null, 2))
    setTab(next)
    setNotice('')
  }
  const importConfiguration = async (file: File | undefined) => {
    if (!file) return
    try {
      if (file.size > 65536) throw new Error('Use a configuration file smaller than 64 KB.')
      const data: unknown = JSON.parse(await file.text())
      if (!data || typeof data !== 'object' || Array.isArray(data))
        throw new Error('Invalid configuration file.')
      const envelope = data as Props
      if (envelope.library !== undefined && envelope.library !== library.id)
        throw new Error('Open the matching library before importing this configuration.')
      const nextVariant = typeof envelope.variant === 'string' ? envelope.variant : variant
      if (!library.variants.some((item) => item.id === nextVariant))
        throw new Error('Unknown component variant.')
      const next = parseProps(
        JSON.stringify(envelope.props || envelope),
        configuredLibrary(library, nextVariant)
      )
      setStartingPoint('')
      setVariant(nextVariant)
      setProps(next)
      setDraft(JSON.stringify(playbackProps(next, configurationPlayback(next)), null, 2))
      setRevision((value) => value + 1)
      setPaused(configurationPlayback(next))
      setTransferNotice('Configuration imported.')
    } catch (error) {
      setTransferNotice(error instanceof Error ? error.message : 'Could not import configuration.')
    }
    if (importInput.current) importInput.current.value = ''
  }
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              library: library.id,
              component: activeLibrary.component,
              variant,
              props: exportedProps,
            },
            null,
            2
          ),
        ],
        {
          type: 'application/json',
        }
      )
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `livenui-${library.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const reset = () => {
    const next = variantDefaults(library, variant)
    setStartingPoint('')
    setProps(next)
    setDraft(JSON.stringify(playbackProps(next), null, 2))
    setRevision((value) => value + 1)
    setNotice('Reset to defaults.')
  }
  const load = (next: { props: Props; variant: string; name: string }, exampleId = '') => {
    setStartingPoint(exampleId)
    setVariant(next.variant)
    setProps({ ...next.props })
    setPaused(configurationPlayback(next.props))
    setDraft(JSON.stringify(playbackProps(next.props, configurationPlayback(next.props)), null, 2))
    setRevision((value) => value + 1)
    setNotice(`Loaded ${next.name}.`)
  }
  const selectExample = (id: string) => {
    const example = findExample(library.id, id)
    if (example) load(example, example.id)
  }
  const deletePreset = (id: string) => {
    if (!savePresets(presets.filter((item) => item.id !== id)))
      setNotice('This browser could not delete the preset.')
  }
  const replay = () => setRevision((value) => value + 1)
  return {
    activeLibrary,
    props: effectiveProps,
    variant,
    paused,
    setPaused,
    revision,
    replay,
    chooseVariant,
    update,
    controls,
    tab,
    selectTab,
    query,
    setQuery,
    all,
    setAll,
    draft,
    setDraft,
    apply,
    notice,
    startingPoint,
    selectExample,
    presetName,
    setPresetName,
    save,
    load,
    deletePreset,
    reset,
    exportedProps,
    liveCode,
    manager,
    setManager,
    importInput,
    importConfiguration,
    download,
    transferNotice,
  }
}

export type PlaygroundState = ReturnType<typeof usePlayground>
