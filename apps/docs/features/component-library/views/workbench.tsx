'use client'

import { SelectionTrack } from '@livenui/agent-ui'
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'
import { siteUrl } from '../../../lib/site'
import { CodePanel } from '../components/code-panel'
import { ComponentShowcase } from '../components/component-showcase'
import { ControlsPanel } from '../components/controls-panel'
import { Copy } from '../components/copy'
import { IntegrationPanel } from '../components/integration-panel'
import { Link } from '../components/link'
import { PreviewPanel } from '../components/preview-panel'
import { useLibrarySession } from '../hooks/use-library-session'
import { type PlaygroundSnapshot, usePlayground } from '../hooks/use-playground'
import { type Library, libraries, prompt, studioHref } from '../lib/config'
import { type Example, findExample } from '../lib/examples'
import { AvatarChat } from './avatar-chat'
import { StudioLayout, StudioWorkspace } from './studio-workspace'

function Workbench({
  library,
  studio,
  initialExample,
  configuration,
  resume,
  retain,
  ...session
}: ReturnType<typeof useLibrarySession> & {
  library: Library
  studio: boolean
  initialExample?: Example
  configuration?: string
  resume?: { configuration: PlaygroundSnapshot; width: number | null }
  retain?: (configuration: PlaygroundSnapshot, width: number | null) => void
}) {
  const state = usePlayground({
    library,
    initialExample,
    configuration,
    resume: resume?.configuration,
    ...session,
  })
  const [view, setView] = useState('preview')
  const [chatOpen, setChatOpen] = useState(library.id === 'avatars' && !studio)
  const [previewWidth, setPreviewWidth] = useState<number | null>(resume?.width ?? null)
  useEffect(() => {
    retain?.(state.snapshot, previewWidth)
  }, [retain, state.snapshot, previewWidth])
  const id = useId()
  const playground = useRef<HTMLHeadingElement>(null)
  const installPanel = useRef<HTMLDivElement>(null)
  let studioLink: string | undefined
  try {
    studioLink = studioHref(library, state.exportedProps, state.variant)
  } catch {}
  const tabs = ['preview', 'install']
  const install = () => {
    setView('install')
    requestAnimationFrame(() => installPanel.current?.focus())
  }
  const showcase = !studio && (
    <ComponentShowcase
      library={library}
      theme={session.theme}
      navigate={session.navigate}
      state={state}
      onSelect={(example) => {
        state.selectExample(example)
        requestAnimationFrame(() => {
          playground.current?.scrollIntoView({
            block: 'start',
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          })
          playground.current?.focus({ preventScroll: true })
        })
      }}
    />
  )
  if (studio)
    return (
      <StudioLayout
        library={library}
        state={state}
        width={previewWidth}
        onWidthChange={setPreviewWidth}
        {...session}
      />
    )
  return (
    <section className="workbench workbench-guide" aria-label={`${library.name} playground`}>
      <div className="workbench-navigation">
        <SelectionTrack className="workbench-tabs" role="tablist" aria-label="Component workflow">
          {tabs.map((tab) => (
            <button
              type="button"
              role="tab"
              key={tab}
              className="pill"
              id={`${id}-tab-${tab}`}
              aria-selected={view === tab}
              aria-controls={`${id}-panel-${tab}`}
              tabIndex={view === tab ? 0 : -1}
              onClick={() => setView(tab)}
              onKeyDown={(event) => {
                const next =
                  event.key === 'ArrowRight' || event.key === 'ArrowLeft'
                    ? tabs[(tabs.indexOf(tab) + 1) % tabs.length]
                    : event.key === 'Home'
                      ? tabs[0]
                      : event.key === 'End'
                        ? tabs[1]
                        : null
                if (next) {
                  event.preventDefault()
                  setView(next)
                  document.getElementById(`${id}-tab-${next}`)?.focus()
                }
              }}
            >
              {tab === 'preview' ? 'Preview' : 'Install & Usage'}
            </button>
          ))}
        </SelectionTrack>
        <div className="workbench-actions">
          {library.id === 'avatars' && (
            <button
              type="button"
              className="button button-accent"
              onClick={() => {
                setView('preview')
                setChatOpen(true)
              }}
            >
              Chat playground
            </button>
          )}
          {!studio && studioLink && (
            <Link href={studioLink} navigate={session.navigate} className="button">
              Open in Studio <span aria-hidden="true">↗</span>
            </Link>
          )}
          <Copy emphasis text={prompt(state.activeLibrary, state.exportedProps, siteUrl.origin)}>
            Copy agent prompt
          </Copy>
        </div>
      </div>
      <div
        className="workbench-view"
        role="tabpanel"
        id={`${id}-panel-preview`}
        aria-labelledby={`${id}-tab-preview`}
        hidden={view !== 'preview'}
        tabIndex={-1}
      >
        {view === 'preview' && !chatOpen && (
          <>
            {library.id !== 'avatars' && showcase}
            {!studio && (
              <div className="playground-heading">
                <h2 ref={playground} tabIndex={-1}>
                  Make it yours
                </h2>
                <p className="helper-text">Adjust the quick settings and try the interaction.</p>
              </div>
            )}
            <div
              className={`preview-settings${library.id === 'avatars' ? ' avatar-workspace' : ''}`}
            >
              <PreviewPanel
                library={library}
                theme={session.theme}
                state={state}
                width={previewWidth}
                onWidthChange={setPreviewWidth}
              />
              <ControlsPanel
                library={library}
                navigate={session.navigate}
                state={state}
                studio={studio}
                studioLink={studioLink}
                theme={session.theme}
              />
            </div>
            <CodePanel state={state} onInstall={install} />
            {library.id === 'avatars' && showcase}
          </>
        )}
      </div>
      <div
        ref={installPanel}
        className="workbench-view"
        role="tabpanel"
        id={`${id}-panel-install`}
        aria-labelledby={`${id}-tab-install`}
        hidden={view !== 'install'}
        tabIndex={-1}
      >
        {view === 'install' && (
          <IntegrationPanel
            library={library}
            navigate={session.navigate}
            state={state}
            studio={studio}
          />
        )}
      </div>
      {library.id === 'avatars' && (
        <AvatarChat
          open={chatOpen}
          library={library}
          state={state}
          theme={session.theme}
          navigate={session.navigate}
          studioLink={studioLink}
          onClose={() => setChatOpen(false)}
          onInstall={install}
        />
      )}
    </section>
  )
}

export function AgentWorkbench({
  library: id,
  studio = false,
  example,
}: {
  library: string
  studio?: boolean
  example?: string
}) {
  const state = useLibrarySession()
  const library = libraries.find((item) => item.id === id) || libraries[1]
  const retained = useRef(
    new Map<string, { configuration: PlaygroundSnapshot; width: number | null }>()
  )
  const retain = useCallback(
    (configuration: PlaygroundSnapshot, width: number | null) => {
      retained.current.set(library.id, { configuration, width })
    },
    [library.id]
  )
  const [handoff, setHandoff] = useState<{
    library: string
    example?: string
    configuration?: string
  }>()
  const configuration =
    handoff?.library === id && handoff.example === example ? handoff.configuration : undefined
  const [ready, setReady] = useState(!studio)
  useEffect(() => {
    if (!studio) return
    const read = () => {
      setHandoff({
        library: id,
        example,
        configuration:
          new URLSearchParams(window.location.hash.slice(1)).get('config') || undefined,
      })
      setReady(true)
    }
    read()
    window.addEventListener('hashchange', read)
    window.addEventListener('popstate', read)
    return () => {
      window.removeEventListener('hashchange', read)
      window.removeEventListener('popstate', read)
    }
  }, [studio, id, example])
  return (
    <div className="agent-libraries not-prose">
      <Workspace studio={studio}>
        {ready ? (
          <Workbench
            key={`${id}:${example || 'default'}:${configuration || ''}`}
            library={library}
            studio={studio}
            initialExample={configuration ? undefined : findExample(library.id, example)}
            configuration={configuration}
            resume={!configuration && !example ? retained.current.get(library.id) : undefined}
            retain={studio ? retain : undefined}
            {...state}
          />
        ) : (
          <StudioLayout library={library} width={null} onWidthChange={() => {}} {...state} />
        )}
      </Workspace>
    </div>
  )
}

function Workspace({ studio, children }: { studio: boolean; children: ReactNode }) {
  return studio ? <StudioWorkspace>{children}</StudioWorkspace> : children
}
