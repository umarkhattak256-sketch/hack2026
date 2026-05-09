const availableSports = [
  { name: 'Football', icon: '⚽' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Tennis', icon: '🎾' },
  { name: 'Running', icon: '🏃' },
  { name: 'Volleyball', icon: '🏐' },
  { name: 'Padel', icon: '🎾' },
]
const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro']

export default function SportPicker({ sports, onChange }) {
  const selected = sports.length > 0 ? sports : [{ sport: 'Football', skill: 'Intermediate', is_primary: true }]
  const selectedNames = selected.map(item => item.sport)

  const toggleSport = sportName => {
    if (selectedNames.includes(sportName)) {
      const next = selected.filter(item => item.sport !== sportName)
      if (next.length === 0) return
      if (!next.some(item => item.is_primary)) {
        next[0] = { ...next[0], is_primary: true }
      }
      onChange(next)
      return
    }
    onChange([
      ...selected,
      { sport: sportName, skill: 'Intermediate', is_primary: selected.length === 0 },
    ])
  }

  const updateSkill = (sportName, skill) => {
    onChange(selected.map(item => item.sport === sportName ? { ...item, skill } : item))
  }

  const setPrimary = sportName => {
    onChange(selected.map(item => ({ ...item, is_primary: item.sport === sportName })))
  }

  return (
    <div className="section-grid">
      <div className="chip-grid">
        {availableSports.map(s => {
          const isActive = selectedNames.includes(s.name)
          return (
            <button
              key={s.name}
              type="button"
              className={`chip ${isActive ? 'active' : ''}`}
              onClick={() => toggleSport(s.name)}
            >
              <span aria-hidden>{s.icon}</span> {s.name}
              {isActive && <span aria-hidden style={{ marginLeft: 2, fontSize: 11 }}>✓</span>}
            </button>
          )
        })}
      </div>

      <div className="section-grid stagger" style={{ gap: 8 }}>
        {selected.map(item => (
          <div className="sport-row" key={item.sport}>
            <button
              type="button"
              className={`star-btn ${item.is_primary ? 'active' : ''}`}
              title={item.is_primary ? 'Primary sport' : 'Set as primary'}
              onClick={() => setPrimary(item.sport)}
              aria-label={item.is_primary ? 'Primary sport' : 'Set as primary'}
            >
              ★
            </button>
            <div>
              <strong style={{ fontSize: 14 }}>{item.sport}</strong>
              <div className="text-xs muted">{item.is_primary ? 'Primary' : 'Tap star to make primary'}</div>
            </div>
            <select value={item.skill} onChange={e => updateSkill(item.sport, e.target.value)}>
              {skillLevels.map(skill => <option key={skill}>{skill}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
