import { useState } from 'react'

const sportIcon = (name) => {
  const m = { Football: '⚽', Basketball: '🏀', Tennis: '🎾', Running: '🏃', Volleyball: '🏐', Padel: '🎾' }
  return m[name] || '🏆'
}

const timeWindows = [
  { value: 'morning', label: 'Morning', icon: '🌅', hint: '6 – 12' },
  { value: 'afternoon', label: 'Afternoon', icon: '☀️', hint: '12 – 17' },
  { value: 'evening', label: 'Evening', icon: '🌆', hint: '17 – 21' },
  { value: '18:00-21:00', label: 'Sharp window', icon: '⏰', hint: '18:00 – 21:00' },
]

export default function ShowUpTodayBanner({ userSports, status, onRespond }) {
  const [askingDetails, setAskingDetails] = useState(false)
  const [selectedSports, setSelectedSports] = useState([])
  const [timeWindow, setTimeWindow] = useState('evening')

  const availableSportNames = userSports && userSports.length > 0
    ? userSports.map(s => s.sport)
    : ['Football', 'Running']

  const handleYes = () => {
    const primary = userSports?.find(s => s.is_primary)
    setSelectedSports([primary ? primary.sport : availableSportNames[0]])
    setAskingDetails(true)
  }

  const toggleSport = (sport) => {
    if (selectedSports.includes(sport)) {
      if (selectedSports.length > 1) {
        setSelectedSports(selectedSports.filter(s => s !== sport))
      }
    } else {
      setSelectedSports([...selectedSports, sport])
    }
  }

  const submitting = status === 'submitting'

  return (
    <section className="hero-card slide-up">
      <div className="eyebrow">Show Up Today</div>

      {!askingDetails ? (
        <>
          <h1>Up for a game today?</h1>
          <p>Tap yes — we'll match you with a nearby group, suggest a venue and assign a captain. The whole flow takes a minute.</p>
          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleYes}
              disabled={submitting || status === 'loading'}
            >
              <span aria-hidden>⚡</span> Yes, match me
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => onRespond(false)}
              disabled={submitting || status === 'loading'}
            >
              Not today
            </button>
          </div>

          <div className="hero-stats">
            <div><strong>~12 min</strong><span>from yes to group</span></div>
            <div><strong>{availableSportNames.length}</strong><span>sports in your profile</span></div>
            <div><strong>1 tap</strong><span>to participate</span></div>
          </div>
        </>
      ) : (
        <div className="fade-in section-grid" style={{ gap: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Step 1 · Sports</div>
            <h2>Which sports are you up for?</h2>
            <p className="text-sm">Pick one or more — we'll only match you on these.</p>
          </div>
          <div className="chip-grid">
            {availableSportNames.map(sport => {
              const active = selectedSports.includes(sport)
              return (
                <button
                  key={sport}
                  type="button"
                  className={`chip ${active ? 'active' : ''}`}
                  onClick={() => toggleSport(sport)}
                >
                  <span aria-hidden>{sportIcon(sport)}</span> {sport}
                </button>
              )
            })}
          </div>

          <div className="divider" />

          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Step 2 · When</div>
            <h2>What time works?</h2>
          </div>
          <div className="chip-grid">
            {timeWindows.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`chip ${timeWindow === opt.value ? 'active' : ''}`}
                onClick={() => setTimeWindow(opt.value)}
              >
                <span aria-hidden>{opt.icon}</span> {opt.label}
                <span className="text-xs muted" style={{ marginLeft: 4 }}>{opt.hint}</span>
              </button>
            ))}
          </div>

          <div className="row gap-md mt-2" style={{ flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onRespond(true, selectedSports, timeWindow)}
              disabled={submitting || selectedSports.length === 0}
            >
              {submitting && <span className="spinner" aria-hidden />}
              {submitting ? 'Confirming…' : 'Confirm availability'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setAskingDetails(false)}
              disabled={submitting}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
