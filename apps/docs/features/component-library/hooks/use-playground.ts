import { useEffect, useRef, useState } from 'react'
import {
  configuredLibrary,
  defaults,
  isCodeOnlyProp,
  type Library,
  type Preset,
  type Props,
  parseConfiguration,
  parseProps,
  snippet,
  variantDefaults,
} from '../lib/config'
import { content, fieldLabel, matchesSearch } from '../lib/content'
import { controlVisible } from '../lib/controls'
import { type Example, findExample } from '../lib/examples'
import { createId } from '../lib/id'
import { validateOrbConfiguration } from '../lib/orb-limits'
import type { Theme } from '../lib/types'

export type PlaygroundSnapshot = {
  props: Props
  variant: string
  paused: boolean
  draft: string
  tab: string
  startingPoint: string
  all: boolean
  query: string
  presetName: string
  manager: 'npm' | 'pnpm' | 'bun'
}

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
  configuration,
  resume,
}: {
  library: Library
  theme: Theme
  presets: Preset[]
  savePresets: (presets: Preset[]) => boolean
  initialExample?: Example
  configuration?: string
  resume?: PlaygroundSnapshot
}) {
  const [initial] = useState(() => {
    const fallback = {
      props: { ...(initialExample?.props || defaults[library.id]) },
      variant: initialExample?.variant || 'ring',
      notice: '',
      shared: false,
    }
    if (!configuration && !initialExample && resume) {
      try {
        return {
          ...parseConfiguration(
            JSON.stringify({ library: library.id, variant: resume.variant, props: resume.props }),
            library
          ),
          notice: 'Your unsaved configuration is restored.',
          shared: true,
        }
      } catch {}
    }
    if (!configuration) return fallback
    try {
      return {
        ...parseConfiguration(configuration, library),
        notice: 'Your preview configuration is ready.',
        shared: true,
      }
    } catch (error) {
      return {
        ...fallback,
        notice: error instanceof Error ? error.message : 'Could not load configuration.',
      }
    }
  })
  const [retained] = useState(!configuration && !initialExample ? resume : undefined)
  const [variant, setVariant] = useState(initial.variant)
  const activeLibrary = configuredLibrary(library, variant)
  const [props, setProps] = useState<Props>(initial.props)
  const currentProps = useRef(props)
  const replaceProps = (next: Props) => {
    currentProps.current = next
    setProps(next)
  }
  const [tab, setTab] = useState(retained?.tab || 'controls')
  const [query, setQuery] = useState(retained?.query || '')
  const [all, setAll] = useState(retained?.all || false)
  const [paused, setPaused] = useState(retained?.paused || false)
  const initialPlayback = playbackPaused(library.id, initial.props, false)
  useEffect(() => {
    setPaused(
      retained
        ? retained.paused
        : initial.shared
          ? initialPlayback
          : matchMedia('(prefers-reduced-motion: reduce)').matches || initialPlayback
    )
  }, [initialPlayback, initial.shared, retained])
  const [draft, setDraftValue] = useState(retained?.draft ?? JSON.stringify(props, null, 2))
  const configurationRevision = useRef(0)
  useEffect(
    () => () => {
      configurationRevision.current++
    },
    []
  )
  const setDraft = (value: string) => {
    configurationRevision.current++
    setDraftValue(value)
  }
  const [notice, setNotice] = useState(initial.notice)
  const [transferNotice, setTransferNotice] = useState('')
  const [startingPoint, setStartingPoint] = useState(
    initialExample?.id || retained?.startingPoint || ''
  )
  const [presetName, setPresetName] = useState(retained?.presetName || '')
  const [revision, setRevision] = useState(0)
  const [controlVersion, setControlVersion] = useState(0)
  const editControl = () => {
    configurationRevision.current++
  }
  const [manager, setManager] = useState<'npm' | 'pnpm' | 'bun'>(retained?.manager || 'npm')
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
    ...(activeLibrary.fields.some((field) => field.name === 'theme')
      ? { theme: props.theme === 'light' || props.theme === 'dark' ? props.theme : theme }
      : {}),
  }
  const liveCode = snippet(activeLibrary, exportedProps)
  const chooseVariant = (next: string) => {
    configurationRevision.current++
    setStartingPoint('')
    setVariant(next)
    const nextProps = variantDefaults(library, next)
    replaceProps(nextProps)
    setDraft(JSON.stringify(playbackProps(nextProps), null, 2))
    setRevision((value) => value + 1)
    setControlVersion((value) => value + 1)
    setNotice('')
  }
  const controls = activeLibrary.fields.filter(
    (field) =>
      (field.kind !== 'json' || content[library.id].choices?.[field.name]) &&
      field.name !== 'theme' &&
      !isCodeOnlyProp(activeLibrary, field.name) &&
      controlVisible(activeLibrary, field, props) &&
      (all || query.trim() || content[library.id].controls.includes(field.name)) &&
      matchesSearch(
        query,
        field.name,
        content[library.id].labels?.[field.name] ?? fieldLabel(field.name),
        field.description
      )
  )
  const update = (name: string, value: unknown) => {
    configurationRevision.current++
    if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > 10000)) {
      setNotice('Use a finite value within the playground limit of 10000.')
      return
    }
    const next = { ...currentProps.current }
    if (value === undefined) delete next[name]
    else next[name] = value
    try {
      if (library.id === 'orbs') validateOrbConfiguration(next)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Invalid configuration.')
      return
    }
    setStartingPoint('')
    setNotice('')
    if (name === 'paused' || name === 'active') setPaused(configurationPlayback({ [name]: value }))
    replaceProps(next)
  }
  const apply = () => {
    try {
      const next = parseProps(draft, activeLibrary)
      configurationRevision.current++
      setStartingPoint('')
      replaceProps(next)
      setPaused(configurationPlayback(next))
      setNotice('Configuration applied.')
      setRevision((value) => value + 1)
      setControlVersion((value) => value + 1)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Invalid configuration.')
    }
  }
  const save = () => {
    const name = presetName.trim()
    if (!name) {
      setNotice('Give your preset a name first.')
      return false
    }
    const next = presets.filter(
      (preset) => !(preset.library === library.id && preset.name === name)
    )
    next.push({
      id: createId(),
      library: library.id,
      name: name.slice(0, 80),
      props: effectiveProps,
      variant,
    })
    if (savePresets(next)) {
      setNotice('Preset saved on this device.')
      setPresetName('')
      return true
    }
    setNotice('This browser could not save your preset. Export the JSON to keep it.')
    return false
  }
  const selectTab = (next: string) => {
    if (next === 'json') setDraft(JSON.stringify(effectiveProps, null, 2))
    setTab(next)
    setNotice('')
  }
  const importConfiguration = async (file: File | undefined) => {
    if (!file) return
    const request = ++configurationRevision.current
    if (importInput.current) importInput.current.value = ''
    setTransferNotice('')
    try {
      if (file.size > 65536) throw new Error('Use a configuration file smaller than 64 KB.')
      const text = await file.text()
      if (request !== configurationRevision.current) return
      const { props: next, variant: nextVariant } = parseConfiguration(text, library, variant)
      setStartingPoint('')
      setVariant(nextVariant)
      replaceProps(next)
      setDraftValue(JSON.stringify(playbackProps(next, configurationPlayback(next)), null, 2))
      setRevision((value) => value + 1)
      setControlVersion((value) => value + 1)
      setPaused(configurationPlayback(next))
      setTransferNotice('Configuration imported.')
    } catch (error) {
      if (request === configurationRevision.current)
        setTransferNotice(
          error instanceof Error ? error.message : 'Could not import configuration.'
        )
    }
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
    replaceProps(next)
    setDraft(JSON.stringify(playbackProps(next), null, 2))
    setRevision((value) => value + 1)
    setControlVersion((value) => value + 1)
    setNotice('Reset to defaults.')
  }
  const load = (next: { props: Props; variant: string; name: string }, exampleId = '') => {
    setStartingPoint(exampleId)
    setVariant(next.variant)
    replaceProps({ ...next.props })
    setPaused(configurationPlayback(next.props))
    setDraft(JSON.stringify(playbackProps(next.props, configurationPlayback(next.props)), null, 2))
    setRevision((value) => value + 1)
    setControlVersion((value) => value + 1)
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
  const replay = () => {
    configurationRevision.current++
    setRevision((value) => value + 1)
  }
  return {
    snapshot: {
      props,
      variant,
      paused,
      draft,
      tab,
      startingPoint,
      all,
      query,
      presetName,
      manager,
    } satisfies PlaygroundSnapshot,
    activeLibrary,
    controlVersion,
    editControl,
    props: effectiveProps,
    variant,
    paused,
    setPaused: (value: boolean) => {
      configurationRevision.current++
      setPaused(value)
    },
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
