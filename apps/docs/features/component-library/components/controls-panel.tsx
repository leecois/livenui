import { Button } from '@livenui/agent-ui'
import { RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PlaygroundState } from '../hooks/use-playground'
import type { Library, Preset } from '../lib/config'
import { content } from '../lib/content'
import type { Navigate } from '../lib/types'
import { FieldControl } from './field-control'
import { Link } from './link'

function ControlContent({
  studio,
  tab,
  children,
}: {
  studio: boolean
  tab: string
  children: ReactNode
}) {
  return studio ? (
    ['controls', 'presets', 'json'].map((item) => (
      <div
        key={item}
        className="control-content"
        role="tabpanel"
        id={`panel-${item}`}
        aria-labelledby={`tab-${item}`}
        hidden={tab !== item}
      >
        {tab === item && children}
      </div>
    ))
  ) : (
    <fieldset className="control-content" aria-label="Quick settings">
      {children}
    </fieldset>
  )
}

export function ControlsPanel({
  library,
  presets,
  navigate,
  state,
  studio = true,
  studioLink,
}: {
  library: Library
  presets: Preset[]
  navigate: Navigate
  state: PlaygroundState
  studio?: boolean
  studioLink?: string
}) {
  const {
    controls,
    tab,
    selectTab,
    query,
    setQuery,
    all,
    setAll,
    props,
    update,
    draft,
    setDraft,
    apply,
    notice,
    presetName,
    setPresetName,
    save,
    load,
    deletePreset,
    reset,
  } = state
  return (
    <aside className="controls-panel">
      <div className="controls-heading">
        <h2>{studio ? 'Customize' : 'Quick settings'}</h2>
        {studio && (
          <div className="control-tabs" role="tablist" aria-label="Configuration view">
            {['controls', 'presets', 'json'].map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={tab === item}
                id={`tab-${item}`}
                aria-controls={`panel-${item}`}
                key={item}
                onClick={() => selectTab(item)}
                tabIndex={tab === item ? 0 : -1}
                onKeyDown={(event) => {
                  const tabs = ['controls', 'presets', 'json']
                  const index = tabs.indexOf(item)
                  const next =
                    event.key === 'ArrowRight'
                      ? tabs[(index + 1) % tabs.length]
                      : event.key === 'ArrowLeft'
                        ? tabs[(index + tabs.length - 1) % tabs.length]
                        : event.key === 'Home'
                          ? tabs[0]
                          : event.key === 'End'
                            ? tabs[tabs.length - 1]
                            : null
                  if (next) {
                    event.preventDefault()
                    selectTab(next)
                    document.getElementById(`tab-${next}`)?.focus()
                  }
                }}
              >
                {item === 'json' ? 'JSON' : item === 'presets' ? 'Saved' : 'Controls'}
              </button>
            ))}
          </div>
        )}
        <Button className="controls-reset" onClick={reset}>
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </Button>
      </div>
      <ControlContent studio={studio} tab={tab}>
        {(!studio || tab === 'controls') && (
          <>
            {studio && all && (
              <input
                className="control-search"
                type="search"
                aria-label="Search controls"
                placeholder="Find a setting…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            )}
            <div className="fields">
              {controls.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={props[field.name]}
                  label={content[library.id].labels?.[field.name]}
                  choices={
                    content[library.id].choices?.[field.name] ||
                    (!studio && field.kind === 'select' && field.options.length <= 6
                      ? field.options
                      : undefined)
                  }
                  set={(value) => update(field.name, value)}
                />
              ))}
            </div>
            {controls.length === 0 && <p className="muted">No matching controls.</p>}
            <div className="control-footer">
              {studio ? (
                <button
                  type="button"
                  className="text-button all-controls"
                  aria-expanded={all}
                  onClick={() => {
                    setAll(!all)
                    setQuery('')
                  }}
                >
                  {all ? 'Show essential controls' : 'Show advanced settings'}{' '}
                  <span aria-hidden="true">↗</span>
                </button>
              ) : studioLink ? (
                <Link href={studioLink} navigate={navigate} className="text-button all-controls">
                  More settings in Studio <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <p className="helper-text">Use the code below to keep this configuration.</p>
              )}
            </div>
          </>
        )}
        {tab === 'json' && (
          <>
            <label className="muted" htmlFor="json-config">
              Edit component props
            </label>
            <textarea
              className="json-editor"
              id="json-config"
              spellCheck={false}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="config-actions">
              <Button className="button-accent" onClick={apply}>
                Apply configuration <span aria-hidden="true">↗</span>
              </Button>
              <p className="helper-text">The preview updates only after validation.</p>
            </div>
          </>
        )}
        {tab === 'presets' && (
          <>
            <h3 className="saved-heading">Your saved presets</h3>
            <p className="muted">
              Keep a configuration for next time. Presets are stored in this browser.
            </p>
            <label className="sr-only" htmlFor="preset-name">
              Preset name
            </label>
            <div className="preset-save">
              <input
                id="preset-name"
                placeholder="Name your preset"
                maxLength={80}
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
              />
              <Button className="button-accent" aria-label="Save preset" onClick={save}>
                Save <span aria-hidden="true">+</span>
              </Button>
            </div>
            <div className="preset-list">
              {presets
                .filter((preset) => preset.library === library.id)
                .map((preset) => (
                  <div key={preset.id} className="preset-row">
                    <button type="button" onClick={() => load(preset)}>
                      {preset.name} <span aria-hidden="true">↗</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${preset.name}`}
                      onClick={() => deletePreset(preset.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}
      </ControlContent>
      <p className="control-notice" role="status">
        {notice}
      </p>
    </aside>
  )
}
