import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import Collapsible from '../components/Collapsible'
import EventCard from '../components/EventCard'
import MapView from '../components/MapView'
import GroupChat from '../components/GroupChat'

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'create',   label: 'Create',   icon: '➕' },
  { key: 'events',   label: 'Events',   icon: '📅' },
  { key: 'venues',   label: 'Venues',   icon: '🗺️' },
]

export default function CaptainDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [view, setView] = useState('overview')

  const [events, setEvents] = useState([])
  const [rules, setRules] = useState([])
  const [venues, setVenues] = useState([])
  const [polls, setPolls] = useState({})

  const [form, setForm] = useState({ title: '', sport: 'Football', time: '', place: '', size: 10 })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [voteEventId, setVoteEventId] = useState(null)
  const [pickedVenueIds, setPickedVenueIds] = useState([])
  const [voteSaving, setVoteSaving] = useState(false)
  const [captainLocation, setCaptainLocation] = useState(null)
  const [openChatId, setOpenChatId] = useState(null)

  useEffect(() => {
    if (!user?.id) navigate('/')
  }, [navigate, user?.id])

  const loadEvents = async () => {
    if (!user?.id) return
    setLoading(true); setMessage('')
    try {
      const response = await api.get('/events/list.php', { params: { user_id: user.id } })
      if (response.data.success) {
        setEvents(response.data.events)
        const pollMap = {}
        await Promise.all(response.data.events.map(async ev => {
          try {
            const r = await api.get('/polls/get.php', { params: { event_id: ev.id, user_id: user.id } })
            if (r.data?.poll) pollMap[ev.id] = r.data.poll
          } catch {}
        }))
        setPolls(pollMap)
      } else {
        setMessage(response.data.message || 'Could not load events')
      }
    } catch (err) {
      setMessage('Could not load events from the database.')
    } finally {
      setLoading(false)
    }
  }

  const loadRules = async () => {
    try {
      const r = await api.get('/sports/rules.php')
      if (r.data.success) setRules(r.data.rules)
    } catch {}
  }

  const loadVenues = async () => {
    try {
      const r = await api.get('/venues/list.php')
      if (r.data.success) setVenues(r.data.venues)
    } catch {}
  }

  const loadCaptainLocation = async () => {
    try {
      const r = await api.get('/profile/get.php', { params: { user_id: user.id } })
      if (r.data?.success) {
        const p = r.data.profile
        const lat = p.lat !== null && p.lat !== '' ? Number(p.lat) : null
        const lng = p.lng !== null && p.lng !== '' ? Number(p.lng) : null
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setCaptainLocation({ lat, lng, label: p.area || 'You' })
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (user?.id) {
      loadEvents()
      loadRules()
      loadVenues()
      loadCaptainLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const sportRule = useMemo(() => rules.find(r => r.sport === form.sport), [rules, form.sport])
  const sportOptions = useMemo(() => rules.length ? rules.map(r => r.sport) : ['Football', 'Basketball', 'Tennis', 'Running', 'Volleyball', 'Padel'], [rules])

  useEffect(() => {
    if (sportRule) {
      setForm(f => ({ ...f, size: Math.max(sportRule.min_players, Math.min(f.size || sportRule.min_players, sportRule.max_players)) }))
    }
  }, [sportRule])

  const createEvent = async event => {
    event.preventDefault()
    if (!form.title || !form.time || !form.place) return
    setSaving(true); setMessage('')
    try {
      const response = await api.post('/events/create.php', {
        title: form.title,
        sport: form.sport,
        location: form.place,
        event_time: form.time,
        max_players: form.size,
        captain_name: user?.name || 'Captain',
      })
      if (response.data.success) {
        setMessage('Event saved')
        setForm({ title: '', sport: form.sport, time: '', place: '', size: form.size })
        await loadEvents()
        setView('events')
      } else {
        setMessage(response.data.message || 'Could not create event')
      }
    } catch (err) {
      setMessage('Could not save the event.')
    } finally {
      setSaving(false)
    }
  }

  const getVenuesForEvent = (eventId) => {
    const sport = events.find(e => e.id === eventId)?.sport
    if (!sport) return venues
    return venues.filter(v => v.sport === sport || sport === 'Running')
  }

  const voteEvent = useMemo(() => events.find(e => e.id === voteEventId) || null, [events, voteEventId])
  const venuesForSport = getVenuesForEvent(voteEventId)

  const togglePickVenue = (id) => {
    setPickedVenueIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  const startVoteFor = (eventId) => {
    const event = events.find(e => e.id === eventId)
    const matchingVenues = getVenuesForEvent(eventId)
    setVoteEventId(eventId)
    setPickedVenueIds([])
    if (matchingVenues.length < 2) {
      setMessage(`Add at least two active ${event?.sport || 'matching'} venues before starting a vote.`)
    } else {
      setMessage('')
    }
  }

  const submitPoll = async () => {
    if (!voteEventId) return
    if (venuesForSport.length < 2) {
      setMessage('Add at least two matching venues before starting a vote.')
      return
    }
    if (pickedVenueIds.length < 2 || pickedVenueIds.length > 4) {
      setMessage('Pick between 2 and 4 venues before starting the poll.')
      return
    }
    setVoteSaving(true); setMessage('')
    try {
      const r = await api.post('/polls/create.php', {
        user_id: user.id,
        event_id: voteEventId,
        venue_ids: pickedVenueIds,
      })
      if (r.data.success) {
        setMessage('Venue poll started — members can vote now.')
        setVoteEventId(null); setPickedVenueIds([])
        await loadEvents()
      } else {
        setMessage(r.data.message || 'Could not start poll')
      }
    } catch {
      setMessage('Could not start poll.')
    } finally {
      setVoteSaving(false)
    }
  }

  const navItems = useMemo(() => ([
    NAV_ITEMS[0],
    NAV_ITEMS[1],
    { ...NAV_ITEMS[2], badge: events.length || null },
    { ...NAV_ITEMS[3], badge: Object.keys(polls).length || null },
  ]), [events.length, polls])

  const titleByView = {
    overview: { title: 'Captain desk', subtitle: 'Coordinate the group after the match is formed.' },
    create:   { title: 'Create event', subtitle: 'Group sizes follow the sport rules from admin.' },
    events:   { title: 'Your events', subtitle: 'Track confirmations and put venues to vote.' },
    venues:   { title: 'Venue assistance', subtitle: 'Browse and propose venues to your group.' },
  }

  return (
    <AppShell
      role="Captain"
      navItems={navItems}
      activeView={view}
      onChangeView={setView}
      pageTitle={titleByView[view].title}
      pageSubtitle={titleByView[view].subtitle}
      rightActions={
        <button className="icon-btn" title="Refresh" onClick={loadEvents} aria-label="Refresh">↻</button>
      }
    >
      {message && (
        <div className={`notice ${message.toLowerCase().includes('saved') || message.toLowerCase().includes('start') ? 'success' : ''}`}>
          {message}
        </div>
      )}

      {view === 'overview' && (
        <div className="section-grid stagger">
          <section className="hero-card slide-up">
            <div className="eyebrow">Captain tools</div>
            <h1>Get them on the pitch.</h1>
            <p>Pick details, compare venues, track confirmations and keep the plan clear enough that everyone can just show up.</p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => setView('create')}>
                <span aria-hidden>➕</span> Create event
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setView('events')}>Manage events</button>
            </div>
            <div className="hero-stats">
              <div><strong>{events.length}</strong><span>Events live</span></div>
              <div><strong>{Object.keys(polls).length}</strong><span>Active polls</span></div>
              <div><strong>{venues.length}</strong><span>Venues available</span></div>
            </div>
          </section>

          <div className="split-2">
            <Collapsible title="Sport rules in effect" help="From the admin desk." defaultOpen>
              <div className="form-grid">
                {(rules.length ? rules : []).map(r => (
                  <div className="card" key={r.sport} style={{ padding: 14 }}>
                    <div className="row-between">
                      <strong>{r.icon} {r.sport}</strong>
                      <span className="pill">{r.min_players}–{r.max_players}</span>
                    </div>
                    <div className="text-xs muted mt-1">{r.default_duration_min} min duration</div>
                  </div>
                ))}
                {rules.length === 0 && <div className="empty"><strong>No rules loaded</strong><span>Admin needs to seed sport rules.</span></div>}
              </div>
            </Collapsible>

            <Collapsible title="Recent events" help="Tap to manage." defaultOpen>
              {events.slice(0, 4).map(ev => (
                <EventCard key={ev.id} event={ev} showActions={false} />
              ))}
              {events.length === 0 && <div className="empty"><strong>No events yet</strong><span>Create your first one to start coordinating.</span></div>}
            </Collapsible>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="section-grid stagger">
          <section className="card">
            <div className="card-row">
              <div>
                <div className="card-title">New event</div>
                <div className="card-subtitle">{sportRule ? `${sportRule.icon} ${form.sport} · ${sportRule.min_players}–${sportRule.max_players} players` : 'Group size will follow sport rules.'}</div>
              </div>
            </div>

            <form className="section-grid" onSubmit={createEvent}>
              <div className="field">
                <label>Event name</label>
                <input placeholder="e.g. Sunset 5v5 at the park" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>Sport</label>
                  <select value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })}>
                    {sportOptions.map(sport => <option key={sport}>{sport}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>When</label>
                  <input type="datetime-local" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Where</label>
                  <input placeholder="Location" value={form.place} onChange={e => setForm({ ...form, place: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Group size {sportRule && <span className="text-xs muted">({sportRule.min_players}–{sportRule.max_players})</span>}</label>
                  <input
                    type="number"
                    min={sportRule?.min_players || 2}
                    max={sportRule?.max_players || 30}
                    value={form.size}
                    onChange={e => setForm({ ...form, size: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="row-between" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div className="text-xs muted">You'll be set as captain. Members join from their dashboard.</div>
                <div className="row gap-sm">
                  <button type="button" className="btn btn-ghost" onClick={() => setView('overview')}>Cancel</button>
                  <button className="btn btn-primary" disabled={saving}>
                    {saving && <span className="spinner" aria-hidden />}
                    {saving ? 'Creating…' : 'Create event'}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

      {view === 'events' && (
        <div className="section-grid stagger">
          {loading && (
            <div className="event-grid-3">
              <div className="skeleton" style={{ height: 200 }} />
              <div className="skeleton" style={{ height: 200 }} />
              <div className="skeleton" style={{ height: 200 }} />
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="empty">
              <strong>No events yet</strong>
              <span>Create your first event to get the group rolling.</span>
            </div>
          )}

          <div className="event-grid-3 stagger">
            {events.map(event => (
              <div key={event.id} className="card" style={{ padding: 0 }}>
                <EventCard event={event} showActions={false} />
                <div style={{ padding: '0 18px 18px', display: 'grid', gap: 8 }}>
                  {polls[event.id] ? (
                    <div className="row-between">
                      <span className="pill pill-success">Vote running</span>
                      <span className="text-xs muted">{polls[event.id].total_votes} votes</span>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => startVoteFor(event.id)}>
                      <span aria-hidden>🗳️</span> Put venue to vote
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => setOpenChatId(openChatId === event.id ? null : event.id)}>
                    {openChatId === event.id ? 'Hide chat' : '💬 Open chat'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {openChatId && events.find(e => e.id === openChatId) && (
            <GroupChat
              eventId={openChatId}
              title={`Chat — ${events.find(e => e.id === openChatId).title}`}
              subtitle={`Members of "${events.find(e => e.id === openChatId).title}" can post here.`}
              height={360}
            />
          )}

          {voteEventId && (
            <Collapsible
              title={`Pick 2–4 venues for "${events.find(e => e.id === voteEventId)?.title || 'event'}"`}
              help="Members will vote. We'll pick the most popular and surface it on their dashboard."
              defaultOpen
              right={
                <div className="row gap-sm">
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setVoteEventId(null) }}>Cancel</button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => { e.stopPropagation(); submitPoll() }}
                    disabled={voteSaving || pickedVenueIds.length < 2 || pickedVenueIds.length > 4 || venuesForSport.length < 2}
                    title={venuesForSport.length < 2 ? 'Add at least two matching venues first' : 'Start venue poll'}
                  >
                    {voteSaving && <span className="spinner" aria-hidden />}
                    {voteSaving ? 'Starting…' : `Start poll (${pickedVenueIds.length})`}
                  </button>
                </div>
              }
            >
              {venuesForSport.length < 2 && (
                <div className="notice">
                  Add at least two active {voteEvent?.sport || 'matching'} venues in the admin venue manager before starting a vote.
                </div>
              )}
              <MapView
                userLocation={captainLocation}
                markers={venuesForSport
                  .filter(v => Number.isFinite(Number(v.lat)) && Number.isFinite(Number(v.lng)))
                  .map(v => ({
                    id: v.id,
                    lat: Number(v.lat),
                    lng: Number(v.lng),
                    kind: pickedVenueIds.includes(v.id) ? 'event' : 'venue',
                    label: v.name,
                    subtitle: `${v.sport}${v.address ? ' · ' + v.address : ''}`,
                  }))}
                height={280}
              />
              <div className="event-grid-3 stagger" style={{ marginTop: 12 }}>
                {venuesForSport.map(v => {
                  const picked = pickedVenueIds.includes(v.id)
                  return (
                    <button
                      type="button"
                      key={v.id}
                      className={`card ${picked ? 'elevated' : ''}`}
                      onClick={() => togglePickVenue(v.id)}
                      style={{
                        textAlign: 'left',
                        padding: 16,
                        borderColor: picked ? 'var(--green)' : 'var(--line)',
                        background: picked ? 'linear-gradient(135deg, #f5fbf8, #ffffff)' : 'var(--paper)',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="row-between">
                        <strong style={{ fontSize: 14 }}>{v.name}</strong>
                        {picked && <span className="pill pill-success">✓</span>}
                      </div>
                      <div className="text-xs muted mt-1">{v.address || v.city || '—'}</div>
                      <div className="row gap-sm mt-2">
                        <span className="pill">{v.sport}</span>
                        <span className="pill">{v.price_per_hour ? `${v.currency} ${v.price_per_hour}/h` : 'Free'}</span>
                      </div>
                      {v.features?.length ? <div className="text-xs muted mt-1">{v.features.join(' · ')}</div> : null}
                    </button>
                  )
                })}
                {venuesForSport.length === 0 && <div className="empty"><strong>No venues match</strong><span>Admin can add some in the venue manager.</span></div>}
              </div>
            </Collapsible>
          )}
        </div>
      )}

      {view === 'venues' && (
        <div className="section-grid stagger">
          <div className="card">
            <div className="card-row">
              <div>
                <div className="card-title">Venue catalog</div>
                <div className="card-subtitle">From your admin team. Pick a few to put to vote.</div>
              </div>
              <span className="pill pill-info">{venues.length} venues</span>
            </div>
            <MapView
              userLocation={captainLocation}
              markers={venues
                .filter(v => Number.isFinite(Number(v.lat)) && Number.isFinite(Number(v.lng)))
                .map(v => ({
                  id: v.id,
                  lat: Number(v.lat),
                  lng: Number(v.lng),
                  kind: 'venue',
                  label: v.name,
                  subtitle: `${v.sport}${v.address ? ' · ' + v.address : ''}`,
                }))}
              height={320}
            />
            <div className="event-grid-3 stagger" style={{ marginTop: 12 }}>
              {venues.map(v => (
                <div className="card" key={v.id} style={{ padding: 16 }}>
                  <div className="row-between">
                    <strong>{v.name}</strong>
                    <span className="pill">{v.sport}</span>
                  </div>
                  <div className="text-xs muted mt-1">{v.address || v.city || '—'}</div>
                  <div className="row gap-sm mt-2">
                    <span className="pill">{v.price_per_hour ? `${v.currency} ${v.price_per_hour}/h` : 'Free'}</span>
                    {v.features?.slice(0, 2).map(f => <span className="pill" key={f}>{f}</span>)}
                  </div>
                </div>
              ))}
              {venues.length === 0 && <div className="empty"><strong>No venues yet</strong><span>Admin can add them in the admin desk.</span></div>}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
