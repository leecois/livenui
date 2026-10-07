import { Button } from '@livenui/agent-ui'
import { RotateCcw } from 'lucide-react'
import type { PlaygroundState } from '../hooks/use-playground'
import type { Library, Preset } from '../lib/config'
import { content } from '../lib/content'
import { controlGroup } from '../lib/controls'
import type { Navigate, Theme } from '../lib/types'
import { AvatarShapeControl } from './avatar-shape-control'
import { FieldControl } from './field-control'
import { Link } from './link'

export function ControlsPanel({
  library,
  navigate,
  state,
  studio = true,
  studioLink,
  theme,
}: {
  library: Library
  navigate: Navigate
  state: PlaygroundState
  studio?: boolean
  studioLink?: string
  theme: Theme
}) {
  const { controls, tab, selectTab, query, setQuery, all, setAll, props, update, notice, reset } =
    state
  const groups = ['Appearance', 'Motion', 'Interaction']
  const categorical = (field: Library['fields'][number]) =>
    field.kind === 'select' ||
    field.kind === 'boolean' ||
    !!content[library.id].choices?.[field.name]?.length
  const advanced = studio && all
  const ordered = [...controls].sort(
    (first, second) =>
      (advanced ? groups.indexOf(controlGroup(first)) - groups.indexOf(controlGroup(second)) : 0) ||
      Number(categorical(second)) - Number(categorical(first))
  )
  return (
    <aside className="controls-panel">
      <div className="controls-heading">
        <h2>{studio ? 'Customize' : 'Quick settings'}</h2>
        <Button className="controls-reset" onClick={reset}>
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </Button>
      </div>
      <fieldset
        className="control-content"
        aria-label={studio ? 'Customize settings' : 'Quick settings'}
      >
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
        <div className="control-groups" data-advanced={advanced || undefined}>
          <div className="fields">
            {ordered.flatMap((field, index) => {
              const group = controlGroup(field)
              const previous = ordered[index - 1]
              const startsGroup = advanced && (!previous || controlGroup(previous) !== group)
              const divider =
                !categorical(field) &&
                previous &&
                categorical(previous) &&
                (!advanced || controlGroup(previous) === group)
              return [
                startsGroup && (
                  <h3 className="control-group-heading" key={`heading-${group}`}>
                    {group}
                  </h3>
                ),
                divider && (
                  <div className="control-divider" aria-hidden="true" key={`divider-${group}`} />
                ),
                library.id === 'avatars' && field.name === 'type' ? (
                  <AvatarShapeControl
                    key={`${field.name}-${state.controlVersion}`}
                    field={field}
                    value={props[field.name]}
                    set={(value) => update(field.name, value)}
                    theme={theme}
                  />
                ) : (
                  <FieldControl
                    key={`${field.name}-${state.controlVersion}`}
                    library={state.activeLibrary}
                    field={field}
                    value={props[field.name]}
                    label={content[library.id].labels?.[field.name]}
                    choices={
                      content[library.id].choices?.[field.name] ||
                      (field.kind === 'select' && field.options.length <= 6
                        ? field.options
                        : undefined)
                    }
                    set={(value) => update(field.name, value)}
                    onDraft={state.editControl}
                  />
                ),
              ]
            })}
          </div>
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
        {studio && (
          <div className="studio-json">
            <button
              type="button"
              className="studio-json-toggle"
              aria-expanded={tab === 'json'}
              aria-controls="studio-json-editor"
              onClick={() => selectTab(tab === 'json' ? 'controls' : 'json')}
            >
              Edit JSON <span>Advanced configuration</span>
            </button>
            <div id="studio-json-editor" hidden={tab !== 'json'}>
              <JsonEditor state={state} />
            </div>
          </div>
        )}
      </fieldset>
      <p className="control-notice" role="status">
        {notice}
      </p>
    </aside>
  )
}

function JsonEditor({ state }: { state: PlaygroundState }) {
  return (
    <>
      <label className="muted" htmlFor="json-config">
        Edit component props
      </label>
      <textarea
        className="json-editor"
        id="json-config"
        spellCheck={false}
        value={state.draft}
        onChange={(event) => state.setDraft(event.target.value)}
      />
      <div className="config-actions">
        <Button className="button-accent" onClick={state.apply}>
          Apply configuration <span aria-hidden="true">↗</span>
        </Button>
        <p className="helper-text">The preview updates only after validation.</p>
      </div>
    </>
  )
}

export function SavedPresets({
  library,
  presets,
  state,
}: {
  library: Library
  presets: Preset[]
  state: PlaygroundState
}) {
  const saved = presets.filter((preset) => preset.library === library.id)
  return (
    <section className="studio-presets" aria-label="Saved presets">
      <h3 className="saved-heading">Saved presets</h3>
      <p className="helper-text">Stored in this browser. Export JSON for a portable copy.</p>
      <label className="sr-only" htmlFor="preset-name">
        Preset name
      </label>
      <div className="preset-save">
        <input
          id="preset-name"
          placeholder="Name your preset"
          maxLength={80}
          value={state.presetName}
          onChange={(event) => state.setPresetName(event.target.value)}
        />
        <Button className="button-accent" aria-label="Save preset" onClick={state.save}>
          Save <span aria-hidden="true">+</span>
        </Button>
      </div>
      <div className="preset-list">
        {saved.map((preset) => (
          <div key={preset.id} className="preset-row">
            <button type="button" onClick={() => state.load(preset)}>
              {preset.name} <span aria-hidden="true">↗</span>
            </button>
            <button
              type="button"
              aria-label={`Delete ${preset.name}`}
              onClick={() => state.deletePreset(preset.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {saved.length === 0 && (
        <p className="helper-text">No presets yet. Name this configuration to keep it.</p>
      )}
    </section>
  )
}
