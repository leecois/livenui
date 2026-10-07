import { useEffect, useRef, useState } from 'react'
import { avatarDemoReply } from '../lib/avatar-chat'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  name?: string
}

type Conversation = { id: string; title: string; messages: ChatMessage[] }

export function useAvatarChat() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 'initial', title: 'New chat', messages: [] },
  ])
  const [active, setActive] = useState('initial')
  const [draft, setDraft] = useState('')
  const [online, setOnline] = useState(true)
  const [replies, setReplies] = useState('Stream')
  const [pending, setPending] = useState<{
    conversation: string
    message: string
    text: string
    token: number
  }>()
  const generation = useRef(0)
  const progress = useRef(0)
  const current = conversations.find((item) => item.id === active) ?? conversations[0]
  useEffect(() => {
    if (!pending) return
    let position = progress.current
    const paint = () => {
      if (pending.token !== generation.current) return
      position =
        replies === 'Instant' ? pending.text.length : Math.min(position + 8, pending.text.length)
      progress.current = position
      setConversations((items) =>
        items.map((item) =>
          item.id === pending.conversation
            ? {
                ...item,
                messages: item.messages.map((message) =>
                  message.id === pending.message
                    ? { ...message, text: pending.text.slice(0, position) }
                    : message
                ),
              }
            : item
        )
      )
      if (position === pending.text.length) {
        clearInterval(timer)
        setPending(undefined)
      }
    }
    const timer = setInterval(paint, 30)
    return () => clearInterval(timer)
  }, [pending, replies])
  useEffect(
    () => () => {
      generation.current++
    },
    []
  )
  const stop = () => {
    generation.current++
    if (pending)
      setConversations((items) =>
        items.map((item) =>
          item.id === pending.conversation
            ? {
                ...item,
                messages: item.messages.map((message) =>
                  message.id === pending.message && !message.text
                    ? { ...message, text: 'Response stopped.' }
                    : message
                ),
              }
            : item
        )
      )
    setPending(undefined)
  }
  const send = (text: string, name: string, title?: string) => {
    const value = text.trim().slice(0, 2000)
    if (!value || !online || pending) return
    const token = ++generation.current
    progress.current = 0
    const message = crypto.randomUUID()
    setConversations((items) =>
      items.map((item) =>
        item.id === active
          ? {
              ...item,
              title: item.messages.length ? item.title : (title || value).slice(0, 60),
              messages: [
                ...item.messages.slice(-38),
                { id: crypto.randomUUID(), role: 'user', text: value },
                { id: message, role: 'assistant', text: '', name },
              ],
            }
          : item
      )
    )
    setDraft('')
    setPending({ conversation: active, message, text: avatarDemoReply(value, name), token })
  }
  const newChat = () => {
    stop()
    const id = crypto.randomUUID()
    setConversations((items) => [...items.slice(-19), { id, title: 'New chat', messages: [] }])
    setActive(id)
    setDraft('')
  }
  const select = (id: string) => {
    stop()
    setActive(id)
    setDraft('')
  }
  const connect = (value: boolean) => {
    if (!value) stop()
    setOnline(value)
  }
  return {
    conversations,
    current,
    draft,
    setDraft,
    online,
    connect,
    replies,
    setReplies,
    pending,
    send,
    stop,
    newChat,
    select,
  }
}
