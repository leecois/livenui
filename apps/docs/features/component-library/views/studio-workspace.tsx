'use client'

import { SelectionTrack } from '@livenui/agent-ui'
import { ArrowLeft, Bookmark, Moon, PanelLeft, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react'
import { siteUrl } from '../../../lib/site'
import { containDialogFocus } from '../components/avatar-chat-panel'
import { ControlsPanel, SavedPresets } from '../components/controls-panel'
import { Copy } from '../components/copy'
import { ConfigurationDetails, IntegrationPanel } from '../components/integration-panel'
import { Link } from '../components/link'
import { PreviewPanel } from '../components/preview-panel'
import { StudioContext } from '../components/studio-context'
import type { PlaygroundState } from '../hooks/use-playground'
import { type Library, type Preset, prompt } from '../lib/config'
import type { Navigate, Theme } from '../lib/types'

const initialStudio = `(() => {
  const dialog = document.currentScript?.parentElement;
  if (!(dialog instanceof HTMLDialogElement)) return;
  dialog.showModal();
  if (dialog.clientWidth >= 1100) dialog.querySelector('.studio-browser')?.show();
})();`

export function StudioWorkspace({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      suppressHydrationWarning
      className="studio-dialog"
      aria-label="Studio workspace"
      onCancel={(event) => event.preventDefault()}
      onKeyDown={containDialogFocus}
    >
      {children}
      <script dangerouslySetInnerHTML={{ __html: initialStudio }} />
    </dialog>
  )
}

export function StudioLayout({
  library,
  navigate,
  theme,
  presets,
  state,
  width,
  onWidthChange,
}: {
  library: Library
  navigate: Navigate
  theme: Theme
  presets: Preset[]
  state?: PlaygroundState
  width: number | null
  onWidthChange: (width: number | null) => void
}) {
  const { setTheme } = useTheme()
  const root = useRef<HTMLDivElement>(null)
  const browser = useRef<HTMLDialogElement>(null)
  const inspectorScroll = useRef<HTMLDivElement>(null)
  const previous = useRef<HTMLElement | null>(null)
  const [wide, setWide] = useState(false)
  const [browse, setBrowse] = useState(false)
  const [view, setView] = useState('customize')
  const id = useId()
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const measure = () => setWide(element.clientWidth >= 1100)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    const panel = browser.current
    if (!panel) return
    const active = document.activeElement
    if (panel.open) panel.close()
    if (wide) {
      panel.show()
      if (active instanceof HTMLElement && active.isConnected) active.focus({ preventScroll: true })
    } else if (browse) {
      previous.current = active instanceof HTMLElement ? active : null
      panel.showModal()
    } else if (previous.current?.isConnected) {
      previous.current.focus({ preventScroll: true })
      previous.current = null
    } else if (active instanceof HTMLElement && panel.contains(active)) {
      root.current
        ?.querySelector<HTMLButtonElement>('.studio-browse')
        ?.focus({ preventScroll: true })
    }
  }, [wide, browse])
  useLayoutEffect(() => {
    inspectorScroll.current?.scrollTo({ top: 0 })
  }, [view])
  const visit: Navigate = (path) => {
    setBrowse(false)
    navigate(path)
  }
  const save = () => {
    setView('presets')
    requestAnimationFrame(() => {
      const input = inspectorScroll.current?.querySelector<HTMLInputElement>('#preset-name')
      input?.scrollIntoView({ block: 'nearest' })
      input?.focus({ preventScroll: true })
    })
  }
  const tabs = ['customize', 'presets', 'code']
  return (
    <div className="studio-root" ref={root} data-wide={wide || undefined}>
      <header className="studio-header">
        <Link
          href={`/agents/${library.id}`}
          navigate={navigate}
          className="pill studio-back"
          aria-label="Back to component guide"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <span className="studio-brand" aria-hidden="true" />
        <div className="studio-title">
          <h1>
            Studio <span>/ {library.name}</span>
          </h1>
        </div>
        <div className="studio-header-actions">
          <button
            type="button"
            className="pill studio-browse"
            aria-label="Components"
            aria-expanded={browse}
            aria-controls={`${id}-browser`}
            onClick={() => setBrowse(true)}
          >
            <PanelLeft size={16} aria-hidden="true" />
            <span>Components</span>
          </button>
          <button
            type="button"
            className="pill"
            aria-label="Name a preset"
            aria-controls={`${id}-panel-presets`}
            onClick={save}
            disabled={!state}
          >
            <Bookmark size={16} aria-hidden="true" />
            <span>Save preset</span>
          </button>
          <button
            type="button"
            className="pill studio-theme"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            disabled={!state}
            onClick={() => {
              const next = theme === 'dark' ? 'light' : 'dark'
              setTheme(next)
              if (state?.activeLibrary.fields.some((field) => field.name === 'theme'))
                state.update('theme', next)
            }}
          >
            {theme === 'dark' ? (
              <Sun size={16} aria-hidden="true" />
            ) : (
              <Moon size={16} aria-hidden="true" />
            )}
          </button>
          <div className="studio-copy">
            <Copy emphasis text={state?.liveCode ?? ''} label="Copy code" disabled={!state}>
              Copy
            </Copy>
          </div>
        </div>
      </header>
      <div className="studio-layout">
        <dialog
          ref={browser}
          suppressHydrationWarning
          id={`${id}-browser`}
          className="studio-browser"
          aria-label="Components"
          aria-modal={!wide && browse ? true : undefined}
          onKeyDown={(event) => {
            if (!wide) containDialogFocus(event)
          }}
          onCancel={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setBrowse(false)
          }}
        >
          <div className="studio-panel-heading">
            <h2>Components</h2>
            <button
              type="button"
              className="pill studio-close"
              aria-label="Close components"
              onClick={() => setBrowse(false)}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="studio-panel-scroll">
            <StudioContext
              library={library}
              navigate={visit}
              state={state}
              onExample={() => setBrowse(false)}
            />
          </div>
        </dialog>
        <section className="studio-preview" aria-label={`${library.name} live preview`}>
          {state ? (
            <PreviewPanel
              library={library}
              theme={theme}
              state={state}
              width={width}
              onWidthChange={onWidthChange}
            />
          ) : (
            <p className="studio-loading helper-text" role="status">
              Preparing your playground…
            </p>
          )}
        </section>
        <aside className="studio-inspector" aria-label="Component configuration">
          <div className="studio-inspector-toolbar">
            <SelectionTrack className="control-tabs" role="tablist" aria-label="Studio view">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab}
                  role="tab"
                  id={`${id}-tab-${tab}`}
                  aria-controls={`${id}-panel-${tab}`}
                  aria-selected={view === tab}
                  tabIndex={view === tab ? 0 : -1}
                  onClick={() => setView(tab)}
                  onKeyDown={(event) => {
                    const next =
                      event.key === 'ArrowRight' || event.key === 'ArrowLeft'
                        ? tabs[
                            (tabs.indexOf(tab) +
                              (event.key === 'ArrowRight' ? 1 : -1) +
                              tabs.length) %
                              tabs.length
                          ]
                        : event.key === 'Home'
                          ? tabs[0]
                          : event.key === 'End'
                            ? tabs[tabs.length - 1]
                            : undefined
                    if (next) {
                      event.preventDefault()
                      setView(next)
                      document.getElementById(`${id}-tab-${next}`)?.focus()
                    }
                  }}
                >
                  {tab === 'customize' ? 'Customize' : tab === 'presets' ? 'Presets' : 'Code'}
                </button>
              ))}
            </SelectionTrack>
          </div>
          <div className="studio-panel-scroll" ref={inspectorScroll}>
            <div
              role="tabpanel"
              id={`${id}-panel-customize`}
              aria-labelledby={`${id}-tab-customize`}
              hidden={view !== 'customize'}
            >
              {state ? (
                <>
                  <ControlsPanel
                    library={library}
                    navigate={navigate}
                    state={state}
                    theme={theme}
                  />
                  <ConfigurationDetails library={library} state={state} />
                </>
              ) : (
                <p className="helper-text" role="status">
                  Loading settings…
                </p>
              )}
            </div>
            <div
              role="tabpanel"
              id={`${id}-panel-presets`}
              aria-labelledby={`${id}-tab-presets`}
              hidden={view !== 'presets'}
            >
              {state && (
                <>
                  <SavedPresets library={library} presets={presets} state={state} />
                  <p className="studio-save-notice helper-text" role="status">
                    {state.notice}
                  </p>
                </>
              )}
            </div>
            <div
              role="tabpanel"
              id={`${id}-panel-code`}
              aria-labelledby={`${id}-tab-code`}
              hidden={view !== 'code'}
            >
              {state && (
                <>
                  <IntegrationPanel
                    library={library}
                    navigate={navigate}
                    state={state}
                    details={false}
                  />
                  <Copy
                    text={prompt(state.activeLibrary, state.exportedProps, siteUrl.origin)}
                    label="Copy prompt for agents"
                  >
                    Copy prompt
                  </Copy>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
