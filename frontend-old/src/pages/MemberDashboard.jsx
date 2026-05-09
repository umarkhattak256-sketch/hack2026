import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import ProfilePicture from '../components/ProfilePicture'
import SportPicker from '../components/SportPicker'
import ShowUpTodayBanner from '../components/ShowUpTodayBanner'
import { useShowUpToday } from '../hooks/useShowUpToday'

const seedPlayers = [
  { name: 'Maya', sport: 'Football', skill: 'Intermediate', area: 'Central Park', available: true },
  { name: 'Dani', sport: 'Football', skill: 'Beginner', area: 'Central Park', available: true },
  { name: 'Arman', sport: 'Basketball', skill: 'Advanced', area: 'Arena 12', available: true },
  { name: 'Sara', sport: 'Tennis', skill: 'Intermediate', area: 'Riverside Courts', available: true },
  { name: 'Leo', sport: 'Running', skill: 'Beginner', area: 'City Loop', available: false },
]

export default function MemberDashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const { respondedToday, respond, status: showUpStatus, availability } = useShowUpToday(user.id)
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
  const watchedBio = watch('bio')
  const watchedArea = watch('area')
  const primarySport = sportsInterests.find(item => item.is_primary) || sportsInterests[0] || { sport: 'Football', skill: 'Intermediate' }
  const profile = {
    bio: watchedBio,
    sport: primarySport.sport,
    skill: primarySport.skill,
    area: watchedArea,
  }

  useEffect(() => {
    if (!user?.id) navigate('/')
  }, [navigate, user?.id])

  const loadProfile = async () => {
    if (!user?.id) return
    setProfileLoading(true)
    setProfileMessage('')

    try {
      const response = await axios.get('/api/profile/get.php', {
        params: { user_id: user.id },
      })

      if (response.data.success) {
        reset({
          bio: response.data.profile.bio,
          area: response.data.profile.area,
          city: response.data.profile.city || '',
          lat: response.data.profile.lat || '',
          lng: response.data.profile.lng || '',
        })
        setProfilePicUrl(response.data.profile.profile_pic_url || '')
        setSportsInterests(response.data.sports?.length ? response.data.sports : [{
          sport: response.data.profile.sport,
          skill: response.data.profile.skill,
          is_primary: true,
        }])
      } else {
        setProfileMessage(response.data.message || 'Could not load profile')
      }
    } catch (err) {
      console.error('Profile API request failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setProfileMessage('Could not load your profile from the database.')
    } finally {
      setProfileLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!user?.id) return
    const values = getValues()
    const primary = sportsInterests.find(item => item.is_primary) || sportsInterests[0]

    setProfileSaving(true)
    setProfileMessage('')

    try {
      const response = await axios.post('/api/profile/update.php', {
        user_id: user.id,
        bio: values.bio,
        sport: primary?.sport || 'Football',
        skill: primary?.skill || 'Intermediate',
        area: values.area,
        city: values.city,
        lat: values.lat,
        lng: values.lng,
      })
      const sportsResponse = await axios.post('/api/profile/sports.php', {
        user_id: user.id,
        sports: sportsInterests,
      })

      if (response.data.success && sportsResponse.data.success) {
        setSportsInterests(sportsResponse.data.sports)
        setProfileMessage('Saved to database')
      } else {
        setProfileMessage(response.data.message || sportsResponse.data.message || 'Could not save profile')
      }
    } catch (err) {
      console.error('Save profile API request failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
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
      const response = await axios.get('/api/events/list.php', {
        params: { user_id: user.id },
      })

      if (response.data.success) {
        setEvents(response.data.events)
      } else {
        setEventsError(response.data.message || 'Could not load events')
      }
    } catch (err) {
      console.error('Events API request failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setEventsError('Could not load events from the database.')
    } finally {
      setEventsLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    loadEvents()
  }, [user?.id])

  const matches = useMemo(() => {
    const todayPrimaryInfo = availability?.sports?.[0] || 'Football'
    const sameSport = seedPlayers.filter(player => player.sport === (typeof todayPrimaryInfo === 'string' ? todayPrimaryInfo : todayPrimaryInfo.sport) && player.available)
    return [
      { name: user?.name || 'You', sport: typeof todayPrimaryInfo === 'string' ? todayPrimaryInfo : todayPrimaryInfo.sport, skill: 'Intermediate', area: 'Central Park', available: availability?.available },
      ...sameSport,
    ]
  }, [availability?.available, availability?.sports, user?.name])

  const compatibility = Math.min(96, 58 + matches.length * 7 + (availability?.available ? 10 : 0))

  const eventSports = useMemo(() => {
    return ['All', ...Array.from(new Set(events.map(event => event.sport))).sort()]
  }, [events])

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => eventView === 'joined' ? event.joined : !event.joined)
      .filter(event => sportFilter === 'All' || event.sport === sportFilter)
      .sort((a, b) => {
        if (sortBy === 'timeLatest') return new Date(b.event_time) - new Date(a.event_time)
        if (sortBy === 'playersMost') return b.confirmed - a.confirmed
        if (sortBy === 'playersFewest') return a.confirmed - b.confirmed
        return new Date(a.event_time) - new Date(b.event_time)
      })
  }, [events, eventView, sportFilter, sortBy])

  const joinedCount = events.filter(event => event.joined).length
  const openCount = events.filter(event => !event.joined).length

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const joinEvent = async eventId => {
    setJoiningEventId(eventId)
    setEventsError('')

    try {
      const response = await axios.post('/api/events/join.php', {
        user_id: user.id,
        event_id: eventId,
      })

      if (response.data.success) {
        await loadEvents()
      } else {
        setEventsError(response.data.message || 'Could not join event')
      }
    } catch (err) {
      console.error('Join event API request failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setEventsError('Could not save your joined event.')
    } finally {
      setJoiningEventId(null)
    }
  }

  const leaveEvent = async eventId => {
    setJoiningEventId(eventId)
    setEventsError('')

    try {
      const response = await axios.post('/api/events/leave.php', {
        user_id: user.id,
        event_id: eventId,
      })

      if (response.data.success) {
        await loadEvents()
      } else {
        setEventsError(response.data.message || 'Could not leave event')
      }
    } catch (err) {
      console.error('Leave event API request failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setEventsError('Could not update your joined event.')
    } finally {
      setJoiningEventId(null)
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand-mark">S2M</div>
        <div>
          <strong>ShowUp2Move</strong>
          <span>Member website</span>
        </div>
        <nav>
          <a href="#match">Matches</a>
          <a href="#events">Events</a>
          <a href="#chat">Chat</a>
        </nav>
        <div className="topbar-avatar">
          {profilePicUrl ? <img src={profilePicUrl} alt={user?.name || 'User'} /> : <span>{(user?.name || 'U').slice(0, 1).toUpperCase()}</span>}
        </div>
        <button className="quiet-btn" onClick={logout}>Log out</button>
      </header>

      <main className="workspace-grid">
        {!respondedToday ? (
          <ShowUpTodayBanner 
            userSports={sportsInterests}
            status={showUpStatus} 
            onRespond={async (isAvail, sports, window) => {
              await respond(isAvail, sports, window)
              // If Phase 6 is implemented, we would redirect to matching
              // if (isAvail) navigate('/match')
            }} 
          />
        ) : (
           <section className="panel hero-panel" style={{background: 'var(--paper)', border: '1px solid var(--border)'}}>
             <div className="eyebrow">ShowUpToday</div>
             <h1>You answered for today.</h1>
             <p>Check back tomorrow for the next prompt.</p>
           </section>
        )}

        <section className="panel profile-panel">
          <div className="section-row">
            <div className="section-title">Lightweight Profile</div>
            <button className="quiet-btn refresh-btn" onClick={handleSubmit(() => saveProfile())} disabled={profileSaving || profileLoading}>
              {profileSaving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
          {profileMessage && <p className="save-message">{profileMessage}</p>}
          <ProfilePicture
            user={user}
            imageUrl={profilePicUrl}
            onUploaded={(url) => setProfilePicUrl(url)}
          />
          <label>Short description</label>
          <textarea {...register('bio')} />
          <div className="form-grid">
            <label>Area
              <input {...register('area')} />
            </label>
            <label>City
              <input {...register('city')} placeholder="e.g. Islamabad" />
            </label>
            <label>Latitude
              <input {...register('lat')} placeholder="Optional" />
            </label>
            <label>Longitude
              <input {...register('lng')} placeholder="Optional" />
            </label>
          </div>
          <div className="profile-subsection">
            <div className="section-title">Sports Interests</div>
            <SportPicker sports={sportsInterests} onChange={setSportsInterests} />
          </div>
        </section>

        <section id="match" className="panel wide-panel">
          <div className="section-row">
            <div>
              <div className="section-title">Smart Group Match</div>
              <p className="muted-text">Generated for {profile.sport} near {profile.area}</p>
            </div>
            <div className="score">{compatibility}% fit</div>
          </div>
          <div className="match-list">
            {matches.map((player, index) => (
              <div className="match-row" key={`${player.name}-${index}`}>
                <div className="avatar">{player.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong>{player.name}</strong>
                  <span>{player.skill} - {player.area}</span>
                </div>
                <small>{player.available ? 'Available' : 'Away'}</small>
              </div>
            ))}
          </div>
        </section>

        <section id="events" className="panel wide-panel">
          <div className="section-row events-heading">
            <div>
              <div className="section-title">Events</div>
              <p className="muted-text">Browse open games, filter by sport, and keep track of the events you already joined.</p>
            </div>
            <button className="quiet-btn refresh-btn" onClick={loadEvents} disabled={eventsLoading}>
              {eventsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="helper-banner">
            <div>
              <strong>Want to create a new event?</strong>
              <span>Event creation lives in the captain dashboard.</span>
            </div>
            <button onClick={() => navigate('/captain')}>Create event as captain</button>
          </div>

          <div className="event-controls">
            <div className="event-tabs">
              <button className={eventView === 'open' ? 'active' : ''} onClick={() => setEventView('open')}>
                Open Events <span>{openCount}</span>
              </button>
              <button className={eventView === 'joined' ? 'active' : ''} onClick={() => setEventView('joined')}>
                Joined Events <span>{joinedCount}</span>
              </button>
            </div>
            <label>Sport
              <select value={sportFilter} onChange={event => setSportFilter(event.target.value)}>
                {eventSports.map(sport => <option key={sport}>{sport}</option>)}
              </select>
            </label>
            <label>Sort
              <select value={sortBy} onChange={event => setSortBy(event.target.value)}>
                <option value="timeSoonest">Time: soonest first</option>
                <option value="timeLatest">Time: latest first</option>
                <option value="playersMost">Players: most joined</option>
                <option value="playersFewest">Players: fewest joined</option>
              </select>
            </label>
          </div>

          {eventsError && <div className="notice">{eventsError}</div>}
          {eventsLoading && <p>Loading events...</p>}
          {!eventsLoading && filteredEvents.length === 0 && (
            <div className="empty-panel">
              <strong>{eventView === 'joined' ? 'No joined events yet' : 'No open events found'}</strong>
              <span>{eventView === 'joined' ? 'Join an open event and it will stay here after refresh.' : 'Try another sport filter or sorting option.'}</span>
            </div>
          )}
          <div className="event-grid">
            {filteredEvents.map(event => (
              <article className={event.joined ? 'event-card joined-event-card' : 'event-card'} key={event.id}>
                <div className="sport-pill">{event.sport}</div>
                <h3>{event.title}</h3>
                <p>{event.time}</p>
                <p>{event.place}</p>
                <div className="event-meta">
                  <span>Captain: {event.captain}</span>
                  <span>{Math.max(event.max_players - event.confirmed, 0)} spots left</span>
                </div>
                <div className="progress-line">
                  <span style={{ width: `${Math.min(100, (event.confirmed / event.max_players) * 100)}%` }} />
                </div>
                <div className="section-row">
                  <span>{event.confirmed}/{event.max_players} players</span>
                  <button
                    className={event.joined ? 'danger-btn' : ''}
                    disabled={joiningEventId === event.id}
                    onClick={() => event.joined ? leaveEvent(event.id) : joinEvent(event.id)}
                  >
                    {joiningEventId === event.id ? 'Updating...' : event.joined ? 'Leave' : 'Join'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="chat" className="panel">
          <div className="section-title">Group Chat Preview</div>
          <div className="chat-box">
            <p><strong>Maya:</strong> Pitch 2 is free at 18:30.</p>
            <p><strong>You:</strong> I can bring a ball.</p>
            <p><strong>System:</strong> Captain assigned: Maya.</p>
          </div>
        </section>

        <section className="panel">
          <div className="section-title">Venue Vote</div>
          {['Central Park Pitch - $24/hour', 'Arena 12 - $36/hour', 'School Court - free'].map((venue, index) => (
            <div className="vote-row" key={venue}>
              <span>{venue}</span>
              <meter min="0" max="10" value={8 - index * 2}></meter>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
