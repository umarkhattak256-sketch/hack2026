import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import Collapsible from '../components/Collapsible'
import ProfilePicture from '../components/ProfilePicture'
import SportPicker from '../components/SportPicker'
import ShowUpTodayBanner from '../components/ShowUpTodayBanner'
import EventCard from '../components/EventCard'
import VenueVote from '../components/VenueVote'
import MapView from '../components/MapView'
import LocationPrompt from '../components/LocationPrompt'
import GroupChat from '../components/GroupChat'
import MatchPage from './MatchPage'
import { useShowUpToday } from '../hooks/useShowUpToday'
import { useActivePoll } from '../hooks/useActivePoll'
import { haversineKm } from '../lib/geo'

const seedPlayers = [
  { name: 'Maya', sport: 'Football', skill: 'Intermediate', area: 'Central Park', available: true },
  { name: 'Dani', sport: 'Football', skill: 'Beginner', area: 'Central Park', available: true },
  { name: 'Arman', sport: 'Basketball', skill: 'Advanced', area: 'Arena 12', available: true },
  { name: 'Sara', sport: 'Tennis', skill: 'Intermediate', area: 'Riverside Courts', available: true },
  { name: 'Leo', sport: 'Running', skill: 'Beginner', area: 'City Loop', available: false },
]

const NAV_ITEMS = [
  { key: 'home',    label: 'Today',   icon: '🏠' },
  { key: 'match',   label: 'Match',   icon: '✨' },
  { key: 'events',  label: 'Events',  icon: '📅' },
  { key: 'vote',    label: 'Venues',  icon: '🗺️' },
  { key: 'profile', label: 'Profile', icon: '👤' },
]

export default function MemberDashboard() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const [view, setView] = useState('home')

  const { respondedToday, respond, status: showUpStatus, availability } = useShowUpToday(user?.id)
  const { poll, loading: pollLoading, error: pollError, vote: votePoll } = useActivePoll(user?.id)

  const { register, handleSubmit, reset, watch, getValues } = useForm({
    defaultValues: {
      bio: 'Busy student, free most evenings, prefers friendly competitive games.',
      area: 'Central Park',
      city: '',
      lat: '',
      lng: '',
    },
  })

  const [profilePicUrl, setProfilePicUrl] = useState('')
  const [sportsInterests, setSportsInterests] = useState([{ sport: 'Football', skill: 'Intermediate', is_primary: true }])
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState('')
  const [joiningEventId, setJoiningEventId] = useState(null)
  const [eventView, setEventView] = useState('open')
  const [sportFilter, setSportFilter] = useState('All')
  const [sortBy, setSortBy] = useState('timeSoonest')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [aiDetecting, setAiDetecting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [aiError, setAiError] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [nearbyVenues, setNearbyVenues] = useState([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState(15)
  const [openChatEventId, setOpenChatEventId] = useState(null)

  const watchedBio = watch('bio')
  const watchedArea = watch('area')
  const primarySport = sportsInterests.find(s => s.is_primary) || sportsInterests[0] || { sport: 'Football', skill: 'Intermediate' }

  useEffect(() => {
    if (!user?.id) navigate('/')
  }, [navigate, user?.id])

  const loadProfile = async () => {
    if (!user?.id) return
    setProfileLoading(true)
    setProfileMessage('')

    try {
      const response = await api.get('/profile/get.php', { params: { user_id: user.id } })
      if (response.data.success) {
        const p = response.data.profile
        reset({
          bio: p.bio,
          area: p.area,
          city: p.city || '',
          lat: p.lat || '',
          lng: p.lng || '',
        })
        setProfilePicUrl(p.profile_pic_url || '')
        setSportsInterests(response.data.sports?.length ? response.data.sports : [{
          sport: p.sport,
          skill: p.skill,
          is_primary: true,
        }])
        const lat = p.lat !== null && p.lat !== '' ? Number(p.lat) : null
        const lng = p.lng !== null && p.lng !== '' ? Number(p.lng) : null
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setUserLocation({ lat, lng, label: p.area || p.city || 'You' })
        } else {
          setUserLocation(null)
        }
        if (p.profile_pic_url) {
          updateUser({ profile_pic_url: p.profile_pic_url })
        }
      } else {
        setProfileMessage(response.data.message || 'Could not load profile')
      }
    } catch (err) {
      setProfileMessage('Could not load your profile from the database.')
    } finally {
      setProfileLoading(false)
    }
  }

  const detectSportsFromBio = async () => {
    const bio = (getValues('bio') || '').trim()
    if (!bio) {
      setAiError('Write a bio first, then detect.')
      return
    }
    setAiDetecting(true)
    setAiError('')
    setAiSuggestions([])
    try {
      const res = await api.post('/profile/ai_detect.php', {
        user_id: user?.id,
        bio,
      })
      if (res.data.success) {
        // Only surface sports the user hasn't already added, so the chip
        // list is always "new things to add" rather than duplicates.
        const existing = new Set(sportsInterests.map(s => s.sport))
        const fresh = (res.data.suggestions || []).filter(s => !existing.has(s.sport))
        setAiSuggestions(fresh)
        if (fresh.length === 0 && (res.data.suggestions || []).length === 0) {
          setAiError('No sports confidently detected from that bio — try adding more detail.')
        }
      } else {
        setAiError(res.data.message || 'AI detection failed.')
      }
    } catch (e) {
      setAiError(e?.response?.data?.message || 'Could not reach AI detection service.')
    } finally {
      setAiDetecting(false)
    }
  }

  const addSuggestedSport = (suggestion) => {
    setSportsInterests(prev => {
      if (prev.some(s => s.sport === suggestion.sport)) return prev
      return [...prev, { sport: suggestion.sport, skill: suggestion.skill, is_primary: prev.length === 0 }]
    })
    setAiSuggestions(prev => prev.filter(s => s.sport !== suggestion.sport))
  }

  const saveProfile = async () => {
    if (!user?.id) return
    const values = getValues()
    const primary = sportsInterests.find(s => s.is_primary) || sportsInterests[0]

    setProfileSaving(true)
    setProfileMessage('')

    try {
      const response = await api.post('/profile/update.php', {
        user_id: user.id,
        bio: values.bio,
        sport: primary?.sport || 'Football',
        skill: primary?.skill || 'Intermediate',
        area: values.area,
        city: values.city,
        lat: values.lat,
        lng: values.lng,
      })
      const sportsResponse = await api.post('/profile/sports.php', {
        user_id: user.id,
        sports: sportsInterests,
      })

      if (response.data.success && sportsResponse.data.success) {
        setSportsInterests(sportsResponse.data.sports)
        setProfileMessage('Saved')
        setTimeout(() => setProfileMessage(''), 2200)
      } else {
        setProfileMessage(response.data.message || sportsResponse.data.message || 'Could not save profile')
      }
    } catch (err) {
      setProfileMessage('Could not save your profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const loadEvents = async () => {
    if (!user?.id) return
    setEventsLoading(true)
    setEventsError('')
    try {
      const response = await api.get('/events/list.php', { params: { user_id: user.id } })
      if (response.data.success) {
        setEvents(response.data.events)
      } else {
        setEventsError(response.data.message || 'Could not load events')
      }
    } catch (err) {
      setEventsError('Could not load events from the database.')
    } finally {
      setEventsLoading(false)
    }
  }

  const loadNearbyVenues = async (location, radiusKm) => {
    if (!location) return
    setNearbyLoading(true)
    try {
      const r = await api.get('/venues/list.php', {
        params: {
          near_lat: location.lat,
          near_lng: location.lng,
          radius_km: radiusKm,
          limit: 50,
        },
      })
      if (r.data.success) setNearbyVenues(r.data.venues || [])
    } catch {
      // non-fatal: panel can stay empty
    } finally {
      setNearbyLoading(false)
    }
  }

  useEffect(() => {
    if (userLocation) loadNearbyVenues(userLocation, nearbyRadiusKm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lat, userLocation?.lng, nearbyRadiusKm])

  useEffect(() => {
    if (user?.id) {
      loadProfile()
      loadEvents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const matches = useMemo(() => {
    const todayPrimary = availability?.sports?.[0] || primarySport.sport
    const sport = typeof todayPrimary === 'string' ? todayPrimary : todayPrimary.sport
    const sameSport = seedPlayers.filter(p => p.sport === sport && p.available)
    return [
      { name: user?.name || 'You', sport, skill: primarySport.skill, area: 'Central Park', available: availability?.available },
      ...sameSport,
    ]
  }, [availability?.available, availability?.sports, primarySport.skill, primarySport.sport, user?.name])

  const compatibility = Math.min(96, 58 + matches.length * 7 + (availability?.available ? 10 : 0))

  const eventSports = useMemo(() => {
    return ['All', ...Array.from(new Set(events.map(e => e.sport))).sort()]
  }, [events])

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => eventView === 'joined' ? e.joined : !e.joined)
      .filter(e => sportFilter === 'All' || e.sport === sportFilter)
      .sort((a, b) => {
        if (sortBy === 'timeLatest') return new Date(b.event_time) - new Date(a.event_time)
        if (sortBy === 'playersMost') return b.confirmed - a.confirmed
        if (sortBy === 'playersFewest') return a.confirmed - b.confirmed
        return new Date(a.event_time) - new Date(b.event_time)
      })
  }, [events, eventView, sportFilter, sortBy])

  const joinedCount = events.filter(e => e.joined).length
  const openCount = events.filter(e => !e.joined).length

  const joinEvent = async eventId => {
    setJoiningEventId(eventId); setEventsError('')
    try {
      const response = await api.post('/events/join.php', { user_id: user.id, event_id: eventId })
      if (response.data.success) await loadEvents()
      else setEventsError(response.data.message || 'Could not join event')
    } catch { setEventsError('Could not save your joined event.') }
    finally { setJoiningEventId(null) }
  }

  const leaveEvent = async eventId => {
    setJoiningEventId(eventId); setEventsError('')
    try {
      const response = await api.post('/events/leave.php', { user_id: user.id, event_id: eventId })
      if (response.data.success) await loadEvents()
      else setEventsError(response.data.message || 'Could not leave event')
    } catch { setEventsError('Could not update your joined event.') }
    finally { setJoiningEventId(null) }
  }

  const navItems = useMemo(() => ([
    { ...NAV_ITEMS[0] },
    { ...NAV_ITEMS[1] },
    { ...NAV_ITEMS[2], badge: joinedCount > 0 ? joinedCount : null },
    { ...NAV_ITEMS[3], badge: poll && poll.my_vote_option == null ? '!' : null },
    { ...NAV_ITEMS[4] },
  ]), [joinedCount, poll])

  const titleByView = {
    home: { title: `Hey, ${user?.name?.split(' ')[0] || 'there'}`, subtitle: respondedToday ? 'You answered for today.' : "Let's lock in today's plan." },
    match: { title: 'Smart group match', subtitle: `Generated for ${primarySport.sport} near ${watchedArea || 'your area'}` },
    events: { title: 'Events', subtitle: 'Browse open games or revisit your joined events.' },
    vote: { title: 'Venue vote', subtitle: 'Voice your pick on upcoming venue.' },
    profile: { title: 'Your profile', subtitle: 'Tune your bio, photo and sports — saved instantly.' },
  }

  return (
    <AppShell
      role="Member"
      navItems={navItems}
      activeView={view}
      onChangeView={setView}
      pageTitle={titleByView[view].title}
      pageSubtitle={titleByView[view].subtitle}
      rightActions={
        <div className="row gap-sm">
          <button className="icon-btn" title="Refresh events" onClick={loadEvents} aria-label="Refresh">
            ↻
          </button>
        </div>
      }
    >
      {view === 'home' && (
        <div className="section-grid stagger">
          <LocationPrompt
            userId={user?.id}
            currentLocation={userLocation}
            onLocation={(loc) => setUserLocation({ ...loc, label: 'You' })}
          />
          {!respondedToday ? (
            <ShowUpTodayBanner
              userSports={sportsInterests}
              status={showUpStatus}
              onRespond={async (isAvail, sports, window) => {
                await respond(isAvail, sports, window)
                if (isAvail) setView('match')
              }}
            />
          ) : (
            <section className="hero-card slide-up">
              <div className="eyebrow">All set</div>
              <h1>You answered for today.</h1>
              <p>Check back tomorrow for the next prompt — or jump into your match group right now.</p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => setView('match')}>
                  See today's match
                </button>
                <button className="btn btn-secondary" onClick={() => setView('events')}>
                  Browse events
                </button>
              </div>
              {availability?.sports && (
                <div className="hero-stats">
                  <div><strong>{Array.isArray(availability.sports) ? availability.sports.join(', ') : '—'}</strong><span>Sports today</span></div>
                  <div><strong>{availability.time_window || '—'}</strong><span>Time window</span></div>
                  <div><strong>{compatibility}%</strong><span>Match fit</span></div>
                </div>
              )}
            </section>
          )}

          <div className="split-2">
            <div className="card">
              <div className="card-row">
                <div>
                  <div className="card-title">Today's primary</div>
                  <div className="card-subtitle">Show this on event cards & matches</div>
                </div>
                <span className="pill pill-success">{primarySport.sport}</span>
              </div>
              <div className="match-row">
                <div className="avatar-mini">
                  {profilePicUrl
                    ? <img src={profilePicUrl} alt={user?.name} />
                    : <span>{(user?.name || 'U').slice(0, 2).toUpperCase()}</span>}
                </div>
                <div>
                  <strong>{user?.name || 'You'}</strong>
                  <span>{primarySport.skill} · {watchedArea || 'Your area'}</span>
                </div>
                <span className={`pill ${availability?.available ? 'pill-success' : 'pill-info'}`}>
                  {availability?.available ? 'Available' : (respondedToday ? 'Resting' : '—')}
                </span>
              </div>
            </div>

            <div className="card">
              <div className="card-row">
                <div>
                  <div className="card-title">Quick stats</div>
                  <div className="card-subtitle">From your activity this week</div>
                </div>
                <span className="pill pill-info">{events.length} events</span>
              </div>
              <div className="form-grid" style={{ gap: 14 }}>
                <div>
                  <strong style={{ fontSize: 22 }}>{joinedCount}</strong>
                  <div className="text-xs muted">Joined</div>
                </div>
                <div>
                  <strong style={{ fontSize: 22 }}>{openCount}</strong>
                  <div className="text-xs muted">Open near you</div>
                </div>
                <div>
                  <strong style={{ fontSize: 22 }}>{sportsInterests.length}</strong>
                  <div className="text-xs muted">Sports played</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-row">
              <div>
                <div className="card-title">Nearby venues</div>
                <div className="card-subtitle">
                  {userLocation
                    ? `Showing venues within ${nearbyRadiusKm} km of you.`
                    : 'Allow location above to see venues with km distances on a map.'}
                </div>
              </div>
              <div className="row gap-sm">
                <select
                  value={nearbyRadiusKm}
                  onChange={(e) => setNearbyRadiusKm(Number(e.target.value))}
                  style={{ minHeight: 36, paddingTop: 6, paddingBottom: 6 }}
                  disabled={!userLocation}
                  title="Search radius"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={15}>15 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
                <span className="pill pill-info">
                  {nearbyLoading ? '…' : `${nearbyVenues.length} venue${nearbyVenues.length === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>

            <MapView
              userLocation={userLocation}
              markers={nearbyVenues.map(v => ({
                id: v.id,
                lat: v.lat,
                lng: v.lng,
                kind: 'venue',
                label: v.name,
                subtitle: `${v.sport}${v.address ? ' · ' + v.address : ''}`,
                distance_km: v.distance_km,
              }))}
              height={340}
            />

            {userLocation && nearbyVenues.length > 0 && (
              <div className="section-grid" style={{ gap: 8, marginTop: 12 }}>
                {nearbyVenues.slice(0, 5).map(v => (
                  <div className="match-row" key={v.id}>
                    <div className="avatar-mini" aria-hidden>
                      <span style={{ fontSize: 18 }}>📍</span>
                    </div>
                    <div>
                      <strong>{v.name}</strong>
                      <span>{v.sport} · {v.address || v.city || '—'}</span>
                    </div>
                    <span className="pill pill-info">
                      {Number.isFinite(v.distance_km) ? `${v.distance_km.toFixed(1)} km` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {userLocation && !nearbyLoading && nearbyVenues.length === 0 && (
              <div className="empty">
                <strong>No venues within {nearbyRadiusKm} km</strong>
                <span>Try increasing the search radius.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'match' && (
        <MatchPage embedded />
      )}

      {view === 'events' && (
        <div className="section-grid">
          <div className="card">
            <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div className="segmented" role="tablist">
                <button className={eventView === 'open' ? 'active' : ''} onClick={() => setEventView('open')}>
                  Open <span className="count">{openCount}</span>
                </button>
                <button className={eventView === 'joined' ? 'active' : ''} onClick={() => setEventView('joined')}>
                  Joined <span className="count">{joinedCount}</span>
                </button>
              </div>
              <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
                <select value={sportFilter} onChange={e => setSportFilter(e.target.value)} style={{ minHeight: 40, paddingTop: 8, paddingBottom: 8 }}>
                  {eventSports.map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ minHeight: 40, paddingTop: 8, paddingBottom: 8 }}>
                  <option value="timeSoonest">Soonest</option>
                  <option value="timeLatest">Latest</option>
                  <option value="playersMost">Most joined</option>
                  <option value="playersFewest">Fewest joined</option>
                </select>
              </div>
            </div>

            <div className="divider" />

            <div className="row-between">
              <div>
                <div className="text-strong">Want to start your own?</div>
                <div className="text-xs muted">Captains create new events.</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/captain')}>Open captain desk →</button>
            </div>
          </div>

          {eventsError && <div className="notice">{eventsError}</div>}

          {eventsLoading && (
            <div className="event-grid-3">
              <div className="skeleton" style={{ height: 200 }} />
              <div className="skeleton" style={{ height: 200 }} />
              <div className="skeleton" style={{ height: 200 }} />
            </div>
          )}

          {!eventsLoading && filteredEvents.length === 0 && (
            <div className="empty">
              <strong>{eventView === 'joined' ? 'No joined events yet' : 'No open events here'}</strong>
              <span>{eventView === 'joined' ? 'Join an event and it will live here.' : 'Try changing the sport filter or sort.'}</span>
            </div>
          )}

          <div className="event-grid-3 stagger">
            {filteredEvents.map(event => (
              <div key={event.id} className="card" style={{ padding: 0 }}>
                <EventCard
                  event={event}
                  busy={joiningEventId === event.id}
                  onJoin={joinEvent}
                  onLeave={leaveEvent}
                />
                {event.joined && (
                  <div style={{ padding: '0 18px 18px' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setOpenChatEventId(openChatEventId === event.id ? null : event.id)}
                    >
                      {openChatEventId === event.id ? 'Hide chat' : '💬 Open chat'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {openChatEventId && events.find(e => e.id === openChatEventId) && (
            <GroupChat
              eventId={openChatEventId}
              title={`Chat — ${events.find(e => e.id === openChatEventId).title}`}
              subtitle={`Members of "${events.find(e => e.id === openChatEventId).title}" can post here.`}
              height={340}
            />
          )}
        </div>
      )}

      {view === 'vote' && (
        <div className="section-grid stagger">
          <div className="card">
            <div className="card-row">
              <div>
                <div className="card-title">Venue vote</div>
                <div className="card-subtitle">
                  {poll ? `Captain put ${poll.options?.length || 0} venues to a vote — pick your favourite.` : 'No active poll right now.'}
                </div>
              </div>
              {poll && <span className="pill pill-info">Total votes: {poll.total_votes}</span>}
            </div>

            <VenueVote
              poll={poll}
              loading={pollLoading}
              error={pollError}
              onVote={votePoll}
              emptyHint="When a captain runs a venue poll for an event you joined, it shows up here."
            />
          </div>

          {poll?.options?.some(o => Number.isFinite(Number(o.lat)) && Number.isFinite(Number(o.lng))) && (
            <div className="card">
              <div className="card-row">
                <div>
                  <div className="card-title">On the map</div>
                  <div className="card-subtitle">All candidates relative to your location.</div>
                </div>
              </div>
              <MapView
                userLocation={userLocation}
                markers={poll.options
                  .filter(o => Number.isFinite(Number(o.lat)) && Number.isFinite(Number(o.lng)))
                  .map(o => ({
                    id: `poll-${o.option_id}`,
                    lat: Number(o.lat),
                    lng: Number(o.lng),
                    kind: 'venue',
                    label: o.name,
                    subtitle: o.address || o.city || '',
                    distance_km: userLocation
                      ? haversineKm(userLocation.lat, userLocation.lng, Number(o.lat), Number(o.lng))
                      : null,
                  }))}
                height={300}
              />
            </div>
          )}
        </div>
      )}

      {view === 'profile' && (
        <div className="section-grid stagger">
          <Collapsible
            title="Photo & basics"
            help="Avatar, bio and area show up in matches and event cards."
            defaultOpen
            right={profileMessage ? <span className="pill pill-success">{profileMessage}</span> : null}
          >
            <ProfilePicture user={user} imageUrl={profilePicUrl} onUploaded={(url) => {
              setProfilePicUrl(url)
              updateUser({ profile_pic_url: url })
            }} />
            <div className="divider" />
            <div className="field">
              <label>Short bio</label>
              <textarea {...register('bio')} placeholder="Two sentences about your playing style." />
              <div className="row-between" style={{ marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={detectSportsFromBio}
                  disabled={aiDetecting}
                >
                  {aiDetecting ? 'Detecting…' : '🤖 Detect sports from bio'}
                </button>
                {aiError ? <span className="text-xs" style={{ color: '#b91c1c' }}>{aiError}</span> : null}
              </div>
              {aiSuggestions.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {aiSuggestions.map((s) => (
                    <button
                      type="button"
                      key={s.sport}
                      className="chip"
                      onClick={() => addSuggestedSport(s)}
                      title={`AI confidence: ${Math.round(s.confidence * 100)}%`}
                    >
                      + Add {s.sport} ({s.skill})
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-grid mt-2">
              <div className="field"><label>Area</label><input {...register('area')} /></div>
              <div className="field"><label>City</label><input {...register('city')} placeholder="e.g. Islamabad" /></div>
              <div className="field"><label>Latitude</label><input {...register('lat')} placeholder="Optional" /></div>
              <div className="field"><label>Longitude</label><input {...register('lng')} placeholder="Optional" /></div>
            </div>
          </Collapsible>

          <Collapsible
            title="Sports & skill"
            help="Tap a sport to add it. Star one as primary."
            defaultOpen
          >
            <SportPicker sports={sportsInterests} onChange={setSportsInterests} />
          </Collapsible>

          <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="text-xs muted">Profile changes save to the database when you press the button.</div>
            <button
              className="btn btn-primary"
              onClick={handleSubmit(() => saveProfile())}
              disabled={profileSaving || profileLoading}
            >
              {profileSaving && <span className="spinner" aria-hidden />}
              {profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
