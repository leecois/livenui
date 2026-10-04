'use client'

import { ControlsPanel } from '../components/controls-panel'
import { IntegrationPanel } from '../components/integration-panel'
import { PreviewPanel } from '../components/preview-panel'
import { StudioContext } from '../components/studio-context'
import { useLibrarySession } from '../hooks/use-library-session'
import { usePlayground } from '../hooks/use-playground'
import { type Library, libraries } from '../lib/config'
import { type Example, findExample } from '../lib/examples'

function Workbench({
  library,
  studio,
  initialExample,
  ...session
}: ReturnType<typeof useLibrarySession> & {
  library: Library
  studio: boolean
  initialExample?: Example
}) {
  const state = usePlayground({ library, initialExample, ...session })
  return (
    <section
      className={`workbench ${studio ? 'workbench-studio' : ''}`}
      aria-label={`${library.name} playground`}
    >
      {studio && (
        <StudioContext
          library={library}
          initialExample={initialExample}
          navigate={session.navigate}
        />
      )}
      <PreviewPanel library={library} theme={session.theme} state={state} />
      <ControlsPanel
        library={library}
        presets={session.presets}
        navigate={session.navigate}
        state={state}
      />
      <IntegrationPanel library={library} navigate={session.navigate} state={state} />
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
  return (
    <div className="agent-libraries not-prose">
      <Workbench
        key={`${id}:${example || 'default'}`}
        library={library}
        studio={studio}
        initialExample={findExample(library.id, example)}
        {...state}
      />
    </div>
  )
}
