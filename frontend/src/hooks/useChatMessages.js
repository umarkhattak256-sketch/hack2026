import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api'

// Polls /api/chat/list.php every `intervalMs` (default 3s), passing
// since_id=lastSeenId to keep the response small. send() optimistically appends,
// rolls back on failure.
export function useChatMessages({ groupId = null, eventId = null, userId, intervalMs = 3000 } = {}) {
  const [messages, setMessages] = useState([])
  const [lastId, setLastId] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const lastIdRef = useRef(0)
  const messagesRef = useRef([])
  const timerRef = useRef(null)
  const channelKey = `${groupId || ''}-${eventId || ''}`

  // Reset whenever the channel changes.
  useEffect(() => {
    setMessages([])
    setLastId(0)
    lastIdRef.current = 0
    messagesRef.current = []
    setError('')
  }, [channelKey])

  const fetchOnce = useCallback(async () => {
    if (!groupId && !eventId) return
    try {
      const params = { since_id: lastIdRef.current, limit: 100 }
      if (groupId) params.group_id = groupId
      if (eventId) params.event_id = eventId
      if (userId) params.user_id = userId
      const r = await api.get('/chat/list.php', { params })
      if (r.data?.success) {
        const incoming = r.data.messages || []
        if (incoming.length > 0) {
          // Merge with optimistic items (which have id < 0). Replace optimistics
          // by body + user_id match.
          const merged = [...messagesRef.current]
          incoming.forEach(m => {
            const optIdx = merged.findIndex(x => x.id < 0 && x.user_id === m.user_id && x.body === m.body)
            if (optIdx >= 0) merged.splice(optIdx, 1, m)
            else if (!merged.some(x => x.id === m.id)) merged.push(m)
          })
          merged.sort((a, b) => a.id - b.id)
          messagesRef.current = merged
          setMessages(merged)
          lastIdRef.current = r.data.last_id || lastIdRef.current
          setLastId(lastIdRef.current)
        }
        setError('')
      } else {
        setError(r.data?.message || 'Could not load messages')
      }
    } catch {
      setError('Could not load messages')
    }
  }, [groupId, eventId, userId])

  useEffect(() => {
    if (!groupId && !eventId) return
    let cancelled = false
    setLoading(true)
    fetchOnce().finally(() => { if (!cancelled) setLoading(false) })

    const tick = async () => {
      if (cancelled) return
      await fetchOnce()
      if (!cancelled) timerRef.current = setTimeout(tick, intervalMs)
    }
    timerRef.current = setTimeout(tick, intervalMs)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [channelKey, intervalMs, fetchOnce, groupId, eventId])

  const send = useCallback(async (body) => {
    const trimmed = (body || '').trim()
    if (!trimmed || sending) return false
    if (!userId) {
      setError('You must be signed in to chat')
      return false
    }
    setSending(true)
    setError('')

    // Optimistic append with negative id.
    const tmpId = -(Date.now())
    const optimistic = {
      id: tmpId,
      group_id: groupId,
      event_id: eventId,
      user_id: userId,
      body: trimmed,
      created_at: new Date().toISOString(),
      user: { id: userId, name: 'You', profile_pic_url: null },
      _optimistic: true,
    }
    messagesRef.current = [...messagesRef.current, optimistic]
    setMessages(messagesRef.current)

    try {
      const payload = { user_id: userId, body: trimmed }
      if (groupId) payload.group_id = groupId
      if (eventId) payload.event_id = eventId
      const r = await api.post('/chat/send.php', payload)
      if (r.data?.success) {
        // Replace optimistic with real.
        messagesRef.current = messagesRef.current.map(m => m.id === tmpId ? r.data.message : m)
        setMessages(messagesRef.current)
        if (r.data.message.id > lastIdRef.current) {
          lastIdRef.current = r.data.message.id
          setLastId(lastIdRef.current)
        }
        return true
      }
      // Revert on failure.
      messagesRef.current = messagesRef.current.filter(m => m.id !== tmpId)
      setMessages(messagesRef.current)
      setError(r.data?.message || 'Could not send message')
      return false
    } catch {
      messagesRef.current = messagesRef.current.filter(m => m.id !== tmpId)
      setMessages(messagesRef.current)
      setError('Could not send message')
      return false
    } finally {
      setSending(false)
    }
  }, [groupId, eventId, userId, sending])

  return { messages, loading, error, send, sending, lastId, refresh: fetchOnce }
}
