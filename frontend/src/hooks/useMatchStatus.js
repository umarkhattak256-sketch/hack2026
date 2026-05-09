import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api'

// Polls /api/matching/status.php while the group is in forming|ready, and once
// every 6s while confirmed (waiting on others) or event_created (so we hand the
// final state back). Stops polling when status === 'cancelled'.
export function useMatchStatus(groupId, userId, { intervalMs = 3000 } = {}) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef(null)
  const stoppedRef = useRef(false)

  const fetchOnce = useCallback(async () => {
    if (!groupId) return
    try {
      const r = await api.get('/matching/status.php', {
        params: { group_id: groupId, user_id: userId },
      })
      if (r.data?.success) {
        setStatus(r.data)
        setError('')
        if (r.data.group?.status === 'cancelled') {
          stoppedRef.current = true
        }
      } else {
        setError(r.data?.message || 'Could not load match status')
      }
    } catch (e) {
      setError('Could not load match status')
    }
  }, [groupId, userId])

  useEffect(() => {
    if (!groupId) {
      setStatus(null)
      return
    }
    let cancelled = false
    stoppedRef.current = false
    setLoading(true)
    fetchOnce().finally(() => { if (!cancelled) setLoading(false) })

    const tick = async () => {
      if (cancelled || stoppedRef.current) return
      await fetchOnce()
      if (!cancelled && !stoppedRef.current) {
        // Slow the polling once finalized.
        const groupStatus = (status?.group?.status) || ''
        const delay = groupStatus === 'event_created' ? Math.max(intervalMs * 3, 6000) : intervalMs
        timerRef.current = setTimeout(tick, delay)
      }
    }
    timerRef.current = setTimeout(tick, intervalMs)
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, userId, intervalMs])

  const confirm = useCallback(async () => {
    if (!groupId || !userId) return
    setError('')
    try {
      const r = await api.post('/matching/confirm.php', { group_id: groupId, user_id: userId })
      if (r.data?.success) {
        await fetchOnce()
        return r.data
      }
      setError(r.data?.message || 'Could not confirm')
    } catch {
      setError('Could not confirm match')
    }
  }, [groupId, userId, fetchOnce])

  const decline = useCallback(async () => {
    if (!groupId || !userId) return
    setError('')
    try {
      const r = await api.post('/matching/decline.php', { group_id: groupId, user_id: userId })
      if (r.data?.success) {
        await fetchOnce()
        return r.data
      }
      setError(r.data?.message || 'Could not decline')
    } catch {
      setError('Could not decline match')
    }
  }, [groupId, userId, fetchOnce])

  return { status, loading, error, confirm, decline, refresh: fetchOnce }
}
