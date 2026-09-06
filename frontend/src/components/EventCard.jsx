const sportIcon = (name) => {
  const m = { Football: '⚽', Basketball: '🏀', Tennis: '🎾', Running: '🏃', Volleyball: '🏐', Padel: '🎾' }
  return m[name] || '🏆'
}

const initialsOf = (name) => (name || '?')
  .split(' ')
  .map(part => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

function MemberAvatars({ members = [], confirmed, max }) {
  const shown = members.slice(0, 5)
  const extra = Math.max(confirmed - shown.length, 0)

  if (shown.length === 0 && extra === 0) return null

  return (
    <div className="avatar-roster" aria-label={`${confirmed} of ${max} players`}>
      {shown.map(m => (
        <span className="roster-avatar" key={m.user_id} title={m.name}>
          {m.profile_pic_url ? <img src={m.profile_pic_url} alt={m.name} /> : <span>{initialsOf(m.name)}</span>}
        </span>
      ))}
      {extra > 0 && <span className="roster-avatar roster-extra" title={`+${extra} more`}>+{extra}</span>}
    </div>
  )
}

export default function EventCard({ event, busy, onJoin, onLeave, showActions = true }) {
  const remaining = Math.max(event.max_players - event.confirmed, 0)
  const fullPct = Math.min(100, (event.confirmed / event.max_players) * 100)
  const isFull = remaining === 0 && !event.joined

  return (
    <article className={`event-card ${event.joined ? 'is-joined' : ''}`}>
      <div className="top-row">
        <span className="sport-tag"><span aria-hidden>{sportIcon(event.sport)}</span> {event.sport}</span>
        {event.joined ? (
          <span className="pill pill-success">✓ Joined</span>
        ) : isFull ? (
          <span className="pill pill-danger">Full</span>
        ) : remaining <= 2 ? (
          <span className="pill pill-warn">{remaining} left</span>
        ) : (
          <span className="pill pill-info">{remaining} spots</span>
        )}
      </div>

      <h3>{event.title}</h3>
      <div className="meta-row">
        <span className="pill"><span aria-hidden>🕒</span> {event.time}</span>
        <span className="pill"><span aria-hidden>📍</span> {event.place}</span>
      </div>

      <div className="row text-xs muted gap-sm" style={{ marginTop: 4 }}>
        <span>Captain: <strong style={{ color: 'var(--ink)' }}>{event.captain}</strong></span>
      </div>

      <MemberAvatars members={event.members} confirmed={event.confirmed} max={event.max_players} />

      <div className="progress" aria-hidden>
        <span style={{ width: `${fullPct}%` }} />
      </div>

      <div className="footer">
        <span className="text">{event.confirmed} / {event.max_players} players</span>
        {showActions && (
          event.joined ? (
            <button
              className="btn btn-secondary btn-sm"
              disabled={busy}
              onClick={() => onLeave(event.id)}
            >
              {busy ? '…' : 'Leave'}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              disabled={busy || isFull}
              onClick={() => onJoin(event.id)}
            >
              {busy ? '…' : isFull ? 'Full' : 'Join'}
            </button>
          )
        )}
      </div>
    </article>
  )
}