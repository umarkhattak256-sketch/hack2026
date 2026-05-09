import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function CaptainDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ title: '', sport: 'Football', time: '', place: '', size: 10 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user?.id) navigate('/')
  }, [navigate, user?.id])

  const loadEvents = async () => {
    if (!user?.id) return
    setLoading(true)
    setMessage('')

    try {
      const response = await axios.get('/api/events/list.php', {
        params: { user_id: user.id },
      })

      if (response.data.success) {
        setEvents(response.data.events)
      } else {
        setMessage(response.data.message || 'Could not load events')
      }
    } catch (err) {
      console.error('Captain events API request failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setMessage('Could not load events from the database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [user?.id])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const createEvent = async event => {
    event.preventDefault()
    if (!form.title || !form.time || !form.place) return
    setSaving(true)
    setMessage('')

    try {
      const response = await axios.post('/api/events/create.php', {
        title: form.title,
        sport: form.sport,
        location: form.place,
        event_time: form.time,
        max_players: form.size,
        captain_name: user?.name || 'Captain',
      })

      if (response.data.success) {
        setMessage('Event saved to database')
        setForm({ title: '', sport: 'Football', time: '', place: '', size: 10 })
        await loadEvents()
      } else {
        setMessage(response.data.message || 'Could not create event')
      }
    } catch (err) {
      console.error('Create event API request failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setMessage('Could not save the event.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand-mark">S2M</div>
        <div>
          <strong>ShowUp2Move</strong>
          <span>Captain desk</span>
        </div>
        <nav>
          <a href="#events">Events</a>
          <a href="#venues">Venues</a>
        </nav>
        <button className="quiet-btn" onClick={logout}>Log out</button>
      </header>

      <main className="workspace-grid">
        <section className="panel hero-panel wide-panel">
          <div className="eyebrow">Captain tools</div>
          <h1>Coordinate the group after the match is formed.</h1>
          <p>Assign details, compare venues, track confirmations and keep the plan clear enough that everyone can just show up.</p>
        </section>

        <section className="panel">
          <div className="section-title">Create Manual Event</div>
          <p className="muted-text form-hint">Members join events from the member dashboard. This form is where captains create new events for everyone.</p>
          {message && <div className={message.includes('saved') ? 'notice success' : 'notice'}>{message}</div>}
          <form className="stack-form" onSubmit={createEvent}>
            <input placeholder="Event name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })}>
              {['Football', 'Basketball', 'Tennis', 'Running', 'Volleyball'].map(sport => <option key={sport}>{sport}</option>)}
            </select>
            <input type="datetime-local" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            <input placeholder="Location" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} />
            <input type="number" min="2" value={form.size} onChange={e => setForm({ ...form, size: Number(e.target.value) })} />
            <button disabled={saving}>{saving ? 'Creating...' : 'Create event'}</button>
          </form>
        </section>

        <section id="events" className="panel wide-panel">
          <div className="section-row events-heading">
            <div className="section-title">Event Coordination</div>
            <button className="quiet-btn refresh-btn" onClick={loadEvents} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="event-grid">
            {events.map(event => (
              <article className="event-card" key={event.id}>
                <div className="sport-pill">{event.sport}</div>
                <h3>{event.title}</h3>
                <p>{event.time}</p>
                <p>{event.place}</p>
                <div className="progress-line"><span style={{ width: `${Math.min(100, event.confirmed / event.max_players * 100)}%` }} /></div>
                <div className="section-row">
                  <span>{event.confirmed}/{event.max_players} confirmed</span>
                  <small>Captain: {event.captain}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="venues" className="panel wide-panel">
          <div className="section-title">Venue Assistance</div>
          <div className="venue-table">
            {[
              ['Central Park Pitch', '$24/hour', '8 min walk', 'Best value'],
              ['Arena 12', '$36/hour', 'Near metro', 'Indoor lights'],
              ['Riverside Courts', '$18/hour', '12 min bike', 'Good for tennis'],
            ].map(row => (
              <div className="venue-row" key={row[0]}>
                {row.map(cell => <span key={cell}>{cell}</span>)}
                <button>Put to vote</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
