import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useMatchStatus } from '../hooks/useMatchStatus'
import MapView from '../components/MapView'
import GroupChat from '../components/GroupChat'

// MatchPage shows the lifecycle of a single match group:
//   1. Looking for matches… (no group yet, or status='forming' / waiting count)
//   2. Found N players for <sport> (status='ready' — Confirm / Decline)
//   3. Waiting on others to confirm (status='confirmed' for me, others not all in)
//   4. Group event created — show event card with venue + captain + time
//
// Lives both as a page (route /match) and as the body of the Match tab on
// MemberDashboard. Pass `embedded` to skip the back-button chrome.
export default function MatchPage({ embedded = false } = {}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [groupId, setGroupId] = useState(null)
  const [bootstrap, setBootstrap] = useState({ loading: true, error: '', waiting: null, sport: null })
  const [acting, setActing] = useState(false)
  const [actError, setActError] = useState('')

  const { status, error: statusError, confirm, decline, refresh } = useMatchStatus(groupId, user?.id)

  // On mount: try to find an active group for the user. If none, start matching.
  const startMatching = async () => {
    if (!user?.id) return
    setBootstrap(b => ({ ...b, loading: true, error: '' }))
    try {
      // Existing group?
      const active = await api.get('/matching/active.php', { params: { user_id: user.id } })
      if (active.data?.group?.id) {
        setGroupId(active.data.group.id)
        setBootstrap({ loading: false, error: '', waiting: null, sport: active.data.group.sport })
        return
      }
      // Start a new run.
      const r = await api.post('/matching/run.php', { user_id: user.id })
      if (r.data?.success) {
        if (r.data.status === 'ready' || r.data.reused) {
          setGroupId(r.data.group_id)
          setBootstrap({ loading: false, error: '', waiting: null, sport: r.data.sport })
        } else if (r.data.status === 'waiting') {
          setBootstrap({
            loading: false,
            error: '',
            waiting: { current: r.data.current_count, needed: r.data.needed, candidates: r.data.candidates || [] },
            sport: r.data.sport,
          })
        } else {
          setBootstrap({ loading: false, error: r.data.message || 'Could not start matching', waiting: null, sport: null })
        }
      } else {
        setBootstrap({ loading: false, error: r.data?.message || 'Could not start matching', waiting: null, sport: null })
      }
    } catch {
      setBootstrap({ loading: false, error: 'Could not contact the matching service.', waiting: null, sport: null })
    }
  }

  useEffect(() => {
    if (user?.id) startMatching()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Re-poll waiting state every 5s when no group was formed yet.
  useEffect(() => {
    if (groupId || !bootstrap.waiting) return
    const t = setInterval(() => { startMatching() }, 5000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, bootstrap.waiting])

  const groupStatus = status?.group?.status
  const myStatus = status?.my_status
  const event = status?.event
  const members = status?.members || []
  const captain = members.find(m => m.is_captain)

  const memberMarkers = useMemo(() => members
    .filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng))
    .map(m => ({
      id: `m-${m.user_id}`,
      lat: m.lat,
      lng: m.lng,
      kind: m.is_self ? 'user' : 'candidate',
      label: m.is_self ? 'You' : m.name,
      subtitle: `${m.skill}${m.is_captain ? ' · Captain' : ''}`,
    })),
    [members],
  )

  const onConfirm = async () => {
    setActing(true); setActError('')
    const r = await confirm()
    if (r && !r.success) setActError(r.message || 'Could not confirm')
    setActing(false)
  }

  const onDecline = async () => {
    setActing(true); setActError('')
    const r = await decline()
    if (r && !r.success) setActError(r.message || 'Could not decline')
    setActing(false)
    if (r?.cancelled) {
      setGroupId(null)
    }
  }

  const renderHeader = () => (
    <div className="card-row">
      <div>
        <div className="card-title">Smart group match</div>
        <div className="card-subtitle">
          {groupStatus === 'event_created'
            ? 'Group locked in. See you on the pitch.'
            : groupStatus === 'confirmed'
              ? 'All confirms in — wrapping up the event.'
              : groupStatus === 'ready' && myStatus === 'confirmed'
                ? 'Waiting on the rest to confirm…'
                : groupStatus === 'ready'
                  ? `Found ${members.length} ${members.length === 1 ? 'player' : 'players'}${bootstrap.sport ? ` for ${bootstrap.sport}` : ''}.`
                  : groupStatus === 'forming'
                    ? 'Group reforming after a decline. Backfilling…'
                    : 'Looking for matches…'}
        </div>
      </div>
      {groupStatus && (
        <span className={`pill ${
          groupStatus === 'event_created' ? 'pill-success' :
          groupStatus === 'confirmed' ? 'pill-info' :
          groupStatus === 'ready' ? 'pill-warn' : ''
        }`}>
          {groupStatus.replace('_', ' ')}
        </span>
      )}
    </div>
  )

  const renderWaiting = () => (
    <div className="card">
      {renderHeader()}
      <div style={{ display: 'grid', placeItems: 'center', padding: '24px 0' }}>
        <span className="spinner" aria-hidden />
        <h2 style={{ marginTop: 14 }}>Looking for matches…</h2>
        <p>
          {bootstrap.waiting
            ? `${bootstrap.waiting.current} of ${bootstrap.waiting.needed} players confirmed available so far.`
            : 'Pulling together everyone who showed up today.'}
        </p>
        <div className="row gap-sm" style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => startMatching()}>Refresh</button>
          {!embedded && <button className="btn btn-ghost" onClick={() => navigate('/member')}>Back</button>}
        </div>
      </div>

      {bootstrap.waiting?.candidates?.length > 0 && (
        <>
          <div className="divider" />
          <div className="text-xs muted" style={{ marginBottom: 8 }}>
            Currently available for {bootstrap.sport}:
          </div>
          <div className="section-grid stagger" style={{ gap: 8 }}>
            {bootstrap.waiting.candidates.map(c => (
              <div className="match-row" key={c.user_id}>
                <div className="avatar-mini">
                  {c.profile_pic_url
                    ? <img src={c.profile_pic_url} alt={c.name} />
                    : <span>{(c.name || 'U').slice(0, 2).toUpperCase()}</span>}
                </div>
                <div>
                  <strong>{c.is_self ? 'You' : c.name}</strong>
                  <span>{c.skill}{Number.isFinite(c.distance_km) ? ` · ${c.distance_km.toFixed(1)} km` : ''}</span>
                </div>
                <span className="pill pill-info">{Math.round(c.fit_score)}% fit</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  const renderGroup = () => (
    <div className="card">
      {renderHeader()}

      <div className="section-grid stagger" style={{ gap: 8 }}>
        {members.map(m => (
          <div className="match-row" key={m.user_id}>
            <div className="avatar-mini">
              {m.profile_pic_url
                ? <img src={m.profile_pic_url} alt={m.name} />
                : <span>{(m.name || 'U').slice(0, 2).toUpperCase()}</span>}
            </div>
            <div>
              <strong>
                {m.is_self ? 'You' : m.name}
                {m.is_captain && <span className="pill pill-success" style={{ marginLeft: 8 }}>Captain</span>}
              </strong>
              <span>{m.skill} · {Number.isFinite(m.fit_score) ? `${Math.round(m.fit_score)}% fit` : '—'}</span>
            </div>
            <span className={`pill ${
              m.status === 'confirmed' ? 'pill-success' :
              m.status === 'declined' ? 'pill-danger' :
              m.status === 'matched' ? 'pill-info' : ''
            }`}>
              {m.status === 'confirmed' ? '✓ In' : m.status === 'declined' ? 'Out' : 'Pending'}
            </span>
          </div>
        ))}
      </div>

      {memberMarkers.length > 0 && (
        <>
          <div className="divider" />
          <div className="text-xs muted" style={{ marginBottom: 8 }}>Where everyone is</div>
          <MapView
            markers={memberMarkers}
            userLocation={status?.group?.centroid ? { lat: status.group.centroid.lat, lng: status.group.centroid.lng, label: 'Group centroid' } : null}
            height={260}
          />
        </>
      )}

      <div className="divider" />
      {actError && <div className="notice" style={{ marginBottom: 8 }}>{actError}</div>}
      {statusError && <div className="notice" style={{ marginBottom: 8 }}>{statusError}</div>}

      <div className="row-between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="text-xs muted">
          {status?.confirmed_count} of at least {status?.min_players} players confirmed
        </div>
        <div className="row gap-sm">
          {myStatus !== 'confirmed' && myStatus !== 'declined' && (
            <>
              <button className="btn btn-ghost" onClick={onDecline} disabled={acting}>Decline</button>
              <button className="btn btn-primary" onClick={onConfirm} disabled={acting}>
                {acting && <span className="spinner" aria-hidden />}
                {acting ? 'Confirming…' : 'Confirm'}
              </button>
            </>
          )}
          {myStatus === 'confirmed' && groupStatus === 'ready' && (
            <span className="pill pill-success">You're in — waiting on others.</span>
          )}
        </div>
      </div>
    </div>
  )

  const renderEventCard = () => (
    <div className="card slide-up" style={{ background: 'linear-gradient(135deg, #f5fbf8, #ffffff)', borderColor: 'rgba(20,164,108,0.35)' }}>
      <div className="eyebrow">Event auto-created</div>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>{event?.title || 'Group ready'}</h1>
      <p>
        {event?.event_time && (
          <>{new Date(event.event_time).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })} at <strong style={{ color: 'var(--ink)' }}>{event?.location}</strong></>
        )}
      </p>
      <div className="hero-stats">
        <div><strong>{event?.captain_name}</strong><span>Captain</span></div>
        <div><strong>{members.length}</strong><span>Players</span></div>
        <div><strong>{event?.sport}</strong><span>Sport</span></div>
      </div>
      <div className="row gap-sm" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={refresh}>Refresh</button>
        <button className="btn btn-primary" onClick={() => navigate('/member')}>Back to dashboard</button>
      </div>
    </div>
  )

  const showGroup = !!groupId && !!status
  const showEventCard = groupStatus === 'event_created' && event

  return (
    <div className="section-grid stagger">
      {bootstrap.loading && !status && (
        <div className="card">
          <div className="card-row">
            <div>
              <div className="card-title">Smart group match</div>
              <div className="card-subtitle">Looking for available players…</div>
            </div>
          </div>
          <div style={{ padding: 24, display: 'grid', placeItems: 'center' }}>
            <span className="spinner" aria-hidden />
          </div>
        </div>
      )}

      {bootstrap.error && (
        <div className="notice">{bootstrap.error}</div>
      )}

      {!groupId && !bootstrap.loading && (bootstrap.waiting || bootstrap.error) && renderWaiting()}

      {showGroup && !showEventCard && renderGroup()}

      {showEventCard && (
        <>
          {renderEventCard()}
          {/* Member list still useful so people see who's coming. */}
          {renderGroup()}
        </>
      )}

      {/* Group chat appears the moment a group exists, regardless of finalize state. */}
      {groupId && showGroup && groupStatus !== 'cancelled' && (
        <GroupChat groupId={groupId} eventId={event?.id || null} />
      )}
    </div>
  )
}
