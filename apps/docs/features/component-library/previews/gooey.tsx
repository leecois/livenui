import { Liquid, type LiquidEffect, type LiquidItemProps, type LiquidProps } from 'liquid-gooey'
import { FilePlus2, FolderPlus, ImagePlus, Plus } from 'lucide-react'
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { ChoiceField } from '../components/choice-field'
import type { PreviewProps } from '../components/preview'
import { meltDemoImages } from '../lib/media'

type Point = { x: number; y: number }
type SceneProps = { group: LiquidProps; item: LiquidItemProps; paused: boolean; showcase?: boolean }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

function useShowcase(showcase: boolean | undefined, paused: boolean) {
  const [phase, setPhase] = useState(true)
  useEffect(() => {
    if (!showcase || paused) return
    const timer = setInterval(() => setPhase((value) => !value), 2600)
    return () => clearInterval(timer)
  }, [showcase, paused])
  return showcase ? phase : null
}

function useDrag(
  initial: Point,
  paused: boolean,
  bounds: () => { min: Point; max: Point },
  returnHome = false
) {
  const [position, setPosition] = useState(initial)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ id: number; offset: Point; target: HTMLElement } | null>(null)
  const limit = (next: Point) => {
    const { min, max } = bounds()
    setPosition({ x: clamp(next.x, min.x, max.x), y: clamp(next.y, min.y, max.y) })
  }
  useEffect(() => {
    if (paused) {
      const active = drag.current
      if (active?.target.hasPointerCapture(active.id))
        active.target.releasePointerCapture(active.id)
      drag.current = null
      setDragging(false)
    }
  }, [paused])
  return {
    position,
    dragging,
    setPosition,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        if (paused || event.button !== 0 || !event.isPrimary) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = {
          id: event.pointerId,
          offset: { x: event.clientX - position.x, y: event.clientY - position.y },
          target: event.currentTarget,
        }
        setDragging(true)
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const active = drag.current
        if (paused || !active || active.id !== event.pointerId) return
        limit({ x: event.clientX - active.offset.x, y: event.clientY - active.offset.y })
      },
      onPointerUp(event: PointerEvent<HTMLElement>) {
        if (drag.current?.id !== event.pointerId) return
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
        drag.current = null
        setDragging(false)
        if (returnHome) setPosition(initial)
      },
      onPointerCancel() {
        drag.current = null
        setDragging(false)
        if (returnHome) setPosition(initial)
      },
      onLostPointerCapture() {
        drag.current = null
        setDragging(false)
      },
      onKeyDown(event: KeyboardEvent<HTMLElement>) {
        if (paused) return
        const step = event.shiftKey ? 24 : 8
        const offsets: Record<string, Point> = {
          ArrowLeft: { x: -step, y: 0 },
          ArrowRight: { x: step, y: 0 },
          ArrowUp: { x: 0, y: -step },
          ArrowDown: { x: 0, y: step },
        }
        const offset = offsets[event.key]
        if (offset) {
          event.preventDefault()
          limit({ x: position.x + offset.x, y: position.y + offset.y })
        } else if (event.key === 'Home' || event.key === 'Escape') {
          event.preventDefault()
          setPosition(initial)
        }
      },
    },
  }
}

function MorphScene({ group, item, paused, showcase }: SceneProps) {
  const [expanded, setOpen] = useState(false)
  const phase = useShowcase(showcase, paused)
  const open = phase ?? expanded
  const menuId = useId()
  const main = useRef<HTMLButtonElement>(null)
  const actions = [
    { label: 'New file', x: -54, y: -34, Icon: FilePlus2 },
    { label: 'Add image', x: 0, y: -64, Icon: ImagePlus },
    { label: 'New folder', x: 54, y: -34, Icon: FolderPlus },
  ]
  return (
    <Liquid {...group} className={`liquid-menu ${open ? 'is-open' : ''}`}>
      {actions.map(({ label, x, y, Icon }, index) => (
        <Liquid.Item
          {...item}
          key={label}
          className="liquid-menu-slot"
          x={(item.x ?? 0) + (open ? x : 0)}
          y={(item.y ?? 0) + (open ? y : 0)}
          radius={item.radius ?? 999}
          transition={
            paused
              ? { duration: 0 }
              : (item.transition ?? {
                  duration: open ? 550 : 250,
                  ease: open
                    ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                    : 'cubic-bezier(0.22, 1, 0.36, 1)',
                })
          }
          delay={paused ? 0 : (item.delay ?? (open ? index * 40 : 0))}
        >
          <button
            type="button"
            id={`${menuId}-${index}`}
            className="liquid-menu-button liquid-satellite"
            aria-label={label}
            aria-hidden={!open}
            aria-disabled={paused}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              if (!paused) {
                setOpen(false)
                main.current?.focus()
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !paused) {
                setOpen(false)
                main.current?.focus()
              }
            }}
          >
            <Icon
              size={18}
              aria-hidden="true"
              style={{ transitionDelay: open && !paused ? `${120 + index * 40}ms` : '0ms' }}
            />
          </button>
        </Liquid.Item>
      ))}
      <Liquid.Item className="liquid-menu-slot" radius={999}>
        <button
          ref={main}
          type="button"
          className="liquid-menu-button liquid-main"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls={actions.map((_, index) => `${menuId}-${index}`).join(' ')}
          aria-disabled={paused}
          onClick={() => {
            if (!paused) setOpen(!open)
          }}
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </Liquid.Item>
    </Liquid>
  )
}

function MoveScene({ group, item, paused, showcase }: SceneProps) {
  const drag = useDrag({ x: 84, y: 0 }, paused, () => ({
    min: { x: 0, y: 0 },
    max: { x: 188, y: 0 },
  }))
  const value = Math.round((drag.position.x / 188) * 100)
  const phase = useShowcase(showcase, paused)
  const { setPosition } = drag
  useEffect(() => {
    if (phase !== null) setPosition({ x: phase ? 152 : 36, y: 0 })
  }, [phase, setPosition])
  return (
    <div className="liquid-slider-demo">
      <Liquid {...group} className="liquid-slider">
        <div className="liquid-track" aria-hidden="true" />
        <Liquid.Item
          {...item}
          effect="move"
          move={{ springiness: 0.5, wobble: 0.5, stretch: 0.6, trail: 0.35, ...item.move }}
        >
          <div
            className="liquid-thumb"
            role="slider"
            aria-label="Liquid slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-disabled={paused}
            tabIndex={0}
            style={{ transform: `translateX(${drag.position.x}px)` }}
            {...drag.handlers}
            onKeyDown={(event) => {
              if (paused) return
              if (['Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault()
                const step = event.shiftKey ? 24 : 8
                const x =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? 188
                      : clamp(drag.position.x + (event.key === 'ArrowUp' ? step : -step), 0, 188)
                drag.setPosition({ x, y: 0 })
              } else drag.handlers.onKeyDown(event)
            }}
          />
        </Liquid.Item>
      </Liquid>
      <span className="liquid-value" aria-hidden="true">
        {value}%
      </span>
    </div>
  )
}

function BendScene({ group, item, paused, showcase }: SceneProps) {
  const stage = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLButtonElement>(null)
  const drag = useDrag(
    { x: 0, y: 0 },
    paused,
    () => {
      const x = Math.max(
        0,
        ((stage.current?.offsetWidth ?? 320) - (card.current?.offsetWidth ?? 236)) / 2 - 8
      )
      const y = Math.max(
        0,
        ((stage.current?.offsetHeight ?? 210) - (card.current?.offsetHeight ?? 48)) / 2 - 8
      )
      return { min: { x: -x, y: -y }, max: { x, y } }
    },
    true
  )
  const phase = useShowcase(showcase, paused)
  const { setPosition } = drag
  useEffect(() => {
    if (phase !== null) {
      const travel = Math.min(28, Math.max(0, ((stage.current?.offsetWidth ?? 320) - 236) / 2 - 8))
      setPosition({ x: phase ? travel : -travel, y: phase ? -24 : 18 })
    }
  }, [phase, setPosition])
  return (
    <Liquid {...group} ref={stage} className="liquid-bend">
      <Liquid.Item {...item} effect="bend" bend={{ vertical: 0.6, horizontal: 0.35, ...item.bend }}>
        <button
          ref={card}
          type="button"
          className="liquid-drag-card"
          aria-label="Drag project card. Use arrow keys to move and Escape to reset."
          aria-disabled={paused}
          style={{
            transform: `translate(${drag.position.x}px, ${drag.position.y}px)`,
            transition:
              drag.dragging || paused ? 'none' : 'transform 400ms cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}
          {...drag.handlers}
        >
          <span className="liquid-card-icon">
            <FolderPlus size={18} aria-hidden="true" />
          </span>
          <span>Agent workspace</span>
          <span className="liquid-card-count">12 files</span>
        </button>
      </Liquid.Item>
    </Liquid>
  )
}

function MeltCard({
  groupRef,
  item,
  paused,
  index,
  phase,
}: {
  groupRef: RefObject<HTMLDivElement | null>
  item: LiquidItemProps
  paused: boolean
  index: number
  phase: boolean | null
}) {
  const [focused, setFocused] = useState(false)
  const initial = { x: index === 0 ? -50 : 50, y: 0 }
  const drag = useDrag(initial, paused, () => {
    const x = Math.max(0, ((groupRef.current?.offsetWidth ?? 300) - 84) / 2 - 4)
    const y = Math.max(0, ((groupRef.current?.offsetHeight ?? 200) - 84) / 2 - 4)
    return { min: { x: -x, y: -y }, max: { x, y } }
  })
  const { setPosition } = drag
  useEffect(() => {
    if (phase !== null) setPosition({ x: (index === 0 ? -1 : 1) * (phase ? 34 : 50), y: 0 })
  }, [phase, index, setPosition])
  return (
    <>
      <Liquid.Item {...item} effect="melt">
        <button
          type="button"
          className="liquid-melt-card"
          aria-label={`Drag ${index === 0 ? 'warm' : 'blue'} image. Use arrow keys to move and Home to reset.`}
          aria-disabled={paused}
          style={{ transform: `translate(${drag.position.x}px, ${drag.position.y}px)` }}
          {...drag.handlers}
          onFocus={(event) => setFocused(event.currentTarget.matches(':focus-visible'))}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            setFocused(true)
            drag.handlers.onKeyDown(event)
          }}
          onPointerDown={(event) => {
            setFocused(false)
            drag.handlers.onPointerDown(event)
          }}
        >
          <img src={meltDemoImages[index].src} alt={meltDemoImages[index].alt} draggable={false} />
        </button>
      </Liquid.Item>
      {focused && (
        <span
          aria-hidden="true"
          className="liquid-melt-focus"
          style={{ transform: `translate(${drag.position.x}px, ${drag.position.y}px)` }}
        />
      )}
    </>
  )
}

function MeltScene({ group, item, paused, showcase }: SceneProps) {
  const stage = useRef<HTMLDivElement>(null)
  const phase = useShowcase(showcase, paused)
  return (
    <Liquid {...group} ref={stage} className="liquid-melt">
      {[0, 1].map((index) => (
        <MeltCard
          key={index}
          groupRef={stage}
          item={item}
          paused={paused}
          index={index}
          phase={phase}
        />
      ))}
    </Liquid>
  )
}

const scenes = { morph: MorphScene, move: MoveScene, bend: BendScene, melt: MeltScene }
const hints = {
  morph: 'Open the menu to pull the actions apart. Press Escape to close it.',
  move: 'Drag the thumb or use arrow keys. Home and End move to the limits.',
  bend: 'Drag the card or move it with arrow keys. Escape returns it home.',
  melt: 'Drag the images together or use arrow keys. Home resets the position.',
}

export default function GooeyPreview({ props, paused, showcase, onPropsChange }: PreviewProps) {
  const { item: rawItem, ...groupProps } = props
  const item = (rawItem || {}) as LiquidItemProps
  const effect = item.effect || 'morph'
  const Scene = scenes[effect] || MorphScene
  const group = {
    shadow: '0 2px 6px color-mix(in srgb, var(--foreground) 8%, transparent)',
    ...groupProps,
  } as LiquidProps
  return (
    <div className="gooey-demo" style={{ '--liquid-ink': 'var(--foreground)' } as CSSProperties}>
      <Scene key={effect} group={group} item={item} paused={paused} showcase={showcase} />
      <p className="demo-note">{hints[effect]}</p>
      {onPropsChange && (
        <div className="demo-actions">
          <ChoiceField
            label="Liquid behavior"
            value={effect}
            options={['morph', 'move', 'bend', 'melt'].map((value) => ({ value, label: value }))}
            onChange={(value) => onPropsChange('item', { ...item, effect: value as LiquidEffect })}
          />
        </div>
      )}
    </div>
  )
}
