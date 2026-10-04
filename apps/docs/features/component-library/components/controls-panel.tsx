import { Button, Select } from '@livenui/agent-ui'
import type { PlaygroundState } from '../hooks/use-playground'
import type { Library, Preset } from '../lib/config'
import { examples } from '../lib/examples'
import type { Navigate } from '../lib/types'
import { FieldControl } from './field-control'
import { Link } from './link'

export function ControlsPanel({
  library,
  presets,
  navigate,
  state,
}: {
  library: Library
  presets: Preset[]
  navigate: Navigate
  state: PlaygroundState
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
    startingPoint,
    selectExample,
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
        <h2>Customize</h2>
        <button type="button" className="text-button" onClick={reset}>
          Reset
        </button>
      </div>
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
            {item === 'json' ? 'JSON' : item === 'presets' ? 'Examples & saved' : 'Controls'}
          </button>
        ))}
      </div>
      <div
        className="control-content"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === 'controls' && (
          <>
            <input
              className="control-search"
              type="search"
              aria-label="Search controls"
              placeholder="Find a setting…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="fields">
              {controls.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={props[field.name]}
                  set={(value) => update(field.name, value)}
                />
              ))}
            </div>
            {controls.length === 0 && <p className="muted">No matching controls.</p>}
            <button
              type="button"
              className="text-button all-controls"
              aria-expanded={all}
              onClick={() => setAll(!all)}
            >
              {all ? 'Show essential controls' : 'Show advanced settings'}{' '}
              <span aria-hidden="true">↗</span>
            </button>
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
            <Button className="button-accent" onClick={apply}>
              Apply configuration <span aria-hidden="true">↗</span>
            </Button>
            <p className="helper-text">The preview updates only after validation.</p>
          </>
        )}
        {tab === 'presets' && (
          <section className="example-presets" aria-label="Library examples">
            <h3>Starting points</h3>
            <p className="helper-text">Load an example, then tune it with the controls.</p>
            <label className="sr-only" htmlFor="starting-example">
              Choose a starting point
            </label>
            <Select
              id="starting-example"
              value={startingPoint}
              onChange={(event) => selectExample(event.target.value)}
            >
              <option value="">Choose an example…</option>
              {examples
                .filter((example) => example.library === library.id)
                .map((example) => (
                  <option key={example.id} value={example.id}>
                    {example.name}
                  </option>
                ))}
            </Select>
            <Link
              href={`/agents/gallery?library=${library.id}`}
              navigate={navigate}
              className="text-button"
            >
              Compare all examples ↗
            </Link>
          </section>
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
            <input
              id="preset-name"
              placeholder="Name your preset"
              maxLength={80}
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
            />
            <Button className="button-accent" onClick={save}>
              Save preset <span aria-hidden="true">+</span>
            </Button>
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
      </div>
      <p className="control-notice" role="status">
        {notice}
      </p>
    </aside>
  )
}
