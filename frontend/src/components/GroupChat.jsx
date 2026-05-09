import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChatMessages } from '../hooks/useChatMessages'

// GroupChat — list + composer for a group or event chat.
// Pass groupId for the matching/group chat, OR eventId for an event chat.
// Polls every 3s via useChatMessages, only fetching since_id=lastSeenId.
export default function GroupChat({ groupId = null, eventId = null, title = 'Group chat', subtitle, height = 320 }) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)

  const { messages, loading, error, send, sending } = useChatMessages({
    groupId,
    eventId,
    userId: user?.id,
  })

  // Auto-scroll to bottom on new messages, but only if the user is already pinned to bottom.
  const wasAtBottomRef = useRef(true)
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    if (wasAtBottomRef.current) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const onScroll = (e) => {
    const el = e.currentTarget
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    wasAtBottomRef.current = distanceFromBottom < 40
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    const ok = await send(draft)
    if (ok) {
      setDraft('')
      wasAtBottomRef.current = true
    }
  }

  const fmtTime = (ts) => {
    if (!ts) return ''
    try {
      const d = new Date(ts)
      if (isNaN(d.getTime())) {
        const norm = ts.replace(' ', 'T') + 'Z'
        const dn = new Date(norm)
        if (!isNaN(dn.getTime())) return dn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return ts
      }
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  if (!groupId && !eventId) {
    return (
      <div className="card">
        <div className="empty">
          <strong>No chat yet</strong>
          <span>Once you're in a group or event, the chat opens up here.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-row">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-subtitle">{subtitle || `Polls every 3s · ${messages.length} message${messages.length === 1 ? '' : 's'}`}</div>
        </div>
        {loading && messages.length === 0 && <span className="spinner" aria-hidden />}
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="chat-list"
        style={{ height, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}
      >
        {messages.length === 0 && !loading && (
          <div className="empty" style={{ margin: 'auto' }}>
            <strong>Say hi 👋</strong>
            <span>Be the first to post in this chat.</span>
          </div>
        )}

        {messages.map(m => {
          const mine = m.user_id === user?.id
          return (
            <div
              key={m.id}
              className={`chat-msg ${mine ? 'you' : ''}`}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                background: mine ? 'linear-gradient(135deg, #14a46c, #0d7f55)' : 'var(--field)',
                color: mine ? 'white' : 'var(--ink)',
                borderRadius: 14,
                padding: '8px 12px',
                maxWidth: '78%',
                opacity: m._optimistic ? 0.65 : 1,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2, opacity: 0.85 }}>
                {mine ? 'You' : (m.user?.name || 'Member')}
                <span style={{ marginLeft: 8, fontWeight: 500, opacity: 0.75 }}>{fmtTime(m.created_at)}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
            </div>
          )
        })}
      </div>

      {error && <div className="notice" style={{ marginTop: 8 }}>{error}</div>}

      <form onSubmit={onSubmit} className="row gap-sm" style={{ marginTop: 12 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message your group…"
          maxLength={2000}
          style={{ flex: 1, minHeight: 44, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', background: 'var(--field)' }}
          disabled={sending}
        />
        <button className="btn btn-primary" type="submit" disabled={sending || !draft.trim()}>
          {sending && <span className="spinner" aria-hidden />}
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
