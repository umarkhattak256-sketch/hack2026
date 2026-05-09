import { useEffect, useState } from 'react'
import api from '../services/api'

const STORAGE_KEY = 's2m_location_prompt_dismissed'

// One-time location ask. Component shows if:
//   - The user has not dismissed the prompt this browser, AND
//   - The user does not yet have lat/lng on their profile.
// On grant: posts to /api/profile/location.php and calls onLocation(coords).
// On deny: stays hidden for the rest of the session.
export default function LocationPrompt({ userId, currentLocation = null, onLocation }) {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    const alreadyHasCoords =
      currentLocation && Number.isFinite(currentLocation.lat) && Number.isFinite(currentLocation.lng)
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === '1'
    if (alreadyHasCoords || dismissed) {
      setVisible(false)
      return
    }
    if (!('geolocation' in navigator)) {
      setVisible(false)
      return
    }
    setVisible(true)
  }, [userId, currentLocation])

  if (!visible) return null

  const grant = () => {
    setBusy(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const r = await api.post('/profile/location.php', { user_id: userId, lat, lng })
          if (r.data?.success) {
            onLocation?.({ lat, lng })
            sessionStorage.setItem(STORAGE_KEY, '1')
            setVisible(false)
          } else {
            setError(r.data?.message || 'Could not save your location')
          }
        } catch {
          setError('Could not save your location to the server.')
        } finally {
          setBusy(false)
        }
      },
      (err) => {
        setBusy(false)
        if (err?.code === 1) {
          // Permission denied — respect it for the session.
          sessionStorage.setItem(STORAGE_KEY, '1')
          setVisible(false)
        } else {
          setError(err?.message || 'Could not read your location')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="card slide-down" style={{ borderColor: 'rgba(20,164,108,0.35)', background: 'linear-gradient(135deg, #f5fbf8, #ffffff)' }}>
      <div className="card-row">
        <div>
          <div className="card-title">Use your location to find nearby games?</div>
          <div className="card-subtitle">We'll match you to venues and groups within reach. Approximate, never shared with other users.</div>
        </div>
        <span aria-hidden style={{ fontSize: 32 }}>📍</span>
      </div>
      {error && <div className="notice" style={{ marginTop: 8 }}>{error}</div>}
      <div className="row gap-sm" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" onClick={grant} disabled={busy}>
          {busy && <span className="spinner" aria-hidden />}
          {busy ? 'Locating…' : 'Allow location'}
        </button>
        <button className="btn btn-ghost" onClick={dismiss} disabled={busy}>Not now</button>
      </div>
    </div>
  )
}
