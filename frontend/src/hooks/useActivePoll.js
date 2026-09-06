import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'

export function useActivePoll(userId) {
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const probe = await api.get('/polls/active.php', { params: { user_id: userId } })
      if (!probe.data?.poll) {
        setPoll(null)
        return
      }
      const detail = await api.get('/polls/get.php', {
        params: { id: probe.data.poll.id, user_id: userId },
      })
      setPoll(detail.data?.poll || null)
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load active poll')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const vote = useCallback(async (optionId) => {
    if (!poll || !userId) return
    setError('')
    const previous = poll
    setPoll(prev => {
      if (!prev) return prev
      const previousOption = prev.my_vote_option
      const options = prev.options.map(opt => {
        let votes = opt.votes
        if (opt.option_id === optionId) votes += 1
        if (opt.option_id === previousOption && previousOption !== optionId) votes = Math.max(votes - 1, 0)
        return { ...opt, votes }
      })
      const total = options.reduce((sum, o) => sum + o.votes, 0)
      return { ...prev, options, total_votes: total, my_vote_option: optionId }
    })
    try {
      const response = await api.post('/venues/vote.php', { user_id: userId, poll_id: poll.id, option_id: optionId })
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Could not save vote')
      }
      await load()
    } catch (err) {
      setPoll(previous)
      setError(err?.response?.data?.message || err?.message || 'Could not save vote')
    }
  }, [poll, userId, load])

  return { poll, loading, error, vote, reload: load }
}
