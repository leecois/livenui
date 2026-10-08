import { Button, SelectionTrack } from '@livenui/agent-ui'
import {
  ArrowLeft,
  ArrowUp,
  Code2,
  Menu,
  Moon,
  Plus,
  SlidersHorizontal,
  Square,
  Sun,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AvatarChatBotPicker } from '../components/avatar-chat-bot-picker'
import { AvatarChatPanel, containDialogFocus } from '../components/avatar-chat-panel'
import { AvatarChatSettings } from '../components/avatar-chat-settings'
import { CodePanel } from '../components/code-panel'
import { Link } from '../components/link'
import { Preview, PreviewBoundary } from '../components/preview'
import { useAvatarChat } from '../hooks/use-avatar-chat'
import type { PlaygroundState } from '../hooks/use-playground'
import {
  avatarChatExamples,
  avatarHelperProps,
  avatarHelpers,
  selectedOutfit,
} from '../lib/avatar-chat'
import type { Library, Props } from '../lib/config'
import { avatarColors, optionLabel } from '../lib/content'
import type { Navigate, Theme } from '../lib/types'

type BotProfile = { id: string; name: string; purpose: string; props: Props }

const initialChat = `(() => {
  const dialog = document.currentScript?.parentElement;
  if (!(dialog instanceof HTMLDialogElement)) return;
  dialog.showModal();
  if (dialog.clientWidth >= 1100) {
    for (const panel of dialog.querySelectorAll('.avatar-chat-layout > .avatar-chat-panel')) {
      panel.show();
    }
  }
})();`

function CreateBot({
  onCreate,
  onClose,
}: {
  onCreate: (name: string, purpose: string) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      className="avatar-chat-create"
      aria-label="New bot"
      onKeyDown={containDialogFocus}
      onCancel={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (name.trim()) onCreate(name.trim(), purpose.trim())
        }}
      >
        <div className="avatar-chat-panel-heading">
          <h2>New bot</h2>
          <button
            type="button"
            className="pill avatar-chat-icon"
            aria-label="Close New bot"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <label>
          Name
          <input
            name="name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your bot’s name"
          />
        </label>
        <label>
          What it helps with
          <input
            name="purpose"
            maxLength={160}
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="A short description"
          />
        </label>
        <Button type="submit" className="button-accent" disabled={!name.trim()}>
          Create bot
        </Button>
      </form>
    </dialog>
  )
}

export function AvatarChat({
  open,
  library,
  state,
  theme,
  navigate,
  studioLink,
  onClose,
  onInstall,
}: {
  open: boolean
  library: Library
  state: PlaygroundState
  theme: Theme
  navigate: Navigate
  studioLink?: string
  onClose: () => void
  onInstall: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const feed = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const [wide, setWide] = useState(false)
  const [panel, setPanel] = useState<'examples' | 'settings'>()
  const [settingsView, setSettingsView] = useState('playground')
  const tabsId = useId()
  const [creating, setCreating] = useState(false)
  const [bots, setBots] = useState<BotProfile[]>([])
  const [bot, setBot] = useState<string>()
  const chat = useAvatarChat()
  const { setTheme } = useTheme()
  const type = String(state.props.type ?? 'clover')
  const profile = bots.find((item) => item.id === bot)
  const outfit = selectedOutfit(state.props)
  const name =
    profile?.name ?? (outfit && outfit !== 'Resting' ? outfit : optionLabel('type', type))
  const purpose = profile?.purpose
  const conversation = chat.current.messages.length > 0
  const botOptions = [
    ...avatarHelpers.map((helper) => ({
      id: helper.outfit,
      name: helper.outfit === 'Resting' ? optionLabel('type', type) : helper.outfit,
      description: helper.description,
      group: helper.group,
      color: String(avatarHelperProps(helper.outfit).color),
    })),
    ...bots.map((profile) => ({
      id: profile.id,
      name: profile.name,
      description: profile.purpose || 'Your saved character',
      group: 'Your bots',
      color: typeof profile.props.color === 'string' ? profile.props.color : avatarColors[0].value,
    })),
  ]
  useLayoutEffect(() => {
    const element = dialog.current
    element?.showModal()
    const focus = requestAnimationFrame(() => composer.current?.focus({ preventScroll: true }))
    return () => {
      cancelAnimationFrame(focus)
      element?.close()
    }
  }, [open])
  useLayoutEffect(() => {
    const element = root.current
    if (!element) return
    setWide(element.getBoundingClientRect().width >= 1100)
    const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 1100))
    observer.observe(element)
    return () => observer.disconnect()
  }, [open])
  useEffect(() => {
    const element = feed.current
    if (element && follow.current) element.scrollTop = element.scrollHeight
  }, [chat.current.messages])
  const send = (message = chat.draft, title?: string) => {
    follow.current = true
    chat.send(message, { name, props: { ...state.exportedProps }, profile: bot }, title)
    setPanel(undefined)
    composer.current?.focus({ preventScroll: true })
  }
  const pick = (value: string) => {
    const profile = bots.find((item) => item.id === value)
    setBot(profile?.id)
    if (profile) {
      state.load({
        name: profile.name,
        props: profile.props,
        variant: state.variant,
      })
    } else {
      for (const [key, presetValue] of Object.entries(avatarHelperProps(value)))
        state.update(key, presetValue)
    }
  }
  const leave = () => {
    chat.stop()
    setCreating(false)
    setPanel(undefined)
    onClose()
  }
  const back = (className = '') => (
    <Link
      href="/agents"
      navigate={(path) => {
        leave()
        navigate(path)
      }}
      className={`pill avatar-chat-back ${className}`}
      aria-label="Back to all components"
      title="All components"
    >
      <ArrowLeft size={18} aria-hidden="true" />
    </Link>
  )
  if (!open) return null
  return (
    <dialog
      ref={dialog}
      suppressHydrationWarning
      className="avatar-chat-dialog"
      aria-label="Bot avatar chat playground"
      onKeyDown={containDialogFocus}
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return
        event.preventDefault()
        leave()
      }}
    >
      <div className="avatar-chat-root" ref={root}>
        <div className="avatar-chat-layout">
          <AvatarChatPanel
            title="Liven UI"
            side="examples"
            wide={wide}
            expanded={panel === 'examples'}
            onClose={() => setPanel(undefined)}
            leading={back('avatar-chat-desktop')}
          >
            <button
              type="button"
              className="avatar-chat-new-conversation"
              onClick={() => {
                chat.newChat()
                setPanel(undefined)
              }}
            >
              <Plus size={16} aria-hidden="true" />
              New chat
            </button>
            {chat.conversations.some((item) => item.messages.length > 0 && !item.example) && (
              <nav aria-label="Conversations" className="avatar-chat-list">
                <h3>Chats</h3>
                {chat.conversations
                  .filter((item) => item.messages.length > 0 && !item.example)
                  .map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-current={item.id === chat.current.id ? 'true' : undefined}
                      onClick={() => {
                        chat.select(item.id)
                        if (item.bot) {
                          setBot(item.bot.profile)
                          state.load({
                            name: item.bot.name,
                            props: item.bot.props,
                            variant: state.variant,
                          })
                        }
                        setPanel(undefined)
                      }}
                    >
                      {item.title}
                    </button>
                  ))}
              </nav>
            )}
            <nav aria-label="Chat examples" className="avatar-chat-list">
              <h3>Examples</h3>
              {avatarChatExamples.map((example) => (
                <button
                  type="button"
                  key={example.title}
                  aria-current={chat.current.example === example.title ? 'true' : undefined}
                  disabled={!!chat.pending || !chat.online}
                  onClick={() => {
                    const previous = chat.conversations.find(
                      (item) => item.example === example.title
                    )
                    if (previous?.bot) {
                      chat.select(previous.id)
                      setBot(previous.bot.profile)
                      state.load({
                        name: previous.bot.name,
                        props: previous.bot.props,
                        variant: state.variant,
                      })
                      follow.current = true
                      setPanel(undefined)
                      composer.current?.focus({ preventScroll: true })
                      return
                    }
                    const props = avatarHelperProps(example.outfit)
                    for (const [key, value] of Object.entries(props)) state.update(key, value)
                    setBot(undefined)
                    follow.current = true
                    chat.send(
                      example.prompt,
                      {
                        name:
                          example.outfit === 'Resting' ? optionLabel('type', type) : example.outfit,
                        props: { ...state.exportedProps, ...props },
                      },
                      example.title
                    )
                    setPanel(undefined)
                    composer.current?.focus({ preventScroll: true })
                  }}
                >
                  <span
                    className="avatar-chat-outfit-dot"
                    style={{ background: String(avatarHelperProps(example.outfit).color) }}
                    aria-hidden="true"
                  />
                  {example.title}
                </button>
              ))}
            </nav>
          </AvatarChatPanel>
          <main className="avatar-chat-main" data-conversation={conversation || undefined}>
            <header className="avatar-chat-header">
              {back('avatar-chat-mobile')}
              <button
                type="button"
                className="pill avatar-chat-icon avatar-chat-mobile"
                aria-label="Chats and examples"
                aria-expanded={panel === 'examples'}
                onClick={() => setPanel(panel === 'examples' ? undefined : 'examples')}
              >
                <Menu size={18} aria-hidden="true" />
              </button>
              <h1 title={chat.current.title}>{chat.current.title}</h1>
              <span className="avatar-chat-status" role="status">
                <span className="status-dot" aria-hidden="true" />
                Demo · {chat.online ? 'Online' : 'Offline'}
              </span>
              <button
                type="button"
                className="pill avatar-chat-icon avatar-chat-mobile"
                aria-label="Playground"
                aria-expanded={panel === 'settings'}
                onClick={() => setPanel(panel === 'settings' ? undefined : 'settings')}
              >
                <SlidersHorizontal size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="pill avatar-chat-icon"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun size={18} aria-hidden="true" />
                ) : (
                  <Moon size={18} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                className="pill avatar-chat-icon"
                aria-label="Component preview"
                title="Component preview and installation"
                onClick={leave}
              >
                <Code2 size={18} aria-hidden="true" />
              </button>
            </header>
            <div
              className="avatar-chat-body"
              ref={feed}
              onScroll={(event) => {
                const element = event.currentTarget
                follow.current =
                  element.scrollHeight - element.scrollTop - element.clientHeight < 100
              }}
            >
              <div
                className="avatar-chat-messages"
                role="log"
                aria-label="Conversation messages"
                aria-live="off"
              >
                {chat.current.messages.map((message) => (
                  <article
                    className={`avatar-chat-message avatar-chat-message-${message.role}`}
                    key={message.id}
                    aria-label={message.role === 'user' ? 'Your message' : `${message.name} reply`}
                  >
                    {message.role === 'assistant' && (
                      <span className="avatar-chat-message-avatar" aria-hidden="true" inert>
                        <PreviewBoundary>
                          <Preview
                            id="avatars"
                            props={{ ...message.avatar, size: 24, interactive: false }}
                            theme={theme}
                            paused
                            showcase
                          />
                        </PreviewBoundary>
                      </span>
                    )}
                    <div>
                      {message.role === 'assistant' && <strong>{message.name}</strong>}
                      <p>{message.text || 'Thinking…'}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="avatar-chat-character" data-conversation={conversation || undefined}>
              <div className="avatar-chat-actor">
                <PreviewBoundary key={state.revision}>
                  <Preview
                    id="avatars"
                    props={{
                      ...state.props,
                      size: conversation ? 64 : 128,
                      state: chat.pending ? 'working' : state.props.state,
                    }}
                    theme={theme}
                    paused={state.paused}
                    showcase
                  />
                </PreviewBoundary>
              </div>
              {!conversation && (
                <>
                  <div className="avatar-chat-who">
                    <h2>Who’s helping?</h2>
                    <AvatarChatBotPicker
                      name={name}
                      value={bot ?? outfit ?? 'Resting'}
                      options={botOptions}
                      onPick={pick}
                    />
                  </div>
                  {purpose && <p className="helper-text avatar-chat-purpose">{purpose}</p>}
                  <button type="button" className="text-button" onClick={() => setCreating(true)}>
                    <Plus size={16} aria-hidden="true" />
                    New bot
                  </button>
                </>
              )}
            </div>
            <div className="avatar-chat-composer-area">
              <form
                className="avatar-chat-composer"
                onSubmit={(event) => {
                  event.preventDefault()
                  send()
                }}
              >
                <textarea
                  ref={composer}
                  rows={1}
                  aria-label={`Message ${name}`}
                  placeholder={chat.online ? `Ask ${name} anything` : 'Reconnect to send a message'}
                  maxLength={2000}
                  value={chat.draft}
                  disabled={!chat.online}
                  onChange={(event) => chat.setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault()
                      send()
                    }
                  }}
                />
                {chat.pending ? (
                  <Button
                    type="button"
                    className="button-accent avatar-chat-send"
                    aria-label="Stop reply"
                    onClick={chat.stop}
                  >
                    <Square size={16} aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="button-accent avatar-chat-send"
                    aria-label="Send message"
                    disabled={!chat.online || !chat.draft.trim()}
                  >
                    <ArrowUp size={18} aria-hidden="true" />
                  </Button>
                )}
              </form>
              <p className="avatar-chat-demo-note" role="status">
                {chat.pending
                  ? `${name} is replying…`
                  : chat.online
                    ? 'Local demo · Scripted replies'
                    : 'Offline · Reconnect in Playground'}
              </p>
            </div>
          </main>
          <AvatarChatPanel
            title="Playground"
            side="settings"
            wide={wide}
            expanded={panel === 'settings'}
            onClose={() => setPanel(undefined)}
            toolbar={
              <SelectionTrack
                className="avatar-chat-settings-tabs"
                role="tablist"
                aria-label="Chat playground view"
              >
                {['playground', 'code'].map((view) => (
                  <button
                    type="button"
                    role="tab"
                    key={view}
                    id={`${tabsId}-${view}`}
                    aria-controls={`${tabsId}-panel-${view}`}
                    aria-selected={settingsView === view}
                    tabIndex={settingsView === view ? 0 : -1}
                    onClick={() => setSettingsView(view)}
                    onKeyDown={(event) => {
                      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                      event.preventDefault()
                      const next =
                        event.key === 'Home'
                          ? 'playground'
                          : event.key === 'End'
                            ? 'code'
                            : view === 'code'
                              ? 'playground'
                              : 'code'
                      setSettingsView(next)
                      event.currentTarget.parentElement
                        ?.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)
                        ?.focus()
                    }}
                    data-view={view}
                  >
                    {view === 'code' ? 'Code' : 'Customize'}
                  </button>
                ))}
              </SelectionTrack>
            }
          >
            <div
              className="avatar-chat-settings-view"
              role="tabpanel"
              id={`${tabsId}-panel-playground`}
              aria-labelledby={`${tabsId}-playground`}
              hidden={settingsView !== 'playground'}
            >
              <AvatarChatSettings
                theme={theme}
                library={library}
                state={state}
                online={chat.online}
                connect={chat.connect}
                replies={chat.replies}
                setReplies={chat.setReplies}
              />
            </div>
            {settingsView === 'code' && (
              <div role="tabpanel" id={`${tabsId}-panel-code`} aria-labelledby={`${tabsId}-code`}>
                <CodePanel
                  state={state}
                  onInstall={() => {
                    leave()
                    onInstall()
                  }}
                />
              </div>
            )}
            {studioLink && (
              <Link
                href={studioLink}
                navigate={navigate}
                className="text-button avatar-chat-studio"
              >
                Open in Studio <span aria-hidden="true">↗</span>
              </Link>
            )}
          </AvatarChatPanel>
        </div>
        {creating && (
          <CreateBot
            onClose={() => setCreating(false)}
            onCreate={(name, purpose) => {
              const profile = {
                id: crypto.randomUUID(),
                name,
                purpose,
                props: { ...state.exportedProps },
              }
              setBots((items) => [...items.slice(-19), profile])
              setBot(profile.id)
              setCreating(false)
            }}
          />
        )}
      </div>
      <script dangerouslySetInnerHTML={{ __html: initialChat }} />
    </dialog>
  )
}
