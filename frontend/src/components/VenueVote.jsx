export default function VenueVote({ poll, loading, error, onVote, emptyHint }) {
  if (loading && !poll) {
    return (
      <div className="section-grid">
        <div className="skeleton" style={{ height: 56 }} />
        <div className="skeleton" style={{ height: 56 }} />
        <div className="skeleton" style={{ height: 56 }} />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="empty">
        <strong>No venue vote running</strong>
        <span>{emptyHint || 'When a captain puts venues to a vote, they will appear here.'}</span>
      </div>
    )
  }

  const total = poll.total_votes || 0
  const myVote = poll.my_vote_option

  return (
    <div className="vote-list">
      {error && <div className="notice">{error}</div>}
      {poll.options.map(opt => {
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0
        const voted = myVote === opt.option_id
        return (
          <button
            type="button"
            key={opt.option_id}
            className={`vote-row ${voted ? 'voted' : ''}`}
            onClick={() => onVote(opt.option_id)}
          >
            <div>
              <div className="row-between">
                <strong>{opt.name}</strong>
                <span className="vote-meta">
                  {opt.price_per_hour ? `${opt.currency || ''} ${opt.price_per_hour}/h` : 'Free'}
                </span>
              </div>
              <div className="text-xs muted">
                {opt.address || opt.city || opt.sport}
                {opt.features?.length ? ` · ${opt.features.join(' · ')}` : ''}
              </div>
              <div className="vote-bar"><span style={{ width: `${pct}%` }} /></div>
              <div className="text-xs muted mt-1">{opt.votes} vote{opt.votes === 1 ? '' : 's'} · {pct}%</div>
            </div>
            <span className={`pill ${voted ? 'pill-success' : ''}`} style={{ alignSelf: 'flex-start' }}>
              {voted ? '✓ Your pick' : 'Tap to vote'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
