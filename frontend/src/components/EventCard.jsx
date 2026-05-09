const sportIcon = (name) => {
  const m = { Football: '⚽', Basketball: '🏀', Tennis: '🎾', Running: '🏃', Volleyball: '🏐', Padel: '🎾' }
  return m[name] || '🏆'
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
