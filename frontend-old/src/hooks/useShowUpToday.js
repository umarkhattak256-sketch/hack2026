import { useState, useEffect } from 'react'
import axios from 'axios'

export function useShowUpToday(userId) {
  const [respondedToday, setRespondedToday] = useState(false)
  const [status, setStatus] = useState('loading') // 'loading' | 'idle' | 'submitting'
  const [availability, setAvailability] = useState(null)

  useEffect(() => {
    if (!userId) return

    const checkToday = async () => {
      try {
        setStatus('loading')
        const response = await axios.get('/api/availability/today.php', {
          params: { user_id: userId }
        })
        if (response.data.success && response.data.data !== null) {
          setRespondedToday(true)
          setAvailability(response.data.data)
        } else {
          setRespondedToday(false)
        }
      } catch (err) {
        console.error('Failed to check today availability', err)
      } finally {
        setStatus('idle')
      }
    }

    checkToday()
  }, [userId])

  const respond = async (isAvailable, sports = null, timeWindow = null) => {
    if (!userId) return
    setStatus('submitting')
    
    try {
      const payload = {
        user_id: userId,
        available: isAvailable
      }
      if (isAvailable) {
        if (sports) payload.sports = sports
        if (timeWindow) payload.time_window = timeWindow
      }

      await axios.post('/api/availability/respond.php', payload)
      
      setRespondedToday(true)
      setAvailability({ available: isAvailable, sports, time_window: timeWindow })
      
      return true
    } catch (err) {
      console.error('Failed to respond availability', err)
      return false
    } finally {
      setStatus('idle')
    }
  }

  return { respondedToday, respond, status, availability }
}
